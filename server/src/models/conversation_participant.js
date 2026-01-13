// server/src/models/conversation_participant.js
module.exports = (sequelize, DataTypes) => {
  const ConversationParticipant = sequelize.define(
    "ConversationParticipant",
    {
      conversation_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      last_read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "conversation_participants",
      underscored: true,
      timestamps: false, // bảng không có updated_at
    }
  );

  ConversationParticipant.associate = (models) => {
    ConversationParticipant.belongsTo(models.Conversation, {
      foreignKey: "conversation_id",
      as: "conversation",
    });
    ConversationParticipant.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return ConversationParticipant;
};
