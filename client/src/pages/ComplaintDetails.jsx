import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { complaintAPI } from '../services/api';
import StatusTimeline from '../components/StatusTimeline';
import { Sparkles, MapPin, User, Shield, CheckCircle, AlertTriangle, ArrowLeft, Send, Award, RefreshCw, Lock } from 'lucide-react';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { socket } = useSocket();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action form state
  const [actionStatus, setActionStatus] = useState('ACCEPTED');
  const [staffMessage, setStaffMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  // Priority override state
  const [newPriority, setNewPriority] = useState('HIGH');
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Intercommunication & Comment State
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:complaint', id);

    const handleComplaintUpdated = (updatedComplaint) => {
      if (updatedComplaint && updatedComplaint._id === id) {
        setComplaint(updatedComplaint);
        complaintAPI.getDetails(id).then(res => {
          setHistory(res.history || []);
        }).catch(() => {});
      }
    };

    const handleCommentAdded = (data) => {
      if (data && data.complaintId === id) {
        if (data.complaint) {
          setComplaint(data.complaint);
        }
        complaintAPI.getDetails(id).then(res => {
          setComplaint(res.complaint);
          setHistory(res.history || []);
        }).catch(() => {});
      }
    };

    socket.on('complaint:updated', handleComplaintUpdated);
    socket.on('comment:added', handleCommentAdded);

    return () => {
      socket.off('complaint:updated', handleComplaintUpdated);
      socket.off('comment:added', handleCommentAdded);
    };
  }, [socket, id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getDetails(id);
      setComplaint(res.complaint);
      setHistory(res.history || []);
    } catch (err) {
      setError(err.message || 'Could not load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (actionStatus === 'REJECTED' && !staffMessage.trim()) {
      alert('⚠️ Please type a manual rejection reason for the citizen before rejecting this complaint.');
      return;
    }
    setUpdating(true);
    try {
      const res = await complaintAPI.updateStatus(id, {
        status: actionStatus,
        message: staffMessage
      });
      setComplaint(res.complaint);
      setStaffMessage('');
      fetchDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityOverride = async (e) => {
    e.preventDefault();
    try {
      const res = await complaintAPI.overridePriority(id, {
        newPriority,
        reason: overrideReason
      });
      setComplaint(res.complaint);
      setShowOverrideModal(false);
      fetchDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && commentFiles.length === 0) return;

    setSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append('text', commentText);
      for (let i = 0; i < commentFiles.length; i++) {
        formData.append('images', commentFiles[i]);
      }

      const res = await complaintAPI.addComment(id, formData);
      setComplaint(res.complaint);
      setCommentText('');
      setCommentFiles([]);
      fetchDetails();
    } catch (err) {
      alert(err.message || 'Failed to submit message.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 0', color: '#004071', fontWeight: '700' }}>Loading details...</div>;
  if (error || !complaint) return <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 0', color: '#b91c1c', fontWeight: '700' }}>{error || 'Complaint not found.'}</div>;

  return (
    <div className="page-wrapper">
      <div className="app-container">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', fontWeight: '700' }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Single Centered Main Container */}
        <div style={{ maxWidth: '920px', margin: '0 auto' }}>
          <div>
            <div className="glass-card" style={{ marginBottom: '1.5rem', background: '#ffffff', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#004071', fontSize: '1.05rem' }}>
                    {complaint.complaintId}
                  </span>
                  <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: '800' }}>
                    {complaint.category}
                  </h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={`badge status-${complaint.status.toLowerCase()}`}>
                    ⚡ {complaint.status.replace('_', ' ')}
                  </span>
                  <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
                    Priority: {complaint.priority}
                  </span>
                </div>
              </div>

              {/* COMPLETED Banner Notice */}
              {complaint.status === 'COMPLETED' && (
                <div style={{ background: '#d1fae5', border: '2px solid #6ee7b7', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', color: '#047857' }}>
                  <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ✅ COMPLAINT RESOLVED & WORK COMPLETED
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                    <strong>Staff Completion Note:</strong> "{complaint.staffNotes || 'Field work completed and verified.'}"
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#065f46', marginTop: '0.4rem', fontWeight: '600' }}>
                    📌 Note: Your complaint is officially over and archived under your Profile → Past History section.
                  </div>
                </div>
              )}

              {/* REJECTED Banner Notice */}
              {complaint.status === 'REJECTED' && (
                <div style={{ background: '#fee2e2', border: '2px solid #fca5a5', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', color: '#991b1b' }}>
                  <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ⛔ COMPLAINT REJECTED & CLOSED
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                    ❌ <strong>Rejection Reason:</strong> "{complaint.staffNotes || 'Flagged or non-civic content. Case permanently closed.'}"
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.4rem', fontWeight: '600' }}>
                    📌 Note: This complaint is permanently closed and archived in your Profile → Past History section.
                  </div>
                </div>
              )}

              {/* NEEDS_INFO Banner Notice */}
              {complaint.status === 'NEEDS_INFO' && (
                <div style={{ background: '#e0f2fe', border: '2px solid #93c5fd', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', color: '#0369a1' }}>
                  <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ⚠️ ADDITIONAL INFORMATION REQUESTED BY STAFF
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                    The authority staff requires further details or updated photos of the problem. Please use the <strong>Intercommunication Chat below</strong> to reply and upload photos. You can be asked for information multiple times as needed.
                  </div>
                </div>
              )}

              {/* Location & Landmark */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                <div style={{ color: '#004071', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <MapPin size={16} color="#0284c7" /> {complaint.location.village}, {complaint.location.panchayat} ({complaint.location.block}, {complaint.location.district})
                </div>
                <div style={{ color: '#475569', fontWeight: '500' }}>
                  <b>Landmark / House:</b> {complaint.location.landmark} (Pincode: {complaint.location.pincode || 'N/A'})
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#004071', marginBottom: '0.5rem', fontWeight: '800' }}>Problem Description:</h4>
                <p style={{ color: '#0f172a', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: '500' }}>
                  {complaint.description}
                </p>
              </div>

              {/* Complaint Images Display */}
              {complaint.images && complaint.images.length > 0 && (
                <div>
                  <h4 style={{ color: '#004071', marginBottom: '0.5rem', fontWeight: '800' }}>Uploaded Evidence Photos ({complaint.images.length}):</h4>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {complaint.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.startsWith('http') || img.startsWith('data:') || img.startsWith('/uploads') ? img : `/uploads/${img}`}
                        alt="Evidence"
                        style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: '1px solid #cbd5e1', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Staff / Admin Action Box */}
            {(role === 'STAFF' || role === 'ADMIN') && complaint.status !== 'REJECTED' && complaint.status !== 'COMPLETED' && (
              <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '5px solid #004071', background: '#ffffff', border: '1px solid #cbd5e1' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#004071', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
                  <Shield size={20} color="#004071" /> Authority Processing & Workflow Action
                </h3>

                <form onSubmit={handleStatusUpdate}>
                  <div className="form-group">
                    <label className="form-label">Transition Complaint Status To:</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {/* NEEDS_INFO: Can be used multiple times */}
                      <button
                        type="button"
                        onClick={() => setActionStatus('NEEDS_INFO')}
                        className="btn btn-sm"
                        style={{
                          background: actionStatus === 'NEEDS_INFO' ? '#d97706' : '#ffffff',
                          color: actionStatus === 'NEEDS_INFO' ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          fontWeight: '700'
                        }}
                      >
                        💬 Needs Info (Multiple)
                      </button>

                      {/* ACCEPTED: One-time process */}
                      <button
                        type="button"
                        onClick={() => !complaint.wasAccepted && setActionStatus('ACCEPTED')}
                        disabled={complaint.wasAccepted}
                        className="btn btn-sm"
                        style={{
                          background: complaint.wasAccepted ? '#cbd5e1' : (actionStatus === 'ACCEPTED' ? '#004071' : '#ffffff'),
                          color: complaint.wasAccepted ? '#64748b' : (actionStatus === 'ACCEPTED' ? '#ffffff' : '#334155'),
                          border: '1px solid #cbd5e1',
                          fontWeight: '700',
                          cursor: complaint.wasAccepted ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {complaint.wasAccepted ? '✓ Accepted (1-Time Done)' : '✓ Accept (1-Time)'}
                      </button>

                      {/* SANCTIONED: One-time process */}
                      <button
                        type="button"
                        onClick={() => !complaint.wasSanctioned && setActionStatus('SANCTIONED')}
                        disabled={complaint.wasSanctioned}
                        className="btn btn-sm"
                        style={{
                          background: complaint.wasSanctioned ? '#cbd5e1' : (actionStatus === 'SANCTIONED' ? '#0284c7' : '#ffffff'),
                          color: complaint.wasSanctioned ? '#64748b' : (actionStatus === 'SANCTIONED' ? '#ffffff' : '#334155'),
                          border: '1px solid #cbd5e1',
                          fontWeight: '700',
                          cursor: complaint.wasSanctioned ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {complaint.wasSanctioned ? '✓ Sanctioned (1-Time Done)' : '🏗️ Sanction (1-Time)'}
                      </button>

                      {/* COMPLETED: Closes case */}
                      <button
                        type="button"
                        onClick={() => setActionStatus('COMPLETED')}
                        className="btn btn-sm"
                        style={{
                          background: actionStatus === 'COMPLETED' ? '#059669' : '#ffffff',
                          color: actionStatus === 'COMPLETED' ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          fontWeight: '700'
                        }}
                      >
                        ✅ Complete & Close Case
                      </button>

                      {/* REJECTED: Closes case */}
                      <button
                        type="button"
                        onClick={() => setActionStatus('REJECTED')}
                        className="btn btn-sm"
                        style={{
                          background: actionStatus === 'REJECTED' ? '#dc2626' : '#ffffff',
                          color: actionStatus === 'REJECTED' ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          fontWeight: '700'
                        }}
                      >
                        ⛔ Reject & Close Case
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Message / Instruction for Citizen:</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder={actionStatus === 'COMPLETED' ? 'Completing & closing complaint. Work verified finished (+20 reward coins credited to citizen)...' : actionStatus === 'ACCEPTED' ? 'Accepting complaint. Work assigned to field team...' : actionStatus === 'NEEDS_INFO' ? 'Specify what additional info/photo is required...' : 'Provide official notes or resolution details...'}
                      value={staffMessage}
                      onChange={(e) => setStaffMessage(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', fontWeight: '700' }} disabled={updating}>
                      <Send size={16} /> Submit Status Update ({actionStatus})
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOverrideModal(!showOverrideModal)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: '700' }}
                    >
                      <RefreshCw size={14} /> Override Priority Level
                    </button>
                  </div>

                  {showOverrideModal && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Select New Priority Level:</label>
                        <select
                          className="form-select"
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value)}
                        >
                          <option value="CRITICAL">🚨 CRITICAL (High Hazard)</option>
                          <option value="URGENT">⚠️ URGENT (Infrastructure)</option>
                          <option value="LESS_CRITICAL">🔵 LESS CRITICAL (Maintenance)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Reason for overriding..."
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          required
                        />
                      </div>
                      <button type="button" onClick={handlePriorityOverride} className="btn btn-primary btn-sm" style={{ fontWeight: '700' }}>
                        Confirm Priority Override
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TWO-WAY INTERCOMMUNICATION CHAT & FOLLOW-UP EVIDENCE FEED */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', background: '#ffffff', border: '1px solid #cbd5e1' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#004071', marginBottom: '0.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                💬 Citizen & Staff Intercommunication Feed
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem' }}>
                Direct two-way messaging between Citizen and Local Panchayat Staff for updates, clarifications, and additional photo evidence.
              </p>

              {/* Message List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {!complaint.comments || complaint.comments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.9rem' }}>
                    ℹ️ No messages yet. You can post messages or attach follow-up photos below.
                  </div>
                ) : (
                  complaint.comments.map((cmt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: cmt.senderRole === 'CITIZEN' ? '#f0f9ff' : '#f8fafc',
                        border: cmt.senderRole === 'CITIZEN' ? '1px solid #bae6fd' : '1px solid #cbd5e1',
                        borderLeft: cmt.senderRole === 'CITIZEN' ? '4px solid #0284c7' : '4px solid #004071'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '800', color: cmt.senderRole === 'CITIZEN' ? '#0369a1' : '#004071', fontSize: '0.9rem' }}>
                            {cmt.senderName || (cmt.senderRole === 'CITIZEN' ? 'Citizen' : 'Panchayat Staff')}
                          </span>
                          <span className="badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: cmt.senderRole === 'CITIZEN' ? '#e0f2fe' : '#e0e7ff', color: cmt.senderRole === 'CITIZEN' ? '#0369a1' : '#3730a3' }}>
                            {cmt.senderRole}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(cmt.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      {cmt.text && (
                        <p style={{ color: '#0f172a', fontSize: '0.925rem', margin: '0.25rem 0', fontWeight: '500', lineHeight: '1.5' }}>
                          {cmt.text}
                        </p>
                      )}

                      {/* Comment Attached Photos */}
                      {cmt.images && cmt.images.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          {cmt.images.map((img, i) => (
                            <img
                              key={i}
                              src={img.startsWith('http') || img.startsWith('data:') || img.startsWith('/uploads') ? img : `/uploads/${img}`}
                              alt="Followup photo"
                              style={{ width: '120px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Reply / Comment Form (Disabled for Citizens unless status is NEEDS_INFO) */}
              {(complaint.status === 'REJECTED' || complaint.status === 'COMPLETED') ? (
                <div style={{ background: complaint.status === 'COMPLETED' ? '#d1fae5' : '#fee2e2', border: complaint.status === 'COMPLETED' ? '1px solid #6ee7b7' : '1px solid #fca5a5', padding: '0.85rem', borderRadius: '8px', color: complaint.status === 'COMPLETED' ? '#047857' : '#991b1b', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>
                  🔒 This complaint is {complaint.status} & OFFICIALLY CLOSED. Case is over and further comments are disabled.
                </div>
              ) : role === 'CITIZEN' && complaint.status !== 'NEEDS_INFO' ? (
                <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '1rem', borderRadius: '10px', color: '#0369a1', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Lock size={22} color="#0284c7" />
                  <div>
                    <strong style={{ color: '#004071', display: 'block', fontSize: '0.95rem' }}>Messaging & Photo Upload Locked</strong>
                    Staff is currently reviewing your report. You can send follow-up messages or photos only when staff requests "Needs Info".
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendComment} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  {role === 'CITIZEN' && complaint.status === 'NEEDS_INFO' && (
                    <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', padding: '0.75rem', borderRadius: '8px', color: '#b45309', fontSize: '0.875rem', fontWeight: '700', marginBottom: '1rem' }}>
                      ⚠️ Staff requested additional information! Please send your reply message and photo evidence below.
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Send Message / Additional Information Details:</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Type details, answers to staff queries, or additional information..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Attach Additional Photo Evidence (Optional):</label>
                    <input
                      type="file"
                      className="form-input"
                      accept="image/*"
                      multiple
                      onChange={(e) => setCommentFiles(Array.from(e.target.files))}
                    />
                    {commentFiles.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.25rem', fontWeight: '600' }}>
                        ✓ Selected {commentFiles.length} photo file(s) to upload with message.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #004071 0%, #0284c7 100%)', color: '#ffffff', fontWeight: '700', padding: '0.75rem 1.25rem', borderRadius: '8px', width: '100%' }}
                    disabled={submittingComment}
                  >
                    {submittingComment ? 'Sending...' : 'Send Message & Upload Photo Evidence'} <Send size={16} />
                  </button>
                </form>
              )}
            </div>

            {/* Status History Timeline */}
            <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#004071', marginBottom: '1rem', fontWeight: '800' }}>
                Status Audit Trail & Timeline History
              </h3>
              <StatusTimeline history={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
