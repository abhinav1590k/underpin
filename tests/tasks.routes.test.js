const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('task routes', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('creates and lists tasks', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Write integration tests', priority: 'high' })
      .expect(201);

    expect(created.body).toMatchObject({ title: 'Write integration tests', priority: 'high' });
    const listed = await request(app).get('/tasks').expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].id).toBe(created.body.id);
  });

  test('validates task creation and updates', async () => {
    await request(app).post('/tasks').send({ title: ' ' }).expect(400);
    await request(app).post('/tasks').send({ title: 'Task', status: 'invalid' }).expect(400);
    await request(app).post('/tasks').send({ title: 'Task', dueDate: 'not-a-date' }).expect(400);

    const created = await request(app).post('/tasks').send({ title: 'Task' }).expect(201);
    await request(app).put(`/tasks/${created.body.id}`).send({ title: '' }).expect(400);
    const updated = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: 'Updated', status: 'in_progress' })
      .expect(200);
    expect(updated.body).toMatchObject({ title: 'Updated', status: 'in_progress' });
    await request(app).put('/tasks/missing').send({ title: 'Updated' }).expect(404);
  });

  test('filters and paginates tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Todo' });
    await request(app).post('/tasks').send({ title: 'In progress', status: 'in_progress' });
    await request(app).post('/tasks').send({ title: 'Another todo' });

    const filtered = await request(app).get('/tasks?status=todo').expect(200);
    expect(filtered.body.map((task) => task.title)).toEqual(['Todo', 'Another todo']);

    const page = await request(app).get('/tasks?page=1&limit=2').expect(200);
    expect(page.body.map((task) => task.title)).toEqual(['Todo', 'In progress']);
  });

  test('completes, reports stats, and deletes tasks', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Ship API', dueDate: '2020-01-01T00:00:00.000Z' })
      .expect(201);

    const completed = await request(app).patch(`/tasks/${created.body.id}/complete`).expect(200);
    expect(completed.body).toMatchObject({ status: 'done', completedAt: expect.any(String) });
    expect((await request(app).get('/tasks/stats')).body).toEqual({ todo: 0, in_progress: 0, done: 1, overdue: 0 });
    await request(app).patch('/tasks/missing/complete').expect(404);
    await request(app).delete(`/tasks/${created.body.id}`).expect(204);
    await request(app).delete(`/tasks/${created.body.id}`).expect(404);
  });

  test('assigns a task, validates assignee, and prevents reassignment', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Review PR' }).expect(201);

    const assigned = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: '  Alex  ' })
      .expect(200);
    expect(assigned.body.assignee).toBe('Alex');

    await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: ' ' }).expect(400);
    await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: 'Sam' }).expect(409);
    await request(app).patch('/tasks/missing/assign').send({ assignee: 'Sam' }).expect(404);
  });
});
