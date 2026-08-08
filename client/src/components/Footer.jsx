import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export function NICLogoSVG() {
  return (
    <svg width="120" height="36" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="60" rx="6" fill="#1e293b" />
      <text x="15" y="38" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="sans-serif">NIC</text>
      <text x="65" y="26" fill="#38bdf8" fontSize="10" fontWeight="700" fontFamily="sans-serif">राष्ट्रीय सूचना विज्ञान केंद्र</text>
      <text x="65" y="38" fill="#ffffff" fontSize="9" fontWeight="600" fontFamily="sans-serif">National Informatics Centre</text>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{
      background: '#090d16',
      borderTop: '3px solid #004071',
      padding: '2.5rem 0 1rem 0',
      marginTop: 'auto',
      color: '#cbd5e1',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div className="app-container">
        <div className="grid-3" style={{ marginBottom: '2rem', gap: '2rem' }}>
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: '700' }}>
              GramSeva Civic Portal
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Official digital grievance reporting and Panchayat / Municipality management system under GramSeva Initiative by MNNIT, Allahabad.
            </p>
          </div>

          <div id="helpdesk-section" style={{
            background: 'rgba(30, 41, 59, 0.6)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ☎️ Official Citizen Helpdesk & Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="#38bdf8" /> <strong>Email Support:</strong> GramSevamnnit@gmail.com
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="#34d399" /> <strong>Toll-Free Helpline:</strong> +91-8391842765 / +91-7880852459
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="#fbbf24" /> First Floor , P. D. Tondon Hostel, MNNIT Allahabad, Teliyarganj, Prayagraj, 211004
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: '700' }}>
              Security & Compliance
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', lineHeight: '1.5' }}>
              <ShieldCheck size={18} color="#34d399" /> Immutable OTP & Role-Scoped Jurisdiction Access Control.
            </p>
          </div>
        </div>

        {/* Official NIC Bottom Copyright Banner */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.82rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NICLogoSVG />
            <div>
              <div>Website content is owned & managed by <strong>Neeraj Sharma & Subrata Ghosh</strong>, MNNIT ALLAHABAD.</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Site is designed, developed, hosted & maintained by <strong style={{ color: '#fde047' }}>Neeraj Sharma & Subrata Ghosh</strong>.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem' }}>
            <span>Privacy Policy</span>
            <span>|</span>
            <span>Accessibility Statement</span>
            <span>|</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
