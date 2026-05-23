// Run: node seed.js
// Creates demo user + sample project + tasks
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

async function seed() {
  // Check if already seeded
  const existing = db.getUserByEmail('demo@taskflow.app');
  if (existing) {
    console.log('✅ Demo data already exists. Skipping seed.');
    return;
  }

  // Demo user
  const hash = await bcrypt.hash('demo123', 10);
  const demoUser = db.createUser({
    id: uuidv4(), name: 'Demo User',
    email: 'demo@taskflow.app', password: hash,
    avatar: '#6366f1', createdAt: new Date().toISOString()
  });

  // Second user (team member)
  const hash2 = await bcrypt.hash('member123', 10);
  const memberUser = db.createUser({
    id: uuidv4(), name: 'Alex Chen',
    email: 'alex@taskflow.app', password: hash2,
    avatar: '#ec4899', createdAt: new Date().toISOString()
  });

  // Project
  const project = db.createProject({
    id: uuidv4(), name: 'Website Redesign',
    description: 'Complete overhaul of the marketing site with new branding',
    color: '#6366f1', createdBy: demoUser.id,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });

  db.addProjectMember({ id: uuidv4(), projectId: project.id, userId: demoUser.id,   role: 'admin',  joinedAt: new Date().toISOString() });
  db.addProjectMember({ id: uuidv4(), projectId: project.id, userId: memberUser.id, role: 'member', joinedAt: new Date().toISOString() });

  const tasks = [
    { title: 'Design new homepage hero section', status: 'done',        priority: 'high',   assigneeId: demoUser.id,   dueDate: '2026-05-10' },
    { title: 'Write copy for About page',        status: 'in_progress', priority: 'medium', assigneeId: memberUser.id, dueDate: '2026-05-25' },
    { title: 'Set up CI/CD pipeline',            status: 'review',      priority: 'high',   assigneeId: demoUser.id,   dueDate: '2026-05-22' },
    { title: 'Mobile responsiveness audit',      status: 'todo',        priority: 'urgent', assigneeId: demoUser.id,   dueDate: '2026-05-20' },
    { title: 'SEO meta tags for all pages',      status: 'todo',        priority: 'low',    assigneeId: memberUser.id, dueDate: '2026-06-01' },
    { title: 'Performance optimisation pass',    status: 'todo',        priority: 'medium', assigneeId: null,          dueDate: null },
  ];

  for (const t of tasks) {
    db.createTask({ id: uuidv4(), projectId: project.id, description: '', tags: [],
      createdBy: demoUser.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...t });
  }

  console.log('🌱 Seed complete!');
  console.log('   Login: demo@taskflow.app / demo123');
  console.log('   Team:  alex@taskflow.app  / member123');
}

seed().catch(console.error);
