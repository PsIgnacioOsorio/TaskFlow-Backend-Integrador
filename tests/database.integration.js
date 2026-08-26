const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");

require("dotenv").config({ quiet: true });

const { closeDatabase, connectDatabase } = require("../config/database");
const { User } = require("../models");
const { setupDatabase } = require("../services/databaseSetup.service");
const { listUsersWithSql } = require("../services/sqlUser.service");
const { addTask, listTasks, removeTask, updateTask } = require("../services/task.service");
const {
  createUser,
  createUserWithInitialTask,
  deleteUser,
  getUserWithTasks,
  listUsers,
  updateUser
} = require("../services/user.service");

before(async () => {
  await connectDatabase();
  await setupDatabase();
});

after(async () => {
  await closeDatabase();
});

test("PostgreSQL permite CRUD, filtros, include y SQL directo", async () => {
  const token = `${Date.now()}-${process.pid}`;
  const email = `prueba-${token}@taskflow.local`;
  const user = await createUser({ name: "Usuario de prueba", email, active: true });

  const updatedUser = await updateUser(user.id, { name: "Usuario actualizado" });
  assert.equal(updatedUser.name, "Usuario actualizado");

  const task = await addTask({
    title: `Tarea ${token}`,
    description: "Registro temporal de prueba",
    priority: "high",
    dueDate: "2026-09-10",
    userId: user.id
  });
  assert.equal(task.user.id, user.id);

  const filteredTasks = await listTasks({ search: token, status: "pending" });
  assert.equal(filteredTasks.length, 1);

  const updatedTask = await updateTask(task.id, { status: "completed" });
  assert.equal(updatedTask.status, "completed");

  const userWithTasks = await getUserWithTasks(user.id);
  assert.equal(userWithTasks.tasks.length, 1);
  assert.equal(userWithTasks.tasks[0].id, task.id);

  const [ormUsers, sqlUsers] = await Promise.all([
    listUsers({ search: email }),
    listUsersWithSql({ search: email })
  ]);
  assert.equal(ormUsers.length, 1);
  assert.equal(sqlUsers.length, 1);
  assert.equal(ormUsers[0].email, sqlUsers[0].email);

  await removeTask(task.id);
  await deleteUser(user.id);
});

test("la transacción revierte el usuario cuando se fuerza una falla", async () => {
  const token = `${Date.now()}-${process.pid}`;
  const email = `rollback-${token}@taskflow.local`;
  const usersBefore = await User.count({ where: { email } });

  await assert.rejects(
    createUserWithInitialTask({
      user: { name: "Usuario rollback", email, active: true },
      task: {
        title: "Esta tarea no debe persistir",
        description: "La operación será revertida",
        status: "pending",
        priority: "medium",
        dueDate: "2026-09-11"
      },
      forceFailure: true
    }),
    /rollback/i
  );

  const usersAfter = await User.count({ where: { email } });
  assert.equal(usersBefore, usersAfter);
});
