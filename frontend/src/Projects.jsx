import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from './api';
import toast from 'react-hot-toast';
import { FolderKanban, Plus, Users, CheckSquare, Trash2, Settings, ArrowRight } from 'lucide-react';

const PROJECT_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
  '#f97316', '#06b6d4'
];

export function NewProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', color: PROJECT_COLORS[0] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.create(form);
      toast.success('Project created!');
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 540 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26 }}>New Project</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Create a workspace for your team</p>
      </div>
      <div className="card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Project name *</label>
            <input
              className="input"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required minLength={1}
            />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input"
              placeholder="What's this project about?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: c,
                    border: form.color === c ? '3px solid white' : '3px solid transparent',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <><Plus size={16} /> Create Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
