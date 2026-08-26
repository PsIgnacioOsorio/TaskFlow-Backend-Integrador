const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");

require("dotenv").config({ quiet: true });

const { closeDatabase, connectDatabase } = require("../config/database");
const { Task, User } = require("../models");
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

  const relationQueries = [];
  const userWithTasks = await getUserWithTasks(user.id, {
    logging: (sql) => relationQueries.push(sql)
  });
  assert.equal(userWithTasks.tasks.length, 1);
  assert.equal(userWithTasks.tasks[0].id, task.id);
  assert.equal(
    relationQueries.filter((sql) => /SELECT/i.test(sql)).length,
    1,
    "La relación User 1:N Task debe resolverse con un solo SELECT"
  );

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

test("la transacción confirma juntas la creación del usuario y su tarea", async () => {
  const token = `${Date.now()}-${process.pid}`;
  const email = `transaccion-${token}@taskflow.local`;
  const title = `Tarea transacción ${token}`;

  const result = await createUserWithInitialTask({
    user: { name: "Usuario transacción", email, active: true },
    task: {
      title,
      description: "Ambos registros deben confirmarse juntos",
      status: "pending",
      priority: "medium",
      dueDate: "2026-09-11"
    }
  });

  assert.equal(result.task.userId, result.user.id);
  assert.equal(await User.count({ where: { email } }), 1);
  assert.equal(await Task.count({ where: { title, userId: result.user.id } }), 1);

  await deleteUser(result.user.id);
  assert.equal(await Task.count({ where: { id: result.task.id } }), 0);
});

test("el rollback revierte tanto el usuario como la tarea", async () => {
  const token = `${Date.now()}-${process.pid}`;
  const email = `rollback-${token}@taskflow.local`;
  const title = `Tarea rollback ${token}`;
  const usersBefore = await User.count({ where: { email } });
  const tasksBefore = await Task.count({ where: { title } });

  await assert.rejects(
    createUserWithInitialTask({
      user: { name: "Usuario rollback", email, active: true },
      task: {
        title,
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
  const tasksAfter = await Task.count({ where: { title } });
  assert.equal(usersBefore, usersAfter);
  assert.equal(tasksBefore, tasksAfter);
});
