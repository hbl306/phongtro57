const { Op } = require('sequelize');
const db = require('../models');
const { Post, Image, Video, User, WalletHistory, Booking , Report} = db;

/* ---------- cost nhãn ---------- */
const LABEL_COST = {
  HOT: 50000,
  VIP1: 30000,
  VIP2: 20000,
  VIP3: 10000,
};

/* ---------- cost gia hạn ---------- */
const EXTEND_COST = {
  3: 15000,
  7: 30000,
  30: 135000,
};

/* ---------- helpers ---------- */
const PROVINCE_SLUG_MAP = {
  'ho-chi-minh': 'Hồ Chí Minh',
  'ha-noi': 'Hà Nội',
  'da-nang': 'Đà Nẵng',
  'binh-duong': 'Bình Dương',
};

// parse chuỗi "min-max" thành số
function parseRange(s) {
  if (!s) return {};
  const [minRaw, maxRaw] = String(s).split('-');
  const min = Number(minRaw);
  const max = Number(maxRaw);
  return {
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
  };
}

/* ---------- helper hết hạn: createdAt + star (ngày) ---------- */
const EXPIRABLE_STATUSES = ['pending', 'approved'];

function calcExpireAt(createdAt, star) {
  if (!createdAt) return null;
  const days = Number(star || 0);
  if (!days) return null;
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
}

async function ensureExpiredIfNeeded(post) {
  if (!post) return post;

  const status = post.status || 'pending';
  if (!EXPIRABLE_STATUSES.includes(status)) return post;

  const expireAt = calcExpireAt(post.createdAt, post.star);
  if (!expireAt) return post;

  if (expireAt.getTime() <= Date.now() && status !== 'expired') {
    post.status = 'expired';
    await post.save();
  }

  return post;
}

/* ---------- helper ghi lịch sử ví ---------- */
async function logWalletHistory({
  t,
  userId,
  action,
  amountIn = 0,
  amountOut = 0,
  balanceBefore,
  balanceAfter,
  refType = null,
  note = null,
}) {
  try {
    if (!WalletHistory) return;

    const payload = {
      userId,
      action,
      amountIn,
      amountOut,
      balanceBefore,
      balanceAfter,
      refType,
      note,
    };

    const options = t ? { transaction: t } : {};
    await WalletHistory.create(payload, options);
  } catch (e) {
    console.error('logWalletHistory error:', e.message);
  }
}

/* ============================================================
 *  createPost: Tạo bài + trừ tiền label + ghi wallet_history
 * ==========================================================*/
