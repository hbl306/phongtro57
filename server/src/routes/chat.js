const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const chatController = require("../controllers/chat");

const router = express.Router();

// ✅ FE đang gọi cái này -> nếu không có sẽ 404
router.get("/unread/summary", verifyToken, chatController.unreadSummary);

// support user-admin
router.post("/conversations/me", verifyToken, chatController.getOrCreateMyConversation);
router.get("/conversations/:id/messages", verifyToken, chatController.fetchMessages);

// dm user-user
router.get("/dm/conversations", verifyToken, chatController.dmListConversations);
router.post("/dm/conversations", verifyToken, chatController.dmGetOrCreateConversation);

module.exports = router;
