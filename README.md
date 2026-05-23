# ⚡ TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control, Kanban boards, real-time dashboards, and one-click Railway deployment.

---

## 🚀 Live Demo

**URL:** https://web-production-d975f.up.railway.app


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


