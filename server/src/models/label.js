// server/src/models/label.js
module.exports = (sequelize, DataTypes) => {
  const Label = sequelize.define(
    "Label",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      value: {
        type: DataTypes.STRING(100),
      },
    },
    {
      tableName: "labels",
      timestamps: true,
      underscored: true,
    }
  );

  Label.associate = (models) => {
    // 1 label có thể được nhiều post dùng
    Label.hasMany(models.Post, {
      foreignKey: "labelCode",
      sourceKey: "code",
    });
  };

  return Label;
};
