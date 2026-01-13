// models/Report.js
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      postId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: "post_id",
      },

      reporterUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "reporter_user_id",
      },

      reporterName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "reporter_name",
      },

      reporterPhone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        field: "reporter_phone",
      },

      reason: {
        type: DataTypes.ENUM(
          "fraud",
          "duplicate",
          "cant_contact",
          "incorrect_info",
          "other"
        ),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("new", "resolved"),
        allowNull: false,
        defaultValue: "new",
      },

      // ✅ Map createdAt -> created_at (vì DB của bạn là created_at)
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "reports",
      timestamps: false, // ✅ Cách A: tắt timestamps, không tự tạo createdAt/updatedAt
      underscored: true,
    }
  );

  Report.associate = (models) => {
    // Report thuộc về 1 Post
    Report.belongsTo(models.Post, {
      foreignKey: "postId",
      targetKey: "id",
      as: "post",
    });

    // Nếu bạn có User model và muốn join người báo:
    // Report.belongsTo(models.User, {
    //   foreignKey: "reporterUserId",
    //   targetKey: "id",
    //   as: "reporter",
    // });
  };

  return Report;
};
