"use strict";

module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: "id",
      },
      postId: {
        type: DataTypes.STRING(36), // posts.id = CHAR(36)
        allowNull: false,
        field: "post_id",
      },
      userId: {
        type: DataTypes.INTEGER, // users.id = INT
        allowNull: false,
        field: "user_id",
      },
      depositAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "deposit_amount",
      },
      // expires_at: NOT NULL
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
      confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "confirmed_at",
      },
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "expired", "canceled"),
        allowNull: false,
        defaultValue: "pending",
        field: "status",
      },
      // created_at, updated_at map bởi underscored + timestamps
    },
    {
      tableName: "bookings",
      underscored: true, // created_at / updated_at
      timestamps: true,
    }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.Post, {
      foreignKey: "postId",
      targetKey: "id",
      as: "post",
    });

    Booking.belongsTo(models.User, {
      foreignKey: "userId",
      targetKey: "id",
      as: "user",
    });
  };

  return Booking;
};
