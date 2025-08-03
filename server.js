// server.js – Server quản lý key (xịn, ổn định, nhẹ nhàng)
const express = require("express");
const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// DB setup
const adapter = new FileSync("db.json");
const db = low(adapter);

// ✅ Khởi tạo DB nếu chưa có
if (!db.has("keys").value()) {
  db.set("keys", []).write();
}

// 👉 Tạo UUID ngẫu nhiên
function generateUUID() {
  return crypto.randomUUID();
}

// ✅ Tạo key
app.post("/create", (req, res) => {
  const { uuid, expireDays } = req.body;
  if (!uuid || !expireDays) {
    return res.status(400).json({ message: "Thiếu UUID hoặc thời hạn" });
  }

  const key = generateUUID();
  const createdAt = new Date().toISOString();
  db.get("keys")
    .push({ key, uuid, createdAt, expireDays: Number(expireDays) })
    .write();

  res.json({ message: "Tạo key thành công", key });
});

// ✅ Lấy danh sách key
app.get("/list", (req, res) => {
  const keys = Object.fromEntries(db.get("keys").value().map(k => [k.key, k]));
  res.json(keys);
});

// ✅ Xoá key
app.delete("/remove", (req, res) => {
  const { key } = req.query;
  const before = db.get("keys").value().length;
  db.set("keys", db.get("keys").filter(k => k.key !== key).value()).write();
  const after = db.get("keys").value().length;

  if (after < before) {
    res.json({ message: "Xoá key thành công" });
  } else {
    res.status(404).json({ message: "Không tìm thấy key" });
  }
});

// ✅ Xác thực key (có thể dùng cho app)
app.get("/verify", (req, res) => {
  const { key, uid } = req.query;
  const found = db.get("keys").find(k => k.key === key && k.uuid === uid).value();
  if (!found) return res.json({ valid: false, message: "Key không hợp lệ" });

  const created = new Date(found.createdAt);
  const expires = new Date(created.getTime() + found.expireDays * 86400000);
  const now = new Date();

  if (now > expires) {
    return res.json({ valid: false, message: "Key đã hết hạn" });
  }

  res.json({ valid: true, message: "Key hợp lệ" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));