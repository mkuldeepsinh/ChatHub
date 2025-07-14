import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signup } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    try {
      await signup({ username: formData.username, email: formData.email, phone: formData.phone, password: formData.password });
      setSuccess('Signup successful! You can now log in.');
      setFormData({ username: '', email: '', phone: '', password: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Sign Up for ChatHub</h2>
        {success && <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg text-green-700 text-sm text-center">{success}</div>}
        {error && <div className="mb-4 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-lg text-[var(--destructive)] text-sm">{error}</div>}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-muted-foreground mb-1">Username</label>
            <input name="username" type="text" value={formData.username} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your username" required />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your email" required />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Phone</label>
            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your phone number" required />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Create a password" required />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Confirm Password</label>
            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Confirm your password" required />
          </div>
          <button type="submit" className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-semibold py-2 rounded-lg transition disabled:opacity-60" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        </form>
        <div className="text-muted-foreground text-sm mt-6 text-center">
          Already have an account? <Link to="/login" className="text-[var(--primary)] hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup; 