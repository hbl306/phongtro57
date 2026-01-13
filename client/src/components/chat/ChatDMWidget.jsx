// src/components/chat/ChatDMWidget.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "../../containers/Public/AuthContext.jsx";
import { connectSocket } from "../../services/socketClient";
import { dmListConversations, fetchMessages } from "../../services/chatService";
import logoChat from "../../assets/logoChat.png";

function getTokenFallback() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function safeTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function pickPeer(conv, myId) {
  if (conv?.peer) return conv.peer;
  if (conv?.otherUser) return conv.otherUser;
  if (conv?.other_user) return conv.other_user;

  const users = conv?.users || conv?.participants || conv?.members;
  if (Array.isArray(users)) {
    const u = users.find((x) => Number(x?.id || x?.user_id) !== Number(myId));
    if (u) return { id: u.id || u.user_id, name: u.name, phone: u.phone, avatar: u.avatar };
  }
  return null;
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

// ✅ dedupe: mỗi peer chỉ giữ 1 conversation mới nhất
function dedupeByPeer(list = [], myId) {
  const map = new Map();

  for (const c of list) {
    const peer = pickPeer(c, myId);
    const key =
      peer?.id ||
      peer?.phone ||
      c?.peer_id ||
      c?.other_user_id ||
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

// ✅ unread “Messenger-like” + localReadAt override
function calcUnread(conv, myId, localReadAtMs = 0) {
  const lastSender =
    conv?.last_message_sender_id ??
    conv?.lastMessageSenderId ??
    conv?.last_sender_id ??
    conv?.lastSenderId ??
    null;

  // last message do mình gửi => unread = 0
  if (lastSender && Number(lastSender) === Number(myId)) return 0;

  // nếu backend có sẵn unread_count
  const n = Number(conv?.unread_count ?? conv?.unreadCount ?? conv?.unread ?? NaN);
  if (Number.isFinite(n) && n > 0) return n;

  const lastAt = getLastMessageAtMs(conv);
  if (!lastAt) return 0;

  const myRead =
    conv?.my_last_read_at ??
    conv?.myLastReadAt ??
    conv?.last_read_at ??
    conv?.lastReadAt ??
    null;

  const readAtServer = myRead ? new Date(myRead).getTime() : 0;
  const readAt = Math.max(readAtServer || 0, localReadAtMs || 0);

  return lastAt > readAt ? 1 : 0;
}

export default function ChatDMWidget() {
  const auth = useAuth?.() || {};
  const user = auth.user || null;
  const token = auth.token || getTokenFallback();

  // admin role thì không cần DM widget
  if (Number(user?.role) === 2) return null;

  const myId = user?.id;

  const socket = useMemo(() => {
    if (!token) return null;
    return connectSocket(token);
  }, [token]);

  const [open, setOpen] = useState(false);

  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [text, setText] = useState("");
  const [info, setInfo] = useState("");

  // local override readAt để UI không nhấp nháy chờ server
  const [localReadAtByConv, setLocalReadAtByConv] = useState({});

  const joinedConvIdRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "auto") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const recomputeUnreadTotal = useCallback(
    (rows, excludeConvId = null) => {
      const total = (rows || []).reduce((sum, c) => {
        if (excludeConvId && Number(c.id) === Number(excludeConvId)) return sum;
        const localReadAt = localReadAtByConv?.[c.id] || 0;
        return sum + calcUnread(c, myId, localReadAt);
      }, 0);

      setUnreadTotal(total);
    },
    [localReadAtByConv, myId]
  );

  const refreshInbox = useCallback(
    async (opts = {}) => {
      const { excludeConversationId } = opts;
      if (!token) return [];

      try {
        setLoadingInbox(true);

        const res = await dmListConversations(token, { limit: 50 });
        let rows = res?.data || [];

        // ✅ lọc rỗng (không có tin nhắn) để khỏi “rác”
        rows = rows.filter(hasAnyMessage);

        // ✅ gộp trùng theo peer
        rows = dedupeByPeer(rows, myId);

        // ✅ sort mới nhất trước
        rows.sort((a, b) => getLastMessageAtMs(b) - getLastMessageAtMs(a));

        setInbox(rows);
        recomputeUnreadTotal(rows, excludeConversationId);
        return rows;
      } catch (e) {
        console.error("DM inbox error:", e);
        return [];
      } finally {
        setLoadingInbox(false);
      }
    },
    [token, myId, recomputeUnreadTotal]
  );

  const leaveCurrentRoom = useCallback(() => {
    const prev = joinedConvIdRef.current;
    if (prev) {
      socket?.emit("conversation:leave", { conversationId: prev }, () => {});
      joinedConvIdRef.current = null;
    }
  }, [socket]);

  const openConversation = useCallback(
    async (conv) => {
      if (!token) return;
      const convId = conv?.id;
      if (!convId) return;

      // leave room cũ
      if (joinedConvIdRef.current && Number(joinedConvIdRef.current) !== Number(convId)) {
        leaveCurrentRoom();
      }

      setActiveConv(conv);
      setMessages([]);
      setInfo("");

      try {
        setLoadingMsg(true);

        joinedConvIdRef.current = convId;
        socket?.emit("conversation:join", { conversationId: convId }, () => {});
        socket?.emit("read:mark", { conversationId: convId }, () => {});

        // local override readAt ngay
        setLocalReadAtByConv((prev) => ({ ...prev, [convId]: Date.now() }));

        const msgRes = await fetchMessages(token, convId, { limit: 50 });
        setMessages(msgRes?.data || []);

        await refreshInbox({ excludeConversationId: convId });
        setTimeout(() => scrollToBottom("auto"), 0);
      } catch (e) {
        console.error(e);
        setInfo(e.message || "Không tải được tin nhắn");
      } finally {
        setLoadingMsg(false);
      }
    },
    [token, socket, refreshInbox, leaveCurrentRoom, scrollToBottom]
  );

  // mở widget => refresh inbox
  useEffect(() => {
    if (!token) return;
    if (!open) return;
    refreshInbox({ excludeConversationId: activeConv?.id || null });
  }, [token, open, activeConv?.id, refreshInbox]);

  // ✅ PostDetail gọi mở: window.dispatchEvent(new CustomEvent("dm:open",{detail:{conversationId}}))
  useEffect(() => {
    if (!token) return;

    const handler = async (e) => {
      const convId = Number(e?.detail?.conversationId);
      if (!convId) return;

      setOpen(true);

      const rows = await refreshInbox({ excludeConversationId: convId });
      const found = rows.find((c) => Number(c.id) === convId);

      await openConversation(found || { id: convId });
    };

    window.addEventListener("dm:open", handler);
    return () => window.removeEventListener("dm:open", handler);
  }, [token, refreshInbox, openConversation]);

  // realtime events
  useEffect(() => {
    if (!socket) return;

    const onInboxUpdate = () => {
      refreshInbox({ excludeConversationId: open && activeConv?.id ? activeConv.id : null });
    };

    const onNew = (payload) => {
      const convId = payload?.conversationId;
      if (!convId) return;

      // luôn refresh list/badge (loại trừ hội thoại đang mở)
      refreshInbox({ excludeConversationId: open && activeConv?.id ? activeConv.id : null });

      // nếu đúng conv đang mở thì append tin
      if (Number(activeConv?.id) === Number(convId)) {
        const msg = payload?.message;
        if (msg) setMessages((prev) => [...prev, msg]);

        // nếu tin từ người khác -> mark read + local override
        const senderId = payload?.message?.sender_id;
        if (senderId && Number(senderId) !== Number(myId)) {
          socket.emit("read:mark", { conversationId: convId }, () => {});
          setLocalReadAtByConv((prev) => ({ ...prev, [convId]: Date.now() }));
        }

        setTimeout(() => scrollToBottom("smooth"), 0);
      }
    };

    socket.on("inbox:update", onInboxUpdate);
    socket.on("message:new", onNew);

    return () => {
      socket.off("inbox:update", onInboxUpdate);
      socket.off("message:new", onNew);
    };
  }, [socket, refreshInbox, open, activeConv?.id, myId, scrollToBottom]);

  // đóng widget => leave room (đỡ nhận loạn)
  useEffect(() => {
    if (open) return;
    leaveCurrentRoom();
  }, [open, leaveCurrentRoom]);

  const send = () => {
    if (!token || !socket || !activeConv?.id) return;
    const content = String(text || "").trim();
    if (!content) return;

    const convId = activeConv.id;

    socket.emit("message:send", { conversationId: convId, type: "text", content }, async (ack) => {
      if (ack?.ok) {
        setText("");
        setInfo("");

        // mình gửi xong => local override đọc để badge không đỏ
        setLocalReadAtByConv((prev) => ({ ...prev, [convId]: Date.now() }));
        socket.emit("read:mark", { conversationId: convId }, () => {});

        await refreshInbox({ excludeConversationId: convId });
        setTimeout(() => scrollToBottom("smooth"), 0);
      } else {
        setInfo(ack?.error || "Gửi thất bại");
      }
    });
  };

  return (
    <>
      {/* NÚT DM */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Chat với người dùng"
        className="fixed z-[61] right-6 bottom-24 w-14 h-14 rounded-full bg-white border border-slate-200/70 shadow-lg flex items-center justify-center hover:shadow-xl"
      >
        <img src={logoChat} alt="dm" className="w-8 h-8 object-contain" />

        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed z-[80] right-6 bottom-[164px] w-[380px] max-w-[92vw] h-[560px] bg-white rounded-2xl shadow-xl border border-slate-200/70 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200/70 flex items-center justify-between">
            <div className="font-semibold text-gray-900">{activeConv ? "Chat người dùng" : "Tin nhắn"}</div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setActiveConv(null);
                setMessages([]);
                setInfo("");
              }}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {!activeConv ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-3 border-b border-slate-200/70 text-sm text-gray-600 flex items-center justify-between">
                <span>Danh sách hội thoại</span>
                <button
                  type="button"
                  onClick={() => refreshInbox({ excludeConversationId: null })}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200/70 hover:bg-slate-50"
                >
                  Làm mới
                </button>
              </div>

              {loadingInbox && <div className="p-4 text-sm text-gray-500">Đang tải…</div>}

              {!loadingInbox && inbox.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Chưa có hội thoại DM.</div>
              )}

              {inbox.map((c) => {
                const peer = pickPeer(c, myId);
                const localReadAt = localReadAtByConv?.[c.id] || 0;
                const unread = calcUnread(c, myId, localReadAt);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openConversation(c)}
                    className="w-full text-left px-4 py-3 border-b border-slate-200/60 hover:bg-slate-50 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      👤
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-gray-900">
                          {peer?.name || peer?.phone || "Người dùng"}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {safeTime(c.last_message_at || c.lastMessageAt)}
                        </div>
                      </div>

                      <div className="mt-1 text-xs text-gray-500 line-clamp-1">
                        {c.last_message_preview || c.lastMessagePreview || " "}
                      </div>
                    </div>

                    {unread > 0 && <span className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-slate-200/70 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    leaveCurrentRoom();
                    setActiveConv(null);
                    setMessages([]);
                    setInfo("");
                    refreshInbox({ excludeConversationId: null });
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200/70 text-sm hover:bg-slate-50"
                >
                  ←
                </button>
                <div className="text-sm text-gray-700">Đang chat</div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50">
                {info && <div className="text-sm text-red-600 mb-3">{info}</div>}
                {loadingMsg && <div className="text-sm text-gray-500">Đang tải…</div>}

                {!loadingMsg && messages.length === 0 && (
                  <div className="text-sm text-gray-500">Chưa có tin nhắn.</div>
                )}

                {messages.map((m) => {
                  const mine = Number(m.sender_id) === Number(myId);
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
                            {safeTime(m.created_at)}
                          </div>
                        </div>
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
                  placeholder={token ? "Nhập tin nhắn..." : "Đăng nhập để chat..."}
                  disabled={!token}
                  className="flex-1 border border-orange-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!token || !text.trim()}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-orange-600"
                >
                  Gửi
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
