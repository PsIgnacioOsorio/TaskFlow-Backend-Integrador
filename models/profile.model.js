const { DataTypes } = require("sequelize");

const defineProfileModel = (sequelize) => {
  return sequelize.define(
    "Profile",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      bio: {
        type: DataTypes.STRING(240),
        allowNull: false,
        defaultValue: ""
      },
      avatarUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "avatar_url"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "user_id"
      }
    },
    {
      tableName: "profiles"
    }
  );
};

module.exports = defineProfileModel;
