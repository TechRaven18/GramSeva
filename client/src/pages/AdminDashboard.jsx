import React, { useState, useEffect } from 'react';
import { adminAPI, locationAPI } from '../services/api';
import { Shield, UserPlus, Users, Building2, CheckCircle2, Lock, Power, RefreshCw, BarChart2, MapPin, Search, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    fetchAdminData();
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

  // Load all jurisdictions when create modal opens
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
        setJurError('Could not load jurisdiction list. Please check the server connection.');
        console.error('getAllJurisdictions error:', err);
      } finally {
        setLoadingJur(false);
      }
    }
  };

  // Computed lists for cascading dropdowns
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
      setFilterDistrict('');
      setFilterBlock('');
      setSearchTerm('');
      setShowCreateModal(false);
      fetchAdminData();
    } catch (err) {
      setCreateMsg(`❌ ${err.message}`);
    }
  };

  const handleToggleStaff = async (id) => {
    try {
      await adminAPI.toggleStaffStatus(id);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteStaff = async (id, name, email) => {
    if (window.confirm(`⚠️ Delete Staff Account Permanently?\n\nStaff Name: ${name}\nEmail / User ID: ${email}\n\nAre you sure you want to delete this staff member? This will permanently delete their account from the database.`)) {
      try {
        const res = await adminAPI.deleteStaff(id);
        alert(`✓ ${res.message}`);
        fetchAdminData();
      } catch (err) {
        alert(`❌ ${err.message}`);
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

  const filteredStaffList = staffList.filter(s => {
    if (!staffSearchQuery.trim()) return true;
    const q = staffSearchQuery.toLowerCase().trim();
    const nameMatch = s.name?.toLowerCase().includes(q);
    const emailMatch = s.email?.toLowerCase().includes(q);
    const mobileMatch = s.mobile?.includes(q);
    const panchayatMatch = s.jurisdiction?.panchayat?.toLowerCase().includes(q);
    const blockMatch = s.jurisdiction?.block?.toLowerCase().includes(q);
    const districtMatch = s.jurisdiction?.district?.toLowerCase().includes(q);
    return nameMatch || emailMatch || mobileMatch || panchayatMatch || blockMatch || districtMatch;
  });

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
                Panchayat Authority & Staff Management
              </h1>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: '500' }}>
                Manage local authority staff accounts, view resolution metrics, and monitor Panchayat performance rankings.
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
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Overall Resolution Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#059669', marginTop: '0.2rem' }}>{overview.resolutionRate || 0}%</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Active Staff Members</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0284c7', marginTop: '0.2rem' }}>{overview.totalStaff || 0}</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Registered Citizens</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#d97706', marginTop: '0.2rem' }}>{overview.totalCitizens || 0}</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
              {/* Modal Header */}
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
                {/* Basic Staff Details */}
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
                      <label className="form-label">Email Address (Mandatory Username / User ID) *</label>
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

                {/* Jurisdiction Assignment - Hierarchical */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ color: '#c084fc', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} /> Assign Jurisdiction Area *
                  </div>

                  {loadingJur ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
                      Loading jurisdictions from MongoDB Atlas...
                    </div>
                  ) : jurError ? (
                    <div style={{ padding: '1rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', border: '1px solid #f87171', fontSize: '0.9rem' }}>
                      ❌ {jurError}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: '10px', border: '1px solid var(--border-glass)', padding: '1rem' }}>

                      {/* Step 1: District */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Step 1 — Select District</label>
                        <select className="form-select" value={filterDistrict} onChange={e => {
                          setFilterDistrict(e.target.value);
                          setFilterBlock('');
                          setSelectedJurisdictionId('');
                        }}>
                          <option value="">-- All Districts ({uniqueDistricts.length} available) --</option>
                          {uniqueDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* Step 2: Block (only shown after district selected) */}
                      {filterDistrict && (
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Step 2 — Select Block / Municipality</label>
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

                      {/* Search */}
                      <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>
                          Step {filterDistrict ? '3' : '2'} — Search & Select Panchayat / Ward *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '2.25rem' }}
                            placeholder="Type to search panchayat / ward name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Panchayat list */}
                      <div style={{ maxHeight: '220px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                        {filteredJurisdictions.length === 0 ? (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                            No jurisdictions found. Try a different filter.
                          </div>
                        ) : (
                          filteredJurisdictions.map(j => (
                            <div
                              key={j._id}
                              onClick={() => setSelectedJurisdictionId(j._id)}
                              style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #e2e8f0',
                                background: selectedJurisdictionId === j._id ? '#ffffff' : 'transparent',
                                borderLeft: selectedJurisdictionId === j._id ? '4px solid #004071' : '4px solid transparent',
                                boxShadow: selectedJurisdictionId === j._id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ fontWeight: selectedJurisdictionId === j._id ? '800' : '600', color: selectedJurisdictionId === j._id ? '#0f172a' : '#334155', fontSize: '0.925rem' }}>
                                {j.panchayat}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                                📍 {j.block} · {j.district} &nbsp;
                                <span style={{
                                  fontSize: '0.7rem', padding: '0.1rem 0.4rem',
                                  borderRadius: '3px', fontWeight: '700',
                                  background: j.type === 'MUNICIPALITY' ? '#fef3c7' : '#e0f2fe',
                                  color: j.type === 'MUNICIPALITY' ? '#b45309' : '#0369a1'
                                }}>{j.type}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Selected jurisdiction display */}
                      {selectedJur && (
                        <div style={{
                          marginTop: '0.85rem', padding: '0.85rem 1.1rem',
                          background: '#ffffff', borderRadius: '10px',
                          border: '2px solid #004071', color: '#0f172a',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#004071', fontWeight: '800', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={16} color="#059669" /> Selected Jurisdiction Area:
                          </div>
                          <div style={{ fontWeight: '900', fontSize: '1.05rem', color: '#0f172a' }}>{selectedJur.panchayat}</div>
                          <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', marginTop: '0.15rem' }}>
                            📍 Block: <b>{selectedJur.block}</b> · District: <b>{selectedJur.district}</b> ({selectedJur.type})
                          </div>
                        </div>
                      )}
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

        {/* Tab 1: Panchayat Analytics */}
        {/* Tab 1: Panchayat Analytics (Sorted by Completed Complaints Descending) */}
        {activeTab === 'analytics' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#004071', marginBottom: '1rem', fontWeight: '800' }}>
              Panchayat & Local Authority Performance Rankings (Sorted by Completed Resolutions)
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
                  {jurisdictions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No data yet — complaints will appear here as they are submitted.
                      </td>
                    </tr>
                  ) : jurisdictions.map((j, idx) => (
                    <tr key={j._id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '800', color: '#004071' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0f172a' }}>
                        {j.panchayat}
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>{j.block}, {j.district}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{j.type}</span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', color: '#334155' }}>{j.staffCount}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', color: '#334155' }}>{j.metrics.total}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', color: '#b45309' }}>{j.metrics.pending}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '800', color: '#059669', fontSize: '1rem' }}>{j.metrics.completed}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>
                        {j.metrics.completionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Staff Directory (Redesigned Cards & Search Filter) */}
        {activeTab === 'staff' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#004071', fontWeight: '800', margin: 0 }}>
                Staff Directory & Jurisdiction Assignments ({filteredStaffList.length} of {staffList.length} Accounts)
              </h3>
            </div>

            {/* Staff Search Filter Input */}
            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                className="form-input"
                style={{
                  paddingLeft: '2.5rem',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontWeight: '600',
                  borderRadius: '8px'
                }}
                placeholder="🔍 Search staff by Name, Email / User ID, Panchayat, Block, or District..."
                value={staffSearchQuery}
                onChange={e => setStaffSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredStaffList.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  {staffSearchQuery ? `No staff members match "${staffSearchQuery}". Try another search term.` : 'No staff accounts found. Click "Create Staff Account" to add one.'}
                </div>
              ) : filteredStaffList.map((s) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                      {s.name} {s.mobile && <span style={{ color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>({s.mobile})</span>}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📍 Jurisdiction: <b style={{ color: '#004071' }}>{s.jurisdiction?.panchayat || 'Unassigned'}</b>
                      {s.jurisdiction?.block && ` · Block: ${s.jurisdiction.block}`}
                      {s.jurisdiction?.district && ` · District: ${s.jurisdiction.district}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Official User ID / Email: <b style={{ color: '#0284c7' }}>{s.email}</b>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Interactive Toggle Switch */}
                    <div
                      onClick={() => handleToggleStaff(s._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      title="Click to toggle account active status"
                    >
                      <div style={{
                        width: '42px',
                        height: '24px',
                        borderRadius: '12px',
                        background: s.isActive ? '#10b981' : '#94a3b8',
                        padding: '2px',
                        transition: 'background 0.25s ease',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transform: s.isActive ? 'translateX(18px)' : 'translateX(0px)',
                          transition: 'transform 0.25s ease'
                        }} />
                      </div>
                      <span style={{
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        color: s.isActive ? '#047857' : '#b91c1c'
                      }}>
                        {s.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleResetPassword(s._id, s.name)}
                      className="btn btn-sm"
                      style={{ background: '#004071', color: '#ffffff', border: 'none', fontWeight: '700', padding: '0.4rem 0.75rem', borderRadius: '6px' }}
                      title="Reset Password"
                    >
                      <Lock size={14} /> Reset Pass
                    </button>

                    <button
                      onClick={() => handleDeleteStaff(s._id, s.name, s.email)}
                      className="btn btn-sm"
                      style={{ background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: '700', padding: '0.4rem 0.75rem', borderRadius: '6px' }}
                      title="Delete Staff Account"
                    >
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
