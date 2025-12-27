// server/models/comment.js
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // post_id CHAR(36)
      postId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: "post_id",
      },

      // user_id INT
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // optional, nếu sau này bạn muốn chấm sao
      rating: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },

      // parent_id INT (reply to comment)
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "parent_id",
      },
    },
    {
      tableName: "comments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.Post, {
      foreignKey: "postId",
      as: "post",
    });

    Comment.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    Comment.belongsTo(models.Comment, {
      foreignKey: "parentId",
      as: "parent",
    });

    Comment.hasMany(models.Comment, {
      foreignKey: "parentId",
      as: "replies",
    });
  };

  return Comment;
};
