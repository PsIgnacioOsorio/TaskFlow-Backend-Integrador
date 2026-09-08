const { sequelize } = require("../config/database");
const defineCredentialModel = require("./credential.model");
const defineProfileModel = require("./profile.model");
const defineProjectModel = require("./project.model");
const defineProjectMemberModel = require("./projectMember.model");
const defineTaskModel = require("./task.model");
const defineUserModel = require("./user.model");

const User = defineUserModel(sequelize);
const Task = defineTaskModel(sequelize);
const Credential = defineCredentialModel(sequelize);
const Profile = defineProfileModel(sequelize);
const Project = defineProjectModel(sequelize);
const ProjectMember = defineProjectMemberModel(sequelize);

User.hasMany(Task, {
  as: "tasks",
  foreignKey: "userId",
  onDelete: "CASCADE"
});

Task.belongsTo(User, {
  as: "user",
  foreignKey: "userId"
});

User.hasOne(Credential, {
  as: "credential",
  foreignKey: "userId",
  onDelete: "CASCADE"
});

Credential.belongsTo(User, {
  as: "user",
  foreignKey: "userId"
});

User.hasOne(Profile, {
  as: "profile",
  foreignKey: "userId",
  onDelete: "CASCADE"
});

Profile.belongsTo(User, {
  as: "user",
  foreignKey: "userId"
});

User.hasMany(Project, {
  as: "ownedProjects",
  foreignKey: "ownerId",
  onDelete: "CASCADE"
});

Project.belongsTo(User, {
  as: "owner",
  foreignKey: "ownerId"
});

User.belongsToMany(Project, {
  as: "projects",
  through: ProjectMember,
  foreignKey: "userId",
  otherKey: "projectId"
});

Project.belongsToMany(User, {
  as: "members",
  through: ProjectMember,
  foreignKey: "projectId",
  otherKey: "userId"
});

module.exports = {
  Credential,
  Profile,
  Project,
  ProjectMember,
  Task,
  User,
  sequelize
};
