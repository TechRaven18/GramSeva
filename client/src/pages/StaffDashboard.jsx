import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { complaintAPI } from '../services/api';
import { Building2, Sparkles, AlertTriangle, Eye, CheckCircle2, Clock, Filter, Shield } from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [flaggedComplaints, setFlaggedComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'flagged'
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterStatus, activeTab]);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newComplaint) => {
      setComplaints(prev => [newComplaint, ...prev.filter(c => c._id !== newComplaint._id)]);
    };

    const handleUpdated = (updatedComplaint) => {
      setComplaints(prev => {
        const exists = prev.some(c => c._id === updatedComplaint._id);
        if (exists) {
          return prev.map(c => c._id === updatedComplaint._id ? updatedComplaint : c);
        }
        return [updatedComplaint, ...prev];
      });
    };

    socket.on('complaint:created', handleCreated);
    socket.on('complaint:updated', handleUpdated);

    return () => {
      socket.off('complaint:created', handleCreated);
      socket.off('complaint:updated', handleUpdated);
    };
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'flagged') {
        const res = await complaintAPI.getFlaggedComplaints();
        setFlaggedComplaints(res.complaints || []);
      } else {
        const res = await complaintAPI.getStaffQueue(filterStatus);
        setComplaints(res.complaints || []);
        // Also prefetch flagged count
        const flaggedRes = await complaintAPI.getFlaggedComplaints();
        setFlaggedComplaints(flaggedRes.complaints || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFraudAction = async (complaintId, action) => {
    setActionLoading(complaintId);
    try {
      const defaultReason = action === 'CONFIRM_REJECT' ? 'Flagged or non-civic content. Case permanently closed.' : 'Verified genuine civic report.';
      const notes = prompt(action === 'CONFIRM_REJECT' ? 'Enter manual rejection reason for citizen:' : 'Enter reason for clearing fraud flag:', defaultReason);
      if (notes === null) return; // User clicked Cancel
      await complaintAPI.reviewFraudComplaint(complaintId, { action, notes });
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getMetricCount = (st) => complaints.filter(c => c.status === st).length;

  return (
    <div className="page-wrapper">
      <div className="app-container">
        {/* Header Banner */}
        <div className="glass-card" style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)',
          borderLeft: '4px solid #004071',
          border: '1px solid #93c5fd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#004071', fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <Shield size={18} /> Authority Jurisdiction Work Queue
              </div>
              <h1 style={{ fontSize: '1.8rem', color: '#004071', fontWeight: '800' }}>
                {user?.jurisdiction?.panchayat || 'Local Panchayat'} Queue
              </h1>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: '500' }}>
                Staff Member: <b style={{ color: '#0f172a' }}>{user?.name}</b> ({user?.mobile}) | Block: {user?.jurisdiction?.block || 'Block'}, District: {user?.jurisdiction?.district || 'District'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase' }}>Priority Sorted</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#b91c1c' }}>
                  {complaints.filter(c => c.priority === 'CRITICAL').length} Critical Safety Cases
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Active Queue vs Flagged Review vs Closed History) */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('queue')}
            className="btn"
            style={{
              background: activeTab === 'queue' ? '#004071' : '#ffffff',
              color: activeTab === 'queue' ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Building2 size={18} /> Active Jurisdiction Queue ({complaints.filter(c => ['PENDING', 'NEEDS_INFO', 'ACCEPTED', 'SANCTIONED'].includes(c.status)).length})
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className="btn"
            style={{
              background: activeTab === 'closed' ? '#059669' : '#ffffff',
              color: activeTab === 'closed' ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle2 size={18} /> 📁 Closed / Past Complaints ({complaints.filter(c => ['COMPLETED', 'REJECTED'].includes(c.status)).length})
          </button>
        </div>

        {activeTab === 'closed' ? (
          /* CLOSED / PAST COMPLAINTS TAB */
          <div>
            <div className="glass-card" style={{ marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <h3 style={{ color: '#004071', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontWeight: '800' }}>
                <CheckCircle2 size={20} color="#059669" /> Closed & Resolved Jurisdiction Complaints History
              </h3>
              <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                Archived past complaints that have been completed or rejected. These cases are officially closed.
              </p>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: '#475569', fontWeight: '600' }}>Loading closed complaints...</div>
            ) : complaints.filter(c => ['COMPLETED', 'REJECTED'].includes(c.status)).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ color: '#004071', fontWeight: '700' }}>No closed complaints archived yet</h3>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>Completed or rejected cases will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {complaints.filter(c => ['COMPLETED', 'REJECTED'].includes(c.status)).map((c) => (
                  <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', borderLeft: c.status === 'REJECTED' ? '5px solid #dc2626' : '5px solid #059669' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span className={`badge status-${c.status.toLowerCase()}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '800', color: '#004071' }}>
                          {c.complaintId}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          • Closed: {new Date(c.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.25rem', fontWeight: '800' }}>
                        {c.category}
                      </h3>

                      <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '500' }}>
                        📍 Village: <b style={{ color: '#0f172a' }}>{c.location.village}</b> | Landmark: {c.location.landmark}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Filed by {c.citizenInfo?.name || 'Citizen'} ({c.citizenInfo?.mobile})
                      </div>
                    </div>

                    <div>
                      <Link to={`/complaint/${c._id}`} className="btn btn-secondary btn-sm" style={{ fontWeight: '700' }}>
                        <Eye size={16} /> View Archived Record
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE JURISDICTION QUEUE TAB */
          <div>
            {/* Metrics Grid */}
            <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
                <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Pending Review</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b45309' }}>{getMetricCount('PENDING')}</div>
              </div>
              <div style={{ padding: '1rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
                <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Accepted / Sanctioned</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0369a1' }}>
                  {getMetricCount('ACCEPTED') + getMetricCount('SANCTIONED')}
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
                <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Completed Work</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#047857' }}>{getMetricCount('COMPLETED')}</div>
              </div>
              <div style={{ padding: '1rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
                <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Needs Info / Rejected</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b91c1c' }}>
                  {getMetricCount('NEEDS_INFO') + getMetricCount('REJECTED')}
                </div>
              </div>
            </div>

            {/* Complaints Table List (Only Active Undergoing Complaints) */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: '#475569', fontWeight: '600' }}>Loading jurisdiction queue...</div>
            ) : complaints.filter(c => ['PENDING', 'NEEDS_INFO', 'ACCEPTED', 'SANCTIONED'].includes(c.status)).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ color: '#004071', fontWeight: '700' }}>No active complaints requiring action</h3>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>All active jurisdiction issues are processed. Archived closed cases are in <b>Closed / Past Complaints</b>.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {complaints.filter(c => ['PENDING', 'NEEDS_INFO', 'ACCEPTED', 'SANCTIONED'].includes(c.status)).map((c) => (
                  <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${(c.priority || 'URGENT').toLowerCase()}`}>
                          Severity: {c.priority === 'CRITICAL' ? '🚨 CRITICAL' : c.priority === 'LESS_CRITICAL' ? '🔵 LESS CRITICAL' : '⚠️ URGENT'}
                        </span>
                        <span className={`badge status-${c.status.toLowerCase()}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '700', color: '#004071' }}>
                          {c.complaintId}
                        </span>
                        {c.imageQuality && (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                            📷 {c.imageQuality.resolution}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.25rem', fontWeight: '700' }}>
                        {c.category}
                      </h3>

                      <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '500' }}>
                        📍 Village: <b style={{ color: '#0f172a' }}>{c.location.village}</b> | Landmark: {c.location.landmark}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Filed by {c.citizenInfo?.name || 'Citizen'} ({c.citizenInfo?.mobile}) on {new Date(c.createdAt).toLocaleString()}
                      </div>

                      {/* Evidence Photo Thumbnail Preview */}
                      {c.images && c.images.length > 0 && (
                        <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#004071', fontWeight: '700' }}>📷 Evidence Photo:</span>
                          <img
                            src={c.images[0].startsWith('http') || c.images[0].startsWith('data:') || c.images[0].startsWith('/uploads') ? c.images[0] : `/uploads/${c.images[0]}`}
                            alt="Complaint Evidence Thumbnail"
                            style={{ width: '64px', height: '48px', borderRadius: '6px', border: '1px solid #cbd5e1', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Link to={`/complaint/${c._id}`} className="btn btn-primary btn-sm">
                        <Eye size={16} /> Process & Update Status
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
