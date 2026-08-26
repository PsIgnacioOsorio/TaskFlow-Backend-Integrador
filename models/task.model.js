const { DataTypes } = require("sequelize");

const defineTaskModel = (sequelize) => {
  return sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
          notEmpty: { msg: "El título es obligatorio" },
          len: { args: [2, 80], msg: "El título debe tener entre 2 y 80 caracteres" }
        }
      },
      description: {
        type: DataTypes.STRING(240),
        allowNull: false,
        defaultValue: ""
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: {
            args: [["pending", "in_progress", "completed"]],
            msg: "El estado de la tarea no es válido"
          }
        }
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "medium",
        validate: {
          isIn: {
            args: [["low", "medium", "high"]],
            msg: "La prioridad de la tarea no es válida"
          }
        }
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id"
      }
    },
    {
      tableName: "tasks",
      indexes: [
        { fields: ["user_id"] },
        { fields: ["status"] },
        { fields: ["priority"] }
      ]
    }
  );
};

module.exports = defineTaskModel;
