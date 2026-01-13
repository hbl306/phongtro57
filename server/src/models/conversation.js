// server/src/models/conversation.js
module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      // support: user <-> admin, dm: user <-> user
      type: {
        type: DataTypes.ENUM("support", "dm"),
        allowNull: false,
        defaultValue: "support",
      },

      // support: user_id là user mở support ticket
      // dm: user_id là người tạo hội thoại (created_by)
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      assigned_admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("open", "closed"),
        allowNull: false,
        defaultValue: "open",
      },

      last_message_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      last_message_preview: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // support read receipt
      user_last_read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      admin_last_read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "conversations",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Conversation.associate = (models) => {
    Conversation.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Conversation.belongsTo(models.User, {
      foreignKey: "assigned_admin_id",
      as: "assignedAdmin",
    });

    Conversation.hasMany(models.Message, {
      foreignKey: "conversation_id",
      as: "messages",
    });

    Conversation.hasMany(models.ConversationParticipant, {
      foreignKey: "conversation_id",
      as: "participants",
    });
  };

  return Conversation;
};
