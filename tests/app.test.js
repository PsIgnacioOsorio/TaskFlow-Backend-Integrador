const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const testLogFilePath = path.join(os.tmpdir(), `taskflow-${process.pid}.log`);

process.env.NODE_ENV = "test";
process.env.LOG_FILE_PATH = testLogFilePath;
process.env.LOG_TIME_ZONE = "America/Santiago";
process.env.JWT_SECRET = "clave-secreta-de-pruebas-taskflow-modulo-8-2026";

const { app } = require("../app");

let server;
let baseUrl;

before(async () => {
  await fs.rm(testLogFilePath, { force: true });
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await fs.rm(testLogFilePath, { force: true });
});

test("GET /status identifica el Módulo 8, PostgreSQL, Sequelize y JWT", async () => {
  const response = await fetch(`${baseUrl}/status`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.data.module, 8);
  assert.equal(body.data.database, "PostgreSQL");
  assert.equal(body.data.orm, "Sequelize");
  assert.equal(body.data.authentication, "JWT");
});

test("GET /api/v1/status publica la versión de la API sin autenticación", async () => {
  const response = await fetch(`${baseUrl}/api/v1/status`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.apiVersion, "v1");
  assert.equal(body.data.module, 8);
});

test("dos recursos privados rechazan solicitudes sin token", async () => {
  const responses = await Promise.all([
    fetch(`${baseUrl}/api/v1/tasks`),
    fetch(`${baseUrl}/api/v1/projects`)
  ]);

  for (const response of responses) {
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.status, "error");
    assert.match(body.message, /Bearer/i);
  }
});

test("un JWT alterado responde 401 antes de consultar PostgreSQL", async () => {
  const response = await fetch(`${baseUrl}/api/v1/users`, {
    headers: { authorization: "Bearer token.alterado.invalido" }
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, "Token no válido");
});

test("registro y login validan el cuerpo antes de acceder a la base", async () => {
  const [registerResponse, loginResponse] = await Promise.all([
    fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "A", email: "mal", password: "123" })
    }),
    fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "mal", password: "" })
    })
  ]);

  assert.equal(registerResponse.status, 400);
  assert.equal(loginResponse.status, 400);
  assert.ok(Array.isArray((await registerResponse.json()).details));
  assert.ok(Array.isArray((await loginResponse.json()).details));
});

test("POST /api/v1/upload también exige JWT", async () => {
  const response = await fetch(`${baseUrl}/api/v1/upload`, { method: "POST" });
  assert.equal(response.status, 401);
});

test("sirve Bootstrap y los archivos estáticos de tareas y usuarios", async () => {
  const responses = await Promise.all([
    fetch(`${baseUrl}/vendor/bootstrap/css/bootstrap.min.css`),
    fetch(`${baseUrl}/css/styles.css`),
    fetch(`${baseUrl}/js/dashboard.js`),
    fetch(`${baseUrl}/js/users.js`)
  ]);

  assert.ok(responses.every((response) => response.status === 200));
  assert.match(await responses[0].text(), /Bootstrap/);
  assert.match(await responses[1].text(), /--taskflow-primary/);
});

test("POST /usuarios valida los datos antes de consultar la base", async () => {
  const response = await fetch(`${baseUrl}/usuarios`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "A", email: "correo-invalido" })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.status, "error");
  assert.match(body.message, /nombre/i);
});

test("POST /tareas exige título y usuario responsable", async () => {
  const response = await fetch(`${baseUrl}/tareas`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "", priority: "medium" })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.status, "error");
  assert.match(body.message, /título/i);
});

test("POST /transacciones valida ambas entidades antes de escribir", async () => {
  const response = await fetch(`${baseUrl}/transacciones/usuario-tarea`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user: { name: "Usuario válido", email: "valido@taskflow.local" },
      task: { title: "", priority: "medium" }
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.status, "error");
  assert.match(body.message, /título/i);
});

test("un cuerpo JSON mal formado responde 400 con un mensaje seguro", async () => {
  const response = await fetch(`${baseUrl}/usuarios`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{\"name\":\"JSON incompleto\""
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    status: "error",
    message: "El cuerpo JSON no tiene un formato válido",
    data: null
  });
});

test("GET /tareas rechaza un estado desconocido sin consultar PostgreSQL", async () => {
  const response = await fetch(`${baseUrl}/tareas?status=desconocido`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    status: "error",
    message: "Estado de tarea no válido",
    data: null
  });
});

test("la vista principal documenta la persistencia en PostgreSQL", async () => {
  const template = await fs.readFile(path.join(__dirname, "../views/home.hbs"), "utf8");
  assert.match(template, /Persistencia activa/);
  assert.match(template, /Responsable/);
  assert.match(template, /PostgreSQL mediante Sequelize/);
});

test("una ruta web inexistente conserva la página 404", async () => {
  const response = await fetch(`${baseUrl}/ruta-inexistente`);
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(body, /Página no encontrada/);
  assert.match(body, /Volver a mis tareas/);
});

test("una ruta de datos inexistente responde 404 en JSON", async () => {
  const response = await fetch(`${baseUrl}/api/ruta-inexistente`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    status: "error",
    message: "Ruta no encontrada: GET /api/ruta-inexistente",
    data: null
  });
});

test("el middleware mantiene el registro de accesos del Módulo 6", async () => {
  await fetch(`${baseUrl}/status`);
  let logContent = "";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      logContent = await fs.readFile(testLogFilePath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (logContent.includes("ruta=/status")) break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  assert.match(
    logContent,
    /fecha=\d{4}-\d{2}-\d{2} hora=\d{2}:\d{2}:\d{2} zona=America\/Santiago metodo=GET ruta=\/status/
  );
});
