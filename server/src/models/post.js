const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    'Post',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      title: DataTypes.STRING,
      star: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      labelCode: {
        type: DataTypes.STRING(50),
        field: 'labelcode',
        allowNull: true,
      },
      address: DataTypes.TEXT,
      province: DataTypes.STRING(100),
      district: DataTypes.STRING(100),
      ward: DataTypes.STRING(100),
      street: DataTypes.STRING(255),

      // 🔥 Trạng thái mới: pending, approved, expired, hidden, booking, booked
      status: {
        type: DataTypes.ENUM(
          'pending',
          'approved',
          'expired',
          'hidden',
          'booking',
          'booked'
        ),
        defaultValue: 'pending',
      },

      categoryCode: {
        type: DataTypes.STRING(50),
        field: 'categoryCode',
      },
      description: DataTypes.TEXT,

      price: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      area: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // LONGTEXT JSON (mảng string)
      features: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        defaultValue: '[]',
        get() {
          const raw = this.getDataValue('features');
          try {
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        },
        set(val) {
          const toSave = Array.isArray(val) ? JSON.stringify(val) : '[]';
          this.setDataValue('features', toSave);
        },
      },

      userId: {
        type: DataTypes.INTEGER,
        field: 'userId',
        allowNull: false,
      },
      contact_name: DataTypes.STRING(100),
      contact_phone: DataTypes.STRING(20),
    },
    {
      tableName: 'posts',
      timestamps: true,
      underscored: true,
    }
  );

  Post.associate = (models) => {
    Post.hasMany(models.Image, {
      foreignKey: 'postId',
      sourceKey: 'id',
      as: 'images',
    });
    Post.hasMany(models.Video, {
      foreignKey: 'postId',
      sourceKey: 'id',
      as: 'videos',
    });
  };

  return Post;
};
