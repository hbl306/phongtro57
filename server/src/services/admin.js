// src/services/adminStats.js
const { Op, fn, col } = require('sequelize');
const db = require('../models');

const { Post, Booking, WalletHistory, User } = db;

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

// Các action được tính là DOANH THU (tiền user bị trừ)
const REVENUE_ACTIONS = [
  'POST_CREATE',
  'POST_LABEL',
  'POST_EXTEND',
  'POST_REPOST',
];

async function getDashboardStats() {
  const { start: todayStart, end: todayEnd } = getTodayRange();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  // ---- Counters cơ bản ----
  const [
    pendingPosts,
    bookingPending,
    bookingConfirmed,
    totalUsers,
    newUsersToday,
  ] = await Promise.all([
    Post.count({ where: { status: 'pending' } }),
    Booking.count({ where: { status: 'pending' } }),
    Booking.count({ where: { status: 'confirmed' } }),
    User.count(),
    User.count({
      where: {
        created_at: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd,
        },
      },
    }),
  ]);

  // ---- Doanh thu tổng / tháng / hôm nay ----
  const [totalRow, monthRow, todayRow, breakdownRows] = await Promise.all([
    WalletHistory.findOne({
      where: { action: { [Op.in]: REVENUE_ACTIONS } },
      attributes: [[fn('SUM', col('amount_out')), 'total']],
      raw: true,
    }),
    WalletHistory.findOne({
      where: {
        action: { [Op.in]: REVENUE_ACTIONS },
        created_at: { [Op.gte]: monthStart, [Op.lt]: monthEnd },
      },
      attributes: [[fn('SUM', col('amount_out')), 'total']],
      raw: true,
    }),
    WalletHistory.findOne({
      where: {
        action: { [Op.in]: REVENUE_ACTIONS },
        created_at: { [Op.gte]: todayStart, [Op.lt]: todayEnd },
      },
      attributes: [[fn('SUM', col('amount_out')), 'total']],
      raw: true,
    }),
    WalletHistory.findAll({
      where: { action: { [Op.in]: REVENUE_ACTIONS } },
      attributes: ['action', [fn('SUM', col('amount_out')), 'total']],
      group: ['action'],
      raw: true,
    }),
  ]);

  const revenueTotal = Number(totalRow?.total || 0);
  const revenueMonth = Number(monthRow?.total || 0);
  const revenueToday = Number(todayRow?.total || 0);

  const revenueByAction = breakdownRows.map((row) => ({
    action: row.action,
    amount: Number(row.total || 0),
    label: row.action,
  }));

  // ---- Giao dịch ví gần đây ----
  const recentWalletRows = await WalletHistory.findAll({
    order: [['created_at', 'DESC']],
    limit: 6,
    attributes: [
      'id',
      'action',
      'amount_in',
      'amount_out',
      'balance_after',
      'note',
      'created_at',
    ],
    raw: true,
  });

  const recentWallet = recentWalletRows.map((r) => ({
    id: r.id,
    action: r.action,
    amountIn: Number(r.amount_in || 0),
    amountOut: Number(r.amount_out || 0),
    balanceAfter: Number(r.balance_after || 0),
    note: r.note || '',
    createdAt: r.created_at,
  }));

  // ---- Bài đăng gần đây ----
  const recentPostRows = await Post.findAll({
    order: [['created_at', 'DESC']],
    limit: 5,
    attributes: ['id', 'title', 'status', 'province', 'district', 'created_at'],
    raw: true,
  });

  const recentPosts = recentPostRows.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    province: p.province,
    district: p.district,
    createdAt: p.created_at,
  }));

  return {
    pendingPosts,
    bookingPending,
    bookingConfirmed,
    totalUsers,
    newUsersToday,
    revenueToday,
    revenueMonth,
    revenueTotal,
    revenueByAction,
    recentWallet,
    recentPosts,
  };
}

// Cách export đảm bảo require(...) có .getDashboardStats
module.exports = {
  getDashboardStats,
};
