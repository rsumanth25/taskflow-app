const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-production';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireProjectRole = (roles) => (req, res, next) => {
  const projectId = req.params.projectId || req.body.projectId;
  const member = db.getProjectMember(projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a project member' });
  if (roles && !roles.includes(member.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  req.projectRole = member.role;
  next();
};

module.exports = { auth, requireProjectRole, JWT_SECRET };
