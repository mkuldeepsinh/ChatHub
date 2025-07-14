import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const location = useLocation();
  const prefillEmail = location.state?.email || '';
  const prefillPhone = location.state?.phone || '';
  const [formData, setFormData] = useState({ email: prefillEmail, password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  // If the user navigates to login with state, prefill the email field
  useEffect(() => {
    setFormData((prev) => ({ ...prev, email: prefillEmail }));
  }, [prefillEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      // Redirect handled by useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Login to ChatHub</h2>
        {error && <div className="mb-4 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-lg text-[var(--destructive)] text-sm">{error}</div>}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-muted-foreground mb-1">Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your email" required />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your password" required />
          </div>
          <button type="submit" className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-semibold py-2 rounded-lg transition disabled:opacity-60" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div className="text-muted-foreground text-sm mt-6 text-center">
          Don&apos;t have an account? <Link to="/signup" className="text-[var(--primary)] hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 