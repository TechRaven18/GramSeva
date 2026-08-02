import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { complaintAPI } from '../services/api';
import { PlusCircle, Award, Clock, FileText, CheckCircle2, AlertCircle, Eye, MapPin, Mail, Send, Check } from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Direct Application State
  const [showAppModal, setShowAppModal] = useState(false);
  const [appComplaintNum, setAppComplaintNum] = useState('');
  const [appIssue, setAppIssue] = useState('');
  const [appMsg, setAppMsg] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);
  const [myApplications, setMyApplications] = useState([]);

  useEffect(() => {
    fetchComplaints();
    fetchMyApplications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newComplaint) => {
      setComplaints(prev => [newComplaint, ...prev.filter(c => c._id !== newComplaint._id)]);
    };

    const handleUpdated = (updatedComplaint) => {
      setComplaints(prev => {
        const exists = prev.some(c => c._id === updatedComplaint._id);
        if (exists) {
          if (['COMPLETED', 'REJECTED', 'DELETED'].includes(updatedComplaint.status)) {
            return prev.filter(c => c._id !== updatedComplaint._id);
          }
          return prev.map(c => c._id === updatedComplaint._id ? updatedComplaint : c);
        }
        return prev;
      });
    };

    const handleAppViewed = (updatedApp) => {
      setMyApplications(prev => prev.filter(a => a._id !== updatedApp._id));
    };

    socket.on('complaint:created', handleCreated);
    socket.on('complaint:updated', handleUpdated);
    socket.on('application:viewed', handleAppViewed);

    return () => {
      socket.off('complaint:created', handleCreated);
      socket.off('complaint:updated', handleUpdated);
      socket.off('application:viewed', handleAppViewed);
    };
  }, [socket]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getMyComplaints('ALL');
      const all = res.complaints || [];
      const active = all.filter(c => ['PENDING', 'NEEDS_INFO', 'ACCEPTED', 'SANCTIONED', 'IN_PROGRESS'].includes(c.status));
      setComplaints(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await complaintAPI.getMyDirectApplications();
      const all = res.applications || [];
      // Only keep unviewed applications so that once viewed by Admin, it disappears from Citizen panel
      setMyApplications(all.filter(a => a.status === 'PENDING_REVIEW'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitDirectApplication = async (e) => {
    e.preventDefault();
    setAppMsg('');
    setSubmittingApp(true);
    try {
      const res = await complaintAPI.createDirectApplication({
        complaintNumber: appComplaintNum,
        issue: appIssue
      });
      setAppMsg(`✓ ${res.message}`);
      setAppComplaintNum('');
      setAppIssue('');
      fetchMyApplications();
      setTimeout(() => {
        setShowAppModal(false);
        setAppMsg('');
      }, 1500);
    } catch (err) {
      setAppMsg(`❌ ${err.message}`);
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="app-container">
        {/* Banner Header */}
        <div className="glass-card" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)',
          border: '1px solid #93c5fd'
        }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#004071', marginBottom: '0.25rem', fontWeight: '800' }}>
              Welcome back, {user?.name}!
            </h1>
            <p style={{ color: '#475569', fontSize: '0.925rem', fontWeight: '500' }}>
              📍 Resident of {user?.address?.village || user?.address?.panchayat || 'Registered Panchayat'}, {user?.address?.district || 'District'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowAppModal(true)} className="btn btn-secondary" style={{ padding: '0.75rem 1.1rem' }}>
              <Mail size={18} /> Apply Direct to Admin
            </button>
            <Link to="/complaint/new" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <PlusCircle size={18} /> Report New Problem
            </Link>
          </div>
        </div>

        {/* Section 1: Active Undergoing Complaints */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#004071', marginBottom: '0.2rem', fontWeight: '800' }}>
              🛠️ Currently Undergoing Complaints ({complaints.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              Active grievances currently under inspection, sanctioning, or field work.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Loading undergoing complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
            <CheckCircle2 size={48} color="#059669" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: '#004071', marginBottom: '0.5rem', fontWeight: '700' }}>No Active Undergoing Complaints</h3>
            <p style={{ color: '#475569', fontSize: '0.925rem', marginBottom: '1.5rem' }}>
              You have no active complaints currently in progress. All previous resolved complaints are stored in your top-right <b>Profile → Past History</b>.
            </p>
            <Link to="/complaint/new" className="btn btn-primary">
              <PlusCircle size={18} /> File a New Complaint
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            {complaints.map((c) => (
              <div key={c._id} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#004071', fontSize: '0.95rem' }}>
                        {c.complaintId}
                      </span>
                      <span className={`badge status-${c.status.toLowerCase()}`}>
                        ⚡ {c.status.replace('_', ' ')}
                      </span>
                      <span className={`badge badge-${c.priority.toLowerCase()}`}>
                        Urgency: {c.priority}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.35rem', fontWeight: '700' }}>
                      {c.category}
                    </h3>

                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span><MapPin size={14} style={{ display: 'inline' }} /> {c.location.village}, {c.location.panchayat}</span>
                      <span>• Landmark: {c.location.landmark}</span>
                      <span>• Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link to={`/complaint/${c._id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                    <Eye size={16} /> View Live Progress Timeline
                  </Link>
                </div>

                <p style={{ color: '#1e293b', fontSize: '0.925rem', marginBottom: '1rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  {c.description}
                </p>

                {c.comments && c.comments.length > 0 ? (
                  <div style={{ background: '#e0f2fe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      💬 Latest Official Comment & Status Update ({c.comments.length})
                    </div>
                    {c.comments.slice(-2).map((cmt, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', color: '#0f172a', borderTop: idx > 0 ? '1px solid #bae6fd' : 'none', paddingTop: idx > 0 ? '0.4rem' : '0', marginTop: idx > 0 ? '0.4rem' : '0' }}>
                        <strong style={{ color: '#004071' }}>{cmt.senderName || 'Authority Staff'}:</strong> "{cmt.text}"
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
                          ({new Date(cmt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                    ℹ️ Waiting for initial inspection comment from local Panchayat field staff.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Section 2: My Direct Applications to Admin */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', color: '#004071', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={20} color="#7c3aed" /> My Direct Applications to System Admin ({myApplications.length})
              </h3>
              <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Direct text applications submitted directly to System Administrator for specific issues.
              </p>
            </div>
            <button onClick={() => setShowAppModal(true)} className="btn btn-primary btn-sm">
              <Mail size={16} /> Submit New Application
            </button>
          </div>

          {myApplications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
              You have not submitted any direct text applications to System Admin yet. Click "Submit New Application" to write one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myApplications.map((app) => (
                <div key={app._id} style={{
                  padding: '1.25rem',
                  background: app.status === 'VIEWED' ? '#ecfdf5' : '#fefce8',
                  border: `1px solid ${app.status === 'VIEWED' ? '#6ee7b7' : '#fde047'}`,
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#004071', fontSize: '0.9rem' }}>
                        Application #{app.applicationId}
                      </span>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                        Regarding Complaint Number: <span style={{ color: '#7c3aed', fontFamily: 'monospace' }}>{app.complaintNumber}</span>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.8rem', fontWeight: '800', padding: '0.3rem 0.75rem', borderRadius: '12px',
                      background: app.status === 'VIEWED' ? '#dcfce7' : '#fef3c7',
                      color: app.status === 'VIEWED' ? '#15803d' : '#b45309',
                      border: `1px solid ${app.status === 'VIEWED' ? '#86efac' : '#fde047'}`
                    }}>
                      {app.status === 'VIEWED' ? '🟢 VIEWED BY ADMIN' : '🟡 PENDING REVIEW BY ADMIN'}
                    </span>
                  </div>

                  <p style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '8px', color: '#1e293b', fontSize: '0.925rem', margin: '0.5rem 0' }}>
                    "{app.issue}"
                  </p>

                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Submitted on: {new Date(app.createdAt).toLocaleString()}
                    {app.viewedAt && <span style={{ color: '#059669', fontWeight: '700', marginLeft: '0.75rem' }}>✓ System Admin viewed this on {new Date(app.viewedAt).toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Direct Application to Admin */}
        {showAppModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}>
            <div style={{
              width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '16px',
              border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', padding: '1.25rem 1.5rem',
                color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail color="#c4b5fd" size={20} /> Direct Application to System Admin
                </h3>
                <button onClick={() => setShowAppModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleSubmitDirectApplication} style={{ padding: '1.5rem' }}>
                {appMsg && (
                  <div style={{
                    padding: '0.85rem', marginBottom: '1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem',
                    background: appMsg.startsWith('✓') ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${appMsg.startsWith('✓') ? '#10b981' : '#f87171'}`,
                    color: appMsg.startsWith('✓') ? '#047857' : '#b91c1c'
                  }}>
                    {appMsg}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Complaint Number (e.g. CMP-2026-0802-9A4B) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Complaint Number"
                    value={appComplaintNum}
                    onChange={e => setAppComplaintNum(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Issue / Text Application Description *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Explain your issue or application text to the System Administrator directly..."
                    value={appIssue}
                    onChange={e => setAppIssue(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ background: '#7c3aed', border: 'none' }} disabled={submittingApp}>
                    <Send size={16} /> {submittingApp ? 'Submitting...' : 'Submit Application to Admin'}
                  </button>
                  <button type="button" onClick={() => setShowAppModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
