const express = require('express');
const db = require('../db');
const { auth } = require('../middleware');

const router = express.Router();

// Dashboard stats
router.get('/stats', auth, (req, res) => {
  const stats = db.getDashboardStats(req.user.id);
  res.json(stats);
});

// My tasks across all projects
router.get('/my-tasks', auth, (req, res) => {
  const tasks = db.getUserTasks(req.user.id);
  const now = new Date();
  
  const enriched = tasks.map(t => ({
    ...t,
    isOverdue: t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
  }));

  res.json(enriched);
});

// Recent activity (tasks updated recently across user's projects)
router.get('/activity', auth, (req, res) => {
  const memberProjects = db.getMemberProjects(req.user.id).map(p => p.id);
  const allTasks = db.getTasks()
    .filter(t => memberProjects.includes(t.projectId))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 20);

  const enriched = allTasks.map(t => {
    const project = db.getProjectById(t.projectId);
    const assignee = t.assigneeId ? db.getUserById(t.assigneeId) : null;
    return {
      ...t,
      project: project ? { id: project.id, name: project.name, color: project.color } : null,
      assignee: assignee ? { id: assignee.id, name: assignee.name, avatar: assignee.avatar } : null,
      isOverdue: t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    };
  });

  res.json(enriched);
});

// Search users (for adding to projects)
router.get('/users/search', auth, (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  
  const users = db.getUsers()
    .filter(u => 
      u.id !== req.user.id && (
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase())
      )
    )
    .slice(0, 10)
    .map(u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar }));

  res.json(users);
});

module.exports = router;