exports.createPost = async (payload, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      title,
      categoryCode,
      labelCode,
      description,
      address,
      province,
      district,
      ward,
      street,
      contact_name,
      contact_phone,
      price,
      area,
      features = [],
      imageUrls = [],
      videoUrl = null,
      walletAction,
      action,
    } = payload;

    const historyAction = walletAction || action || 'POST_CREATE';

    // phí nhãn
    const trimmedLabel = (labelCode || '').toUpperCase().trim();
    const cost = LABEL_COST[trimmedLabel] || 0;

    // status + star ban đầu
    const hasLabel = !!trimmedLabel;
    const initialStatus = hasLabel ? 'approved' : 'pending';
    const initialStar = hasLabel ? 3 : 1;

    // trừ tiền nếu có
    let newBalance;
    let balanceBefore = null;
    let balanceAfter = null;

    if (cost > 0) {
      const user = await User.findByPk(userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const balance = Number(user?.money || 0);

      if (balance < cost) {
        await t.rollback();
        const err = new Error('Số dư tài khoản không đủ');
        err.code = 'INSUFFICIENT_BALANCE';
        err.balance = balance;
        err.needed = cost;
        throw err;
      }

      balanceBefore = balance;
      newBalance = balance - cost;
      balanceAfter = newBalance;

      user.money = newBalance;
      await user.save({ transaction: t });
    }

    // tạo post
    const post = await Post.create(
      {
        title,
        star: initialStar,
        labelCode: trimmedLabel || null,
        address,
        province,
        district,
        ward,
        street,
        status: initialStatus,
        categoryCode,
        description,
        price: price ?? null,
        area: area ?? null,
        features,
        userId,
        contact_name,
        contact_phone,
      },
      { transaction: t }
    );

    // ảnh
    if (Array.isArray(imageUrls) && imageUrls.length) {
      const rows = imageUrls.map((url, idx) => ({
        postId: post.id,
        url,
        isPrimary: idx === 0 ? 1 : 0,
        sortOrder: idx,
      }));
      await Image.bulkCreate(rows, { transaction: t });
    }

    // video
    if (videoUrl) {
      await Video.create({ postId: post.id, url: videoUrl }, { transaction: t });
    }

    // log ví
    if (cost > 0 && balanceBefore != null && balanceAfter != null) {
      await logWalletHistory({
        t,
        userId,
        action: historyAction,
        amountIn: 0,
        amountOut: cost,
        balanceBefore,
        balanceAfter,
        refType: 'POST',
        note:
          historyAction === 'POST_REPOST'
            ? `Đăng lại tin #${post.id}${trimmedLabel ? ` với nhãn ${trimmedLabel}` : ''}`
            : `Đăng tin mới #${post.id}${trimmedLabel ? ` với nhãn ${trimmedLabel}` : ''}`,
      });
    }

    await t.commit();
    return { post, charged: cost, balance: newBalance };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/* ============================================================
 *  repostPost: Đăng lại tin (giữ nguyên id)
 * ==========================================================*/
exports.repostPost = async (postId, payload, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const post = await Post.findOne({
      where: { id: postId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!post) {
      const err = new Error('Không tìm thấy bài đăng');
      err.status = 404;
      throw err;
    }

    const {
      title,
      categoryCode,
      labelCode,
      description,
      address,
      province,
      district,
      ward,
      street,
      contact_name,
      contact_phone,
      price,
      area,
      features = [],
      imageUrls = [],
      videoUrl = null,
    } = payload;

    const trimmedLabel = (labelCode || '').toUpperCase().trim();
    const hasLabel = !!trimmedLabel;
    const cost = LABEL_COST[trimmedLabel] || 0;

    const initialStatus = hasLabel ? 'approved' : 'pending';
    const initialStar = hasLabel ? 3 : 1;

    let newBalance;
    let balanceBefore = null;
    let balanceAfter = null;

    if (cost > 0) {
      const user = await User.findByPk(userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const balance = Number(user?.money || 0);
      if (balance < cost) {
        await t.rollback();
        const err = new Error('Số dư tài khoản không đủ');
        err.code = 'INSUFFICIENT_BALANCE';
        err.balance = balance;
        err.needed = cost;
        throw err;
      }

      balanceBefore = balance;
      newBalance = balance - cost;
      balanceAfter = newBalance;

      user.money = newBalance;
      await user.save({ transaction: t });
    }

    // cập nhật nội dung
    post.title = title;
    post.categoryCode = categoryCode;
    post.description = description;
    post.address = address;
    post.province = province;
    post.district = district;
    post.ward = ward;
    post.street = street;
    post.contact_name = contact_name;
    post.contact_phone = contact_phone;
    post.price = price ?? null;
    post.area = area ?? null;
    post.features = features;
    post.labelCode = trimmedLabel || null;
    post.status = initialStatus;
    post.star = initialStar;

    const now = new Date();
    post.setDataValue('createdAt', now);
    post.changed('createdAt', true);

    await post.save({ transaction: t });

    // ảnh
    await Image.destroy({ where: { postId: post.id }, transaction: t });
    if (Array.isArray(imageUrls) && imageUrls.length) {
      const rows = imageUrls.map((url, idx) => ({
        postId: post.id,
        url,
        isPrimary: idx === 0 ? 1 : 0,
        sortOrder: idx,
      }));
      await Image.bulkCreate(rows, { transaction: t });
    }

    // video
    await Video.destroy({ where: { postId: post.id }, transaction: t });
    if (videoUrl) {
      await Video.create({ postId: post.id, url: videoUrl }, { transaction: t });
    }

    // log ví
    if (cost > 0 && balanceBefore != null && balanceAfter != null) {
      await logWalletHistory({
        t,
        userId,
        action: 'POST_REPOST',
        amountIn: 0,
        amountOut: cost,
        balanceBefore,
        balanceAfter,
        refType: 'POST',
        note: `Đăng lại tin #${post.id}${trimmedLabel ? ` với nhãn ${trimmedLabel}` : ''}`,
      });
    }

    await t.commit();
    return { post, charged: cost, balance: newBalance };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/* ============================================================
 *  getPosts: Lấy danh sách bài có filter
 * ==========================================================*/
exports.getPosts = async (query = {}) => {
  const where = {};
  const andConditions = [];

  /* trạng thái */
  if (query.status) {
    const s = String(query.status);
    if (s === 'public') {
      where.status = { [Op.in]: ['pending', 'approved'] };
    } else {
      where.status = s;
    }
  }

  /* danh mục */
  if (query.category) {
    where.categoryCode = String(query.category).toUpperCase();
  }

  /* tỉnh */
  if (query.province) {
    const raw = String(query.province);
    const pv = PROVINCE_SLUG_MAP[raw.toLowerCase()] || raw;
    where.province = { [Op.like]: `%${pv}%` };
  }

  /* quận / huyện, phường / xã */
  if (query.district) {
    where.district = { [Op.like]: `%${query.district}%` };
  }

  if (query.ward) {
    where.ward = { [Op.like]: `%${query.ward}%` };
  }

  /* khoảng giá */
  if (query.price) {
    const { min, max } = parseRange(query.price);
    if (min && max) where.price = { [Op.between]: [min, max] };
    else if (min) where.price = { [Op.gte]: min };
    else if (max) where.price = { [Op.lte]: max };
  }

  /* khoảng diện tích */
  if (query.area) {
    const { min, max } = parseRange(query.area);
    if (min && max) where.area = { [Op.between]: [min, max] };
    else if (min) where.area = { [Op.gte]: min };
    else if (max) where.area = { [Op.lte]: max };
  }

  /* features */
  if (query.features) {
    const feats = Array.isArray(query.features)
      ? query.features
      : String(query.features)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    if (feats.length) {
      feats.forEach((feat) => {
        andConditions.push({
          features: { [Op.like]: `%${feat}%` },
        });
      });
    }
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  const rows = await Post.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Image,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary', 'sortOrder', 'createdAt'],
        required: false,
      },
      {
        model: Video,
        as: 'videos',
        attributes: ['id', 'url', 'createdAt'],
        required: false,
      },
    ],
    limit: 50,
  });

  for (const p of rows) {
    // eslint-disable-next-line no-await-in-loop
    await ensureExpiredIfNeeded(p);
  }

  return rows.map((p) => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    const vids = Array.isArray(p.videos) ? p.videos : [];
    const primary =
      imgs.find((i) => (i.isPrimary ?? i.is_primary) === 1) || imgs[0];

    return {
      id: p.id,
      userId: p.userId,
      title: p.title,
      description: p.description,
      price: p.price,
      area: p.area,
      province: p.province,
      district: p.district,
      ward: p.ward,
      street: p.street,
      address: p.address,
      categoryCode: p.categoryCode,
      labelCode: p.labelCode || null,
      star: p.star || 0,
      status: p.status || 'pending',
      contact_name: p.contact_name || '',
      contact_phone: p.contact_phone || '',
      createdAt: p.createdAt,
      features: p.features,
      coverImage: primary ? primary.url : null,
      videoUrl: vids[0]?.url || null,
      images: imgs.map((i) => ({
        url: i.url,
        isPrimary: i.isPrimary ?? i.is_primary,
        sortOrder: i.sortOrder ?? i.sort_order,
      })),
      videos: vids.map((v) => ({ url: v.url })),
    };
  });
};

/* ============================================================
 *  getPostById: chi tiết 1 bài
 * ==========================================================*/
exports.getPostById = async (id) => {
  const post = await Post.findByPk(id, {
    include: [
      {
        model: Image,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary', 'sortOrder'],
      },
      {
        model: Video,
        as: 'videos',
        attributes: ['id', 'url'],
      },
    ],
  });

  if (!post) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }

  await ensureExpiredIfNeeded(post);
  return post;
};

