const {
  addProjectMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} = require("../services/project.service");
const { createHttpError } = require("../utils/httpError.util");
const { sendSuccess } = require("../utils/apiResponse.util");

const getProjects = async (req, res) => {
  const projects = await listProjects(req.auth);
  return sendSuccess(res, 200, "Proyectos obtenidos", { projects });
};

const getProjectById = async (req, res) => {
  const project = await getProject(req.params.id);
  const belongs = project.members.some((member) => member.id === req.auth.userId);
  if (req.auth.role !== "admin" && !belongs) {
    throw createHttpError(403, "No perteneces a este proyecto");
  }
  return sendSuccess(res, 200, "Proyecto y miembros obtenidos", { project });
};

const postProject = async (req, res) => {
  const project = await createProject(req.body, req.auth.userId);
  return sendSuccess(res, 201, "Proyecto creado", { project });
};

const putProject = async (req, res) => {
  const project = await updateProject(req.params.id, req.body, req.auth);
  return sendSuccess(res, 200, "Proyecto actualizado", { project });
};

const postMember = async (req, res) => {
  const project = await addProjectMember(req.params.id, req.body.userId, req.auth);
  return sendSuccess(res, 200, "Integrante asociado al proyecto", { project });
};

const removeProject = async (req, res) => {
  const project = await deleteProject(req.params.id, req.auth);
  return sendSuccess(res, 200, "Proyecto eliminado", { project });
};

module.exports = {
  getProjectById,
  getProjects,
  postMember,
  postProject,
  putProject,
  removeProject
};
