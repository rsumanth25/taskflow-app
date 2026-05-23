import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI, dashboardAPI } from './api';
import { useAuth } from './AuthContext';
import { Avatar } from './Layout';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import {
  Plus, Settings, Users, Trash2, X, ChevronDown,
  Calendar, Flag, MessageSquare, Edit3, Check, UserPlus,
  MoreHorizontal, ArrowLeft, ExternalLink
} from 'lucide-react';

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'var(--text2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--cyan)' },
  { key: 'review', label: 'Review', color: 'var(--yellow)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

const PRIORITIES = [
  { key: 'low', label: 'Low', color: 'var(--green)' },
  { key: 'medium', label: 'Medium', color: 'var(--yellow)' },
  { key: 'high', label: 'High', color: 'var(--orange)' },
  { key: 'urgent', label: 'Urgent', color: 'var(--red)' },
];

function TaskCard({ task, onClick, onStatusChange, isAdmin }) {
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
  const priority = PRIORITIES.find(p => p.key === task.priority);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        borderLeft: `3px solid ${priority?.color || 'transparent'}`,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>
        {task.title}
      </div>

      {task.description && (
        <div style={{
          fontSize: 12, color: 'var(--text2)', marginBottom: 8,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
        }}>
          {task.description}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {task.dueDate && (
          <span style={{
            fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
            color: isOverdue ? 'var(--red)' : 'var(--text2)'
          }}>
            <Calendar size={10} />
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
        <span className={`badge badge-${task.priority}`} style={{ fontSize: 10 }}>
          {task.priority}
        </span>
        {task.assignee && (
          <div style={{ marginLeft: 'auto' }}>
            <Avatar user={task.assignee} size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

function TaskModal({ task, projectId, members, onClose, onUpdate, onDelete, isAdmin }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(!task.id);
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task.assigneeId || '',
  });
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(task.comments || []);
  const [saving, setSaving] = useState(false);

  const canEdit = isAdmin || task.assigneeId === user?.id || !task.id;

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    setSaving(true);
    try {
      const payload = { ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null };
      if (task.id) {
        const res = await tasksAPI.update(projectId, task.id, payload);
        onUpdate(res.data);
        toast.success('Task updated');
        setEditing(false);
      } else {
        const res = await tasksAPI.create(projectId, payload);
        onUpdate(res.data, true);
        toast.success('Task created');
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    setForm(f => ({ ...f, status }));
    if (task.id) {
      try {
        const res = await tasksAPI.update(projectId, task.id, { status });
        onUpdate(res.data);
      } catch (err) { toast.error('Failed to update status'); }
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await tasksAPI.addComment(projectId, task.id, { content: comment });
      setComments(c => [...c, res.data]);
      setComment('');
    } catch (err) { toast.error('Failed to add comment'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(projectId, task.id);
      onDelete(task.id);
      onClose();
      toast.success('Task deleted');
    } catch (err) { toast.error('Failed to delete task'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge badge-${form.status}`}>
              {form.status.replace('_', ' ')}
            </span>
            <span className={`badge badge-${form.priority}`}>{form.priority}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {task.id && canEdit && (
              <button className="btn btn-ghost btn-sm btn" onClick={() => setEditing(e => !e)}>
                <Edit3 size={14} /> {editing ? 'View' : 'Edit'}
              </button>
            )}
            {task.id && isAdmin && (
              <button className="btn btn-danger btn-sm btn" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            )}
            <button className="btn btn-ghost btn-icon btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {editing ? (
            <div>
              <div className="form-group">
                <label className="label">Title *</label>
                <input className="input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="input" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="label">Status</label>
                  <select className="input" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Assignee</label>
                  <select className="input" value={form.assigneeId}
                    onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>{task.title}</h2>
              {task.description && (
                <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                  {task.description}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {task.dueDate && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <Calendar size={14} color="var(--text2)" />
                    <span style={{ color: 'var(--text2)' }}>Due:</span>
                    <span style={{ color: isPast(parseISO(task.dueDate)) && task.status !== 'done' ? 'var(--red)' : 'var(--text)' }}>
                      {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                      {isPast(parseISO(task.dueDate)) && task.status !== 'done' && ' (Overdue)'}
                    </span>
                  </div>
                )}
                {task.assignee && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <Avatar user={task.assignee} size={22} />
                    <span>{task.assignee.name}</span>
                  </div>
                )}
              </div>

              {/* Quick status change */}
              <div style={{ marginBottom: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>Change Status</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUSES.map(s => (
                    <button
                      key={s.key}
                      onClick={() => handleStatusChange(s.key)}
                      className="btn btn-sm btn"
                      style={{
                        background: form.status === s.key ? `${s.color}20` : 'var(--bg3)',
                        color: form.status === s.key ? s.color : 'var(--text2)',
                        border: `1px solid ${form.status === s.key ? s.color : 'var(--border)'}`,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              {task.id && (
                <div>
                  <div className="divider" />
                  <div className="label" style={{ marginBottom: 12 }}>Comments ({comments.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                        <Avatar user={c.user} size={28} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{c.user?.name}
                            <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 400, marginLeft: 6 }}>
                              {format(new Date(c.createdAt), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, marginTop: 3, color: 'var(--text2)' }}>{c.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary btn-sm btn" onClick={handleAddComment}>Post</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {editing && (
          <div className="modal-footer">
            <button className="btn btn-secondary btn" onClick={() => task.id ? setEditing(false) : onClose()}>
              Cancel
            </button>
            <button className="btn btn-primary btn" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : (task.id ? 'Save changes' : 'Create task')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MembersModal({ project, onClose, onUpdate, isAdmin }) {
  const [members, setMembers] = useState(project.members || []);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await projectsAPI.addMember(project.id, { email: email.trim(), role });
      setMembers(m => [...m, res.data]);
      setEmail('');
      toast.success('Member added!');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await projectsAPI.removeMember(project.id, userId);
      setMembers(m => m.filter(x => x.userId !== userId));
      toast.success('Member removed');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await projectsAPI.updateMember(project.id, userId, { role: newRole });
      setMembers(m => m.map(x => x.userId === userId ? { ...x, role: newRole } : x));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontSize: 16 }}>Team Members ({members.length})</h3>
          <button className="btn btn-ghost btn-icon btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                className="input"
                placeholder="member@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                style={{ flex: 1 }}
              />
              <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ width: 110 }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn btn-primary btn" onClick={handleAdd} disabled={adding}>
                {adding ? <span className="spinner" /> : <><UserPlus size={15} /> Add</>}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <div key={m.userId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, background: 'var(--bg3)'
              }}>
                <Avatar user={m.user} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{m.user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.user?.email}</div>
                </div>
                {isAdmin ? (
                  <select
                    className="input"
                    value={m.role}
                    onChange={e => handleRoleChange(m.userId, e.target.value)}
                    style={{ width: 100, padding: '5px 10px', fontSize: 12 }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                )}
                {isAdmin && (
                  <button className="btn btn-ghost btn-icon btn" onClick={() => handleRemove(m.userId)}
                    style={{ color: 'var(--red)', padding: 6 }}>
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskStatus, setNewTaskStatus] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState('board'); // board | list

  const loadProject = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        projectsAPI.get(projectId),
        tasksAPI.list(projectId)
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch (err) {
      toast.error('Project not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProject(); }, [projectId]);

  const isAdmin = project?.role === 'admin';

  const handleTaskUpdate = (updated, isNew = false) => {
    if (isNew) {
      setTasks(t => [...t, updated]);
    } else {
      setTasks(t => t.map(x => x.id === updated.id ? updated : x));
    }
  };

  const handleTaskDelete = (id) => {
    setTasks(t => t.filter(x => x.id !== id));
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await projectsAPI.delete(projectId);
      toast.success('Project deleted');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (!project) return null;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: project.color, flexShrink: 0
          }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 24, marginBottom: 4 }}>{project.name}</h1>
            {project.description && (
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>{project.description}</p>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>
              <span>{totalTasks} tasks</span>
              <span>{doneTasks} done</span>
              <span>{project.members?.length || 0} members</span>
              <span style={{ color: 'var(--accent2)' }}>{project.role}</span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="progress-bar" style={{ flex: 1, maxWidth: 200 }}>
                <div className="progress-fill" style={{ width: `${progress}%`, background: project.color }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{progress}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* Avatar stack */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {(project.members || []).slice(0, 4).map((m, i) => (
                <div key={m.userId} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
                  <Avatar user={m.user} size={28} />
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn" onClick={() => setShowMembers(true)}>
              <Users size={15} /> Team
            </button>
            <button
              className="btn btn-primary btn"
              onClick={() => { setNewTaskStatus('todo'); setSelectedTask({}); }}
            >
              <Plus size={15} /> Task
            </button>
            {isAdmin && (
              <button className="btn btn-ghost btn-icon btn" onClick={() => setShowSettings(true)}>
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['board', 'list'].map(v => (
          <button
            key={v}
            className="btn btn-sm btn"
            onClick={() => setView(v)}
            style={{
              background: view === v ? 'var(--accent)' : 'var(--bg3)',
              color: view === v ? 'white' : 'var(--text2)',
              border: '1px solid ' + (view === v ? 'transparent' : 'var(--border)'),
              textTransform: 'capitalize'
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Board View */}
      {view === 'board' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 16,
          alignItems: 'start'
        }}>
          {STATUSES.map(status => {
            const colTasks = tasks.filter(t => t.status === status.key);
            return (
              <div key={status.key} style={{
                background: 'var(--bg3)',
                borderRadius: 12,
                padding: '14px',
                minHeight: 100
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 50, background: status.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{status.label}</span>
                    <span style={{
                      fontSize: 11, background: 'var(--bg2)', padding: '2px 7px',
                      borderRadius: 10, color: 'var(--text2)'
                    }}>{colTasks.length}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon btn"
                    style={{ padding: 4 }}
                    onClick={() => { setNewTaskStatus(status.key); setSelectedTask({ status: status.key }); }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      onClick={() => setSelectedTask(task)}
                      onStatusChange={handleTaskUpdate}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet</p>
              <button className="btn btn-primary btn-sm btn" onClick={() => setSelectedTask({})}>
                <Plus size={14} /> Create first task
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  {['Task', 'Status', 'Priority', 'Assignee', 'Due Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{task.title}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {task.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar user={task.assignee} size={22} />
                            <span style={{ fontSize: 13 }}>{task.assignee.name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text2)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: isOverdue ? 'var(--red)' : 'var(--text2)', fontSize: 13 }}>
                        {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Task Modal */}
      {selectedTask !== null && (
        <TaskModal
          task={selectedTask}
          projectId={projectId}
          members={project.members || []}
          isAdmin={isAdmin}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Members Modal */}
      {showMembers && (
        <MembersModal
          project={project}
          isAdmin={isAdmin}
          onClose={() => setShowMembers(false)}
          onUpdate={loadProject}
        />
      )}

      {/* Settings Modal */}
      {showSettings && isAdmin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Project Settings</h3>
              <button className="btn btn-ghost btn-icon btn" onClick={() => setShowSettings(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 10
                }}>
                  <h4 style={{ color: 'var(--red)', marginBottom: 8, fontSize: 14 }}>Danger Zone</h4>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                    Permanently delete this project and all its tasks.
                  </p>
                  <button className="btn btn-danger btn" onClick={handleDeleteProject}>
                    <Trash2 size={14} /> Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
