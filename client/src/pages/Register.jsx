import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, locationAPI } from '../services/api';
import { Mail, ShieldCheck, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

export default function Register() {
  // Step State: 1 = Basic Info & Address, 2 = Verify OTP, 3 = Create Password & Save
  const [step, setStep] = useState(1);

  // Mandatory Registration Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');

  // Location State
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [panchayats, setPanchayats] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedPanchayat, setSelectedPanchayat] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [landmark, setLandmark] = useState('');

  // Step 2 State: OTP
  const [otp, setOtp] = useState('');
  const [receivedOtpInfo, setReceivedOtpInfo] = useState(null);

  // Step 3 State: Passwords
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load districts
  useEffect(() => {
    locationAPI.getDistricts()
      .then(res => setDistricts(res.districts || []))
      .catch(err => console.error(err));
  }, []);

  const handleDistrictChange = async (e) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);
    setSelectedBlock('');
    setSelectedPanchayat('');
    setSelectedVillage('');
    setBlocks([]); setPanchayats([]); setVillages([]);

    if (dist) {
      const res = await locationAPI.getBlocks(dist);
      setBlocks(res.blocks || []);
    }
  };

  const handleBlockChange = async (e) => {
    const blk = e.target.value;
    setSelectedBlock(blk);
    setSelectedPanchayat('');
    setSelectedVillage('');
    setPanchayats([]); setVillages([]);

    if (selectedDistrict && blk) {
      const res = await locationAPI.getPanchayats(selectedDistrict, blk);
      setPanchayats(res.panchayats || []);
    }
  };

  const handlePanchayatChange = async (e) => {
    const panchayatName = e.target.value;
    setSelectedPanchayat(panchayatName);
    setSelectedVillage('');
    setVillages([]);

    const matchedJur = panchayats.find(p => p.panchayat === panchayatName);
    if (matchedJur) {
      setVillages(matchedJur.villages || []);
    }
  };

  // STEP 1: Ask Details & Generate Email OTP
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid Email Address.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.sendRegistrationOTP({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        pincode: pincode.trim(),
        address: {
          district: selectedDistrict,
          block: selectedBlock,
          panchayat: selectedPanchayat,
          village: selectedVillage,
          landmark,
          pincode: pincode.trim()
        }
      });

      setReceivedOtpInfo(res);
      setStep(2);
      const otpDisplay = res.otp ? ` (Verification Code: ${res.otp})` : '';
      setSuccessMsg(`Verification OTP code sent to your Email Inbox (${email}).${otpDisplay}`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. This Email Address might already be registered for a Citizen.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleStep2VerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.verifyRegistrationOTP({
        email: email.trim().toLowerCase(),
        otp
      });

      setStep(3);
      setSuccessMsg('Email OTP verified successfully! Now create your password.');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Create Password & Complete Registration
  const handleStep3SavePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please retype password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.completeRegistration({
        email: email.trim().toLowerCase(),
        password,
        confirmPassword
      });

      login(data.user, data.token);
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create password and save account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="app-container" style={{ width: '100%', maxWidth: '640px' }}>
        <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)' }}>
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: '1.75rem', color: '#004071', marginBottom: '0.25rem', fontWeight: '800' }}>
              Citizen Registration Wizard
            </h2>
            <p style={{ color: '#475569', fontSize: '0.925rem', fontWeight: '500' }}>
              Create your Citizen Account for GramSeva Panchayat System
            </p>
          </div>

          {/* 3-Step Wizard Navigation Indicator */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{
              flex: 1, padding: '0.6rem',
              background: step >= 1 ? 'linear-gradient(135deg, #004071 0%, #0284c7 100%)' : '#f1f5f9',
              color: step >= 1 ? '#ffffff' : '#64748b',
              border: step >= 1 ? 'none' : '1px solid #cbd5e1',
              borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700',
              boxShadow: step >= 1 ? '0 2px 6px rgba(0,64,113,0.2)' : 'none'
            }}>
              1. Basic Info & Email
            </div>
            <div style={{
              flex: 1, padding: '0.6rem',
              background: step >= 2 ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : '#f1f5f9',
              color: step >= 2 ? '#ffffff' : '#64748b',
              border: step >= 2 ? 'none' : '1px solid #cbd5e1',
              borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700',
              boxShadow: step >= 2 ? '0 2px 6px rgba(5,150,105,0.2)' : 'none'
            }}>
              2. Verify Email OTP
            </div>
            <div style={{
              flex: 1, padding: '0.6rem',
              background: step >= 3 ? 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)' : '#f1f5f9',
              color: step >= 3 ? '#ffffff' : '#64748b',
              border: step >= 3 ? 'none' : '1px solid #cbd5e1',
              borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700',
              boxShadow: step >= 3 ? '0 2px 6px rgba(107,33,168,0.2)' : 'none'
            }}>
              3. Create Password
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: '600' }}>
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: '700' }}>
              ✅ {successMsg}
            </div>
          )}

          {/* STEP 1: Basic Information & Email as Username */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <div style={{ fontWeight: '800', color: '#004071', fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                👤 Personal Details & Mandatory Email Address
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Mandatory User ID) *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#e0f2fe', border: '1px solid #93c5fd', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#0369a1', lineHeight: '1.5' }}>
                📧 <strong>Official Notice:</strong> Your registered <strong>Email Address</strong> will be your mandatory GramSeva Username / User ID for signing in. The 6-digit OTP code will be sent to your Email Inbox.
              </div>

              {/* Location Hierarchy & Pincode Box */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #cbd5e1', margin: '1.25rem 0' }}>
                <div style={{ fontWeight: '800', color: '#004071', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📍 Residential Jurisdiction Address
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <select className="form-select" value={selectedDistrict} onChange={handleDistrictChange} required>
                      <option value="">Select District</option>
                      {districts.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Block *</label>
                    <select className="form-select" value={selectedBlock} onChange={handleBlockChange} disabled={!selectedDistrict} required>
                      <option value="">Select Block</option>
                      {blocks.map((b, i) => <option key={i} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Panchayat / Municipality *</label>
                    <select className="form-select" value={selectedPanchayat} onChange={handlePanchayatChange} disabled={!selectedBlock} required>
                      <option value="">Select Panchayat / Ward</option>
                      {panchayats.map((p, i) => <option key={i} value={p.panchayat}>{p.panchayat}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Village / Locality *</label>
                    <select className="form-select" value={selectedVillage} onChange={(e) => setSelectedVillage(e.target.value)} disabled={!selectedPanchayat} required>
                      <option value="">Select Village / Locality</option>
                      {villages.map((v, i) => <option key={i} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Landmark / House Address *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Near Water Tank, Main Road"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Postal Pincode *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 800001"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn" style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', background: 'linear-gradient(135deg, #004071 0%, #0284c7 100%)', color: '#ffffff', fontWeight: '700', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 64, 113, 0.25)' }} disabled={loading}>
                {loading ? 'Sending OTP to Email...' : 'Generate Verification Email OTP'} <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-Digit Email OTP */}
          {step === 2 && (
            <form onSubmit={handleStep2VerifyOTP}>
              <div style={{ background: '#e0f2fe', border: '1px solid #93c5fd', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: '600' }}>
                  📧 6-Digit Verification OTP Dispatched to Email Inbox: <strong style={{ color: '#004071' }}>{email}</strong>
                </div>

                {receivedOtpInfo?.previewUrl && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={receivedOtpInfo.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ background: '#004071', border: 'none', color: '#ffffff', fontSize: '0.85rem', padding: '0.45rem 1rem', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: '700' }}
                    >
                      🔗 Click Here to View Live Sent Email Preview
                    </a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', color: '#004071', textAlign: 'center', display: 'block', fontWeight: '800' }}>
                  Enter 6-Digit Email OTP Code *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ fontSize: '1.75rem', textAlign: 'center', letterSpacing: '6px', padding: '0.75rem', fontWeight: '800', color: '#004071' }}
                  required
                />
              </div>

              <button type="submit" className="btn" style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', background: '#059669', color: '#ffffff', fontWeight: '700', borderRadius: '8px' }} disabled={loading}>
                {loading ? 'Verifying Email OTP...' : 'Verify Email OTP & Proceed to Password Setup'} <CheckCircle2 size={18} />
              </button>

              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem', fontWeight: '700' }}>
                ← Edit Email Address / Resend OTP
              </button>
            </form>
          )}

          {/* STEP 3: Create & Confirm Password */}
          {step === 3 && (
            <form onSubmit={handleStep3SavePassword}>
              <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', color: '#6b21a8' }}>
                <Lock size={32} style={{ marginBottom: '0.35rem' }} />
                <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#6b21a8' }}>Create Your Account Password</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                  Email User ID <strong style={{ color: '#004071' }}>{email}</strong> Verified! Set a secure password to complete registration.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Create Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Retype password to confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn" style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', background: '#7c3aed', color: '#ffffff', fontWeight: '700', borderRadius: '8px' }} disabled={loading}>
                {loading ? 'Saving Profile & Password...' : 'Save & Complete Registration'} <CheckCircle2 size={18} />
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: '#475569' }}>
            Already have an account? <Link to="/login?role=CITIZEN" style={{ fontWeight: '700', color: '#004071' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
