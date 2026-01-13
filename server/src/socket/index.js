import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// IMPORTANT: models & service của bạn đang kiểu CommonJS,
// ESM import default sẽ lấy module.exports
import db from "../models/index.js";
import chatService from "../services/chat.js";

function getTokenFromSocket(socket) {
  return (
    socket.handshake?.auth?.token ||
    socket.handshake?.headers?.authorization?.replace("Bearer ", "") ||
    ""
  );
}

function roleToSenderRole(userRole) {
  return Number(userRole) === 2 ? "admin" : "user";
}

export function initSocket(httpServer, allowedOrigins = []) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) return next(new Error("NO_TOKEN"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

      const user = await db.User.findByPk(decoded.id, {
        attributes: ["id", "name", "phone", "role"],
      });
      if (!user) return next(new Error("NO_USER"));

      socket.user = {
        id: user.id,
        role: user.role,
        name: user.name,
        phone: user.phone,
      };

      // room theo user để bắn inbox:update
      socket.join(`user:${user.id}`);

      // ✅ room admin để support chat luôn notify được (dù admin chưa join conversation)
      if (Number(user.role) === 2) {
        socket.join("admins");
      }

      next();
    } catch (e) {
      next(new Error("AUTH_FAILED"));
    }
  });

  io.on("connection", (socket) => {
    // =========================
    // JOIN / LEAVE CONVERSATION
    // =========================
    socket.on("conversation:join", async ({ conversationId }, cb) => {
      try {
        const convId = Number(conversationId);
        const conv = await db.Conversation.findByPk(convId);
        if (!conv) return cb?.({ ok: false, error: "Conversation not found" });

        // permission:
        if (conv.type === "support") {
          // user được join nếu là chủ conversation
          if (
            Number(socket.user.role) !== 2 &&
            Number(conv.user_id) !== Number(socket.user.id)
          ) {
            return cb?.({ ok: false, error: "Forbidden" });
          }

          // admin join: nếu conv chưa assigned admin => gán admin này
          if (Number(socket.user.role) === 2) {
            if (
              conv.assigned_admin_id &&
              Number(conv.assigned_admin_id) !== Number(socket.user.id)
            ) {
              return cb?.({ ok: false, error: "Conversation assigned to another admin" });
            }

            if (!conv.assigned_admin_id) {
              await db.Conversation.update(
                { assigned_admin_id: socket.user.id },
                { where: { id: convId } }
              );
            }

            // đảm bảo admin có trong participants (nếu bạn dùng bảng cp cho support)
            if (chatService.upsertParticipant) {
              await chatService.upsertParticipant(
                convId,
                socket.user.id,
                conv.admin_last_read_at || null
              );
            }
          }

          // đảm bảo user có trong participants
          if (chatService.upsertParticipant) {
            await chatService.upsertParticipant(
              convId,
              conv.user_id,
              conv.user_last_read_at || null
            );
          }
        } else {
          // dm: phải là participant
          const ok = await chatService.ensureParticipant(convId, socket.user.id);
          if (!ok) return cb?.({ ok: false, error: "Forbidden" });
        }

        socket.join(`conv:${convId}`);
        cb?.({ ok: true });
      } catch (e) {
        cb?.({ ok: false, error: "Join failed" });
      }
    });

    socket.on("conversation:leave", ({ conversationId }, cb) => {
      const convId = Number(conversationId);
      socket.leave(`conv:${convId}`);
      cb?.({ ok: true });
    });

    // =========================
    // SEND MESSAGE
    // =========================
    socket.on("message:send", async ({ conversationId, type = "text", content }, cb) => {
      try {
        const convId = Number(conversationId);
        const conv = await db.Conversation.findByPk(convId);
        if (!conv) return cb?.({ ok: false, error: "Conversation not found" });

        const text = String(content || "").trim();
        if (!text) return cb?.({ ok: false, error: "Empty message" });

        // permission
        if (conv.type === "support") {
          // user chỉ được gửi nếu là chủ
          if (
            Number(socket.user.role) !== 2 &&
            Number(conv.user_id) !== Number(socket.user.id)
          ) {
            return cb?.({ ok: false, error: "Forbidden" });
          }

          // admin chỉ được gửi nếu đúng assigned
          if (
            Number(socket.user.role) === 2 &&
            conv.assigned_admin_id &&
            Number(conv.assigned_admin_id) !== Number(socket.user.id)
          ) {
            return cb?.({ ok: false, error: "Conversation assigned to another admin" });
          }
        } else {
          // dm: phải là participant
          const ok = await chatService.ensureParticipant(convId, socket.user.id);
          if (!ok) return cb?.({ ok: false, error: "Forbidden" });
        }

        const senderRole = roleToSenderRole(socket.user.role);

        const msg = await chatService.createMessage(
          convId,
          socket.user.id,
          senderRole,
          type,
          text
        );

        // emit message to room
        io.to(`conv:${convId}`).emit("message:new", {
          conversationId: convId,
          message: msg,
        });

        // =========================
        // INBOX UPDATE
        // =========================
        if (conv.type === "support") {
          // ✅ luôn notify toàn bộ admin để admin thấy đỏ/unread dù chưa join conv
          io.to("admins").emit("inbox:update", { conversationId: convId, type: "support" });

          // notify user chủ conv
          io.to(`user:${conv.user_id}`).emit("inbox:update", { conversationId: convId, type: "support" });

          // nếu bạn muốn chỉ notify assigned admin (thay vì tất cả admin),
          // vẫn có thể thêm: io.to(`user:${conv.assigned_admin_id}`).emit(...)
        } else {
          // dm: notify 2 participants
          const participants = await db.ConversationParticipant.findAll({
            where: { conversation_id: convId },
            attributes: ["user_id"],
          });

          for (const p of participants) {
            io.to(`user:${p.user_id}`).emit("inbox:update", { conversationId: convId, type: "dm" });
          }
        }

        cb?.({ ok: true });
      } catch (e) {
        console.error(e);
        cb?.({ ok: false, error: "Send failed" });
      }
    });

    // =========================
    // MARK READ
    // =========================
    socket.on("read:mark", async ({ conversationId }, cb) => {
      try {
        const convId = Number(conversationId);
        const conv = await db.Conversation.findByPk(convId);
        if (!conv) return cb?.({ ok: false, error: "Conversation not found" });

        // permission
        if (conv.type === "support") {
          const ok =
            Number(socket.user.role) === 2 ||
            Number(conv.user_id) === Number(socket.user.id);
          if (!ok) return cb?.({ ok: false, error: "Forbidden" });
        } else {
          const ok = await chatService.ensureParticipant(convId, socket.user.id);
          if (!ok) return cb?.({ ok: false, error: "Forbidden" });
        }

        const { readAt } = await chatService.markRead(
          convId,
          socket.user.id,
          socket.user.role
        );

        const whoRole = roleToSenderRole(socket.user.role); // 'admin' | 'user'

        io.to(`conv:${convId}`).emit("read:update", {
          conversationId: convId,
          whoId: socket.user.id,
          whoRole,
          readAt,
        });

        // refresh inbox
        if (conv.type === "support") {
          io.to("admins").emit("inbox:update", { conversationId: convId, type: "support" });
          io.to(`user:${conv.user_id}`).emit("inbox:update", { conversationId: convId, type: "support" });
        } else {
          const participants = await db.ConversationParticipant.findAll({
            where: { conversation_id: convId },
            attributes: ["user_id"],
          });
          for (const p of participants) {
            io.to(`user:${p.user_id}`).emit("inbox:update", { conversationId: convId, type: "dm" });
          }
        }

        cb?.({ ok: true });
      } catch (e) {
        console.error(e);
        cb?.({ ok: false, error: "Read mark failed" });
      }
    });
  });

  return io;
}
