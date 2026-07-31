import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { authAPI, complaintAPI, rewardAPI } from '../services/api';
import { User, Award, FileText, KeyRound, X, CheckCircle2, ShieldAlert, Clock, MapPin, Gift, Lock } from 'lucide-react';

export default function CitizenProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('PROFILE');

  // Past Complaints State
  const [pastComplaints, setPastComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Rewards State
  const [rewardHistory, setRewardHistory] = useState([]);
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [selectedShopId, setSelectedShopId] = useState('SHOP-RATION-101');
  const [currentCoins, setCurrentCoins] = useState(user?.rewardCoins || 0);
  const [redeemOtpCode, setRedeemOtpCode] = useState(null);
  const [rewardMsg, setRewardMsg] = useState('');
  const [rewardError, setRewardError] = useState('');

  // Sync currentCoins state whenever user object changes
  useEffect(() => {
    if (user?.rewardCoins !== undefined) {
      setCurrentCoins(user.rewardCoins);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleRewardUpdated = (data) => {
      if (data && data.rewardCoins !== undefined) {
        setCurrentCoins(data.rewardCoins);
        if (updateUser && user) {
          updateUser({ ...user, rewardCoins: data.rewardCoins });
        }
        fetchRewardHistory();
      }
    };

    socket.on('reward:updated', handleRewardUpdated);
    socket.on('complaint:updated', handleRewardUpdated);

    return () => {
      socket.off('reward:updated', handleRewardUpdated);
      socket.off('complaint:updated', handleRewardUpdated);
    };
  }, [socket]);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      if (activeTab === 'PAST_COMPLAINTS') {
        fetchPastComplaints();
      } else if (activeTab === 'REWARDS') {
        fetchRewardHistory();
      }
    }
  }, [isOpen, activeTab, user]);

  const fetchPastComplaints = async () => {
    setLoadingComplaints(true);
    try {
      // Fetch all complaints and filter closed / resolved / completed ones
      const res = await complaintAPI.getMyComplaints('ALL');
      const all = res.complaints || [];
      const past = all.filter(c => ['COMPLETED', 'CONFIRMED', 'REJECTED'].includes(c.status));
      setPastComplaints(past);
    } catch (err) {
      console.error('Failed to load past complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchRewardHistory = async () => {
    try {
      const res = await rewardAPI.getMyRewards();
      setRewardHistory(res.redemptions || []);
      if (res.rewardCoins !== undefined) {
        setCurrentCoins(res.rewardCoins);
        if (updateUser && user && user.rewardCoins !== res.rewardCoins) {
          updateUser({ ...user, rewardCoins: res.rewardCoins });
        }
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    }
  };

  const handleRequestRedemption = async (e) => {
    e.preventDefault();
    setRewardError('');
    setRewardMsg('');

    try {
      const res = await rewardAPI.requestRedemption({
        coins: Number(redeemAmount),
        shopId: selectedShopId
      });
      const generatedOtp = res.redemption?.otp || res.redemption?.otpCode;
      setRedeemOtpCode(generatedOtp);
      setRewardMsg(`Success! Redeemed ${redeemAmount} Coins for ₹${redeemAmount} Discount at ${res.redemption?.shopName || 'Partner Store'} (${res.redemption?.shopId}). Your Counter Coupon code is listed in active discounts below.`);
      
      if (res.newBalance !== undefined) {
        setCurrentCoins(res.newBalance);
        if (updateUser && user) {
          updateUser({ ...user, rewardCoins: res.newBalance });
        }
      }
      fetchRewardHistory();
    } catch (err) {
      setRewardError(err.message || 'Failed to request coin redemption.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassMsg('');

    if (newPassword !== confirmPassword) {
      setPassError('New Password and Confirm Password do not match.');
      return;
    }

    setPassLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setPassMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto',
        padding: '2rem', borderRadius: '16px', border: '2px solid #93c5fd',
        background: '#ffffff', boxShadow: '0 20px 50px rgba(0, 64, 113, 0.2)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={20} />
        </button>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.25rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #004071 0%, #0284c7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: '800', color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 64, 113, 0.25)'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#004071', marginBottom: '0.15rem', fontWeight: '800' }}>{user.name}</h2>
              <span className="badge badge-medium" style={{
                background: user.role === 'ADMIN' ? '#f3e8ff' : user.role === 'STAFF' ? '#e0f2fe' : '#e0f2fe',
                color: user.role === 'ADMIN' ? '#6b21a8' : user.role === 'STAFF' ? '#0284c7' : '#0369a1',
                border: user.role === 'ADMIN' ? '1px solid #d8b4fe' : '1px solid #7dd3fc',
                fontWeight: '800'
              }}>
                {user.role === 'ADMIN' ? 'ADMINISTRATOR' : user.role === 'STAFF' ? 'FIELD STAFF' : 'CITIZEN'}
              </span>
            </div>
            <p style={{ color: '#0284c7', fontSize: '0.925rem', marginBottom: '0.2rem', fontWeight: '700' }}>
              📧 {user.email} (User ID)
            </p>
            <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '500' }}>
              📍 {user.address?.village || user.address?.panchayat || user.jurisdiction?.panchayat || 'HQ Central'}, {user.address?.district || user.jurisdiction?.district || 'District'}
            </p>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: user.role === 'CITIZEN' ? 'repeat(4, 1fr)' : user.role === 'ADMIN' ? 'repeat(2, 1fr)' : '1fr',
          gap: '0.5rem',
          background: '#f1f5f9', padding: '6px',
          borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('PROFILE')}
            style={{
              padding: '0.65rem 0', border: 'none', borderRadius: '8px',
              background: activeTab === 'PROFILE' ? '#004071' : 'transparent',
              color: activeTab === 'PROFILE' ? '#ffffff' : '#334155',
              fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
            }}
          >
            <User size={16} /> Personal Info
          </button>

          {user.role === 'CITIZEN' && (
            <>
              <button
                onClick={() => setActiveTab('REWARDS')}
                style={{
                  padding: '0.65rem 0', border: 'none', borderRadius: '8px',
                  background: activeTab === 'REWARDS' ? '#d97706' : 'transparent',
                  color: activeTab === 'REWARDS' ? '#ffffff' : '#334155',
                  fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                }}
              >
                <Award size={16} /> Coins ({currentCoins})
              </button>

              <button
                onClick={() => setActiveTab('PAST_COMPLAINTS')}
                style={{
                  padding: '0.65rem 0', border: 'none', borderRadius: '8px',
                  background: activeTab === 'PAST_COMPLAINTS' ? '#059669' : 'transparent',
                  color: activeTab === 'PAST_COMPLAINTS' ? '#ffffff' : '#334155',
                  fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                }}
              >
                <FileText size={16} /> Past History
              </button>
            </>
          )}

          {/* Password tab hidden for STAFF since password is created and reset by Admin */}
          {user.role !== 'STAFF' && (
            <button
              onClick={() => setActiveTab('SECURITY')}
              style={{
                padding: '0.65rem 0', border: 'none', borderRadius: '8px',
                background: activeTab === 'SECURITY' ? '#7c3aed' : 'transparent',
                color: activeTab === 'SECURITY' ? '#ffffff' : '#334155',
                fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
              }}
            >
              <Lock size={16} /> Password
            </button>
          )}
        </div>

        {/* TAB 1: Personal Info */}
        {activeTab === 'PROFILE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#004071', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', fontWeight: '800' }}>
                📋 Account Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', fontSize: '0.925rem' }}>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Full Name</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>{user.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Official User ID (Email)</span>
                  <strong style={{ color: '#0284c7', fontSize: '1.05rem', fontWeight: '800' }}>{user.email}</strong>
                </div>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Jurisdiction Role</span>
                  <span className="badge badge-medium" style={{
                    marginTop: '0.2rem',
                    background: user.role === 'ADMIN' ? '#f3e8ff' : user.role === 'STAFF' ? '#e0f2fe' : '#e0f2fe',
                    color: user.role === 'ADMIN' ? '#6b21a8' : user.role === 'STAFF' ? '#0284c7' : '#0369a1',
                    border: user.role === 'ADMIN' ? '1px solid #d8b4fe' : '1px solid #7dd3fc',
                    fontWeight: '800'
                  }}>
                    {user.role === 'ADMIN' ? 'System Administrator (HQ)' : user.role === 'STAFF' ? 'Panchayat Field Staff' : 'Citizen Resident'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Postal Pincode</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>{user.address?.pincode || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#004071', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', fontWeight: '800' }}>
                📍 Residential Address Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', fontSize: '0.925rem' }}>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>State</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>{user.address?.state || 'Jharkhand'}</strong>
                </div>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>District</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>{user.address?.district || 'Not Specified'}</strong>
                </div>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Block / Taluka</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>{user.address?.block || 'Not Specified'}</strong>
                </div>
                <div>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Panchayat / Municipality</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>{user.address?.panchayat || 'Not Specified'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#475569', display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Village / Local Area Address</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>{user.address?.village || 'Not Specified'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Reward Coins */}
        {activeTab === 'REWARDS' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)', border: '2px solid #fcd34d', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: '700' }}>Civic Reward Coins Balance</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#d97706', fontFamily: 'monospace' }}>
                  🪙 {user.rewardCoins || 0} Coins
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem', fontWeight: '500' }}>
                  Earn +20 coins for every genuine civic issue resolved by Panchayat staff.
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Award size={52} color="#d97706" />
              </div>
            </div>

            {/* Redeem Coins Form */}
            <div style={{ padding: '1.5rem', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#ffffff', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#004071', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
                <Gift size={20} color="#d97706" /> Redeem Coins at Participating Stores (Multiples of 100)
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
                Select a merchant store / public utility (Ration, Electricity, Water, Gas, Seeds) and coin discount amount in multiples of 100. Coins will be debited and credited to your chosen store.
              </p>

              {rewardError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.65rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '600' }}>
                  ⚠️ {rewardError}
                </div>
              )}

              {rewardMsg && (
                <div style={{ background: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center', fontWeight: '700' }}>
                  ✅ {rewardMsg}
                </div>
              )}

              <form onSubmit={handleRequestRedemption} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Select Merchant Store / Utility *</label>
                    <select
                      className="form-input"
                      value={selectedShopId}
                      onChange={(e) => setSelectedShopId(e.target.value)}
                    >
                      <option value="SHOP-RATION-101">🌾 GramSeva Fair Price Ration Shop (SHOP-RATION-101)</option>
                      <option value="SHOP-ELEC-202">⚡ Electricity Bill Payment Counter (SHOP-ELEC-202)</option>
                      <option value="SHOP-WATER-303">💧 Drinking Water Utility Board (SHOP-WATER-303)</option>
                      <option value="SHOP-GAS-404">🔥 PM Ujjwala LPG Gas Agency (SHOP-GAS-404)</option>
                      <option value="SHOP-AGRI-505">🌱 Fertilizer & Seed Store (SHOP-AGRI-505)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Select Coins to Redeem (Multiples of 100) *</label>
                    <select
                      className="form-input"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(Number(e.target.value))}
                    >
                      <option value={100}>100 Coins (₹100 Store Discount)</option>
                      <option value={200}>200 Coins (₹200 Store Discount)</option>
                      <option value={300}>300 Coins (₹300 Store Discount)</option>
                      <option value={400}>400 Coins (₹400 Store Discount)</option>
                      <option value={500}>500 Coins (₹500 Store Discount)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Available Balance: <strong style={{ color: '#d97706' }}>{currentCoins} Coins</strong>
                  </div>
                  <button
                    type="submit"
                    className="btn"
                    style={{ background: '#d97706', color: '#ffffff', fontWeight: '700', padding: '0.75rem 1.5rem', borderRadius: '6px' }}
                    disabled={currentCoins < Number(redeemAmount)}
                  >
                    Redeem {redeemAmount} Coins (₹{redeemAmount} Discount)
                  </button>
                </div>
              </form>
            </div>

            {/* Active Store Discounts & Coupons Ledger */}
            {rewardHistory.length > 0 && (
              <div style={{ padding: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                <h4 style={{ fontSize: '1rem', color: '#004071', marginBottom: '0.75rem', fontWeight: '800' }}>
                  🛒 My Active Store Discounts & Counter Coupons ({rewardHistory.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {rewardHistory.map((r) => (
                    <div key={r._id} style={{ padding: '0.85rem 1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                          ₹{r.discountValueRupees || r.coins} Discount Reserved — {r.shopName || r.merchantName}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '0.15rem' }}>
                          Shop ID: <strong style={{ color: '#004071' }}>{r.shopId || r.merchantCode}</strong> | Category: {r.category || 'Utility Discount'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '700' }}>Counter Coupon:</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '1.25rem', color: '#d97706', letterSpacing: '2px' }}>{r.otp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Past Complaints History */}
        {activeTab === 'PAST_COMPLAINTS' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#004071', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
              <CheckCircle2 color="#059669" /> Resolved & Past Complaints History
            </h3>

            {loadingComplaints ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#475569', fontWeight: '600' }}>
                Loading past complaints history...
              </div>
            ) : pastComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                <FileText size={40} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ color: '#0f172a', marginBottom: '0.25rem', fontWeight: '700' }}>No Past Resolved Complaints</h4>
                <p style={{ color: '#475569', fontSize: '0.875rem' }}>
                  Completed and resolved complaints will be archived here once resolved by Panchayat staff.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pastComplaints.map((c) => (
                  <div key={c._id} style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', borderLeft: c.status === 'REJECTED' ? '5px solid #dc2626' : '5px solid #059669' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#004071', fontSize: '0.9rem' }}>{c.complaintId}</span>
                          <span className={`badge status-${c.status.toLowerCase()}`}>{c.status.replace('_', ' ')}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 style={{ color: '#0f172a', fontSize: '1.1rem', margin: 0, fontWeight: '800' }}>{c.category}</h4>
                      </div>

                      {c.status === 'REJECTED' ? (
                        <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: '700' }}>
                          ⛔ Rejected & Closed
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7', fontWeight: '700' }}>
                          ✓ Resolved & Closed
                        </span>
                      )}
                    </div>

                    <p style={{ color: '#334155', fontSize: '0.9rem', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      {c.description}
                    </p>

                    {c.status === 'REJECTED' && (
                      <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', color: '#991b1b', fontWeight: '600' }}>
                        ❌ <strong>Rejection Reason:</strong> "{c.staffNotes || 'Flagged or non-civic content. Case permanently closed.'}"
                      </div>
                    )}

                    {c.status === 'COMPLETED' && c.staffNotes && (
                      <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', color: '#047857', fontWeight: '600' }}>
                        💡 <strong>Resolution Staff Note:</strong> {c.staffNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Security & Change Password (Excludes STAFF users) */}
        {activeTab === 'SECURITY' && user.role !== 'STAFF' && (
          <div style={{ padding: '1.5rem', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#004071', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
              <Lock size={20} color="#7c3aed" /> Change Password
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
              Update your account password for security.
            </p>

            {passError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.65rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '600' }}>
                ⚠️ {passError}
              </div>
            )}

            {passMsg && (
              <div style={{ background: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7', padding: '0.65rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '700' }}>
                ✅ {passMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn"
                style={{ width: '100%', padding: '0.8rem', background: '#7c3aed', color: '#ffffff', fontWeight: '700', borderRadius: '6px', marginTop: '0.5rem' }}
                disabled={passLoading}
              >
                {passLoading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
