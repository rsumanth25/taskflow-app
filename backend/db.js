const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.json');

const defaultData = {
  users: [],
  projects: [],
  projectMembers: [],
  tasks: [],
  comments: []
};

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
      return { ...defaultData };
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { ...defaultData };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const db = {
  // Users
  getUsers: () => readDB().users,
  getUserById: (id) => readDB().users.find(u => u.id === id),
  getUserByEmail: (email) => readDB().users.find(u => u.email === email.toLowerCase()),
  createUser: (user) => {
    const data = readDB();
    data.users.push(user);
    writeDB(data);
    return user;
  },
  updateUser: (id, updates) => {
    const data = readDB();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    writeDB(data);
    return data.users[idx];
  },

  // Projects
  getProjects: () => readDB().projects,
  getProjectById: (id) => readDB().projects.find(p => p.id === id),
  createProject: (project) => {
    const data = readDB();
    data.projects.push(project);
    writeDB(data);
    return project;
  },
  updateProject: (id, updates) => {
    const data = readDB();
    const idx = data.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    data.projects[idx] = { ...data.projects[idx], ...updates };
    writeDB(data);
    return data.projects[idx];
  },
  deleteProject: (id) => {
    const data = readDB();
    data.projects = data.projects.filter(p => p.id !== id);
    data.projectMembers = data.projectMembers.filter(m => m.projectId !== id);
    data.tasks = data.tasks.filter(t => t.projectId !== id);
    writeDB(data);
  },

  // Project Members
  getProjectMembers: (projectId) => {
    const data = readDB();
    return data.projectMembers
      .filter(m => m.projectId === projectId)
      .map(m => {
        const user = data.users.find(u => u.id === m.userId);
        return user ? { ...m, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } } : m;
      });
  },
  getMemberProjects: (userId) => {
    const data = readDB();
    const memberRows = data.projectMembers.filter(m => m.userId === userId);
    return memberRows.map(m => {
      const project = data.projects.find(p => p.id === m.projectId);
      return project ? { ...project, role: m.role } : null;
    }).filter(Boolean);
  },
  addProjectMember: (member) => {
    const data = readDB();
    const existing = data.projectMembers.find(m => m.projectId === member.projectId && m.userId === member.userId);
    if (existing) return existing;
    data.projectMembers.push(member);
    writeDB(data);
    return member;
  },
  removeProjectMember: (projectId, userId) => {
    const data = readDB();
    data.projectMembers = data.projectMembers.filter(m => !(m.projectId === projectId && m.userId === userId));
    writeDB(data);
  },
  getProjectMember: (projectId, userId) => {
    const data = readDB();
    return data.projectMembers.find(m => m.projectId === projectId && m.userId === userId);
  },
  updateProjectMember: (projectId, userId, updates) => {
    const data = readDB();
    const idx = data.projectMembers.findIndex(m => m.projectId === projectId && m.userId === userId);
    if (idx === -1) return null;
    data.projectMembers[idx] = { ...data.projectMembers[idx], ...updates };
    writeDB(data);
    return data.projectMembers[idx];
  },

  // Tasks
  getTasks: () => readDB().tasks,
  getTaskById: (id) => readDB().tasks.find(t => t.id === id),
  getProjectTasks: (projectId) => {
    const data = readDB();
    return data.tasks
      .filter(t => t.projectId === projectId)
      .map(t => {
        const assignee = t.assigneeId ? data.users.find(u => u.id === t.assigneeId) : null;
        const creator = data.users.find(u => u.id === t.createdBy);
        return {
          ...t,
          assignee: assignee ? { id: assignee.id, name: assignee.name, avatar: assignee.avatar } : null,
          creator: creator ? { id: creator.id, name: creator.name } : null
        };
      });
  },
  getUserTasks: (userId) => {
    const data = readDB();
    return data.tasks
      .filter(t => t.assigneeId === userId)
      .map(t => {
        const project = data.projects.find(p => p.id === t.projectId);
        return { ...t, project: project ? { id: project.id, name: project.name, color: project.color } : null };
      });
  },
  createTask: (task) => {
    const data = readDB();
    data.tasks.push(task);
    writeDB(data);
    return task;
  },
  updateTask: (id, updates) => {
    const data = readDB();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    data.tasks[idx] = { ...data.tasks[idx], ...updates };
    writeDB(data);
    return data.tasks[idx];
  },
  deleteTask: (id) => {
    const data = readDB();
    data.tasks = data.tasks.filter(t => t.id !== id);
    data.comments = data.comments.filter(c => c.taskId !== id);
    writeDB(data);
  },

  // Comments
  getTaskComments: (taskId) => {
    const data = readDB();
    return data.comments
      .filter(c => c.taskId === taskId)
      .map(c => {
        const user = data.users.find(u => u.id === c.userId);
        return { ...c, user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null };
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },
  createComment: (comment) => {
    const data = readDB();
    data.comments.push(comment);
    writeDB(data);
    return comment;
  },

  // Stats
  getDashboardStats: (userId) => {
    const data = readDB();
    const memberProjects = data.projectMembers.filter(m => m.userId === userId).map(m => m.projectId);
    const myTasks = data.tasks.filter(t => t.assigneeId === userId);
    const now = new Date();

    const overdue = myTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    );

    const byStatus = {
      todo: myTasks.filter(t => t.status === 'todo').length,
      in_progress: myTasks.filter(t => t.status === 'in_progress').length,
      review: myTasks.filter(t => t.status === 'review').length,
      done: myTasks.filter(t => t.status === 'done').length,
    };

    return {
      totalProjects: memberProjects.length,
      totalTasks: myTasks.length,
      overdueTasks: overdue.length,
      completedTasks: byStatus.done,
      tasksByStatus: byStatus
    };
  }
};

module.exports = db;
