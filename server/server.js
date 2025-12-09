// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import connectDatabase from "./src/config/connectDatabase.js";
import authRoutes from "./src/routes/auth.js";
import postRoutes from "./src/routes/post.js";
import uploadRoutes from "./src/routes/upload.js";
import adminRoutes from "./src/routes/admin.js";
import bookingRoutes from "./src/routes/booking.js";
import walletRoutes from "./src/routes/wallet.js";

dotenv.config();

const app = express();

/**
 * CORS: cho phép cả localhost và link dev tunnel (client 5173)
 * ⚠️ Lưu ý: mỗi lần tạo tunnel mới, domain sẽ thay đổi,
 * bạn phải sửa lại origin tương ứng.
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://g1s1q49p-5173.asse.devtunnels.ms", // client tunnel hiện tại
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (ví dụ: Postman, server-side)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Nếu origin không nằm trong danh sách
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== API routes ======
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);

app.get("/api/ping", (req, res) => res.json({ ok: true }));

// Static uploads
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(uploadsDir));

// ====== Database & Server start ======
connectDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
