// src/components/chat/ChatSupport.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { connectSocket } from "../../services/socketClient";
import { fetchMessages, getOrCreateMyConversation } from "../../services/chatService";
import { useAuth } from "../../containers/Public/AuthContext.jsx";
import logoChat from "../../assets/logoChat2.png";

function getTokenFallback() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

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

function pickLatestMessage(list = []) {
  if (!Array.isArray(list) || list.length === 0) return null;
  let best = null;
  let bestT = -1;
  for (const m of list) {
    const t = new Date(m?.created_at || m?.createdAt || 0).getTime();
    if (!Number.isNaN(t) && t > bestT) {
      bestT = t;
      best = m;
    }
  }
  return best;
}

function supportConvKey(userId) {
  return userId ? `support_conv_id_${userId}` : "support_conv_id";
}

function supportReadKey(userId) {
  return userId ? `support_last_read_at_${userId}` : "support_last_read_at";
}

export default function ChatSupport() {
  const auth = useAuth?.() || {};
  const user = auth.user || null;
  const token = auth.token || getTokenFallback();

  // Ẩn với admin
  if (Number(user?.role) === 2) return null;

  const myId = user?.id || null;

  const socket = useMemo(() => {
    if (!token) return null;
    return connectSocket(token);
  }, [token]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ KHÔNG gọi getOrCreate khi mở — chỉ dùng convId đã có (từ localStorage)
  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [info, setInfo] = useState("");

  // admin đã đọc đến thời điểm nào (để hiện "Đã xem")
  const [adminReadAt, setAdminReadAt] = useState(null);

  // badge đỏ (0/1)
  const [unread, setUnread] = useState(0);

  const joinedConvIdRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "auto") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // load convId từ localStorage (nếu user đã từng chat)
  useEffect(() => {
    if (!token) return;

    const key = supportConvKey(myId);
    const stored = localStorage.getItem(key);
    const cid = stored ? Number(stored) : null;

    if (cid && Number.isFinite(cid)) {
      setConversationId(cid);
    } else {
      setConversationId(null);
      setMessages([]);
      setUnread(0);
    }
  }, [token, myId]);

  // ✅ refreshUnread KHÔNG tạo conversation
  // - Nếu chưa có conversationId => unread = 0
  // - Nếu có => fetch 1 ít tin để check tin cuối có phải từ admin và > lastReadLocal
  const refreshUnread = useCallback(async () => {
    if (!token) return;
    if (!conversationId) {
      setUnread(0);
      return;
    }

    try {
      const keyRead = supportReadKey(myId);
      const lastReadLocal = Number(localStorage.getItem(keyRead) || 0) || 0;

      const msgRes = await fetchMessages(token, conversationId, { limit: 20 });
      const list = msgRes?.data || [];
      const latest = pickLatestMessage(list);

      if (!latest) {
        setUnread(0);
        return;
      }

      const latestAt = new Date(latest.created_at || latest.createdAt || 0).getTime();
      const senderRole = String(latest.sender_role || "").toLowerCase();

      // ✅ CHỈ unread khi tin cuối là admin và chưa đọc local
      const isUnread = senderRole === "admin" && latestAt > lastReadLocal;
      setUnread(isUnread ? 1 : 0);
    } catch {
      // ignore
    }
  }, [token, conversationId, myId]);

  useEffect(() => {
    if (!token) return;
    refreshUnread();
  }, [token, refreshUnread]);

  // join/leave helper
  const joinRoom = useCallback(
    (cid) => {
      if (!socket || !cid) return;

      if (joinedConvIdRef.current && Number(joinedConvIdRef.current) !== Number(cid)) {
        socket.emit("conversation:leave", { conversationId: joinedConvIdRef.current }, () => {});
      }

      joinedConvIdRef.current = cid;
      socket.emit("conversation:join", { conversationId: cid }, () => {});
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

  // mở panel:
  // - nếu chưa có conversation => chỉ hiển thị empty (KHÔNG tạo)
  // - nếu có => load messages + join + mark read
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!open) return;

      if (!token) {
        setInfo("Bạn cần đăng nhập để gửi tin nhắn.");
        setLoading(false);
        setMessages([]);
        return;
      }

      if (!conversationId) {
        setLoading(false);
        setMessages([]);
        setUnread(0);
        return;
      }

      try {
        setLoading(true);
        setInfo("");

        joinRoom(conversationId);

        const msgRes = await fetchMessages(token, conversationId, { limit: 50 });
        if (!mounted) return;
        setMessages(msgRes?.data || []);

        socket?.emit("read:mark", { conversationId }, () => {});

        // ✅ cập nhật local readAt để đóng panel không bị đỏ lại
        const keyRead = supportReadKey(myId);
        localStorage.setItem(keyRead, String(Date.now()));

        setUnread(0);
        setTimeout(() => scrollToBottom("auto"), 0);
      } catch (e) {
        console.error("ChatSupport init error >>>", e);
        setInfo(e.message || "Không khởi tạo được chat");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
      // đóng panel => leave room
      if (!open) return;
      leaveRoom();
    };
  }, [open, token, conversationId, joinRoom, leaveRoom, socket, myId, scrollToBottom]);

  // realtime: inbox:update => chỉ refreshUnread khi đang đóng panel
  useEffect(() => {
    if (!socket) return;

    const onInboxUpdate = () => {
      if (!open) refreshUnread();
    };

    socket.on("inbox:update", onInboxUpdate);
    return () => socket.off("inbox:update", onInboxUpdate);
  }, [socket, open, refreshUnread]);

  // realtime: message:new + read:update
  useEffect(() => {
    if (!socket) return;

    const onNew = (payload) => {
      const cid = joinedConvIdRef.current || conversationId;
      if (!payload || !cid) return;
      if (payload.conversationId !== cid) return;

      const msg = payload.message;
      if (!msg) return;

      setMessages((prev) => [...prev, msg]);

      const senderRole = String(msg?.sender_role || "").toLowerCase();

      if (open) {
        socket.emit("read:mark", { conversationId: cid }, () => {});
        const keyRead = supportReadKey(myId);
        localStorage.setItem(keyRead, String(Date.now()));
        setUnread(0);
      } else {
        // ✅ CHỈ bật chấm đỏ khi tin tới là từ ADMIN
        if (senderRole === "admin") setUnread(1);
      }

      if (open) setTimeout(() => scrollToBottom("smooth"), 0);
    };

    const onReadUpdate = (payload) => {
      const cid = joinedConvIdRef.current || conversationId;
      if (!payload || !cid) return;
      if (payload.conversationId !== cid) return;

      const who = String(payload.whoRole || payload.who || "").toLowerCase();
      if (who === "admin") setAdminReadAt(payload.readAt);
    };

    socket.on("message:new", onNew);
    socket.on("read:update", onReadUpdate);

    return () => {
      socket.off("message:new", onNew);
      socket.off("read:update", onReadUpdate);
    };
  }, [socket, conversationId, open, myId, scrollToBottom]);

  // ✅ tạo conversation CHỈ khi gửi lần đầu
  const ensureConversationId = useCallback(async () => {
    if (conversationId) return conversationId;
    if (!token) return null;

    const convRes = await getOrCreateMyConversation(token);
    const conv = convRes?.data;

    // debug shape conv
    if (import.meta?.env?.DEV) {
      console.log("[ChatSupport] conv item =>", conv);
    }

    const cid = conv?.id;
    if (!cid) return null;

    setConversationId(cid);
    localStorage.setItem(supportConvKey(myId), String(cid));
    return cid;
  }, [conversationId, token, myId]);

  const send = async () => {
    if (!token || !socket) return;

    const content = String(text || "").trim();
    if (!content) return;

    try {
      const cid = await ensureConversationId();
      if (!cid) {
        setInfo("Không tạo được hội thoại. Vui lòng thử lại.");
        return;
      }

      // nếu đang mở panel, join room ngay
      if (open) joinRoom(cid);

      socket.emit("message:send", { conversationId: cid, type: "text", content }, (ack) => {
        if (ack?.ok) {
          setText("");
          setInfo("");

          // mình gửi => unread vẫn 0
          setUnread(0);

          // nếu đang mở thì mark read (đồng bộ)
          if (open) {
            socket.emit("read:mark", { conversationId: cid }, () => {});
            localStorage.setItem(supportReadKey(myId), String(Date.now()));
          }
        } else {
          setInfo(ack?.error || "Gửi thất bại");
        }
      });
    } catch (e) {
      console.error(e);
      setInfo(e?.message || "Gửi thất bại");
    }
  };

  return (
    <>
      {/* NÚT CHAT SUPPORT */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Chat hỗ trợ"
        className="fixed z-[60] right-6 bottom-6 w-14 h-14 rounded-full bg-white border border-orange-200 shadow-lg flex items-center justify-center hover:shadow-xl"
      >
        <img src={logoChat} alt="chat" className="w-8 h-8 object-contain" />

        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-[12px] h-[12px] rounded-full bg-red-500 shadow" />
        )}
      </button>

      {/* PANEL CHAT */}
      {open && (
        <div className="fixed z-[70] right-6 bottom-[92px] w-[380px] max-w-[92vw] h-[560px] bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-gray-900">Chat với Admin</div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                leaveRoom();
              }}
              className="w-9 h-9 rounded-full hover:bg-orange-50 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-orange-50/20">
            {info && <div className="text-sm text-red-600 mb-3">{info}</div>}
            {loading && <div className="text-sm text-gray-500">Đang tải...</div>}

            {!token && <div className="text-sm text-gray-500">Bạn cần đăng nhập để chat.</div>}

            {token && !conversationId && !loading && (
              <div className="text-sm text-gray-500">
                Bạn chưa có hội thoại với admin. Hãy gửi tin nhắn đầu tiên để bắt đầu.
              </div>
            )}

            {token && conversationId && !loading && messages.length === 0 && (
              <div className="text-sm text-gray-500">Chưa có tin nhắn.</div>
            )}

            {messages.map((m) => {
              const mine = String(m.sender_role || "").toLowerCase() === "user";
              const time = formatTime(m.created_at || m.createdAt);
              const seen = mine ? isSeenByOther(adminReadAt, m.created_at || m.createdAt) : false;

              return (
                <div key={m.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[78%]">
                    <div
                      className={`px-3 py-2 rounded-2xl border shadow-sm ${
                        mine ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
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

          <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
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
        </div>
      )}
    </>
  );
}
