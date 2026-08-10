const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const testLogFilePath = path.join(os.tmpdir(), `taskflow-${process.pid}.log`);

process.env.NODE_ENV = "test";
process.env.LOG_FILE_PATH = testLogFilePath;
process.env.LOG_TIME_ZONE = "America/Santiago";

const { app } = require("../app");

let server;
let baseUrl;

before(async () => {
  await fs.rm(testLogFilePath, { force: true });

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
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

test("GET / renderiza la aplicación de tareas con HBS y Bootstrap", async () => {
  const response = await fetch(`${baseUrl}/`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(body, /Organiza tu trabajo sin complicaciones/);
  assert.match(body, /Agregar una tarea/);
  assert.match(body, /Preparar entrega del módulo/);
  assert.match(body, /bootstrap\.min\.css/);
});

test("GET /status devuelve JSON con formato consistente", async () => {
  const response = await fetch(`${baseUrl}/status`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.message, "Servidor TaskFlow activo");
  assert.equal(body.data.module, 6);
});

test("sirve Bootstrap y los archivos estáticos propios", async () => {
  const responses = await Promise.all([
    fetch(`${baseUrl}/vendor/bootstrap/css/bootstrap.min.css`),
    fetch(`${baseUrl}/vendor/bootstrap/js/bootstrap.bundle.min.js`),
    fetch(`${baseUrl}/css/styles.css`),
    fetch(`${baseUrl}/js/dashboard.js`)
  ]);

  assert.ok(responses.every((response) => response.status === 200));
  assert.match(await responses[0].text(), /Bootstrap/);
  assert.match(await responses[2].text(), /--taskflow-primary/);
  assert.match(await responses[3].text(), /applyFilters/);
});

test("GET /api/tasks lista y filtra las tareas temporales", async () => {
  const allResponse = await fetch(`${baseUrl}/api/tasks`);
  const allBody = await allResponse.json();
  const filteredResponse = await fetch(`${baseUrl}/api/tasks?status=completed`);
  const filteredBody = await filteredResponse.json();

  assert.equal(allResponse.status, 200);
  assert.equal(allBody.data.persistence, "memory");
  assert.equal(allBody.data.tasks.length, 3);
  assert.equal(allBody.data.summary.total, 3);
  assert.equal(filteredBody.data.tasks.length, 1);
  assert.ok(filteredBody.data.tasks.every((task) => task.status === "completed"));
});

test("los formularios permiten crear, avanzar y eliminar una tarea", async () => {
  const createResponse = await fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      title: "Tarea creada desde prueba",
      description: "Comprobar el flujo básico",
      priority: "high",
      dueDate: "2026-08-15"
    }),
    redirect: "manual"
  });

  assert.equal(createResponse.status, 303);

  let tasksResponse = await fetch(`${baseUrl}/api/tasks?search=creada desde prueba`);
  let tasksBody = await tasksResponse.json();
  assert.equal(tasksBody.data.tasks.length, 1);

  const createdTask = tasksBody.data.tasks[0];
  assert.equal(createdTask.status, "pending");

  const advanceResponse = await fetch(`${baseUrl}/tasks/${createdTask.id}/advance`, {
    method: "POST",
    redirect: "manual"
  });
  assert.equal(advanceResponse.status, 303);

  tasksResponse = await fetch(`${baseUrl}/api/tasks?search=creada desde prueba`);
  tasksBody = await tasksResponse.json();
  assert.equal(tasksBody.data.tasks[0].status, "in_progress");

  const deleteResponse = await fetch(`${baseUrl}/tasks/${createdTask.id}/delete`, {
    method: "POST",
    redirect: "manual"
  });
  assert.equal(deleteResponse.status, 303);

  tasksResponse = await fetch(`${baseUrl}/api/tasks?search=creada desde prueba`);
  tasksBody = await tasksResponse.json();
  assert.equal(tasksBody.data.tasks.length, 0);
});

test("GET /api/tasks rechaza un estado desconocido", async () => {
  const response = await fetch(`${baseUrl}/api/tasks?status=desconocido`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    status: "error",
    message: "Estado de tarea no válido",
    data: null
  });
});

test("una ruta web inexistente muestra la página 404", async () => {
  const response = await fetch(`${baseUrl}/ruta-inexistente`);
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(body, /Página no encontrada/);
  assert.match(body, /Volver a mis tareas/);
  assert.match(body, /\/ruta-inexistente/);
});

test("una ruta API inexistente mantiene el error 404 en JSON", async () => {
  const response = await fetch(`${baseUrl}/api/ruta-inexistente`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    status: "error",
    message: "Ruta no encontrada: GET /api/ruta-inexistente",
    data: null
  });
});

test("el middleware registra fecha, hora, método y ruta en un archivo plano", async () => {
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
