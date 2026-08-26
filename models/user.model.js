const { DataTypes } = require("sequelize");

const defineUserModel = (sequelize) => {
  return sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
          notEmpty: { msg: "El nombre es obligatorio" },
          len: { args: [2, 80], msg: "El nombre debe tener entre 2 y 80 caracteres" }
        }
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: "El correo electrónico no es válido" }
        }
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: "users"
    }
  );
};

module.exports = defineUserModel;