import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { createReservation } from '../lib/api';

function SignIn() {
  const { signIn } = useAuth();
  const { pendingBooking } = useBooking();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', role: 'CLIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profile = await signIn({ username: form.username, password: form.password, role: form.role });
      if (form.role && profile?.role && form.role !== profile.role) {
        throw new Error(`This account is a ${profile.role} account, but you selected ${form.role}. Please choose the correct role.`);
      }
      // After login, redirect back if there was a saved target (e.g., /select-slot)
      let to = '/';
      try {
        const saved = sessionStorage.getItem('bc_post_login_redirect');
        if (saved) {
          to = saved;
          sessionStorage.removeItem('bc_post_login_redirect');
        }
      } catch { }
      if (to === '/') {
        if (profile?.role === 'ADMIN') to = '/admin/dashboard';
        else if (profile?.role === 'CLIENT') to = '/client/dashboard';
        // Barbers go to home page (/) to see their personalized view
      }
      navigate(to);
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="bc-container" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="signin-card">
          <h2 className="selection-title">Welcome Back</h2>
          <p className="muted" style={{ textAlign: 'center', marginBottom: 24 }}>
            Sign in to your account to continue
          </p>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label>
              <span>Login as</span>
              <select name="role" value={form.role} onChange={onChange}>
                <option value="CLIENT">Client</option>
                <option value="BARBER">Barber</option>
              </select>
            </label>

            <label>
              <span>Username</span>
              <input
                name="username"
                type="text"
                placeholder="yourusername"
                value={form.username}
                onChange={onChange}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                required
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="auth-alt" style={{ marginTop: 24, textAlign: 'center' }}>
            <span className="muted">Don't have an account?</span>{' '}
            <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
