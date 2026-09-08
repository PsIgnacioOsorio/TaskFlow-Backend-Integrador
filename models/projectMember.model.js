const { DataTypes } = require("sequelize");

const defineProjectMemberModel = (sequelize) => {
  return sequelize.define(
    "ProjectMember",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        field: "user_id"
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        field: "project_id"
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "joined_at"
      }
    },
    {
      tableName: "project_members",
      timestamps: false
    }
  );
};

module.exports = defineProjectMemberModel;
