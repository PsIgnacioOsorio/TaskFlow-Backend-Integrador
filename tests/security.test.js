const assert = require("node:assert/strict");
const { test } = require("node:test");

process.env.JWT_SECRET = "clave-secreta-de-pruebas-taskflow-modulo-8-2026";

const { readBearerToken } = require("../middlewares/auth.middleware");
const { maxFileSize } = require("../middlewares/upload.middleware");
const { validatePassword } = require("../services/auth.service");
const { createAccessToken, verifyAccessToken } = require("../services/token.service");
const { detectImageExtension } = require("../services/upload.service");

test("JWT conserva identidad y rol con firma válida", () => {
  const token = createAccessToken({ id: 27, role: "admin" }, { expiresIn: "5m" });
  const payload = verifyAccessToken(token);
  assert.equal(payload.sub, "27");
  assert.equal(payload.role, "admin");
  assert.equal(readBearerToken(`Bearer ${token}`), token);
});

test("Bearer rechaza encabezados incompletos o ambiguos", () => {
  assert.throws(() => readBearerToken(""), /Bearer/);
  assert.throws(() => readBearerToken("Basic abc"), /Bearer/);
  assert.throws(() => readBearerToken("Bearer uno dos"), /Bearer/);
});

test("contraseña exige longitud, mayúscula, minúscula y número", () => {
  assert.equal(validatePassword("Modulo82026!"), "Modulo82026!");
  assert.throws(() => validatePassword("minusculas1"), /mayúscula/i);
  assert.throws(() => validatePassword("CORTA1"), /entre 8 y 72/i);
});

test("upload reconoce firmas permitidas y mantiene límite de 2 MiB", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const webp = Buffer.from("RIFF0000WEBP", "ascii");
  assert.equal(detectImageExtension(png), "png");
  assert.equal(detectImageExtension(jpg), "jpg");
  assert.equal(detectImageExtension(webp), "webp");
  assert.equal(detectImageExtension(Buffer.from("archivo falso")), null);
  assert.equal(maxFileSize, 2 * 1024 * 1024);
});
