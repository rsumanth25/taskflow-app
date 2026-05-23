const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, requireProjectRole } = require('../middleware');

const router = express.Router();

// Get all projects for current user
router.get('/', auth, (req, res) => {
  const projects = db.getMemberProjects(req.user.id);
  
  const enriched = projects.map(p => {
    const members = db.getProjectMembers(p.id);
    const tasks = db.getProjectTasks(p.id);
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    return {
      ...p,
      memberCount: members.length,
      taskCount: tasks.length,
      completedTasks: doneTasks,
      progress: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0
    };
  });

  res.json(enriched);
});

// Create project
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name required'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];
  const project = db.createProject({
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description || '',
    color: req.body.color || colors[Math.floor(Math.random() * colors.length)],
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Creator is auto-added as admin
  db.addProjectMember({
    id: uuidv4(),
    projectId: project.id,
    userId: req.user.id,
    role: 'admin',
    joinedAt: new Date().toISOString()
  });

  res.status(201).json(project);
});

// Get project by ID
router.get('/:projectId', auth, requireProjectRole(), (req, res) => {
  const project = db.getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.getProjectMembers(project.id);
  const tasks = db.getProjectTasks(project.id);
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  res.json({
    ...project,
    role: req.projectRole,
    members,
    taskCount: tasks.length,
    completedTasks: doneTasks,
    progress: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0
  });
});

// Update project
router.put('/:projectId', auth, requireProjectRole(['admin']), [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const project = db.updateProject(req.params.projectId, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });
  res.json(project);
});

// Delete project
router.delete('/:projectId', auth, requireProjectRole(['admin']), (req, res) => {
  db.deleteProject(req.params.projectId);
  res.json({ message: 'Project deleted' });
});

// Get members
router.get('/:projectId/members', auth, requireProjectRole(), (req, res) => {
  const members = db.getProjectMembers(req.params.projectId);
  res.json(members);
});

// Add member by email
router.post('/:projectId/members', auth, requireProjectRole(['admin']), [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'member']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = db.getUserByEmail(req.body.email);
  if (!user) return res.status(404).json({ error: 'User not found. They must sign up first.' });

  const existing = db.getProjectMember(req.params.projectId, user.id);
  if (existing) return res.status(409).json({ error: 'User already in project' });

  const member = db.addProjectMember({
    id: uuidv4(),
    projectId: req.params.projectId,
    userId: user.id,
    role: req.body.role || 'member',
    joinedAt: new Date().toISOString()
  });

  res.status(201).json({
    ...member,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
  });
});

// Update member role
router.put('/:projectId/members/:userId', auth, requireProjectRole(['admin']), [
  body('role').isIn(['admin', 'member']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // Can't demote yourself if only admin
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  const member = db.updateProjectMember(req.params.projectId, req.params.userId, { role: req.body.role });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

// Remove member
router.delete('/:projectId/members/:userId', auth, requireProjectRole(['admin']), (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot remove yourself. Delete the project instead.' });
  }
  db.removeProjectMember(req.params.projectId, req.params.userId);
  res.json({ message: 'Member removed' });
});

// Leave project
router.delete('/:projectId/leave', auth, requireProjectRole(), (req, res) => {
  const project = db.getProjectById(req.params.projectId);
  if (project.createdBy === req.user.id) {
    return res.status(400).json({ error: 'Project owner cannot leave. Transfer ownership or delete project.' });
  }
  db.removeProjectMember(req.params.projectId, req.user.id);
  res.json({ message: 'Left project' });
});

module.exports = router;
