import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Award, LogOut, User, PlusCircle, Shield, FileText, CheckCircle, HelpCircle, UserCheck, ShieldAlert, X, Home, Trophy } from 'lucide-react';
import CitizenProfileModal from './CitizenProfileModal';

export function AshokaEmblemSVG() {
  return (
    <svg width="48" height="54" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crown / Top Lions */}
      <path d="M50 10 C35 10 30 25 30 35 C30 45 40 50 50 50 C60 50 70 45 70 35 C70 25 65 10 50 10 Z" fill="#d97706" />
      <path d="M25 20 C15 20 12 32 15 42 C20 48 30 48 32 40 Z" fill="#b45309" />
      <path d="M75 20 C85 20 88 32 85 42 C80 48 70 48 68 40 Z" fill="#b45309" />
      {/* Abacus */}
      <rect x="15" y="55" width="70" height="12" rx="2" fill="#d97706" />
      {/* Ashoka Chakra in Center */}
      <circle cx="50" cy="61" r="5" fill="#003882" stroke="#ffffff" strokeWidth="1.5" />
      {/* Bull and Horse Side accents */}
      <circle cx="28" cy="61" r="3" fill="#78350f" />
      <circle cx="72" cy="61" r="3" fill="#78350f" />
      {/* Base / Lotus pedestal */}
      <path d="M20 67 C30 78 70 78 80 67 L85 75 C70 90 30 90 15 75 Z" fill="#b45309" />
      {/* Satyameva Jayate Text */}
      <text x="50" y="105" textAnchor="middle" fill="#d97706" fontSize="11" fontWeight="bold" fontFamily="serif">सत्यमेव जयते</text>
    </svg>
  );
}

export function GandhiSealSVG() {
  return (
    <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      {/* Spectacles (Swachh Bharat symbol) */}
      <circle cx="34" cy="48" r="14" stroke="#004071" strokeWidth="4" fill="none" />
      <circle cx="66" cy="48" r="14" stroke="#004071" strokeWidth="4" fill="none" />
      <line x1="48" y1="48" x2="52" y2="48" stroke="#004071" strokeWidth="4" />
      <line x1="20" y1="46" x2="10" y2="42" stroke="#004071" strokeWidth="3" />
      <line x1="80" y1="46" x2="90" y2="42" stroke="#004071" strokeWidth="3" />
      {/* Tricolor Lens accents */}
      <path d="M22 48 A12 12 0 0 1 46 48" fill="none" stroke="#f97316" strokeWidth="2" />
      <path d="M54 48 A12 12 0 0 1 78 48" fill="none" stroke="#16a34a" strokeWidth="2" />
      <text x="50" y="80" textAnchor="middle" fill="#004071" fontSize="9" fontWeight="bold">स्वच्छ भारत</text>
    </svg>
  );
}

