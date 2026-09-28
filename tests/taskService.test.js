const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('creates and finds a task with defaults', () => {
    const task = taskService.create({ title: 'Write tests' });

    expect(task).toMatchObject({
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toEqual(expect.any(String));
    expect(task.createdAt).toEqual(expect.any(String));
    expect(taskService.findById(task.id)).toEqual(task);
  });

  test('filters by exact status and paginates from the requested page', () => {
    taskService.create({ title: 'First', status: 'todo' });
    taskService.create({ title: 'Second', status: 'in_progress' });
    taskService.create({ title: 'Third', status: 'todo' });

    expect(taskService.getByStatus('in')).toHaveLength(0);
    expect(taskService.getByStatus('todo').map((task) => task.title)).toEqual(['First', 'Third']);
    expect(taskService.getPaginated(1, 2).map((task) => task.title)).toEqual(['First', 'Second']);
    expect(taskService.getPaginated(2, 2).map((task) => task.title)).toEqual(['Third']);
  });

  test('updates and removes tasks', () => {
    const task = taskService.create({ title: 'Original' });

    expect(taskService.update(task.id, { title: 'Updated' })).toMatchObject({ title: 'Updated' });
    expect(taskService.update('missing', { title: 'Nope' })).toBeNull();
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.remove(task.id)).toBe(false);
  });

  test('completes a task and records the completion time', () => {
    const task = taskService.create({ title: 'Finish work', priority: 'high' });
    const completed = taskService.completeTask(task.id);

    expect(completed).toMatchObject({ status: 'done', priority: 'medium' });
    expect(completed.completedAt).toEqual(expect.any(String));
    expect(taskService.completeTask('missing')).toBeNull();
  });

  test('calculates status and overdue statistics', () => {
    taskService.create({ title: 'Overdue', dueDate: '2020-01-01T00:00:00.000Z' });
    taskService.create({ title: 'Done', status: 'done', dueDate: '2020-01-01T00:00:00.000Z' });
    taskService.create({ title: 'In progress', status: 'in_progress' });

    expect(taskService.getStats()).toEqual({ todo: 1, in_progress: 1, done: 1, overdue: 1 });
  });

  test('assigns an unassigned task and rejects reassignment', () => {
    const task = taskService.create({ title: 'Review PR' });

    expect(taskService.assignTask(task.id, 'Alex')).toEqual({
      task: expect.objectContaining({ id: task.id, assignee: 'Alex' }),
      alreadyAssigned: false,
    });
    expect(taskService.assignTask(task.id, 'Sam')).toEqual({
      task: expect.objectContaining({ id: task.id, assignee: 'Alex' }),
      alreadyAssigned: true,
    });
    expect(taskService.assignTask('missing', 'Sam')).toEqual({ task: null, alreadyAssigned: false });
  });
});
