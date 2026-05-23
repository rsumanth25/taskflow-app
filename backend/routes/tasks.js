const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, requireProjectRole } = require('../middleware');

const router = express.Router({ mergeParams: true });

// Get all tasks in a project
router.get('/', auth, requireProjectRole(), (req, res) => {
  const tasks = db.getProjectTasks(req.params.projectId);
  
  // Optional filters
  const { status, assigneeId, priority } = req.query;
  let filtered = tasks;
  if (status) filtered = filtered.filter(t => t.status === status);
  if (assigneeId) filtered = filtered.filter(t => t.assigneeId === assigneeId);
  if (priority) filtered = filtered.filter(t => t.priority === priority);

  res.json(filtered);
});

// Create task
router.post('/', auth, requireProjectRole(), [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601(),
  body('assigneeId').optional().isString(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // Validate assignee is project member
  if (req.body.assigneeId) {
    const member = db.getProjectMember(req.params.projectId, req.body.assigneeId);
    if (!member) return res.status(400).json({ error: 'Assignee is not a project member' });
  }

  const task = db.createTask({
    id: uuidv4(),
    projectId: req.params.projectId,
    title: req.body.title,
    description: req.body.description || '',
    status: req.body.status || 'todo',
    priority: req.body.priority || 'medium',
    dueDate: req.body.dueDate || null,
    assigneeId: req.body.assigneeId || null,
    tags: req.body.tags || [],
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Return with enriched data
  const tasks = db.getProjectTasks(req.params.projectId);
  const enriched = tasks.find(t => t.id === task.id);
  res.status(201).json(enriched || task);
});

// Get task by ID
router.get('/:taskId', auth, requireProjectRole(), (req, res) => {
  const task = db.getTaskById(req.params.taskId);
  if (!task || task.projectId !== req.params.projectId) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const tasks = db.getProjectTasks(req.params.projectId);
  const enriched = tasks.find(t => t.id === req.params.taskId);
  const comments = db.getTaskComments(req.params.taskId);
  
  res.json({ ...enriched, comments });
});

// Update task
router.put('/:taskId', auth, requireProjectRole(), [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional({ nullable: true }),
  body('assigneeId').optional({ nullable: true }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const task = db.getTaskById(req.params.taskId);
  if (!task || task.projectId !== req.params.projectId) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Members can only update tasks assigned to them (or status changes)
  // Admins can update any task
  const allowedFields = ['status']; // Members can always change status
  if (req.projectRole === 'member' && 
      task.assigneeId !== req.user.id && 
      task.createdBy !== req.user.id) {
    // Restrict to status updates only
    const hasNonStatusUpdate = Object.keys(req.body).some(k => !allowedFields.includes(k));
    if (hasNonStatusUpdate) {
      return res.status(403).json({ error: 'Members can only update tasks assigned to them' });
    }
  }

  if (req.body.assigneeId) {
    const member = db.getProjectMember(req.params.projectId, req.body.assigneeId);
    if (!member) return res.status(400).json({ error: 'Assignee is not a project member' });
  }

  const updated = db.updateTask(req.params.taskId, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });

  const tasks = db.getProjectTasks(req.params.projectId);
  const enriched = tasks.find(t => t.id === req.params.taskId);
  res.json(enriched || updated);
});

// Delete task
router.delete('/:taskId', auth, requireProjectRole(['admin']), (req, res) => {
  const task = db.getTaskById(req.params.taskId);
  if (!task || task.projectId !== req.params.projectId) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.deleteTask(req.params.taskId);
  res.json({ message: 'Task deleted' });
});

// Add comment
router.post('/:taskId/comments', auth, requireProjectRole(), [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const task = db.getTaskById(req.params.taskId);
  if (!task || task.projectId !== req.params.projectId) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const comment = db.createComment({
    id: uuidv4(),
    taskId: req.params.taskId,
    userId: req.user.id,
    content: req.body.content,
    createdAt: new Date().toISOString()
  });

  const comments = db.getTaskComments(req.params.taskId);
  const enriched = comments.find(c => c.id === comment.id);
  res.status(201).json(enriched || comment);
});

module.exports = router;
