// server/src/models/category.js
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      code: {
        type: DataTypes.STRING(10),
        primaryKey: true,
      },
      value: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "categories",
      timestamps: true,
      underscored: true,
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Post, {
      foreignKey: "categoryCode",
      sourceKey: "code",
    });
  };

  return Category;
};
