import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="page-shell">
      <div className="hero-panel">
        <p className="eyebrow">Event-driven auth demo</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
        <div className="nav-links">
          <Link to="/signup">Signup</Link>
          <Link to="/login">Login</Link>
          <Link to="/status">Service Status</Link>
        </div>
      </div>
      <div className="form-panel">{children}</div>
    </div>
  );
}

function useAuthToken() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return [token, setToken];
}

function AuthForm({ mode, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      onSuccess(data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={mode === 'signup' ? 'Create account' : 'Welcome back'}
      subtitle={
        mode === 'signup'
          ? 'Register to trigger a Kafka event that multiple services can consume.'
          : 'Log in with the credentials you created during signup.'
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
          />
        </label>
        {error ? <div className="error-box">{error}</div> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}

function SignupPage({ onSuccess }) {
  return <AuthForm mode="signup" onSuccess={onSuccess} />;
}

function LoginPage({ onSuccess }) {
  return <AuthForm mode="login" onSuccess={onSuccess} />;
}

function HomePage({ token, onLogout }) {
  if (!token) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-card">
        <p className="eyebrow">Authenticated session</p>
        <h1>You are signed in</h1>
        <p className="subtitle">
          The JWT is stored in localStorage and the backend publishes signup events to Kafka.
        </p>
        <div className="token-box">
          <strong>JWT</strong>
          <code>{token}</code>
        </div>
        <div className="nav-links">
          <Link to="/status">Open service status</Link>
        </div>
        <button type="button" className="secondary-button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}

function StatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStatus() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/admin/status`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to fetch service status');
        }

        setData(payload);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-card">
        <p className="eyebrow">Beginner status view</p>
        <h1>Service status</h1>
        <p className="subtitle">
          This page calls the admin endpoint and shows backend, database, Kafka, and consumer activity in one place.
        </p>

        <div className="nav-links">
          <Link to="/signup">Back to signup</Link>
          <Link to="/login">Back to login</Link>
        </div>

        {loading ? <p>Loading status...</p> : null}
        {error ? <div className="error-box">{error}</div> : null}

        {!loading && !error && data ? (
          <div className="status-grid">
            <div className="status-card">
              <h3>Backend</h3>
              <p>Healthy: {String(data.backend?.healthy)}</p>
            </div>
            <div className="status-card">
              <h3>Database</h3>
              <p>Name: {data.database?.name}</p>
              <p>Healthy: {String(data.database?.healthy)}</p>
              <p>Total users: {data.database?.totalUsers}</p>
            </div>
            <div className="status-card">
              <h3>Kafka</h3>
              <p>Healthy: {String(data.kafka?.healthy)}</p>
              <p>Topics: {(data.kafka?.topics || []).join(', ') || 'none'}</p>
            </div>
            {(data.consumers || []).map((consumer) => (
              <div className="status-card" key={consumer.name}>
                <h3>{consumer.name}</h3>
                <p>Healthy: {String(consumer.healthy)}</p>
                <p>Status: {consumer.details?.status || 'unknown'}</p>
                <p>Processed events: {consumer.details?.processedEvents ?? 'n/a'}</p>
                <p>Last event at: {consumer.details?.lastEventAt || 'n/a'}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useAuthToken();

  return (
    <Routes>
      <Route path="/" element={<HomePage token={token} onLogout={() => setToken('')} />} />
      <Route path="/signup" element={<SignupPage onSuccess={setToken} />} />
      <Route path="/login" element={<LoginPage onSuccess={setToken} />} />
      <Route path="/status" element={<StatusPage />} />
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}
