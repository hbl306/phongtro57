// src/controllers/user.js
const userService = require('../services/user');

/**
 * Kiểm tra role admin (2). Nếu không phải admin, trả response và return true.
 * Nếu ok, return false.
 */
function requireAdmin(req, res) {
  const role = Number(req.user?.role ?? 0);
  if (role !== 2) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return true;
  }
  return false;
}

/** GET /api/admin/users?phone=... */
exports.getUsers = async (req, res) => {
  try {
    if (requireAdmin(req, res)) return;

    const { phone } = req.query;
    const users = await userService.getUsers({ phone });
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('admin getUsers error >>>', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

/** POST /api/admin/users */
exports.createUser = async (req, res) => {
  try {
    if (requireAdmin(req, res)) return;

    const payload = req.body; // { name, phone, password, role, money }
    const user = await userService.createUser(payload);
    return res.status(201).json({ success: true, data: { id: user.id } });
  } catch (err) {
    console.error('admin createUser error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Internal server error' });
  }
};

/** PUT /api/admin/users/:id */
exports.updateUser = async (req, res) => {
  try {
    if (requireAdmin(req, res)) return;

    const id = req.params.id;
    const payload = req.body; // allowed: name, phone, password, role, money
    const user = await userService.updateUser(id, payload);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: { id: user.id } });
  } catch (err) {
    console.error('admin updateUser error >>>', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Internal server error' });
  }
};

/** DELETE /api/admin/users/:id */
exports.deleteUser = async (req, res) => {
  try {
    if (requireAdmin(req, res)) return;

    const id = req.params.id;
    const ok = await userService.deleteUser(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('admin deleteUser error >>>', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