/* ============================================================
 *  updatePost: cập nhật bài (không trừ tiền, giữ nguyên label)
 * ==========================================================*/
exports.updatePost = async (postId, payload, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const post = await Post.findByPk(postId, { transaction: t });

    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      throw err;
    }

    if (Number(post.userId) !== Number(userId)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }

    const {
      title,
      categoryCode,
      description,
      address,
      province,
      district,
      ward,
      street,
      contact_name,
      contact_phone,
      price,
      area,
      features = [],
      imageUrls = [],
      videoUrl = null,
    } = payload;

    post.title = title;
    post.categoryCode = categoryCode;
    post.description = description;
    post.address = address;
    post.province = province;
    post.district = district;
    post.ward = ward;
    post.street = street;
    post.contact_name = contact_name;
    post.contact_phone = contact_phone;
    post.price = price ?? null;
    post.area = area ?? null;
    post.features = features;

    await post.save({ transaction: t });

    await Image.destroy({ where: { postId: post.id }, transaction: t });

    if (Array.isArray(imageUrls) && imageUrls.length) {
      const rows = imageUrls.map((url, idx) => ({
        postId: post.id,
        url,
        isPrimary: idx === 0 ? 1 : 0,
        sortOrder: idx,
      }));
      await Image.bulkCreate(rows, { transaction: t });
    }

    await Video.destroy({ where: { postId: post.id }, transaction: t });

    if (videoUrl) {
      await Video.create({ postId: post.id, url: videoUrl }, { transaction: t });
    }

    await t.commit();
    return { post };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/* ============================================================
 *  updateLabel: gắn / đổi nhãn
 * ==========================================================*/
