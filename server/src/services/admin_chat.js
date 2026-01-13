const { Op } = require("sequelize");
const db = require("../models");

function err(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = {
  async adminListSupportConversations(adminId, { limit = 50, q = "" } = {}) {
    // admin thấy các support open (hoặc assigned cho mình)
    const where = {
      type: "support",
      status: "open",
      [Op.or]: [
        { assigned_admin_id: null },
        { assigned_admin_id: adminId },
      ],
    };

    const convs = await db.Conversation.findAll({
      where,
      order: [["last_message_at", "DESC"], ["updated_at", "DESC"]],
      limit,
    });

    const out = [];
    for (const c of convs) {
      const u = await db.User.findByPk(c.user_id, { attributes: ["id", "name", "phone", "role"] });
      if (q && u && !String(u.name || "").toLowerCase().includes(q.toLowerCase())) continue;

      out.push({
        id: c.id,
        user: u,
        status: c.status,
        last_message_at: c.last_message_at,
        last_message_preview: c.last_message_preview,
      });
    }

    return out;
  },

  async adminFetchMessages(adminId, conversationId, limit = 50) {
    const conv = await db.Conversation.findByPk(conversationId);
    if (!conv) throw err(404, "Conversation not found");
    if (conv.type !== "support") throw err(400, "Not support conversation");

    if (conv.assigned_admin_id && Number(conv.assigned_admin_id) !== Number(adminId)) {
      throw err(403, "Conversation assigned to another admin");
    }

    const msgs = await db.Message.findAll({
      where: { conversation_id: conversationId },
      order: [["created_at", "ASC"]],
      limit,
    });

    return msgs;
  },
};
