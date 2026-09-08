const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const collectionPath = path.join(
  __dirname,
  "../postman/TaskFlow-Modulo8.postman_collection.json"
);
const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));

const flattenRequests = (items = []) => items.flatMap((item) => (
  Array.isArray(item.item) ? flattenRequests(item.item) : (item.request ? [item] : [])
));
const rawUrl = (request) => typeof request.url === "string" ? request.url : request.url.raw;
const requests = flattenRequests(collection.item);
const methods = new Set(requests.map((item) => item.request.method));
const urls = requests.map((item) => rawUrl(item.request));

assert.ok(requests.length >= 20, "La colección debe incluir al menos 20 evidencias ejecutables");
assert.deepEqual([...methods].sort(), ["DELETE", "GET", "POST", "PUT"]);

for (const item of requests) {
  const tests = (item.event || []).filter(
    (event) => event.listen === "test" && event.script?.exec?.length
  );
  assert.ok(tests.length, `${item.name} debe contener pruebas automáticas`);
  for (const event of item.event || []) {
    if (!event.script?.exec?.length) continue;
    assert.doesNotThrow(() => new Function(event.script.exec.join("\n")),
      `${item.name} contiene JavaScript inválido`);
  }
}

for (const route of [
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/users",
  "/api/v1/tasks",
  "/api/v1/projects",
  "/api/v1/upload"
]) {
  assert.ok(urls.some((url) => url.includes(route)), `Falta evidencia para ${route}`);
}

const uploadRequest = requests.find((item) => rawUrl(item.request).includes("/api/v1/upload"));
assert.equal(uploadRequest.request.body?.mode, "formdata", "Upload debe usar multipart/form-data");
assert.ok(
  uploadRequest.request.body.formdata.some((field) => field.key === "file" && field.type === "file"),
  "Upload debe declarar el campo de archivo file"
);

const protectedRequests = requests.filter((item) => (
  /\/api\/v1\/(users|tasks|projects|upload)/.test(rawUrl(item.request))
  && !/Sin token/.test(item.name)
));
assert.ok(protectedRequests.every((item) => item.request.auth?.type === "bearer"));

console.log(
  `Postman Módulo 8: ${requests.length} solicitudes con JWT, CRUD, relaciones, filtros y upload.`
);
