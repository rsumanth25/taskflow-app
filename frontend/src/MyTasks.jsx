import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, tasksAPI } from './api';
import { format, isPast, parseISO } from 'date-fns';
import { Calendar, AlertTriangle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'todo', 'in_progress', 'review', 'done'];
const statusLabels = { all: 'All', todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const statusColors = { todo: 'var(--text2)', in_progress: 'var(--cyan)', review: 'var(--yellow)', done: 'var(--green)' };

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.myTasks()
      .then(res => setTasks(res.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const overdueTasks = tasks.filter(t => t.isOverdue);

  const handleStatusChange = async (task, status) => {
    try {
      await tasksAPI.update(task.projectId, task.id, { status });
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status, isOverdue: status !== 'done' && t.isOverdue } : t));
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26 }}>My Tasks</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>
          {tasks.length} tasks assigned to you
          {overdueTasks.length > 0 && (
            <span style={{ color: 'var(--red)', marginLeft: 8 }}>
              · {overdueTasks.length} overdue
            </span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUSES.map(s => {
          const count = s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="btn btn-sm btn"
              style={{
                background: filter === s ? 'var(--accent)' : 'var(--bg3)',
                color: filter === s ? 'white' : 'var(--text2)',
                border: '1px solid ' + (filter === s ? 'transparent' : 'var(--border)')
              }}
            >
              {statusLabels[s]} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <h3>{filter === 'all' ? 'No tasks yet' : `No ${statusLabels[filter]} tasks`}</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(task => {
            const isOverdue = task.isOverdue;
            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  borderLeft: isOverdue ? '3px solid var(--red)' : `3px solid ${task.project?.color || 'transparent'}`
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {task.project && (
                      <Link
                        to={`/projects/${task.projectId}`}
                        style={{
                          fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                          color: 'var(--text2)',
                          padding: '2px 8px',
                          background: `${task.project.color}18`,
                          borderRadius: 20
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: 50, background: task.project.color }} />
                        {task.project.name}
                      </Link>
                    )}
                    <span className={`badge badge-${task.priority}`} style={{ fontSize: 10 }}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span style={{
                        fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
                        color: isOverdue ? 'var(--red)' : 'var(--text2)'
                      }}>
                        {isOverdue && <AlertTriangle size={10} />}
                        {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                        {isOverdue && ' (Overdue)'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <select
                    className="input"
                    value={task.status}
                    onChange={e => handleStatusChange(task, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      padding: '5px 10px', fontSize: 12, width: 130,
                      color: statusColors[task.status]
                    }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
