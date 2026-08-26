const { sequelize } = require("../config/database");
const defineTaskModel = require("./task.model");
const defineUserModel = require("./user.model");

const User = defineUserModel(sequelize);
const Task = defineTaskModel(sequelize);

User.hasMany(Task, {
  as: "tasks",
  foreignKey: "userId",
  onDelete: "CASCADE"
});

Task.belongsTo(User, {
  as: "user",
  foreignKey: "userId"
});

module.exports = {
  Task,
  User,
  sequelize
};
