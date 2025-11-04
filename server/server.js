// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDatabase from "./src/config/connectDatabase.js";
import authRoutes from "./src/routes/auth.js";

dotenv.config();

const app = express();

// CHỈ 1 middleware CORS thôi, và cho đúng origin 5173
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// đọc JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route test để bạn mở trên browser
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, msg: "API is alive" });
});

// auth routes
app.use("/api/auth", authRoutes);

// root
app.get("/", (req, res) => {
  res.send("server on ...");
});

// kết nối DB
connectDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
