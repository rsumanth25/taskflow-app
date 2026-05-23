import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { projectsAPI } from './api';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, LogOut, Plus, ChevronDown, Menu, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

function Avatar({ user, size = 32 }) {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="avatar" style={{
      width: size, height: size,
      fontSize: size * 0.38,
      background: user?.avatar || 'var(--accent)'
    }}>
      {initials}
    </div>
  );
}

export { Avatar };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  useEffect(() => {
    projectsAPI.list().then(res => setProjects(res.data)).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Signed out');
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/my-tasks', icon: <CheckSquare size={18} />, label: 'My Tasks' },
  ];

  const isActive = (path) => location.pathname === path;
  const isProjectActive = (id) => location.pathname.startsWith(`/projects/${id}`);

  const Sidebar = () => (
    <div style={{
      width: 240,
      minWidth: 240,
      height: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, var(--accent), var(--pink))',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Zap size={16} color="white" />
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>TaskFlow</span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1, overflow: 'auto' }}>
        {navItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              marginBottom: 2,
              color: isActive(item.to) ? 'var(--text)' : 'var(--text2)',
              background: isActive(item.to) ? 'var(--bg3)' : 'transparent',
              fontWeight: isActive(item.to) ? 500 : 400,
              fontSize: 14,
              transition: 'all 0.1s'
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        <div style={{ margin: '16px 0 8px 12px' }}>
          <button
            onClick={() => setProjectsExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, color: 'var(--text2)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'none', border: 'none', cursor: 'pointer',
              width: '100%'
            }}
          >
            Projects
            <ChevronDown size={12} style={{ transform: projectsExpanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {projectsExpanded && (
          <>
            {projects.map(p => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 1,
                  color: isProjectActive(p.id) ? 'var(--text)' : 'var(--text2)',
                  background: isProjectActive(p.id) ? 'var(--bg3)' : 'transparent',
                  fontSize: 14,
                  transition: 'all 0.1s'
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: p.color, flexShrink: 0
                }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
              </Link>
            ))}
            <Link
              to="/projects/new"
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                color: 'var(--text2)',
                fontSize: 13,
                marginTop: 4
              }}
            >
              <Plus size={14} />
              New project
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <Avatar user={user} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button
          className="btn-ghost btn-icon btn"
          onClick={handleLogout}
          title="Sign out"
          style={{ padding: '6px', flexShrink: 0 }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          gap: 12,
          background: 'var(--bg2)'
        }} className="mobile-header">
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16 }}>TaskFlow</span>
        </div>

        <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  );
}