exports.updateLabel = async (postId, labelCode, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const post = await Post.findOne({
      where: { id: postId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!post) {
      const err = new Error('Không tìm thấy bài đăng');
      err.status = 404;
      throw err;
    }

    const newLabel = (labelCode || '').toUpperCase().trim();
    const oldLabel = (post.labelCode || '').toUpperCase().trim();

    let cost = 0;
    let newBalance;
    let balanceBefore = null;
    let balanceAfter = null;

    if (newLabel !== oldLabel) {
      const labelCost = LABEL_COST[newLabel] || 0;
      cost = labelCost;

      if (cost > 0) {
        const user = await User.findByPk(userId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        const balance = Number(user?.money || 0);

        if (balance < cost) {
          await t.rollback();
          const err = new Error('Số dư tài khoản không đủ');
          err.code = 'INSUFFICIENT_BALANCE';
          err.balance = balance;
          err.needed = cost;
          throw err;
        }

        balanceBefore = balance;
        newBalance = balance - cost;
        balanceAfter = newBalance;

        user.money = newBalance;
        await user.save({ transaction: t });
      }

      post.labelCode = newLabel || null;
      await post.save({ transaction: t });
    }

    if (cost > 0 && balanceBefore != null && balanceAfter != null) {
      await logWalletHistory({
        t,
        userId,
        action: 'POST_LABEL',
        amountIn: 0,
        amountOut: cost,
        balanceBefore,
        balanceAfter,
        refType: 'POST',
        note: `Gắn nhãn ${newLabel || '(bỏ nhãn)'} cho bài #${post.id}`,
      });
    }

    await t.commit();
    return { post, charged: cost, balance: newBalance };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/* ============================================================
 *  extendPost: gia hạn bài đăng
 * ==========================================================*/
exports.extendPost = async (postId, days, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const extendDays = Number(days);
    if (![3, 7, 30].includes(extendDays)) {
      const err = new Error('Số ngày gia hạn không hợp lệ');
      err.status = 400;
      throw err;
    }

    const post = await Post.findOne({
      where: { id: postId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!post) {
      const err = new Error('Không tìm thấy bài đăng');
      err.status = 404;
      throw err;
    }

    const cost = EXTEND_COST[extendDays] || 0;
    let newBalance;
    let balanceBefore = null;
    let balanceAfter = null;

    if (cost > 0) {
      const user = await User.findByPk(userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const balance = Number(user?.money || 0);

      if (balance < cost) {
        await t.rollback();
        const err = new Error('Số dư tài khoản không đủ');
        err.code = 'INSUFFICIENT_BALANCE';
        err.balance = balance;
        err.needed = cost;
        throw err;
      }

      balanceBefore = balance;
      newBalance = balance - cost;
      balanceAfter = newBalance;

      user.money = newBalance;
      await user.save({ transaction: t });
    }

    const oldStar = Number(post.star || 0);
    const newStar = oldStar + extendDays;

    post.star = newStar;

    if (post.status === 'expired') {
      post.status = 'approved';
    }

    await post.save({ transaction: t });

    if (cost > 0 && balanceBefore != null && balanceAfter != null) {
      await logWalletHistory({
        t,
        userId,
        action: 'POST_EXTEND',
        amountIn: 0,
        amountOut: cost,
        balanceBefore,
        balanceAfter,
        refType: 'POST',
        note: `Gia hạn +${extendDays} ngày cho bài #${post.id}`,
      });
    }

    await t.commit();
    return { post, charged: cost, balance: newBalance };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/* ============================================================
 *  getPostsByUser: list bài theo user
 * ==========================================================*/
exports.getPostsByUser = async (userId) => {
  const rows = await Post.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Image,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary', 'sortOrder', 'createdAt'],
        required: false,
      },
      {
        model: Video,
        as: 'videos',
        attributes: ['id', 'url', 'createdAt'],
        required: false,
      },
    ],
  });

  for (const p of rows) {
    // eslint-disable-next-line no-await-in-loop
    await ensureExpiredIfNeeded(p);
  }

  return rows.map((p) => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    const vids = Array.isArray(p.videos) ? p.videos : [];
    const primary =
      imgs.find((i) => (i.isPrimary ?? i.is_primary) === 1) || imgs[0];

    return {
      id: p.id,
      userId: p.userId,
      title: p.title,
      description: p.description,
      price: p.price,
      area: p.area,
      province: p.province,
      district: p.district,
      ward: p.ward,
      street: p.street,
      address: p.address,
      categoryCode: p.categoryCode,
      labelCode: p.labelCode || null,
      star: p.star || 0,
      status: p.status || 'pending',
      contact_name: p.contact_name || '',
      contact_phone: p.contact_phone || '',
      createdAt: p.createdAt,
      coverImage: primary ? primary.url : null,
      videoUrl: vids[0]?.url || null,
      images: imgs.map((i) => ({
        url: i.url,
        isPrimary: i.isPrimary ?? i.is_primary,
        sortOrder: i.sortOrder ?? i.sort_order,
      })),
      videos: vids.map((v) => ({ url: v.url })),
    };
  });
};

/* ============================================================
 *  hidePost: Ẩn bài đăng (chủ bài)
 * ==========================================================*/
exports.hidePost = async (postId, userId) => {
  const post = await Post.findOne({
    where: { id: postId, userId },
  });

  if (!post) {
    const err = new Error('Không tìm thấy bài đăng');
    err.status = 404;
    throw err;
  }

  post.status = 'hidden';
  await post.save();

  return post;
};

/* ============================================================
 *  bookPost: người thuê ĐẶT PHÒNG
 *  - Tiền cọc = 30% giá phòng (làm tròn 10.000đ)
 *  - Trừ tiền user + ghi wallet_history(action = 'BOOKING')
 *  - Cập nhật post.status = 'booking'
 *  - Tạo 1 booking (pending, expiresAt = createdAt + 2 ngày xấp xỉ)
 * ==========================================================*/
exports.bookPost = async (postId, userId) => {
  const t = await db.sequelize.transaction();
  try {
    const post = await Post.findByPk(postId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!post) {
      const err = new Error('Không tìm thấy bài đăng');
      err.status = 404;
      throw err;
    }

    // không cho tự đặt phòng tin của mình
    if (Number(post.userId) === Number(userId)) {
      const err = new Error('Bạn không thể tự đặt phòng tin của mình');
      err.status = 400;
      throw err;
    }

    // chỉ tin đang hiển thị mới được đặt
    if (post.status !== 'approved') {
      const err = new Error('Chỉ có thể đặt phòng với tin đang hiển thị');
      err.status = 400;
      throw err;
    }

    const price = Number(post.price || 0);
    if (!price || price <= 0) {
      const err = new Error('Tin này chưa có giá, không thể đặt phòng');
      err.status = 400;
      throw err;
    }

    // tiền cọc = 30% giá phòng, làm tròn đến hàng chục nghìn
    const rawDeposit = Math.round(price * 0.3);
    const unit = 10000;
    const deposit = rawDeposit > 0 ? Math.round(rawDeposit / unit) * unit : 0;

    const user = await User.findByPk(userId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!user) {
      const err = new Error('Không tìm thấy người dùng');
      err.status = 404;
      throw err;
    }

    const balance = Number(user.money || 0);
    if (balance < deposit) {
      await t.rollback();
      const err = new Error('Số dư tài khoản không đủ');
      err.code = 'INSUFFICIENT_BALANCE';
      err.balance = balance;
      err.needed = deposit;
      throw err;
    }

    const balanceBefore = balance;
    const balanceAfter = balance - deposit;

    // trừ tiền
    user.money = balanceAfter;
    await user.save({ transaction: t });

    // cập nhật trạng thái post
    post.status = 'booking';
    await post.save({ transaction: t });

    // thời điểm tạo + expiresAt = createdAt + 2 ngày (xấp xỉ)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const booking = await Booking.create(
      {
        postId: post.id,
        userId,
        depositAmount: deposit,
        expiresAt,
        confirmedAt: null,
        status: 'pending',
      },
      { transaction: t }
    );

    // log ví
    await logWalletHistory({
      t,
      userId,
      action: 'BOOKING',
      amountIn: 0,
      amountOut: deposit,
      balanceBefore,
      balanceAfter,
      refType: 'BOOKING',
      note: `Đặt cọc phòng cho tin #${post.id} (booking #${booking.id})`,
    });

    await t.commit();
    return {
      booking,
      post,
      charged: deposit,
      balance: balanceAfter,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
// ============ REPORT (tenant gửi báo xấu) ============
exports.createReportForPost = async (postId, payload, reporterUserId) => {
  const post = await Post.findByPk(postId);
  if (!post) {
    const err = new Error("Không tìm thấy bài đăng để phản ánh");
    err.status = 404;
    throw err;
  }

  const reason = payload?.reason;
  const description = payload?.description || null;

  const reporterName =
    payload?.reporter_name || payload?.reporterName || payload?.name || "";
  const reporterPhone =
    payload?.reporter_phone || payload?.reporterPhone || payload?.phone || "";

  if (!reason) {
    const err = new Error("Thiếu lý do phản ánh");
    err.status = 400;
    throw err;
  }
  if (!String(reporterName).trim() || !String(reporterPhone).trim()) {
    const err = new Error("Vui lòng nhập đầy đủ họ tên và số điện thoại");
    err.status = 400;
    throw err;
  }

  const report = await Report.create({
    postId,
    reporterUserId: reporterUserId || null,
    reporterName: String(reporterName).trim(),
    reporterPhone: String(reporterPhone).trim(),
    reason,
    description: description ? String(description).trim() : null,
    status: "new",
  });

  return report;
};


/* ============================================================
 *  (NÂNG CẤP) deletePostByAdmin: xóa luôn reports + images + videos
 * ==========================================================*/
exports.deletePostByAdmin = async (postId) => {
  const t = await db.sequelize.transaction();
  try {
    // dọn các bảng con
    await Report.destroy({ where: { postId }, transaction: t });
    await Image.destroy({ where: { postId }, transaction: t });
    await Video.destroy({ where: { postId }, transaction: t });
    if (Booking) await Booking.destroy({ where: { postId }, transaction: t });

    // xóa post
    const deletedCount = await Post.destroy({
      where: { id: postId },
      transaction: t,
    });

    await t.commit();
    return { success: deletedCount > 0 };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
