// src/models/image.js
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define('Image', {
    id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: () => uuidv4() },
    // bảng của bạn là post_id (snake_case)
    postId: { type: DataTypes.CHAR(36), allowNull: false, field: 'post_id' },
    url: { type: DataTypes.STRING(255), allowNull: false },
    isPrimary: { type: DataTypes.TINYINT, field: 'is_primary', allowNull: false, defaultValue: 0 },
    sortOrder: { type: DataTypes.INTEGER, field: 'sort_order', allowNull: true },
  }, {
    tableName: 'images',
    timestamps: true,
    underscored: true,
  });

  Image.associate = (models) => {
    Image.belongsTo(models.Post, { foreignKey: 'postId', targetKey: 'id', as: 'post' });
  };

  return Image;
};
