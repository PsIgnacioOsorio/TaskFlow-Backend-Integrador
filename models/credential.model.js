const { DataTypes } = require("sequelize");

const defineCredentialModel = (sequelize) => {
  return sequelize.define(
    "Credential",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      passwordHash: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "password_hash"
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        allowNull: false,
        defaultValue: "user"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "user_id"
      }
    },
    {
      tableName: "credentials"
    }
  );
};

module.exports = defineCredentialModel;
