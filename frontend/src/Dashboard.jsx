import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, projectsAPI } from './api';
import { useAuth } from './AuthContext';
import { Avatar } from './Layout';
import { format, isAfter, parseISO } from 'date-fns';
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, FolderKanban, ArrowRight } from 'lucide-react';

const statusColors = {
  todo: 'var(--text2)', in_progress: 'var(--cyan)',
  review: 'var(--yellow)', done: 'var(--green)'
};
const priorityColors = {
  low: 'var(--green)', medium: 'var(--yellow)',
  high: 'var(--orange)', urgent: 'var(--red)'
};

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      borderColor: `${color}22`,
      background: `linear-gradient(135deg, var(--bg2), ${color}08)`
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      projectsAPI.list(),
      dashboardAPI.activity()
    ]).then(([s, p, a]) => {
      setStats(s.data);
      setProjects(p.data.slice(0, 4));
      setActivity(a.data.slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  const completionRate = stats?.totalTasks
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15 }}>
          {format(new Date(), 'EEEE, MMMM d')} · Here's your overview
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard
          icon={<FolderKanban size={20} />}
          label="Active Projects"
          value={stats?.totalProjects || 0}
          color="var(--accent)"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Total Tasks"
          value={stats?.totalTasks || 0}
          color="var(--cyan)"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Completed"
          value={stats?.completedTasks || 0}
          color="var(--green)"
          sub={`${completionRate}% completion rate`}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Overdue"
          value={stats?.overdueTasks || 0}
          color={stats?.overdueTasks > 0 ? 'var(--red)' : 'var(--text2)'}
          sub={stats?.overdueTasks > 0 ? 'Needs attention' : 'All on track!'}
        />
      </div>

      {/* Task status breakdown */}
      {stats?.tasksByStatus && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Task Status Breakdown</h3>
            <Link to="/my-tasks" style={{ fontSize: 13, color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { key: 'todo', label: 'To Do' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'review', label: 'Review' },
              { key: 'done', label: 'Done' }
            ].map(s => (
              <div key={s.key} style={{
                background: 'var(--bg3)',
                borderRadius: 10,
                padding: '14px 16px',
                borderLeft: `3px solid ${statusColors[s.key]}`
              }}>
                <div style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 800, color: statusColors[s.key] }}>
                  {stats.tasksByStatus[s.key] || 0}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {/* Projects */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Projects</h3>
            <Link to="/projects/new" style={{ fontSize: 13, color: 'var(--accent2)' }}>+ New</Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <FolderKanban size={32} />
              <p>No projects yet</p>
              <Link to="/projects/new" className="btn btn-primary btn-sm">Create project</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  padding: '12px', borderRadius: 8,
                  background: 'var(--bg3)',
                  transition: 'background 0.1s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.taskCount} tasks</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    {p.progress}% complete · {p.memberCount} members
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Recent Activity</h3>
          {activity.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <Clock size={32} />
              <p>No recent activity</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activity.map(task => (
                <Link key={task.id} to={`/projects/${task.projectId}`} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px', borderRadius: 8,
                  background: 'var(--bg3)',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 50,
                    background: task.project?.color || 'var(--accent)',
                    marginTop: 5, flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                      {task.project?.name} · <span style={{ color: statusColors[task.status] }}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.isOverdue && <span style={{ color: 'var(--red)', marginLeft: 4 }}>· Overdue</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
