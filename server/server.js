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

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST","PATCH" ,"PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes); 

const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(uploadsDir));

app.get("/api/ping", (req, res) => res.json({ ok: true }));
app.use("/api/admin", adminRoutes);


connectDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
