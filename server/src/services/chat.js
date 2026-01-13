const { Op } = require("sequelize");
const db = require("../models");

function err(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function previewOf(content) {
  const s = String(content || "").trim();
  return s.length > 80 ? s.slice(0, 80) + "..." : s;
}

module.exports = {
  // participant helpers
  async ensureParticipant(conversationId, userId) {
    const row = await db.ConversationParticipant.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });
    return !!row;
  },

  async upsertParticipant(conversationId, userId, lastReadAt = null) {
    const found = await db.ConversationParticipant.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });
    if (found) return found;

    return db.ConversationParticipant.create({
      conversation_id: conversationId,
      user_id: userId,
      last_read_at: lastReadAt,
    });
  },

  // SUPPORT
  async getOrCreateSupportConversation(userId) {
    let conv = await db.Conversation.findOne({
      where: { type: "support", user_id: userId, status: "open" },
      order: [["id", "DESC"]],
    });

    if (!conv) {
      conv = await db.Conversation.create({
        type: "support",
        user_id: userId,
        status: "open",
        last_message_at: null,
        last_message_preview: null,
      });
    }

    // đảm bảo participant
    await this.upsertParticipant(conv.id, userId, conv.user_last_read_at || null);

    return conv;
  },

  // DM
  async dmGetOrCreateConversation(meId, peerId) {
    if (!peerId || Number.isNaN(Number(peerId))) throw err(400, "peerId invalid");
    if (Number(peerId) === Number(meId)) throw err(400, "Cannot chat with yourself");

    const peer = await db.User.findByPk(peerId, { attributes: ["id", "name", "role"] });
    if (!peer) throw err(404, "User not found");

    // tìm conv dm có đủ 2 participant
    const myRows = await db.ConversationParticipant.findAll({
      where: { user_id: meId },
      attributes: ["conversation_id"],
    });
    const convIds = myRows.map((r) => r.conversation_id);
    let conv = null;

    if (convIds.length) {
      conv = await db.Conversation.findOne({
        where: { id: { [Op.in]: convIds }, type: "dm" },
        order: [["id", "DESC"]],
      });

      // conv ở trên có thể không đúng peer; tìm đúng conv theo 2 participant
      if (conv) {
        const both = await db.Conversation.findOne({
          where: { id: { [Op.in]: convIds }, type: "dm" },
          include: [
            {
              model: db.ConversationParticipant,
              as: "participants",
              where: { user_id: { [Op.in]: [meId, peerId] } },
              required: true,
            },
          ],
          order: [["id", "DESC"]],
        });

        // both sẽ match nhiều conv nếu include kiểu này; nên check count participant
        // cách đơn giản: iterate convIds
        if (!both) conv = null;
      }
    }

    // cách chắc chắn: duyệt từng convId (ít vì inbox user thường nhỏ)
    if (convIds.length) {
      for (const id of convIds) {
        const c = await db.Conversation.findByPk(id);
        if (!c || c.type !== "dm") continue;
        const ps = await db.ConversationParticipant.findAll({
          where: { conversation_id: id },
          attributes: ["user_id"],
        });
        const ids = ps.map((x) => Number(x.user_id));
        if (ids.includes(Number(meId)) && ids.includes(Number(peerId)) && ids.length === 2) {
          conv = c;
          break;
        }
      }
    }

    if (!conv) {
      conv = await db.Conversation.create({
        type: "dm",
        user_id: meId, // giữ như schema cũ (không bắt buộc cho dm)
        status: "open",
        last_message_at: null,
        last_message_preview: null,
      });

      await this.upsertParticipant(conv.id, meId, null);
      await this.upsertParticipant(conv.id, peerId, null);
    }

    return {
      id: conv.id,
      peer: { id: peer.id, name: peer.name, role: peer.role },
    };
  },

  async dmListConversations(meId, { limit = 50, q = "" } = {}) {
    const rows = await db.ConversationParticipant.findAll({
      where: { user_id: meId },
      attributes: ["conversation_id", "last_read_at"],
      limit: 500,
    });

    const ids = rows.map((r) => r.conversation_id);
    if (!ids.length) return [];

    const convs = await db.Conversation.findAll({
      where: { id: { [Op.in]: ids }, type: "dm" },
      order: [["last_message_at", "DESC"], ["updated_at", "DESC"]],
      limit,
    });

    const result = [];
    for (const c of convs) {
      const ps = await db.ConversationParticipant.findAll({
        where: { conversation_id: c.id },
        attributes: ["user_id", "last_read_at"],
      });

      const peerId = ps.map((x) => Number(x.user_id)).find((id) => id !== Number(meId));
      const peer = peerId
        ? await db.User.findByPk(peerId, { attributes: ["id", "name", "role", "phone"] })
        : null;

      if (q && peer && !String(peer.name || "").toLowerCase().includes(q.toLowerCase())) continue;

      const my = ps.find((x) => Number(x.user_id) === Number(meId));
      const unread = c.last_message_at && (!my?.last_read_at || new Date(c.last_message_at) > new Date(my.last_read_at));

      result.push({
        id: c.id,
        type: c.type,
        last_message_at: c.last_message_at,
        last_message_preview: c.last_message_preview,
        peer,
        unread: !!unread,
      });
    }

    return result;
  },

  // messages
  async fetchMessages(meId, meRole, conversationId, limit = 50) {
    const conv = await db.Conversation.findByPk(conversationId);
    if (!conv) throw err(404, "Conversation not found");

    if (conv.type === "support") {
      if (Number(meRole) !== 2 && Number(conv.user_id) !== Number(meId)) throw err(403, "Không có quyền");
      if (Number(meRole) === 2 && conv.assigned_admin_id && Number(conv.assigned_admin_id) !== Number(meId)) {
        throw err(403, "Không có quyền");
      }
    } else {
      const ok = await this.ensureParticipant(conversationId, meId);
      if (!ok) throw err(403, "Không có quyền");
    }

    const msgs = await db.Message.findAll({
      where: { conversation_id: conversationId },
      order: [["created_at", "ASC"]],
      limit,
    });

    return msgs;
  },

  async createMessage(conversationId, senderId, senderRole, type, content) {
    const msg = await db.Message.create({
      conversation_id: conversationId,
      sender_role: senderRole, // 'user'|'admin'
      sender_id: senderId,
      type: type || "text",
      content: String(content || ""),
      created_at: new Date(),
    });

    await db.Conversation.update(
      {
        last_message_at: msg.created_at,
        last_message_preview: previewOf(msg.content),
      },
      { where: { id: conversationId } }
    );

    return msg;
  },

  async markRead(conversationId, userId, userRole) {
    const readAt = new Date();

    await db.ConversationParticipant.update(
      { last_read_at: readAt },
      { where: { conversation_id: conversationId, user_id: userId } }
    );

    const conv = await db.Conversation.findByPk(conversationId);
    if (conv?.type === "support") {
      if (Number(userRole) === 2) {
        await db.Conversation.update({ admin_last_read_at: readAt }, { where: { id: conversationId } });
      } else {
        await db.Conversation.update({ user_last_read_at: readAt }, { where: { id: conversationId } });
      }
    }

    return { readAt };
  },

  async touchReadAfterSend(conversationId, userId, userRole) {
    // gửi tin -> coi như người gửi đã đọc đến hiện tại
    try {
      await this.upsertParticipant(conversationId, userId, new Date());
      await this.markRead(conversationId, userId, userRole);
    } catch (_) {}
  },

  async unreadSummary(meId) {
    const rows = await db.ConversationParticipant.findAll({
      where: { user_id: meId },
      attributes: ["conversation_id", "last_read_at"],
      limit: 1000,
    });

    const ids = rows.map((r) => r.conversation_id);
    if (!ids.length) return { total: 0, support: 0, dm: 0 };

    const convs = await db.Conversation.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ["id", "type", "last_message_at"],
    });

    let support = 0;
    let dm = 0;

    for (const c of convs) {
      const my = rows.find((x) => Number(x.conversation_id) === Number(c.id));
      const unread = c.last_message_at && (!my?.last_read_at || new Date(c.last_message_at) > new Date(my.last_read_at));
      if (!unread) continue;

      if (c.type === "support") support += 1;
      if (c.type === "dm") dm += 1;
    }

    return { total: support + dm, support, dm };
  },
};
