import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'CLIENT', barberId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profile = await signUp({
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role,
        barberId: form.role === 'BARBER' ? (form.barberId || form.username) : null
      });

      // Special handling for barber signup - requires admin approval
      if (profile?.role === 'BARBER') {
        alert('✅ Signup successful! Your registration has been submitted and is pending admin approval. You will be able to log in once approved.');
        navigate('/signin');
      } else {
        // Client can login immediately
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="bc-container" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="signin-card">
          <h2 className="selection-title">Create Account</h2>
          <p className="muted" style={{ textAlign: 'center', marginBottom: 24 }}>
            Join us and book your next haircut
          </p>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label>
              <span>Register as</span>
              <select name="role" value={form.role} onChange={onChange}>
                <option value="CLIENT">Client</option>
                <option value="BARBER">Barber</option>
              </select>
            </label>

            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={onChange}
                required
              />
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

            {form.role === 'BARBER' && (
              <label>
                <span>Barber ID (optional)</span>
                <input
                  name="barberId"
                  type="text"
                  placeholder="unique-barber-id"
                  value={form.barberId}
                  onChange={onChange}
                />
              </label>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="auth-alt" style={{ marginTop: 24, textAlign: 'center' }}>
            <span className="muted">Already have an account?</span>{' '}
            <Link to="/signin">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
