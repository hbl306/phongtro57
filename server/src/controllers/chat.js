const chatService = require("../services/chat");

module.exports = {
  async unreadSummary(req, res) {
    try {
      const data = await chatService.unreadSummary(req.user.id);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message || "Server error" });
    }
  },

  async getOrCreateMyConversation(req, res) {
    try {
      const data = await chatService.getOrCreateSupportConversation(req.user.id);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message || "Server error" });
    }
  },

  async fetchMessages(req, res) {
    try {
      const conversationId = Number(req.params.id);
      const limit = Number(req.query.limit || 50);
      const data = await chatService.fetchMessages(req.user.id, req.user.role, conversationId, limit);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message || "Server error" });
    }
  },

  async dmListConversations(req, res) {
    try {
      const limit = Number(req.query.limit || 50);
      const q = String(req.query.q || "");
      const data = await chatService.dmListConversations(req.user.id, { limit, q });
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message || "Server error" });
    }
  },

  async dmGetOrCreateConversation(req, res) {
    try {
      const peerId = Number(req.body.peerId);
      const data = await chatService.dmGetOrCreateConversation(req.user.id, peerId);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message || "Server error" });
    }
  },
};
