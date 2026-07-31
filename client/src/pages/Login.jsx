import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Shield, KeyRound, X, UserCheck, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role')?.toUpperCase();

  const isCitizenMode = urlRole !== 'STAFF' && urlRole !== 'ADMIN';
  const [role, setRole] = useState(isCitizenMode ? 'CITIZEN' : (urlRole === 'ADMIN' ? 'ADMIN' : 'STAFF'));

  // Citizen Login Method: 'PASSWORD' or 'OTP'
  const [loginMethod, setLoginMethod] = useState('PASSWORD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login OTP State
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [receivedLoginOtpInfo, setReceivedLoginOtpInfo] = useState(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = Request, 2 = Reset
  const [receivedResetOtpInfo, setReceivedResetOtpInfo] = useState(null);
  const [modalMsg, setModalMsg] = useState('');
  const [modalError, setModalError] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlRole === 'ADMIN') {
      setRole('ADMIN');
    } else if (urlRole === 'STAFF') {
      setRole('STAFF');
    } else {
      setRole('CITIZEN');
    }
    setEmail('');
    setPassword('');
  }, [urlRole]);

  const handleAuthorityTabChange = (selectedRole) => {
    setRole(selectedRole);
    setEmail('');
    setPassword('');
  };

  // 1. Handle Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login({
        email: email.trim().toLowerCase(),
        password,
        role
      });

      login(data.user, data.token);

      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your Email Address and Password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Login OTP Request
  const handleSendLoginOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.sendLoginOTP({ email: email.trim().toLowerCase() });
      setReceivedLoginOtpInfo(res);
      setLoginOtpSent(true);
      setSuccessMsg(`Login OTP sent to Email Inbox: ${email}.`);
    } catch (err) {
      setError(err.message || 'Failed to send login OTP to Email.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Login with OTP Submit
  const handleOTPLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.loginWithOTP({
        email: email.trim().toLowerCase(),
        otp: loginOtp
      });

      login(data.user, data.token);
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired Email Login OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password Flow
  const handleRequestForgotOTP = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalMsg('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword({ email: forgotInput.trim().toLowerCase() });
      setReceivedResetOtpInfo(res);
      setForgotStep(2);
      setModalMsg(`Password reset OTP sent to Email Inbox (${forgotInput}).`);
    } catch (err) {
      setModalError(err.message || 'Failed to request reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithOTP = async (e) => {
    e.preventDefault();
    setModalError('');
    setLoading(true);

    try {
      await authAPI.resetPasswordWithOTP({
        email: forgotInput.trim().toLowerCase(),
        otp: forgotOtp,
        newPassword: newResetPassword
      });

      setShowForgotModal(false);
      setSuccessMsg('Password reset successful! Please log in with your new password.');
    } catch (err) {
      setModalError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="app-container" style={{ width: '100%', maxWidth: '480px' }}>
          <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
            
            {/* Header */}
            {isCitizenMode ? (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ background: '#e0f2fe', color: '#0284c7', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                  <User size={28} />
                </div>
                <h2 style={{ fontSize: '1.6rem', color: '#004071', marginBottom: '0.25rem', fontWeight: '800' }}>
                  Citizen Portal Sign In
                </h2>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>
                  Sign in with your Email Address User ID
                </p>

                {/* Citizen Dual Login Method Selector */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '1.25rem',
                  border: '1px solid #cbd5e1'
                }}>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('PASSWORD'); setLoginOtpSent(false); }}
                    style={{
                      padding: '0.55rem 0', border: 'none', borderRadius: '6px',
                      background: loginMethod === 'PASSWORD' ? '#004071' : 'transparent',
                      color: loginMethod === 'PASSWORD' ? '#ffffff' : '#475569',
                      fontWeight: loginMethod === 'PASSWORD' ? '700' : '600', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    🔑 With Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('OTP')}
                    style={{
                      padding: '0.55rem 0', border: 'none', borderRadius: '6px',
                      background: loginMethod === 'OTP' ? '#059669' : 'transparent',
                      color: loginMethod === 'OTP' ? '#ffffff' : '#475569',
                      fontWeight: loginMethod === 'OTP' ? '700' : '600', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    💬 With Email OTP
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f3e8ff', color: '#6b21a8', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                  <Shield size={28} />
                </div>
                <h2 style={{ fontSize: '1.6rem', color: '#004071', marginBottom: '0.25rem', fontWeight: '800' }}>
                  Authority Portal Sign In
                </h2>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>
                  Authorized Staff Member and Panchayat Admin Authentication
                </p>

                {/* Authority Login Tabs: Staff vs Admin */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  background: '#f1f5f9', padding: '6px',
                  borderRadius: '10px', marginTop: '1.25rem', border: '1px solid #cbd5e1'
                }}>
                  <button
                    type="button"
                    onClick={() => handleAuthorityTabChange('STAFF')}
                    style={{
                      padding: '0.65rem 0', border: 'none', borderRadius: '8px',
                      background: role === 'STAFF' ? 'linear-gradient(135deg, #004071 0%, #0284c7 100%)' : 'transparent',
                      color: role === 'STAFF' ? '#ffffff' : '#334155',
                      fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                      boxShadow: role === 'STAFF' ? '0 2px 8px rgba(0,64,113,0.25)' : 'none'
                    }}
                  >
                    <UserCheck size={16} /> Staff Member
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthorityTabChange('ADMIN')}
                    style={{
                      padding: '0.65rem 0', border: 'none', borderRadius: '8px',
                      background: role === 'ADMIN' ? 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)' : 'transparent',
                      color: role === 'ADMIN' ? '#ffffff' : '#334155',
                      fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                      boxShadow: role === 'ADMIN' ? '0 2px 8px rgba(107,33,168,0.25)' : 'none'
                    }}
                  >
                    <ShieldAlert size={16} /> System Admin
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', fontWeight: '600' }}>
                ⚠️ {error}
              </div>
            )}

            {successMsg && (
              <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', fontWeight: '700' }}>
                ✅ {successMsg}
              </div>
            )}

            {/* FORM A: Password Login (Default) */}
            {loginMethod === 'PASSWORD' ? (
              <form onSubmit={handlePasswordLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address (Official User ID) *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter registered email (e.g. user@example.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Password *</label>
                    {role !== 'STAFF' && (
                      <button
                        type="button"
                        onClick={() => { setShowForgotModal(true); setForgotInput(email); }}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{
                    width: '100%', padding: '0.85rem', fontSize: '1.05rem', marginTop: '0.5rem',
                    background: role === 'ADMIN' ? 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)' : (role === 'STAFF' ? 'linear-gradient(135deg, #004071 0%, #0284c7 100%)' : 'linear-gradient(135deg, #004071 0%, #0284c7 100%)'),
                    color: '#ffffff',
                    fontWeight: '700',
                    borderRadius: '8px',
                    boxShadow: role === 'ADMIN' ? '0 4px 14px rgba(107,33,168,0.3)' : '0 4px 14px rgba(0,64,113,0.3)'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : `Sign In as ${role}`}
                </button>
              </form>
            ) : (
              /* FORM B: Passwordless Email OTP Login */
              <form onSubmit={loginOtpSent ? handleOTPLogin : handleSendLoginOTP}>
                <div className="form-group">
                  <label className="form-label">Registered Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter registered email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginOtpSent}
                    required
                  />
                </div>

                {loginOtpSent && (
                  <>
                    {receivedLoginOtpInfo?.previewUrl && (
                      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                        <a
                          href={receivedLoginOtpInfo.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ background: 'rgba(59, 130, 246, 0.25)', border: '1px solid #3b82f6', color: '#60a5fa', fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' }}
                        >
                          🔗 Click Here to View Live Sent Email Preview
                        </a>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Enter 6-Digit Email OTP *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        style={{ fontSize: '1.4rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', background: '#10b981', borderColor: '#10b981' }}
                  disabled={loading}
                >
                  {loading ? 'Processing OTP...' : (loginOtpSent ? 'Verify Email OTP & Sign In' : 'Send OTP to Email Inbox')}
                </button>

                {loginOtpSent && (
                  <button type="button" onClick={() => setLoginOtpSent(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    ← Edit Email Address
                  </button>
                )}
              </form>
            )}



            {isCitizenMode && (
              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: '#475569' }}>
                Don't have a citizen account? <Link to="/register" style={{ fontWeight: '700', color: '#004071' }}>Register here</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', borderRadius: '16px', position: 'relative' }}>
            <button
              onClick={() => setShowForgotModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto' }}>
                <KeyRound size={26} />
              </div>
              <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '0.25rem' }}>Password Recovery</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {forgotStep === 1 ? 'Enter your registered Email Address to receive a Reset OTP' : 'Enter Reset OTP & New Password'}
              </p>
            </div>

            {modalError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {modalError}
              </div>
            )}

            {modalMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ✅ {modalMsg}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestForgotOTP}>
                <div className="form-group">
                  <label className="form-label">Registered Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. user@example.com"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', background: '#ef4444', borderColor: '#ef4444' }} disabled={loading}>
                  {loading ? 'Sending Reset OTP...' : 'Send Password Reset Email OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordWithOTP}>
                <div className="form-group">
                  <label className="form-label">Enter 6-Digit Email Reset OTP *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    style={{ fontSize: '1.25rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Enter New Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', background: '#10b981', borderColor: '#10b981' }} disabled={loading}>
                  {loading ? 'Updating Password...' : 'Reset Password & Save'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
