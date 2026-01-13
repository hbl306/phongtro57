const adminChatService = require("../services/admin_chat");

module.exports = {
  async adminListSupportConversations(req, res) {
    try {
      const limit = Number(req.query.limit || 50);
      const q = String(req.query.q || "");
      const data = await adminChatService.adminListSupportConversations(req.user.id, { limit, q });
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message || "Server error" });
    }
  },

  async adminFetchMessages(req, res) {
    try {
      const conversationId = Number(req.params.id);
      const limit = Number(req.query.limit || 50);
      const data = await adminChatService.adminFetchMessages(req.user.id, conversationId, limit);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message || "Server error" });
    }
  },
};
