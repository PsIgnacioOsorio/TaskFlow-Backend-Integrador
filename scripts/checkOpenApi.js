const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const contractPath = path.join(__dirname, "../docs/openapi.yaml");
const contract = YAML.parse(fs.readFileSync(contractPath, "utf8"));

assert.equal(contract.openapi, "3.0.3");
assert.equal(contract.servers[0].url, "http://localhost:3000/api/v1");

for (const pathname of [
  "/auth/register",
  "/auth/login",
  "/users",
  "/tasks",
  "/projects",
  "/upload"
]) {
  assert.ok(contract.paths[pathname], `Falta documentar ${pathname}`);
}

const methods = new Set();
for (const pathItem of Object.values(contract.paths)) {
  for (const method of ["get", "post", "put", "delete"]) {
    if (pathItem[method]) methods.add(method.toUpperCase());
  }
}
assert.deepEqual([...methods].sort(), ["DELETE", "GET", "POST", "PUT"]);
assert.deepEqual(contract.paths["/tasks"].get.security, [{ bearerAuth: [] }]);
assert.deepEqual(contract.paths["/projects"].get.security, [{ bearerAuth: [] }]);
assert.equal(
  contract.paths["/upload"].post.requestBody.content["multipart/form-data"].schema.properties.file.format,
  "binary"
);

console.log("OpenAPI: contrato 3.0.3 válido con CRUD, JWT y multipart/form-data.");
