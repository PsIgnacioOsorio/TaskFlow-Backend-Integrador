const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const collectionPath = path.join(
  __dirname,
  "../postman/TaskFlow-Modulo7.postman_collection.json"
);

const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));

const flattenRequests = (items = []) => {
  return items.flatMap((item) => {
    if (Array.isArray(item.item)) return flattenRequests(item.item);
    return item.request ? [item] : [];
  });
};

const getRawUrl = (request) => {
  return typeof request.url === "string" ? request.url : request.url.raw;
};

const requests = flattenRequests(collection.item);
const methods = new Set(requests.map((item) => item.request.method));
const routes = new Set(requests.map((item) => getRawUrl(item.request)));
const variables = new Map(
  (collection.variable || []).map((variable) => [variable.key, variable.value])
);

assert.equal(requests.length, 15, "La colección debe conservar sus 15 solicitudes");
assert.deepEqual(
  [...methods].sort(),
  ["DELETE", "GET", "POST", "PUT"],
  "La colección debe demostrar el CRUD completo"
);

for (const item of requests) {
  const testEvents = (item.event || []).filter(
    (event) => event.listen === "test" && event.script?.exec?.length > 0
  );
  const hasTests = testEvents.length > 0;
  assert.ok(hasTests, `${item.name} debe incluir pruebas automáticas de Postman`);

  for (const event of item.event || []) {
    if (!event.script?.exec?.length) continue;
    assert.doesNotThrow(
      () => new Function(event.script.exec.join("\n")),
      `${item.name} contiene un script de Postman con sintaxis inválida`
    );
  }
}

for (const requiredRoute of [
  "{{baseUrl}}/usuarios",
  "{{baseUrl}}/usuarios/sql",
  "{{baseUrl}}/usuarios/comparacion",
  "{{baseUrl}}/usuarios/{{userId}}/tareas",
  "{{baseUrl}}/tareas",
  "{{baseUrl}}/transacciones/usuario-tarea"
]) {
  assert.ok(routes.has(requiredRoute), `Falta la ruta de evidencia ${requiredRoute}`);
}

for (const idVariable of ["userId", "taskId", "transactionUserId"]) {
  assert.equal(
    variables.get(idVariable),
    "",
    `${idVariable} debe iniciar vacío para no modificar datos de ejemplo si falla una creación`
  );
}

console.log(
  "Postman: 15 solicitudes con CRUD, ORM/SQL, relación, transacciones y pruebas automáticas."
);
