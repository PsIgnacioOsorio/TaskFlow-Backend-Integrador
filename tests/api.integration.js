const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { after, before, test } = require("node:test");

require("dotenv").config({ quiet: true });

process.env.JWT_SECRET ||= "clave-secreta-de-pruebas-taskflow-modulo-8-2026";
process.env.SEED_USER_PASSWORD ||= "TaskFlow2026!";

const { app } = require("../app");
const { closeDatabase, connectDatabase } = require("../config/database");
const { maxFileSize } = require("../middlewares/upload.middleware");
const { User } = require("../models");
const { setupDatabase } = require("../services/databaseSetup.service");
const { createAccessToken } = require("../services/token.service");

let baseUrl;
let server;
let accessToken;
let adminToken;
let userId;
let taskId;
let projectId;
let avatarUrl;
const runId = `${Date.now()}-${process.pid}`;
const userEmail = `api-${runId}@taskflow.local`;

const jsonRequest = async (pathname, options = {}) => {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return { response, body: await response.json() };
};

before(async () => {
  await connectDatabase();
  await setupDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await User.destroy({ where: { email: userEmail } });
  if (avatarUrl) {
    await fs.unlink(path.join(__dirname, "..", avatarUrl.replace(/^\//, ""))).catch(() => {});
  }
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await closeDatabase();
});

test("registro, hash de contraseña y login JWT funcionan", async () => {
  const registration = await jsonRequest("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Usuario API",
      email: userEmail,
      password: "Modulo82026!",
      bio: "Cuenta temporal para la prueba de integración"
    }
  });
  assert.equal(registration.response.status, 201);
  userId = registration.body.data.user.id;
  assert.equal(registration.body.data.user.credential, undefined);
  assert.equal(registration.body.data.user.passwordHash, undefined);

  const duplicate = await jsonRequest("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Usuario repetido",
      email: userEmail,
      password: "Modulo82026!"
    }
  });
  assert.equal(duplicate.response.status, 409);

  const denied = await jsonRequest("/api/v1/auth/login", {
    method: "POST",
    body: { email: userEmail, password: "ClaveIncorrecta1" }
  });
  assert.equal(denied.response.status, 401);

  const login = await jsonRequest("/api/v1/auth/login", {
    method: "POST",
    body: { email: userEmail, password: "Modulo82026!" }
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.body.data.tokenType, "Bearer");
  accessToken = login.body.data.token;

  const adminLogin = await jsonRequest("/api/v1/auth/login", {
    method: "POST",
    body: {
      email: "ignacio@taskflow.local",
      password: process.env.SEED_USER_PASSWORD
    }
  });
  assert.equal(adminLogin.response.status, 200);
  adminToken = adminLogin.body.data.token;
});

test("JWT protege recursos y detecta expiración", async () => {
  const noToken = await jsonRequest("/api/v1/tasks");
  assert.equal(noToken.response.status, 401);

  const expiredToken = createAccessToken({ id: userId, role: "user" }, { expiresIn: "1ms" });
  await new Promise((resolve) => setTimeout(resolve, 10));
  const expired = await jsonRequest("/api/v1/projects", { token: expiredToken });
  assert.equal(expired.response.status, 401);
  assert.match(expired.body.message, /expirado/i);
});

test("CRUD de tareas aplica filtros y propiedad del recurso", async () => {
  const created = await jsonRequest("/api/v1/tasks", {
    method: "POST",
    token: accessToken,
    body: {
      title: `Tarea API ${runId}`,
      description: "CRUD protegido del Módulo 8",
      status: "pending",
      priority: "high",
      dueDate: "2026-09-20"
    }
  });
  assert.equal(created.response.status, 201);
  taskId = created.body.data.task.id;
  assert.equal(created.body.data.task.userId, userId);

  const filtered = await jsonRequest(
    `/api/v1/tasks?status=pending&search=${encodeURIComponent(runId)}`,
    { token: accessToken }
  );
  assert.equal(filtered.response.status, 200);
  assert.equal(filtered.body.data.tasks.length, 1);

  const updated = await jsonRequest(`/api/v1/tasks/${taskId}`, {
    method: "PUT",
    token: accessToken,
    body: { status: "completed" }
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.task.status, "completed");
});

test("proyectos demuestran relación N:M y perfiles la relación 1:1", async () => {
  const created = await jsonRequest("/api/v1/projects", {
    method: "POST",
    token: accessToken,
    body: {
      name: `Proyecto API ${runId}`,
      description: "Relación de usuarios y proyectos"
    }
  });
  assert.equal(created.response.status, 201);
  projectId = created.body.data.project.id;
  assert.equal(created.body.data.project.members.length, 1);

  const updated = await jsonRequest(`/api/v1/projects/${projectId}`, {
    method: "PUT",
    token: accessToken,
    body: { description: "Proyecto actualizado mediante CRUD REST" }
  });
  assert.equal(updated.response.status, 200);
  assert.equal(
    updated.body.data.project.description,
    "Proyecto actualizado mediante CRUD REST"
  );

  const camila = await User.findOne({ where: { email: "camila@taskflow.local" } });
  const member = await jsonRequest(`/api/v1/projects/${projectId}/members`, {
    method: "POST",
    token: accessToken,
    body: { userId: camila.id }
  });
  assert.equal(member.response.status, 200);
  assert.equal(member.body.data.project.members.length, 2);

  const relations = await jsonRequest(`/api/v1/users/${userId}`, { token: accessToken });
  assert.equal(relations.response.status, 200);
  assert.equal(relations.body.data.user.profile.userId, userId);
  assert.ok(relations.body.data.user.projects.some((project) => project.id === projectId));
});

test("Multer valida contenido y asocia el avatar al perfil", async () => {
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
  ]);
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "avatar.png");
  const response = await fetch(`${baseUrl}/api/v1/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: form
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  avatarUrl = body.data.avatarUrl;
  assert.match(avatarUrl, /^\/uploads\/avatars\/.+\.png$/);
  const publicAvatar = await fetch(`${baseUrl}${avatarUrl}`);
  assert.equal(publicAvatar.status, 200);

  const invalidForm = new FormData();
  invalidForm.append("file", new Blob(["no es una imagen"], { type: "text/plain" }), "nota.txt");
  const invalidResponse = await fetch(`${baseUrl}/api/v1/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: invalidForm
  });
  assert.equal(invalidResponse.status, 415);

  const oversized = Buffer.alloc(maxFileSize + 1);
  png.copy(oversized);
  const oversizedForm = new FormData();
  oversizedForm.append(
    "file",
    new Blob([oversized], { type: "image/png" }),
    "avatar-grande.png"
  );
  const oversizedResponse = await fetch(`${baseUrl}/api/v1/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: oversizedForm
  });
  assert.equal(oversizedResponse.status, 413);
});

test("DELETE completa el CRUD y el administrador elimina la cuenta", async () => {
  const deletedTask = await jsonRequest(`/api/v1/tasks/${taskId}`, {
    method: "DELETE",
    token: accessToken
  });
  assert.equal(deletedTask.response.status, 200);

  const deletedProject = await jsonRequest(`/api/v1/projects/${projectId}`, {
    method: "DELETE",
    token: accessToken
  });
  assert.equal(deletedProject.response.status, 200);

  const forbidden = await jsonRequest(`/api/v1/users/${userId}`, {
    method: "DELETE",
    token: accessToken
  });
  assert.equal(forbidden.response.status, 403);

  const deletedUser = await jsonRequest(`/api/v1/users/${userId}`, {
    method: "DELETE",
    token: adminToken
  });
  assert.equal(deletedUser.response.status, 200);
});
