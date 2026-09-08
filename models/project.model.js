const { DataTypes } = require("sequelize");

const defineProjectModel = (sequelize) => {
  return sequelize.define(
    "Project",
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
          notEmpty: { msg: "El nombre del proyecto es obligatorio" },
          len: { args: [2, 80], msg: "El nombre debe tener entre 2 y 80 caracteres" }
        }
      },
      description: {
        type: DataTypes.STRING(240),
        allowNull: false,
        defaultValue: ""
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "owner_id"
      }
    },
    {
      tableName: "projects",
      indexes: [{ fields: ["owner_id"] }]
    }
  );
};

module.exports = defineProjectModel;
