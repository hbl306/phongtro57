import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { createServer } from "http";

import connectDatabase from "./src/config/connectDatabase.js";
import authRoutes from "./src/routes/auth.js";
import postRoutes from "./src/routes/post.js";
import uploadRoutes from "./src/routes/upload.js";
import adminRoutes from "./src/routes/admin.js";
import bookingRoutes from "./src/routes/booking.js";
import walletRoutes from "./src/routes/wallet.js";

// NEW routes
import chatRoutes from "./src/routes/chat.js";
import adminChatRoutes from "./src/routes/admin_chat.js";

// NEW socket (ESM)
import { initSocket } from "./src/socket/index.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://g1s1q49p-5173.asse.devtunnels.ms",
];

// CORS (cors middleware tự xử lý preflight OPTIONS rồi => không cần app.options("*"))
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // postman, curl...
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);

// NEW
app.use("/api/chat", chatRoutes);
app.use("/api/admin/chat", adminChatRoutes);

app.get("/api/ping", (req, res) => res.json({ ok: true }));

const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(uploadsDir));

connectDatabase();

const PORT = process.env.PORT || 5000;

// IMPORTANT: dùng http server để attach socket
const httpServer = createServer(app);
initSocket(httpServer, allowedOrigins);

httpServer.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
