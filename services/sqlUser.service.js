const { sqlPool } = require("../config/database");
const { createHttpError } = require("../utils/httpError.util");

const parseActiveFilter = (value) => {
  if (value === undefined || value === "") return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw createHttpError(400, "active debe ser verdadero o falso");
};

const listUsersWithSql = async ({ search = "", active } = {}) => {
  const conditions = [];
  const values = [];
  const cleanSearch = String(search || "").trim();
  const activeFilter = parseActiveFilter(active);

  if (cleanSearch) {
    values.push(`%${cleanSearch}%`);
    conditions.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length})`);
  }
  if (activeFilter !== undefined) {
    values.push(activeFilter);
    conditions.push(`active = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await sqlPool.query(
    `SELECT id, name, email, active, created_at, updated_at
     FROM users
     ${whereClause}
     ORDER BY name ASC`,
    values
  );

  return result.rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }));
};

module.exports = { listUsersWithSql };
