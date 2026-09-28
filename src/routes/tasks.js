const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');
const {
  validateCreateTask,
  validateUpdateTask,
  validateAssignment,
} = require('../utils/validators');

router.get('/stats', (req, res) => {
  res.json(taskService.getStats());
});

router.get('/', (req, res) => {
  const { status, page, limit } = req.query;

  if (status) {
    return res.json(taskService.getByStatus(status));
  }

  if (page !== undefined || limit !== undefined) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return res.json(taskService.getPaginated(pageNum, limitNum));
  }

  res.json(taskService.getAll());
});

router.post('/', (req, res) => {
  const error = validateCreateTask(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  res.status(201).json(taskService.create(req.body));
});

router.put('/:id', (req, res) => {
  const error = validateUpdateTask(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const task = taskService.update(req.params.id, req.body);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

router.delete('/:id', (req, res) => {
  if (!taskService.remove(req.params.id)) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.status(204).send();
});

router.patch('/:id/complete', (req, res) => {
  const task = taskService.completeTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

router.patch('/:id/assign', (req, res) => {
  const error = validateAssignment(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const result = taskService.assignTask(req.params.id, req.body.assignee.trim());
  if (!result.task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (result.alreadyAssigned) {
    return res.status(409).json({ error: 'Task is already assigned' });
  }

  res.json(result.task);
});

module.exports = router;
