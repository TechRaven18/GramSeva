import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../services/api';
import { PlusCircle, Award, Clock, FileText, CheckCircle2, AlertCircle, Eye, MapPin } from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getMyComplaints('ALL');
      const all = res.complaints || [];
      // Only keep undergoing / active complaints on main Citizen Dashboard
      const active = all.filter(c => ['PENDING', 'NEEDS_INFO', 'ACCEPTED', 'SANCTIONED', 'IN_PROGRESS'].includes(c.status));
      setComplaints(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/complaint/new" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <PlusCircle size={18} /> Report New Problem
            </Link>
          </div>
        </div>

        {/* Section Header */}
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

        {/* Active Complaints Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Loading undergoing complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

                {/* Active Comments & Official Staff Updates */}
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
      </div>
    </div>
  );
}
