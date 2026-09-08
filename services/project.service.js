const { Project, ProjectMember, User, sequelize } = require("../models");
const { createHttpError, parsePositiveId } = require("../utils/httpError.util");

const projectInclude = [
  { model: User, as: "owner", attributes: ["id", "name", "email"] },
  {
    model: User,
    as: "members",
    attributes: ["id", "name", "email"],
    through: { attributes: ["joinedAt"] }
  }
];

const validateProjectPayload = (payload = {}, { partial = false } = {}) => {
  const clean = {};
  const has = (field) => Object.prototype.hasOwnProperty.call(payload, field);

  if (!partial || has("name")) {
    const name = String(payload.name || "").trim();
    if (name.length < 2 || name.length > 80) {
      throw createHttpError(400, "El nombre debe tener entre 2 y 80 caracteres");
    }
    clean.name = name;
  }
  if (!partial || has("description")) {
    const description = String(payload.description || "").trim();
    if (description.length > 240) {
      throw createHttpError(400, "La descripción no puede superar 240 caracteres");
    }
    clean.description = description;
  }
  if (partial && Object.keys(clean).length === 0) {
    throw createHttpError(400, "No se recibieron campos válidos para actualizar");
  }
  return clean;
};

const presentProject = (record) => record.get({ plain: true });

const findProjectRecord = async (id, options = {}) => {
  const project = await Project.findByPk(parsePositiveId(id, "ID de proyecto"), options);
  if (!project) throw createHttpError(404, "Proyecto no encontrado");
  return project;
};

const getProject = async (id) => {
  const project = await findProjectRecord(id, { include: projectInclude });
  return presentProject(project);
};

const listProjects = async ({ userId, role }) => {
  const options = { include: projectInclude, order: [["createdAt", "DESC"]] };
  const projects = await Project.findAll(options);
  const presented = projects.map(presentProject);
  return role === "admin"
    ? presented
    : presented.filter((project) => project.members.some((member) => member.id === userId));
};

const createProject = async (payload, ownerId) => {
  const clean = validateProjectPayload(payload);
  const projectId = await sequelize.transaction(async (transaction) => {
    const project = await Project.create({ ...clean, ownerId }, { transaction });
    await ProjectMember.create({ projectId: project.id, userId: ownerId }, { transaction });
    return project.id;
  });
  return getProject(projectId);
};

const assertProjectManager = (project, auth) => {
  if (auth.role !== "admin" && project.ownerId !== auth.userId) {
    throw createHttpError(403, "Solo el propietario o un administrador puede modificar el proyecto");
  }
};

const updateProject = async (id, payload, auth) => {
  const project = await findProjectRecord(id);
  assertProjectManager(project, auth);
  await project.update(validateProjectPayload(payload, { partial: true }));
  return getProject(project.id);
};

const addProjectMember = async (id, memberId, auth) => {
  const project = await findProjectRecord(id);
  assertProjectManager(project, auth);
  const userId = parsePositiveId(memberId, "ID de integrante");
  const user = await User.findByPk(userId);
  if (!user) throw createHttpError(404, "Usuario integrante no encontrado");
  await ProjectMember.findOrCreate({
    where: { projectId: project.id, userId },
    defaults: { projectId: project.id, userId }
  });
  return getProject(project.id);
};

const deleteProject = async (id, auth) => {
  const project = await findProjectRecord(id);
  assertProjectManager(project, auth);
  const deleted = presentProject(project);
  await project.destroy();
  return deleted;
};

module.exports = {
  addProjectMember,
  createProject,
  deleteProject,
  findProjectRecord,
  getProject,
  listProjects,
  updateProject,
  validateProjectPayload
};