export default function GovernmentHeader() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuthorityModal, setShowAuthorityModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHelpdeskClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollToHelpdesk: true } });
      setTimeout(() => {
        const elem = document.getElementById('helpdesk-section');
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const elem = document.getElementById('helpdesk-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header style={{ width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* TIER 1: Top Dark Blue Government of India Bar */}
      <div style={{
        background: '#003366',
        color: '#ffffff',
        padding: '0.35rem 1.5rem',
        fontSize: '0.82rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
          <span style={{ fontSize: '1rem' }}>🇮🇳</span>
          
          <span style={{ opacity: 0.5, margin: '0 0.25rem' }}>|</span>
         
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.78rem' }}>
          <a href="#main-content" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Skip to main content</a>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ color: '#fde047', fontWeight: '600' }}>Official Civic Grievance Portal</span>
        </div>
      </div>

      {/* TIER 2: Main Ministry Header Banner (White Background) */}
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        padding: '0.85rem 1.5rem',
        borderBottom: '2px solid #004071',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Left: Ashoka Emblem & Ministry Name */}
          <img 
          src="/logo.png" 
          alt="Emblem Logo" 
          style={{ width: '48px', height: '54px', objectFit: 'contain' }} 
          />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.2 }}>
                ग्रामसेवा
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#004071', lineHeight: 1.25 }}>
                GramSeva
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                MNNIT ALLAHABAD
              </div>
            </div>
          

          {/* Middle: Bold Portal / Scheme Title Header */}
          <div style={{ textAlign: 'center', flex: 1, padding: '0 1rem' }}>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.15rem',
              fontWeight: '900',
              color: '#003366',
              letterSpacing: '0.02em',
              lineHeight: 1.3,
              textTransform: 'uppercase'
            }}>
              PANCHAYAT & MUNICIPALITY CIVIC ISSUE MANAGEMENT SYSTEM
            </div>
            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700', marginTop: '0.2rem' }}>
              पंचायती राज एवं नगर निकाय जन शिकायत निवारण प्रणाली
            </div>
          </div>

          {/* Right: Swachh Bharat Seal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GandhiSealSVG />
          </div>
        </div>
      </div>

      {/* TIER 3: Light Sub-header Bar with Navigation Options */}
      <div style={{
        background: '#e0f2fe',
        borderBottom: '1px solid #bae6fd',
        padding: '0.45rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/" style={{
              fontSize: '0.88rem',
              color: '#0369a1',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              padding: '0.35rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #93c5fd'
            }}>
              <Home size={16} /> Home
            </Link>

            <a href="#helpdesk-section" onClick={handleHelpdeskClick} style={{
              fontSize: '0.88rem',
              color: '#0284c7',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem'
            }}>
              <HelpCircle size={16} /> Official Helpdesk
            </a>

            {/* Public Top 10 Panchayats Leaderboard Button */}
            <Link
              to="/top-panchayats"
              style={{
                fontSize: '0.85rem',
                color: '#004071',
                background: '#ffffff',
                border: '1px solid #004071',
                fontWeight: '800',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              title="View Top 10 Performing Panchayats Resolution Leaderboard (Public Page)"
            >
              <Trophy size={16} color="#004071" /> 🏆 Top 10 Panchayats
            </Link>

            {isAuthenticated && role === 'CITIZEN' && (
              <>
                <Link to="/citizen/dashboard" style={{ fontSize: '0.88rem', color: '#0369a1', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={16} /> My Active Complaints
                </Link>
                <Link to="/complaint/new" style={{
                  fontSize: '0.85rem',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: '700',
                  textDecoration: 'none',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <PlusCircle size={16} /> Report Problem
                </Link>
              </>
            )}

            {isAuthenticated && role === 'STAFF' && (
              <Link to="/staff/dashboard" style={{ fontSize: '0.88rem', color: '#0369a1', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle size={16} /> Staff Queue ({user?.jurisdiction?.panchayat || 'Jurisdiction'})
              </Link>
            )}

            {isAuthenticated && role === 'ADMIN' && (
              <Link to="/admin/dashboard" style={{ fontSize: '0.88rem', color: '#6b21a8', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={16} /> Admin Console
              </Link>
            )}
          </div>

          {/* Right Action Menu: User Profile or Sign In */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #93c5fd',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  title="Open Profile, Reward Coins & Past Complaints History"
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '0.78rem', color: '#ffffff'
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{user?.name?.split(' ')[0]}</span>
                </button>

                <button onClick={handleLogout} style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }} title="Log Out">
                  <LogOut size={14} /> Exit
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/login?role=CITIZEN" style={{
                  fontSize: '0.82rem',
                  background: '#ffffff',
                  color: '#0369a1',
                  border: '1px solid #93c5fd',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <User size={14} /> Citizen Login
                </Link>
                <Link to="/register" style={{
                  fontSize: '0.82rem',
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}>
                  Register
                </Link>

                <button
                  onClick={() => setShowAuthorityModal(true)}
                  style={{
                    fontSize: '0.82rem',
                    background: '#6b21a8',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Shield size={14} /> Authority Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citizen Profile Modal */}
      <CitizenProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Authority Login Choice Modal */}
      {showAuthorityModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-glass)', position: 'relative' }}>
            <button 
              onClick={() => setShowAuthorityModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(147, 51, 234, 0.2)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#c084fc' }}>
                <Shield size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.25rem' }}>Panchayat Authority Portal</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Please select your authorized role to access the staff queue or administrative console.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => { setShowAuthorityModal(false); navigate('/login?role=STAFF'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem',
                  borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#ffffff', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ background: '#3b82f6', padding: '0.6rem', borderRadius: '10px', color: '#ffffff' }}>
                  <UserCheck size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#60a5fa' }}>🛠️ Field Staff Member Login</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inspect, resolve, and update local citizen complaints</div>
                </div>
              </button>

              <button
                onClick={() => { setShowAuthorityModal(false); navigate('/login?role=ADMIN'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem',
                  borderRadius: '12px', background: 'rgba(147, 51, 234, 0.12)', border: '1px solid rgba(147, 51, 234, 0.4)',
                  color: '#ffffff', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ background: '#a855f7', padding: '0.6rem', borderRadius: '10px', color: '#ffffff' }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#c084fc' }}>🛡️ Panchayat System Admin Login</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manage staff accounts, jurisdictions, and analytics</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
