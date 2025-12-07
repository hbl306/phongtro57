// server/src/models/wallet_topup.js
export default (sequelize, DataTypes) => {
  const WalletTopup = sequelize.define(
    "WalletTopup",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "success", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      provider_txn_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      provider_note: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "wallet_topups",
      timestamps: false,
    }
  );

  return WalletTopup;
};
