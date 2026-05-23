import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from './api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,108,248,0.12) 0%, transparent 70%), var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, var(--accent), var(--pink))',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20
            }}>⚡</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>TaskFlow</span>
          </div>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>{title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>{subtitle}</p>
        </div>
        <div className="card" style={{ padding: '32px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your workspace">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Sign in'}
        </button>
      </form>
      <div className="divider" />
      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
        Don't have an account?{' '}
        <Link to="/signup" style={{ color: 'var(--accent2)', fontWeight: 500 }}>Create one</Link>
      </p>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
        Demo: demo@taskflow.app / demo123
      </p>
    </AuthLayout>
  );
}

export function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.signup(form);
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/');
    } catch (err) {
      const msgs = err.response?.data?.errors;
      toast.error(msgs ? msgs[0].msg : (err.response?.data?.error || 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join your team on TaskFlow">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Full name</label>
          <input
            className="input"
            type="text"
            placeholder="Alex Johnson"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required minLength={2}
          />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required minLength={6}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Create account'}
        </button>
      </form>
      <div className="divider" />
      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent2)', fontWeight: 500 }}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}
