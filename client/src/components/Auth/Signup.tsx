import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../utils/api';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendCode = async (isResend = false) => {
    setCodeLoading(true);
    setCodeError('');
    setCodeSuccess('');
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setCodeError('Please enter a valid email address.');
      setCodeLoading(false);
      return;
    }
    try {
      await authAPI.sendVerificationCode(formData.email);
      setCodeSent(true);
      setCodeSuccess(isResend ? 'Verification code resent to your email.' : 'Verification code sent to your email.');
    } catch (err: any) {
      if (err.response?.data?.message?.toLowerCase().includes('not exist')) {
        setCodeError('This email does not exist.');
      } else {
        setCodeError(err.response?.data?.message || 'Failed to send code.');
      }
    } finally {
      setCodeLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setCodeLoading(true);
    setCodeError('');
    setCodeSuccess('');
    try {
      await authAPI.verifyEmailCode(formData.email, code);
      setEmailVerified(true);
      setCodeSuccess('Email verified! You can now complete sign up.');
    } catch (err: any) {
      setCodeError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setCodeLoading(false);
    }
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
      setSuccess('Signup successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { email: formData.email, phone: formData.phone } });
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Sign Up for ChatHub</h2>
        {!emailVerified && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 rounded-lg text-blue-700 text-sm text-center">
            Please verify your email before proceeding with sign up.
          </div>
        )}
        {success && <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg text-green-700 text-sm text-center">{success}</div>}
        {error && <div className="mb-4 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-lg text-[var(--destructive)] text-sm">{error}</div>}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-muted-foreground mb-1">Email</label>
            <div className="flex gap-2">
              <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your email" required disabled={emailVerified} />
              <button type="button" onClick={() => handleSendCode(false)} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-3 rounded-lg disabled:opacity-60" disabled={codeLoading || !formData.email || emailVerified}>{codeLoading ? 'Sending...' : (emailVerified ? 'Verified' : (codeSent ? 'Resend Code' : 'Send Code'))}</button>
            </div>
          </div>
          {codeSent && !emailVerified && (
            <div>
              <label className="block text-muted-foreground mb-1">Enter 4-digit Code</label>
              <div className="flex gap-2">
                <input type="text" maxLength={4} value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter code" />
                <button type="button" onClick={handleVerifyCode} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-3 rounded-lg disabled:opacity-60" disabled={codeLoading || code.length !== 4}>{codeLoading ? 'Verifying...' : 'Verify'}</button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">Didn't get the code? <button type="button" className="text-[var(--primary)] underline ml-1" onClick={() => handleSendCode(true)} disabled={codeLoading || !formData.email}>Resend</button></span>
                <span className="text-xs text-muted-foreground">Check your spam/junk folder.</span>
              </div>
              {codeError && <div className="text-red-500 text-xs mt-1">{codeError}</div>}
              {codeSuccess && <div className="text-green-600 text-xs mt-1">{codeSuccess}</div>}
            </div>
          )}
          {/* Rest of the form, disabled until email is verified */}
          <div>
            <label className="block text-muted-foreground mb-1">Username</label>
            <input name="username" type="text" value={formData.username} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your username" required disabled={!emailVerified} />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Phone</label>
            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter your phone number" required disabled={!emailVerified} />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Create a password" required disabled={!emailVerified} />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Confirm Password</label>
            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Confirm your password" required disabled={!emailVerified} />
          </div>
          <button type="submit" className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-semibold py-2 rounded-lg transition disabled:opacity-60" disabled={loading || !emailVerified}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        </form>
        <div className="text-muted-foreground text-sm mt-6 text-center">
          Already have an account? <Link to="/login" className="text-[var(--primary)] hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup; 