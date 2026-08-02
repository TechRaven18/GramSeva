import React, { useState, useEffect } from 'react';
import { adminAPI, locationAPI } from '../services/api';
import { Shield, UserPlus, Users, Building2, CheckCircle2, Lock, Power, RefreshCw, BarChart2, MapPin, Search, Trash2, Mail, FileText, AlertCircle, Clock, Eye, Edit3 } from 'lucide-react';

export default function AdminDashboard() {
  const [overview, setOverview] = useState({});
  const [jurisdictions, setJurisdictions] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');

  // Create Staff Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffMobile, setStaffMobile] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('Password@123');
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState('');
  const [createMsg, setCreateMsg] = useState('');

  // Hierarchical jurisdiction selection
  const [allJurisdictions, setAllJurisdictions] = useState([]);
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingJur, setLoadingJur] = useState(false);
  const [jurError, setJurError] = useState('');

  // Search & Authority Complaint Management State
  const [searchComplaintNum, setSearchComplaintNum] = useState('');
  const [searchedComplaint, setSearchedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('PENDING');
  const [overrideNote, setOverrideNote] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Citizen Direct Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchDirectApplications();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, staffRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getStaffList()
      ]);
      setOverview(analyticsRes.overview || {});
      setJurisdictions(analyticsRes.jurisdictions || []);
      setStaffList(staffRes.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await adminAPI.getApplications();
      const all = res.applications || [];
      // Only keep unviewed applications in the active queue
      setApplications(all.filter(a => a.status === 'PENDING_REVIEW'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleOpenModal = async () => {
    setShowCreateModal(true);
    setCreateMsg('');
    setSelectedJurisdictionId('');
    setFilterDistrict('');
    setFilterBlock('');
    setSearchTerm('');
    setJurError('');

    if (allJurisdictions.length === 0) {
      setLoadingJur(true);
      try {
        const res = await locationAPI.getAllJurisdictions();
        setAllJurisdictions(res.jurisdictions || []);
      } catch (err) {
        setJurError('Could not load jurisdiction list.');
      } finally {
        setLoadingJur(false);
      }
    }
  };

  const uniqueDistricts = [...new Set(allJurisdictions.map(j => j.district))].sort();
  const uniqueBlocks = filterDistrict
    ? [...new Set(allJurisdictions.filter(j => j.district === filterDistrict).map(j => j.block))].sort()
    : [];

  const filteredJurisdictions = allJurisdictions.filter(j => {
    const matchDistrict = !filterDistrict || j.district === filterDistrict;
    const matchBlock = !filterBlock || j.block === filterBlock;
    const matchSearch = !searchTerm ||
      j.panchayat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.block.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.district.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDistrict && matchBlock && matchSearch;
  });

  const selectedJur = allJurisdictions.find(j => j._id === selectedJurisdictionId);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      const res = await adminAPI.createStaff({
        name: staffName,
        mobile: staffMobile,
        email: staffEmail,
        password: staffPassword,
        jurisdictionId: selectedJurisdictionId
      });
      setCreateMsg(`✓ ${res.message}`);
      setStaffName('');
      setStaffMobile('');
      setStaffEmail('');
      setStaffPassword('Password@123');
      setSelectedJurisdictionId('');
      setShowCreateModal(false);
      fetchAdminData();
    } catch (err) {
      setCreateMsg(`❌ ${err.message}`);
    }
  };

  const handleToggleStaff = async (id) => {
    setStaffList(prev => prev.map(s => s._id === id ? { ...s, isActive: !s.isActive } : s));
    try {
      await adminAPI.toggleStaffStatus(id);
    } catch (err) {
      setStaffList(prev => prev.map(s => s._id === id ? { ...s, isActive: !s.isActive } : s));
      alert(err.message || 'Could not update staff status.');
    }
  };

  const handleDeleteStaff = async (id, name, email) => {
    if (window.confirm(`⚠️ Delete Staff Account Permanently?\n\nStaff Name: ${name}\nEmail: ${email}\n\nAre you sure you want to delete this staff member?`)) {
      setStaffList(prev => prev.filter(s => s._id !== id));
      try {
        await adminAPI.deleteStaff(id);
      } catch (err) {
        fetchAdminData();
        alert(`❌ ${err.message || 'Could not delete staff account.'}`);
      }
    }
  };

  const handleResetPassword = async (id, name) => {
    const newPass = prompt(`Enter new password for staff ${name}:`, 'Password@123');
    if (newPass) {
      try {
        await adminAPI.resetStaffPassword(id, { newPassword: newPass });
        alert(`Password for ${name} reset successfully.`);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Search Complaint by Complaint Number
  const handleSearchComplaint = async (e) => {
    e.preventDefault();
    if (!searchComplaintNum.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setActionMsg('');
    setSearchedComplaint(null);
    try {
      const res = await adminAPI.searchComplaintByNumber(searchComplaintNum.trim());
      setSearchedComplaint(res.complaint);
      setComplaintHistory(res.history || []);
      setOverrideStatus(res.complaint.status);
    } catch (err) {
      setSearchError(err.message || 'Complaint not found.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Admin Status Override
  const handleAdminStatusOverride = async (e) => {
    e.preventDefault();
    if (!searchedComplaint) return;
    setActionMsg('');
    try {
      const res = await adminAPI.adminUpdateComplaintStatus(searchedComplaint._id, {
        status: overrideStatus,
        message: overrideNote || `Admin state override to ${overrideStatus}`
      });
      setActionMsg(`✓ ${res.message}`);
      setSearchedComplaint(res.complaint);
      setOverrideNote('');
      fetchAdminData();
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    }
  };

  // Admin Delete Complaint
  const handleAdminDeleteComplaint = async () => {
    if (!searchedComplaint) return;
    if (window.confirm(`⚠️ PERMANENTLY DELETE COMPLAINT?\n\nComplaint ID: ${searchedComplaint.complaintId}\nCategory: ${searchedComplaint.category}\n\nAre you sure you want to permanently delete this complaint from the database? This action cannot be undone.`)) {
      setActionMsg('');
      try {
        const res = await adminAPI.adminDeleteComplaint(searchedComplaint._id);
        setActionMsg(`✓ ${res.message}`);
        setSearchedComplaint(null);
        setSearchComplaintNum('');
        fetchAdminData();
      } catch (err) {
        setActionMsg(`❌ ${err.message}`);
      }
    }
  };

  // Admin Mark Application as Viewed
  const handleMarkApplicationViewed = async (id) => {
    try {
      await adminAPI.markApplicationViewed(id);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert(err.message || 'Could not mark application as viewed.');
    }
  };

  const filteredStaffList = staffList.filter(s => {
    if (!staffSearchQuery.trim()) return true;
    const q = staffSearchQuery.toLowerCase().trim();
    return s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.mobile?.includes(q) ||
      s.jurisdiction?.panchayat?.toLowerCase().includes(q) ||
      s.jurisdiction?.block?.toLowerCase().includes(q) ||
      s.jurisdiction?.district?.toLowerCase().includes(q);
  });

  const unviewedAppsCount = applications.filter(a => a.status === 'PENDING_REVIEW').length;

  return (
    <div className="page-wrapper">
      <div className="app-container">
        {/* Banner Header */}
        <div className="glass-card" style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 100%)',
          borderLeft: '4px solid #7c3aed',
          border: '1px solid #d8b4fe'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <Shield size={18} /> System Administrator Portal
              </div>
              <h1 style={{ fontSize: '1.8rem', color: '#004071', fontWeight: '800' }}>
                Panchayat Authority & System Control Panel
              </h1>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: '500' }}>
                Full authority complaint override, citizen application review, staff management, and Panchayat resolution rankings.
              </p>
            </div>
            <button onClick={handleOpenModal} className="btn btn-primary">
              <UserPlus size={18} /> Create Staff Account
            </button>
          </div>
        </div>

        {/* System Overview Metrics */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Total Grievances</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#004071', marginTop: '0.2rem' }}>{overview.totalComplaints || 0}</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Resolution Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#059669', marginTop: '0.2rem' }}>{overview.resolutionRate || 0}%</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Pending Citizen Apps</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#7c3aed', marginTop: '0.2rem' }}>{unviewedAppsCount}</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Active Staff</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0284c7', marginTop: '0.2rem' }}>{overview.totalStaff || 0}</div>
          </div>
        </div>

        {/* Tab Controls (4 Main Admin Tabs) */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('analytics')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'analytics' ? '#004071' : '#ffffff',
              color: activeTab === 'analytics' ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              fontWeight: '700',
              padding: '0.6rem 1.25rem'
            }}
          >
            <BarChart2 size={16} /> Panchayat Performance Rankings
          </button>
          <button
            onClick={() => setActiveTab('search-complaint')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'search-complaint' ? '#004071' : '#ffffff',
              color: activeTab === 'search-complaint' ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              fontWeight: '700',
              padding: '0.6rem 1.25rem'
            }}
          >
            <Search size={16} /> 🔍 Complaint Lookup & State Override
          </button>
          <button
            onClick={() => setActiveTab('citizen-applications')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'citizen-applications' ? '#004071' : '#ffffff',
              color: activeTab === 'citizen-applications' ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              fontWeight: '700',
              padding: '0.6rem 1.25rem',
              position: 'relative'
            }}
          >
            <Mail size={16} /> 📩 Citizen Applications {unviewedAppsCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.4rem' }}>{unviewedAppsCount} New</span>}
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'staff' ? '#004071' : '#ffffff',
              color: activeTab === 'staff' ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              fontWeight: '700',
              padding: '0.6rem 1.25rem'
            }}
          >
            <Users size={16} /> Staff Directory ({staffList.length})
          </button>
        </div>

        {/* ============================
            CREATE STAFF MODAL
        =============================== */}
        {showCreateModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              width: '100%', maxWidth: '750px', maxHeight: '90vh',
              overflowY: 'auto', background: '#ffffff',
              borderRadius: '16px', border: '1px solid #cbd5e1',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #004071 0%, #1e3a8a 100%)',
                padding: '1.25rem 1.75rem',
                borderTopLeftRadius: '15px', borderTopRightRadius: '15px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Authority Staff Onboarding
                  </div>
                  <h3 style={{ fontSize: '1.35rem', color: '#ffffff', fontWeight: '800', margin: '0.2rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus color="#60a5fa" size={22} /> Create Official Staff Account
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.15)', color: '#ffffff',
                    border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                    fontSize: '1rem', cursor: 'pointer', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '1.75rem' }}>
                {createMsg && (
                  <div style={{
                    marginBottom: '1.25rem', padding: '0.85rem 1.1rem',
                    background: createMsg.startsWith('✓') ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${createMsg.startsWith('✓') ? '#10b981' : '#f87171'}`,
                    color: createMsg.startsWith('✓') ? '#047857' : '#b91c1c',
                    borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600'
                  }}>{createMsg}</div>
                )}

                <form onSubmit={handleCreateStaff}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ color: '#c084fc', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Staff Details
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Staff Full Name *</label>
                        <input type="text" className="form-input" placeholder="e.g. Suresh Kumar Prasad" value={staffName} onChange={e => setStaffName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address (Mandatory User ID) *</label>
                        <input type="email" className="form-input" placeholder="staff@gramseva.in" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Mobile Phone Number</label>
                        <input type="tel" className="form-input" placeholder="e.g. 9876543210" value={staffMobile} onChange={e => setStaffMobile(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Initial Password *</label>
                        <input type="text" className="form-input" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ color: '#c084fc', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} /> Assign Jurisdiction Area *
                    </div>

                    {loadingJur ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                        Loading jurisdictions...
                      </div>
                    ) : (
                      <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Step 1 — Select District</label>
                          <select className="form-select" value={filterDistrict} onChange={e => {
                            setFilterDistrict(e.target.value);
                            setFilterBlock('');
                            setSelectedJurisdictionId('');
                          }}>
                            <option value="">-- All Districts ({uniqueDistricts.length}) --</option>
                            {uniqueDistricts.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {filterDistrict && (
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Step 2 — Select Block</label>
                            <select className="form-select" value={filterBlock} onChange={e => {
                              setFilterBlock(e.target.value);
                              setSelectedJurisdictionId('');
                            }}>
                              <option value="">-- All Blocks in {filterDistrict} --</option>
                              {uniqueBlocks.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff' }}>
                          {filteredJurisdictions.map(j => (
                            <div
                              key={j._id}
                              onClick={() => setSelectedJurisdictionId(j._id)}
                              style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #e2e8f0',
                                background: selectedJurisdictionId === j._id ? '#e0f2fe' : 'transparent',
                                borderLeft: selectedJurisdictionId === j._id ? '4px solid #004071' : '4px solid transparent'
                              }}
                            >
                              <div style={{ fontWeight: '700', color: '#0f172a' }}>{j.panchayat}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>📍 {j.block} · {j.district}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={!selectedJurisdictionId}>
                      <UserPlus size={16} /> Create Staff Account
                    </button>
                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Analytics */}
        {activeTab === 'analytics' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#004071', marginBottom: '1rem', fontWeight: '800' }}>
              Panchayat & Local Authority Performance Rankings
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800' }}>Rank</th>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800' }}>Authority / Panchayat</th>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800' }}>Type</th>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800', textAlign: 'center' }}>Staff</th>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800', textAlign: 'center' }}>Total</th>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800', textAlign: 'center' }}>Pending</th>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800', textAlign: 'center' }}>Completed</th>
                    <th style={{ padding: '0.75rem', color: '#004071', fontWeight: '800', textAlign: 'right' }}>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {jurisdictions.map((j, idx) => (
                    <tr key={j._id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '800', color: '#004071' }}>#{idx + 1}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0f172a' }}>
                        {j.panchayat}
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{j.block}, {j.district}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{j.type}</span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700' }}>{j.staffCount}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700' }}>{j.metrics.total}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', color: '#b45309' }}>{j.metrics.pending}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '800', color: '#059669', fontSize: '1rem' }}>{j.metrics.completed}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>{j.metrics.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: COMPLAINT LOOKUP & AUTHORITY OVERRIDE
        =========================================== */}
        {activeTab === 'search-complaint' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#004071', fontWeight: '800', margin: '0 0 0.25rem 0' }}>
                🔍 Admin Complaint Lookup & Full State Override
              </h3>
              <p style={{ color: '#475569', fontSize: '0.875rem' }}>
                Enter any Complaint Number (e.g. <code>CMP-2026-0802-9A4B</code>) to view full details, change status to any state (e.g. convert <b>REJECTED</b> back to <b>PENDING</b>), or delete permanently.
              </p>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchComplaint} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', maxWidth: '650px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  placeholder="Enter Complaint Number (e.g. CMP-2026-...)"
                  value={searchComplaintNum}
                  onChange={e => setSearchComplaintNum(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Lookup Complaint'}
              </button>
            </form>

            {searchError && (
              <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '600' }}>
                ❌ {searchError}
              </div>
            )}

            {actionMsg && (
              <div style={{
                padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', fontWeight: '700',
                background: actionMsg.startsWith('✓') ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${actionMsg.startsWith('✓') ? '#10b981' : '#f87171'}`,
                color: actionMsg.startsWith('✓') ? '#047857' : '#b91c1c'
              }}>
                {actionMsg}
              </div>
            )}

            {/* Searched Complaint Display Card */}
            {searchedComplaint && (
              <div style={{ background: '#f8fafc', border: '2px solid #004071', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#004071', fontSize: '1.1rem' }}>
                        {searchedComplaint.complaintId}
                      </span>
                      <span className={`badge status-${searchedComplaint.status.toLowerCase()}`}>
                        {searchedComplaint.status}
                      </span>
                      <span className={`badge badge-${searchedComplaint.priority.toLowerCase()}`}>
                        Urgency: {searchedComplaint.priority}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: '800', margin: '0.2rem 0' }}>
                      {searchedComplaint.category}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      👤 Citizen: <b>{searchedComplaint.citizen?.name}</b> ({searchedComplaint.citizen?.email}) · 📍 {searchedComplaint.location?.panchayat}, {searchedComplaint.location?.block}, {searchedComplaint.location?.district}
                    </div>
                  </div>

                  <button onClick={handleAdminDeleteComplaint} className="btn btn-sm" style={{ background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: '800' }}>
                    <Trash2 size={16} /> Delete Complaint Permanently
                  </button>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Description</div>
                  <p style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem' }}>{searchedComplaint.description}</p>
                </div>

                {/* Authority State Override Controls */}
                <div style={{ background: '#ffffff', border: '1px solid #7c3aed', padding: '1.25rem', borderRadius: '10px' }}>
                  <h4 style={{ fontSize: '1.05rem', color: '#7c3aed', fontWeight: '800', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit3 size={18} /> Admin State Override Controls
                  </h4>
                  <form onSubmit={handleAdminStatusOverride} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="grid-2">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Select New Target Status *</label>
                        <select className="form-select" value={overrideStatus} onChange={e => setOverrideStatus(e.target.value)}>
                          <option value="PENDING">PENDING (Revert from REJECTED / Under Inspection)</option>
                          <option value="ACCEPTED">ACCEPTED (Work Approved)</option>
                          <option value="NEEDS_INFO">NEEDS_INFO (Request Info from Citizen)</option>
                          <option value="SANCTIONED">SANCTIONED (Budget Sanctioned)</option>
                          <option value="COMPLETED">COMPLETED (Work Resolved + Award 20 Coins)</option>
                          <option value="REJECTED">REJECTED (Mark Invalid / Rejected)</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Override Reason / Note (Optional)</label>
                        <input type="text" className="form-input" placeholder="e.g. Reverted from Rejected after Admin review..." value={overrideNote} onChange={e => setOverrideNote(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <button type="submit" className="btn btn-primary" style={{ background: '#7c3aed', border: 'none' }}>
                        Apply Status Override Now
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 3: CITIZEN DIRECT APPLICATIONS
        =========================================== */}
        {activeTab === 'citizen-applications' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#004071', fontWeight: '800', margin: 0 }}>
                  📩 Citizen Direct Applications to Admin ({applications.length} Total)
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                  Direct text applications submitted by citizens for specific issues. Mark as viewed to remove from active unread list.
                </p>
              </div>
            </div>

            {loadingApps ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                No citizen direct applications found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.map((app) => (
                  <div key={app._id} style={{
                    padding: '1.25rem',
                    background: app.status === 'PENDING_REVIEW' ? '#fefce8' : '#f8fafc',
                    border: `1px solid ${app.status === 'PENDING_REVIEW' ? '#fde047' : '#cbd5e1'}`,
                    borderLeft: `5px solid ${app.status === 'PENDING_REVIEW' ? '#eab308' : '#059669'}`,
                    borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'
                  }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#004071', fontSize: '0.9rem' }}>
                          Application #{app.applicationId}
                        </span>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '12px',
                          background: app.status === 'PENDING_REVIEW' ? '#fef3c7' : '#dcfce7',
                          color: app.status === 'PENDING_REVIEW' ? '#b45309' : '#15803d'
                        }}>
                          {app.status === 'PENDING_REVIEW' ? '🟡 PENDING REVIEW' : '🟢 VIEWED BY ADMIN'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
                        Regarding Complaint Number: <span style={{ color: '#7c3aed', fontFamily: 'monospace' }}>{app.complaintNumber}</span>
                      </div>

                      <p style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '8px', color: '#1e293b', fontSize: '0.925rem', margin: '0.5rem 0' }}>
                        "{app.issue}"
                      </p>

                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        👤 Submitted by <b>{app.citizenName}</b> ({app.citizenEmail}) · {new Date(app.createdAt).toLocaleString()}
                        {app.viewedAt && ` · Viewed at ${new Date(app.viewedAt).toLocaleString()}`}
                      </div>
                    </div>

                    <div>
                      {app.status === 'PENDING_REVIEW' ? (
                        <button
                          onClick={() => handleMarkApplicationViewed(app._id)}
                          className="btn btn-sm"
                          style={{ background: '#059669', color: '#ffffff', border: 'none', fontWeight: '800', padding: '0.5rem 1rem' }}
                        >
                          <Eye size={16} /> Mark as Viewed
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={16} /> Marked as Viewed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Staff Directory */}
        {activeTab === 'staff' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#004071', fontWeight: '800', margin: 0 }}>
                Staff Directory ({filteredStaffList.length} Accounts)
              </h3>
            </div>

            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: '600' }}
                placeholder="🔍 Search staff by Name, Email, Panchayat..."
                value={staffSearchQuery}
                onChange={e => setStaffSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredStaffList.map((s) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                      {s.name} {s.mobile && <span style={{ color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>({s.mobile})</span>}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>
                      📍 Jurisdiction: <b style={{ color: '#004071' }}>{s.jurisdiction?.panchayat || 'Unassigned'}</b> ({s.jurisdiction?.block}, {s.jurisdiction?.district})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>User ID: {s.email}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={() => handleToggleStaff(s._id)} className="btn btn-sm" style={{ background: s.isActive ? '#10b981' : '#94a3b8', color: '#fff', border: 'none', fontWeight: '700' }}>
                      {s.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                    </button>
                    <button onClick={() => handleResetPassword(s._id, s.name)} className="btn btn-sm" style={{ background: '#004071', color: '#fff', border: 'none', fontWeight: '700' }}>
                      <Lock size={14} /> Reset Pass
                    </button>
                    <button onClick={() => handleDeleteStaff(s._id, s.name, s.email)} className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: '700' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
