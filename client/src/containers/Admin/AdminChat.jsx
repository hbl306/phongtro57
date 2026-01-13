// src/containers/Admin/AdminChat.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminPageLayout from "./AdminPageLayout.jsx";
import { useAuth } from "../Public/AuthContext.jsx";
import { connectSocket } from "../../services/socketClient";
import { adminListConversations, fetchMessages } from "../../services/chatService";

function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isSeenByOther(otherReadAt, msgCreatedAt) {
  if (!otherReadAt || !msgCreatedAt) return false;
  const a = new Date(otherReadAt).getTime();
  const b = new Date(msgCreatedAt).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return a >= b;
}

// ✅ backend có thể trả nhiều tên field unread khác nhau
function getUnreadCountFromServer(c) {
  const v =
    c?.unreadCount ??
    c?.unread_count ??
    c?.unread ??
    c?.unread_count_admin ??
    c?.unread_admin ??
    c?.admin_unread_count ??
    c?.adminUnreadCount ??
    0;

  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function getUserNameFromConv(c) {
  return (
    c?.user?.name ||
    c?.user_name ||
    c?.username ||
    (c?.user_id ? `User #${c.user_id}` : "Khách hàng")
  );
}

function getUserPhoneFromConv(c) {
  return c?.user?.phone || c?.user_phone || c?.phone || "";
}

function getLastMessageAtMs(c) {
  const v =
    c?.last_message_at ??
    c?.lastMessageAt ??
    c?.last_message_time ??
    c?.lastMessageTime ??
    c?.last_message_created_at ??
    c?.lastMessageCreatedAt ??
    null;

  const t = v ? new Date(v).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

function getMessageCount(c) {
  const v =
    c?.messageCount ??
    c?.messages_count ??
    c?.messagesCount ??
    c?.total_messages ??
    c?.totalMessages ??
    0;
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

// ✅ chỉ coi là “hội thoại thật” khi có ít nhất 1 tin nhắn
function hasAnyMessage(c) {
  if (!c) return false;

  if (getMessageCount(c) > 0) return true;

  const preview = String(c?.last_message_preview ?? c?.lastMessagePreview ?? "").trim();
  if (preview && preview !== "—" && preview !== "-") return true;

  if (c?.last_message_id || c?.lastMessageId) return true;
  if (getLastMessageAtMs(c) > 0) return true;

  return false;
}

// ✅ gộp trùng: mỗi user chỉ giữ 1 conversation mới nhất
function dedupeByUser(list = []) {
  const map = new Map();

  for (const c of list) {
    const key =
      c?.user_id ||
      c?.user?.id ||
      c?.user?.phone ||
      c?.user_phone ||
      c?.phone ||
      c?.id;

    const prev = map.get(key);
    if (!prev) {
      map.set(key, c);
      continue;
    }

    if (getLastMessageAtMs(c) >= getLastMessageAtMs(prev)) {
      map.set(key, c);
    }
  }

  return Array.from(map.values());
}

function getAdminReadAtMs(conv) {
  const v =
    conv?.admin_last_read_at ??
    conv?.adminLastReadAt ??
    conv?.last_read_at_admin ??
    conv?.lastReadAtAdmin ??
    conv?.my_last_read_at_admin ??
    conv?.myLastReadAtAdmin ??
    conv?.admin_read_at ??
    conv?.adminReadAt ??
    null;

  const t = v ? new Date(v).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

function getLastSenderRole(conv) {
  const v =
    conv?.last_message_sender_role ??
    conv?.lastMessageSenderRole ??
    conv?.last_sender_role ??
    conv?.lastSenderRole ??
    conv?.last_message_role ??
    conv?.lastMessageRole ??
    "";
  return String(v || "").toLowerCase();
}

// ✅ Fallback unread cho admin nếu server không trả unread_count_...
// - unread khi tin cuối là USER và > admin_last_read_at (có tính local override)
function calcAdminUnread(conv, localAdminReadAtMs = 0) {
  const serverUnread = getUnreadCountFromServer(conv);
  if (serverUnread > 0) return serverUnread;

  const lastAt = getLastMessageAtMs(conv);
  if (!lastAt) return 0;

  const lastRole = getLastSenderRole(conv);
  const adminReadAt = Math.max(getAdminReadAtMs(conv), localAdminReadAtMs || 0);

  // ✅ chỉ unread khi tin cuối là user và admin chưa đọc
  if (lastRole === "user" && lastAt > adminReadAt) return 1;

  return 0;
}

function clearTextSelection() {
  try {
    const sel = window.getSelection?.();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
  } catch {
    // ignore
  }
}

export default function AdminChat() {
  const { user, token } = useAuth();
  const isAdmin = Number(user?.role) === 2;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [convs, setConvs] = useState([]);
  const [active, setActive] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // user đã đọc tới thời điểm nào (để admin thấy "Đã xem")
  const [userReadAt, setUserReadAt] = useState(null);

  // local override admin readAt theo conversation (để unread tắt ngay khi mở)
  const [localAdminReadAtByConv, setLocalAdminReadAtByConv] = useState({});

  // ✅ auto scroll
  const bottomRef = useRef(null);
  const scrollToBottom = useCallback((behavior = "auto") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const socket = useMemo(() => {
    if (!token) return null;
    if (!isAdmin) return null;
    return connectSocket(token);
  }, [token, isAdmin]);

  // ✅ track room join chuẩn (tránh leave sai khi state active đổi nhanh)
  const joinedConvIdRef = useRef(null);

  const joinRoom = useCallback(
    (convId) => {
      if (!socket || !convId) return;

      if (joinedConvIdRef.current && Number(joinedConvIdRef.current) !== Number(convId)) {
        socket.emit("conversation:leave", { conversationId: joinedConvIdRef.current }, () => {});
      }

      joinedConvIdRef.current = convId;
      socket.emit("conversation:join", { conversationId: convId }, () => {});
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    if (joinedConvIdRef.current) {
      socket.emit("conversation:leave", { conversationId: joinedConvIdRef.current }, () => {});
      joinedConvIdRef.current = null;
    }
  }, [socket]);

  // ✅ chống race load inbox
  const inboxReqIdRef = useRef(0);
  const activeIdRef = useRef(null);
  useEffect(() => {
    activeIdRef.current = active?.id || null;
  }, [active?.id]);

  // ✅ coalesce inbox reload (đỡ spam socket)
  const inboxReloadTimerRef = useRef(null);
  const scheduleInboxReload = useCallback(() => {
    if (inboxReloadTimerRef.current) return;
    inboxReloadTimerRef.current = setTimeout(() => {
      inboxReloadTimerRef.current = null;
      loadInboxRef.current?.();
    }, 120);
  }, []);
  useEffect(() => {
    return () => {
      if (inboxReloadTimerRef.current) clearTimeout(inboxReloadTimerRef.current);
    };
  }, []);

  const loadInboxRef = useRef(null);

  const loadInbox = useCallback(async () => {
    if (!token || !isAdmin) return;

    const reqId = ++inboxReqIdRef.current;

    setLoading(true);
    setErr("");

    try {
      const res = await adminListConversations(token, { limit: 50, q });
      if (reqId !== inboxReqIdRef.current) return;

      let list = res?.data || [];

      // ✅ 1) bỏ conversation rỗng (user mở chat nhưng chưa nhắn)
      list = list.filter(hasAnyMessage);

      // ✅ 2) bỏ trùng theo user
      list = dedupeByUser(list);

      // ✅ 3) sort theo tin nhắn mới nhất
      list.sort((a, b) => getLastMessageAtMs(b) - getLastMessageAtMs(a));

      setConvs(list);

      // ✅ không bao giờ “setActive ngược” bởi inbox load
      const curActiveId = activeIdRef.current;
      if (curActiveId && !list.some((x) => Number(x.id) === Number(curActiveId))) {
        setActive(null);
        setMessages([]);
        setUserReadAt(null);
        leaveRoom();
      } else if (curActiveId) {
        // refresh active object (chỉ refresh nếu đúng ID hiện tại)
        const newer = list.find((x) => Number(x.id) === Number(curActiveId));
        if (newer) setActive((prev) => (prev?.id === newer.id ? newer : prev));
      }
    } catch (e) {
      console.error("loadInbox error >>>", e);
      setErr(e.message || "Không tải được hội thoại");
    } finally {
      if (reqId === inboxReqIdRef.current) setLoading(false);
    }
  }, [token, isAdmin, q, leaveRoom]);

  loadInboxRef.current = loadInbox;

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ✅ realtime: inbox update
  useEffect(() => {
    if (!socket) return;

    const onInboxUpdate = () => {
      // đỡ spam call
      scheduleInboxReload();
    };

    socket.on("inbox:update", onInboxUpdate);
    return () => socket.off("inbox:update", onInboxUpdate);
  }, [socket, scheduleInboxReload]);

  // ✅ chống race load messages khi chuyển nhanh
  const msgReqIdRef = useRef(0);

  const openConv = useCallback(
    async (conv) => {
      if (!conv?.id) return;
      if (!token) return;

      clearTextSelection();

      const convId = conv.id;
      const reqId = ++msgReqIdRef.current;

      setErr("");
      setMessages([]);

      // set active ngay để UI đổi user tức thời (tránh cảm giác “kẹt”)
      setActive(conv);

      // lấy mốc user đã đọc (nếu backend trả về)
      setUserReadAt(conv?.user_last_read_at || conv?.userLastReadAt || null);

      try {
        joinRoom(convId);

        // admin mở conv => mark admin đã đọc
        socket?.emit("read:mark", { conversationId: convId }, () => {});

        // ✅ local override đọc ngay => unread tắt luôn
        setLocalAdminReadAtByConv((prev) => ({ ...prev, [convId]: Date.now() }));

        const msgRes = await fetchMessages(token, convId, { limit: 50 });
        if (reqId !== msgReqIdRef.current) return;

        setMessages(msgRes?.data || []);

        // reload inbox để update preview + unread
        scheduleInboxReload();

        setTimeout(() => scrollToBottom("auto"), 0);
      } catch (e) {
        if (reqId !== msgReqIdRef.current) return;
        setErr(e.message || "Không tải được tin nhắn");
      }
    },
    [token, socket, joinRoom, scheduleInboxReload, scrollToBottom]
  );

  // ✅ realtime messages + read status
  useEffect(() => {
    if (!socket) return;

    const onNew = (payload) => {
      if (!payload?.conversationId) return;

      // update inbox list (để hiện chấm đỏ ở item tương ứng)
      scheduleInboxReload();

      const currentConvId = joinedConvIdRef.current;
      if (!currentConvId) return;

      // nếu đang mở đúng conv thì append tin
      if (Number(payload.conversationId) === Number(currentConvId)) {
        const msg = payload.message;
        if (msg) setMessages((prev) => [...prev, msg]);

        // đang mở conv và nhận tin từ user => mark read ngay
        if (String(msg?.sender_role || "").toLowerCase() === "user") {
          socket.emit("read:mark", { conversationId: currentConvId }, () => {});
          // local override readAt để UI không hiện unread trở lại
          setLocalAdminReadAtByConv((prev) => ({ ...prev, [currentConvId]: Date.now() }));
        }

        setTimeout(() => scrollToBottom("smooth"), 0);
      }
    };

    const onReadUpdate = (payload) => {
      if (!payload) return;

      const currentConvId = joinedConvIdRef.current;
      if (!currentConvId) return;
      if (Number(payload.conversationId) !== Number(currentConvId)) return;

      const who = String(payload.whoRole || payload.who || "").toLowerCase();
      if (who === "user") {
        setUserReadAt(payload.readAt);
      }

      // nếu server cập nhật admin read => reload inbox cho chuẩn
      if (who === "admin") {
        scheduleInboxReload();
      }
    };

    socket.on("message:new", onNew);
    socket.on("read:update", onReadUpdate);

    return () => {
      socket.off("message:new", onNew);
      socket.off("read:update", onReadUpdate);
    };
  }, [socket, scheduleInboxReload, scrollToBottom]);

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const send = () => {
    if (!socket) return;

    const convId = joinedConvIdRef.current || active?.id;
    if (!convId) return;

    const content = String(text || "").trim();
    if (!content) return;

    socket.emit(
      "message:send",
      { conversationId: convId, type: "text", content },
      (ack) => {
        if (ack?.ok) {
          setText("");
          socket.emit("read:mark", { conversationId: convId }, () => {});
          setLocalAdminReadAtByConv((prev) => ({ ...prev, [convId]: Date.now() }));

          scheduleInboxReload();
          setTimeout(() => scrollToBottom("smooth"), 0);
        } else {
          setErr(ack?.error || "Gửi thất bại");
        }
      }
    );
  };

  if (!isAdmin) {
    return (
      <AdminPageLayout activeKey="chat">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/60">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Chat với khách hàng</h1>
          <p className="text-sm text-gray-600">Bạn không có quyền truy cập trang này.</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout activeKey="chat">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/70 flex items-center justify-between">
          <div className="select-none">
            <h1 className="text-xl font-semibold text-gray-900">Chat với khách hàng</h1>
            <p className="text-sm text-gray-600">Xem danh sách hội thoại và trả lời realtime.</p>
          </div>

          <button
            type="button"
            onClick={loadInbox}
            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-800 border border-slate-200/70 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 h-[70vh]">
          {/* Left inbox */}
          <div className="col-span-4 border-r border-slate-200/70 min-h-0 flex flex-col">
            <div className="p-3 border-b border-slate-200/70">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadInbox();
                }}
                placeholder="Tìm theo tên / SĐT... (Enter)"
                className="w-full border border-slate-200/70 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading && <div className="p-3 text-sm text-gray-500">Đang tải...</div>}
              {err && <div className="p-3 text-sm text-red-600">{err}</div>}
              {!loading && convs.length === 0 && (
                <div className="p-3 text-sm text-gray-500">Chưa có hội thoại.</div>
              )}

              {convs.map((c) => {
                const isActive = Number(active?.id) === Number(c.id);
                const localReadAt = localAdminReadAtByConv?.[c.id] || 0;
                const unread = calcAdminUnread(c, localReadAt);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => clearTextSelection()}
                    onClick={() => openConv(c)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-200/60 hover:bg-orange-50/30 ${
                      isActive ? "bg-orange-50/50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {getUserNameFromConv(c)}
                      </div>

                      {/* ✅ chấm đỏ + số unread */}
                      {unread > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 truncate">{getUserPhoneFromConv(c)}</div>
                    <div className="text-xs text-gray-600 truncate mt-1">
                      {c.last_message_preview || c.lastMessagePreview || "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right chat */}
          <div className="col-span-8 flex flex-col min-h-0">
            {!active ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Chọn một hội thoại để xem tin nhắn
              </div>
            ) : (
              <>
                {/* ✅ select-none để không bị “kẹt bôi đen” */}
                <div className="px-4 py-3 border-b border-slate-200/70 bg-white select-none">
                  <div className="font-semibold text-gray-900">{getUserNameFromConv(active)}</div>
                  <div className="text-xs text-gray-500">{getUserPhoneFromConv(active)}</div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-orange-50/20">
                  {messages.map((m) => {
                    const mine = String(m.sender_role || "").toLowerCase() === "admin";
                    const time = formatTime(m.created_at || m.createdAt);
                    const seen = mine ? isSeenByOther(userReadAt, m.created_at || m.createdAt) : false;

                    return (
                      <div key={m.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[78%]">
                          <div
                            className={`px-3 py-2 rounded-2xl border shadow-sm ${
                              mine ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200/70"
                            }`}
                          >
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">{m.content}</div>
                            <div className={`mt-1 text-[11px] text-gray-400 ${mine ? "text-right" : "text-left"}`}>
                              {time}
                            </div>
                          </div>

                          {mine && (
                            <div className="mt-1 text-[11px] text-gray-500 text-right">
                              {seen ? "Đã xem" : "Đã gửi"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={bottomRef} />
                </div>

                <div className="p-3 border-t border-slate-200/70 flex gap-2 bg-white">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 border border-orange-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!text.trim()}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-orange-600"
                  >
                    Gửi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
