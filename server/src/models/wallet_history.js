// server/src/models/wallet_history.js
module.exports = (sequelize, DataTypes) => {
  const WalletHistory = sequelize.define(
    "WalletHistory",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: "user_id",
      },

      action: {
        // Các action tiền tệ
        type: DataTypes.ENUM(
          "POST_CREATE",      // Đăng tin mới (có trừ tiền nhãn)
          "POST_LABEL",       // Gắn / đổi nhãn
          "POST_EXTEND",      // Gia hạn
          "POST_REPOST",      // Đăng lại
          "DEPOSIT",          // Nạp tiền
          "WITHDRAW",         // Rút tiền
          "BOOKING",          // Đặt phòng
          "REFUND",           // Hoàn tiền
          "RECEIVE_DEPOSIT"   // Nhận tiền cọc
        ),
        allowNull: false,
      },

      amountIn: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "amount_in",
      },

      amountOut: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "amount_out",
      },

      balanceBefore: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "balance_before",
      },

      balanceAfter: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "balance_after",
      },

      refType: {
        // ví dụ: 'POST', 'BOOKING', ...
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "ref_type",
      },

      note: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "wallet_history",
      timestamps: false, // bảng chỉ có created_at
      underscored: true,
    }
  );

  WalletHistory.associate = (models) => {
    WalletHistory.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return WalletHistory;
};
