// server/src/routes/admin_chat.js
const express = require("express");

// NOTE: fix ESM default export khi require()
const verifyTokenMod = require("../middlewares/verifyToken");
const adminOnlyMod = require("../middlewares/adminOnly");
const adminChatControllerMod = require("../controllers/admin_chat");

const verifyToken = verifyTokenMod.default || verifyTokenMod;
const adminOnly = adminOnlyMod.default || adminOnlyMod;
const adminChatController = adminChatControllerMod.default || adminChatControllerMod;

const router = express.Router();

// log đúng biến để check
console.log("verifyToken:", typeof verifyToken);
console.log("adminOnly:", typeof adminOnly);
console.log(
  "adminListSupportConversations:",
  typeof adminChatController.adminListSupportConversations
);
console.log("adminFetchMessages:", typeof adminChatController.adminFetchMessages);

router.get(
  "/conversations",
  verifyToken,
  adminOnly,
  adminChatController.adminListSupportConversations
);

router.get(
  "/conversations/:id/messages",
  verifyToken,
  adminOnly,
  adminChatController.adminFetchMessages
);

module.exports = router;
