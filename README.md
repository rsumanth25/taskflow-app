# ⚡ TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control, Kanban boards, real-time dashboards, and one-click Railway deployment.

---

## 🚀 Live Demo

> **URL:** *(add your Railway URL here after deploy)*  
> **Demo login:** `demo@taskflow.app` / `demo123`  
> **Team member:** `alex@taskflow.app` / `member123`

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | JWT signup/login, 7-day tokens, bcrypt hashing |
| 📁 Projects | Create, manage, color-code projects |
| 👥 Team | Invite members by email, assign Admin/Member roles |
| ✅ Tasks | Create, assign, prioritize, set due dates |
| 📋 Kanban Board | Drag-free column view: Todo → In Progress → Review → Done |
| 📊 Dashboard | Stats, overdue alerts, status breakdown, recent activity |
| 💬 Comments | Per-task comment threads |
| 🔒 RBAC | Admins manage all; Members update their own tasks only |
| 📱 Responsive | Works on mobile and desktop |

---

## 🏗️ Tech Stack

**Backend**
- Node.js + Express 5
- JWT authentication (jsonwebtoken)
- bcryptjs password hashing
- express-validator input validation
- JSON file database (zero native dependencies → deploys anywhere)

**Frontend**
- React 19 + Vite
- React Router v6
- Axios (API client)
- date-fns (date formatting)
- react-hot-toast (notifications)
- lucide-react (icons)

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── routes/
│   │   ├── auth.js        # POST /signup, /login, GET /me
│   │   ├── projects.js    # CRUD projects + member management
│   │   ├── tasks.js       # CRUD tasks + comments
│   │   └── dashboard.js   # Stats, my-tasks, activity, user search
│   ├── db.js              # JSON file database layer
│   ├── middleware.js       # JWT auth + RBAC middleware
│   ├── server.js          # Express app entry point
│   └── seed.js            # Demo data seeder
├── frontend/
│   └── src/
│       ├── App.jsx         # Router + auth guards
│       ├── AuthContext.jsx # Global auth state
│       ├── AuthPages.jsx   # Login + Signup pages
│       ├── Dashboard.jsx   # Home dashboard
│       ├── ProjectPage.jsx # Kanban board + task modals
│       ├── MyTasks.jsx     # Personal task list
│       ├── Projects.jsx    # New project form
│       ├── Layout.jsx      # Sidebar navigation
│       └── api.js          # Axios API client
├── railway.json
├── nixpacks.toml
└── package.json
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+

### 1. Clone & install
```bash
git clone <your-repo-url>
cd taskflow

# Install frontend deps
cd frontend && npm install && cd ..

# Install backend deps
cd backend && npm install && cd ..
```

### 2. Seed demo data
```bash
cd backend && node seed.js
```

### 3. Run backend
```bash
cd backend && node server.js
# API running on http://localhost:3001
```

### 4. Run frontend (separate terminal)
```bash
cd frontend && npm run dev
# UI running on http://localhost:5173
# Proxies /api/* to :3001 automatically
```

---

## 🌐 Deploy to Railway

### One-time setup

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Set these **environment variables** in Railway dashboard:

| Variable | Value |
|---|---|
| `JWT_SECRET` | any long random string |
| `NODE_ENV` | `production` |
| `DB_PATH` | `/data/taskflow.json` *(optional — uses Railway volume)* |

5. Railway auto-detects `nixpacks.toml`, builds frontend, then starts backend
6. Visit your Railway URL — seed data is pre-loaded

### How the deployment works
```
Railway pulls code
→ nixpacks.toml: cd frontend && npm install && npm run build
→ nixpacks.toml: cd backend && npm install
→ node backend/server.js
   → serves /api/* routes
   → serves frontend/dist as static files
   → all on a single port (Railway assigns $PORT)
```

---

## 🔌 REST API Reference

### Auth
```
POST /api/auth/signup     { name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → current user (requires token)
PUT  /api/auth/me         { name }
```

### Projects
```
GET    /api/projects                     → list user's projects
POST   /api/projects                     { name, description?, color? }
GET    /api/projects/:id                 → project detail + members
PUT    /api/projects/:id                 [admin] update
DELETE /api/projects/:id                 [admin] delete

GET    /api/projects/:id/members         → member list
POST   /api/projects/:id/members         [admin] { email, role }
PUT    /api/projects/:id/members/:userId [admin] { role }
DELETE /api/projects/:id/members/:userId [admin] remove member
DELETE /api/projects/:id/leave           leave project
```

### Tasks
```
GET    /api/projects/:id/tasks           → task list (?status=&assigneeId=&priority=)
POST   /api/projects/:id/tasks           { title, description?, status?, priority?, dueDate?, assigneeId? }
GET    /api/projects/:id/tasks/:taskId   → task + comments
PUT    /api/projects/:id/tasks/:taskId   update (members: own tasks only)
DELETE /api/projects/:id/tasks/:taskId   [admin only]

POST   /api/projects/:id/tasks/:taskId/comments  { content }
```

### Dashboard
```
GET /api/dashboard/stats          → totalProjects, totalTasks, overdue, byStatus
GET /api/dashboard/my-tasks       → all tasks assigned to me
GET /api/dashboard/activity       → recent task updates across my projects
GET /api/dashboard/users/search   ?q=name_or_email
```

---

## 🔒 Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| View project & tasks | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Update own tasks | ✅ | ✅ |
| Update any task | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Invite/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Delete project | ✅ | ❌ |

---

## 📝 License

MIT
