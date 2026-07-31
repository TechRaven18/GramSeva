import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { rewardAPI } from '../services/api';
import { Award, ShoppingBag, Key, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function Rewards() {
  const { user, updateUser } = useAuth();
  const [balance, setBalance] = useState(user?.rewardCoins || 0);
  const [transactions, setTransactions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request Redemption State
  const [coinsToRedeem, setCoinsToRedeem] = useState(20);
  const [merchantName, setMerchantName] = useState('Authorized Local General Store');
  const [activeRedemption, setActiveRedemption] = useState(null);

  // Merchant Test Form State
  const [merchantOtpInput, setMerchantOtpInput] = useState('');
  const [merchantRedemptionIdInput, setMerchantRedemptionIdInput] = useState('');
  const [verificationResult, setVerificationResult] = useState('');

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await rewardAPI.getMyRewards();
      setBalance(res.rewardCoins || 0);
      setTransactions(res.transactions || []);
      setRedemptions(res.redemptions || []);
      if (user) {
        updateUser({ ...user, rewardCoins: res.rewardCoins });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [requestMsg, setRequestMsg] = useState('');

  const handleRequestRedemption = async (e) => {
    e.preventDefault();
    setRequestMsg('');
    try {
      const res = await rewardAPI.requestRedemption({
        coins: coinsToRedeem,
        merchantName
      });
      setActiveRedemption(res.redemption);
      setMerchantRedemptionIdInput(res.redemption.redemptionId);
      setMerchantOtpInput(res.redemption.otp);
      setRequestMsg(`✓ ${res.message}`);
      fetchRewards();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyMerchant = async (e) => {
    e.preventDefault();
    setVerificationResult('');
    try {
      const res = await rewardAPI.verifyRedemption({
        redemptionId: merchantRedemptionIdInput,
        otp: merchantOtpInput
      });
      setVerificationResult(`✓ ${res.message}`);
      setActiveRedemption(null);
      setRequestMsg('');
      fetchRewards();
    } catch (err) {
      setVerificationResult(`❌ ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="app-container" style={{ maxWidth: '900px' }}>
        {/* Reward Balance Card */}
        <div className="glass-card" style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <Award size={20} /> Citizen Civic Rewards Program
            </div>
            <h1 style={{ fontSize: '2.25rem', color: '#ffffff' }}>
              {balance} <span style={{ fontSize: '1.2rem', color: '#fbbf24' }}>Reward Coins</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Earn +20 coins for every genuine accepted civic problem report. Redeemable at authorized stores.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redemption Rule</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#ffffff' }}>
              1 Coin = ₹1 Value Credit
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Section 1: Request Redemption */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag color="#3b82f6" size={20} /> Redeem Coins at Local Store
            </h3>

            <form onSubmit={handleRequestRedemption}>
              <div className="form-group">
                <label className="form-label">Coins to Redeem</label>
                <input
                  type="number"
                  className="form-input"
                  min={10}
                  max={balance}
                  value={coinsToRedeem}
                  onChange={(e) => setCoinsToRedeem(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Participating Merchant Store</label>
                <select className="form-select" value={merchantName} onChange={(e) => setMerchantName(e.target.value)}>
                  <option value="Authorized Local General Store">Authorized Local General Store</option>
                  <option value="Gramin Fair Price Ration Shop">Gramin Fair Price Ration Shop</option>
                  <option value="Cooperative Farmers Outlet">Cooperative Farmers Outlet</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={balance < coinsToRedeem || coinsToRedeem <= 0}>
                Generate 6-Digit OTP Code
              </button>
            </form>

            {requestMsg && (
              <div style={{
                marginTop: '1rem', padding: '0.75rem 1rem',
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid #34d399',
                color: '#34d399',
                borderRadius: '8px', fontSize: '0.85rem'
              }}>
                {requestMsg}
              </div>
            )}

            {/* Generated Active OTP Box */}
            {activeRedemption && (
              <div style={{ marginTop: '1.25rem', background: 'rgba(59,130,246,0.15)', border: '1px dashed #3b82f6', padding: '1.25rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show this 6-digit OTP code to the merchant:</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '0.2em', color: '#60a5fa', margin: '0.5rem 0' }}>
                  {activeRedemption.otp}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Redemption ID: {activeRedemption.redemptionId} | Valid for 15 minutes | Sent to registered email inbox
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Merchant Verification Simulator */}
          <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key color="#10b981" size={20} /> Merchant Verification Portal
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Simulates merchant verifying citizen's 6-digit OTP code to deduct coins atomically.
            </p>

            {verificationResult && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.875rem' }}>
                {verificationResult}
              </div>
            )}

            <form onSubmit={handleVerifyMerchant}>
              <div className="form-group">
                <label className="form-label">Redemption ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RDM-123456-ABC"
                  value={merchantRedemptionIdInput}
                  onChange={(e) => setMerchantRedemptionIdInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">6-Digit OTP Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter 6-digit OTP"
                  value={merchantOtpInput}
                  onChange={(e) => setMerchantOtpInput(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
                Verify OTP & Complete Coin Redemption
              </button>
            </form>
          </div>
        </div>

        {/* Immutable Transaction History Ledger */}
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '1rem' }}>
            Immutable Reward Coins Ledger History
          </h3>

          {transactions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
              No transactions recorded in your ledger yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {transactions.map((t) => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {t.type === 'CREDIT' ? (
                      <div style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '0.4rem', borderRadius: '50%' }}>
                        <ArrowDownLeft size={18} />
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.4rem', borderRadius: '50%' }}>
                        <ArrowUpRight size={18} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '0.9rem' }}>{t.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(t.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: t.type === 'CREDIT' ? '#34d399' : '#f87171' }}>
                      {t.type === 'CREDIT' ? '+' : '-'}{t.amount} Coins
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Balance after: {t.balanceAfter}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
