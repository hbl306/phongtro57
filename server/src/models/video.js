// src/models/video.js
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Video = sequelize.define('Video', {
    id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: () => uuidv4() },
    // cột trong DB là post_id  → dùng attr postId và map field
    postId: { type: DataTypes.CHAR(36), allowNull: false, field: 'post_id' },
    url: { type: DataTypes.TEXT('long'), allowNull: false },
  }, {
    tableName: 'videos',
    timestamps: true,
    underscored: true,
  });

  Video.associate = (models) => {
    Video.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id', as: 'post' });
  };

  return Video;
};
