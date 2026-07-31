import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Award, Sparkles, CheckCircle2, AlertTriangle, FileText, ArrowRight, HelpCircle } from 'lucide-react';
import { locationAPI } from '../services/api';

import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, role } = useAuth();
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    locationAPI.getDistricts()
      .then(res => setDistricts(res.districts || []))
      .catch(() => setDistricts(['Ranchi', 'Dhanbad', 'Hazaribagh']));
  }, []);

  return (
    <div className="page-wrapper">
      <div className="app-container">
        {/* Hero Section */}
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 40%, #e0f2fe 75%, #ecfdf5 100%)',
          border: '2px solid #93c5fd',
          boxShadow: '0 12px 32px rgba(2, 132, 199, 0.12)',
          borderRadius: '16px',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Tricolor Pill Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'linear-gradient(90deg, #ffedd5 0%, #ffffff 50%, #d1fae5 100%)',
            color: '#0f172a',
            border: '1px solid #fdba74',
            padding: '0.45rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.9rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.15)'
          }}>
            🇮🇳 Digital India | Swachh Panchayat Civic Portal
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: '900', lineHeight: 1.25, marginBottom: '1.25rem', color: '#002b49' }}>
            Panchayat & Municipality <br />
            <span style={{
              background: 'linear-gradient(90deg, #ea580c 0%, #004071 50%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Civic Issue Management System
            </span>
          </h1>

          <p style={{ maxWidth: '740px', margin: '0 auto 2.5rem auto', color: '#334155', fontSize: '1.1rem', lineHeight: '1.65', fontWeight: '500' }}>
            Report public problems such as <span style={{ color: '#ea580c', fontWeight: '700' }}>damaged electric poles</span>, <span style={{ color: '#0284c7', fontWeight: '700' }}>broken roads</span>, <span style={{ color: '#dc2626', fontWeight: '700' }}>open manholes</span>, garbage accumulation, or tube well failures directly to local field authorities.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link to="/complaint/new" className="btn" style={{
              background: 'linear-gradient(135deg, #004071 0%, #0284c7 100%)',
              color: '#ffffff',
              padding: '0.9rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
            }}>
              Report a Civic Issue <ArrowRight size={20} />
            </Link>
            {isAuthenticated && role === 'CITIZEN' && (
              <Link to="/citizen/dashboard" className="btn" style={{
                background: '#ffffff',
                color: '#004071',
                border: '2px solid #004071',
                padding: '0.9rem 2rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <FileText size={18} /> View My Active Complaints
              </Link>
            )}
          </div>
        </div>

        {/* 3 Core Workflow Cards */}
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center', color: '#004071', fontWeight: '800' }}>
          How GramSeva Works
        </h2>

        <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
          <div className="glass-card">
            <div style={{ background: '#e0f2fe', color: '#0284c7', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: '700' }}>1. Report & Upload</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>
              Select your District → Block → Panchayat/Municipality → Village, describe the problem, and upload a photo.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ background: '#d1fae5', color: '#059669', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: '700' }}>2. Instant Authority Routing</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>
              Complaints are automatically routed directly to assigned Panchayat & Municipality field staff inspectors for immediate action.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ background: '#fef3c7', color: '#d97706', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: '700' }}>3. Verification & Rewards</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>
              Panchayat staff verifies the issue, sanctions work, and completes it. Citizens earn +20 reward coins for genuine reports, redeemable at merchants.
            </p>
          </div>
        </div>

        {/* Partner Merchant Stores & Utility Centers Showcase */}
        <div style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center', color: '#004071', fontWeight: '800' }}>
            🏪 GramSeva Partner Merchant Stores & Utility Centers
          </h2>
          <p style={{ textAlign: 'center', color: '#475569', maxWidth: '680px', margin: '0 auto 1.75rem auto', fontSize: '0.95rem' }}>
            Citizens can redeem earned reward coins (in multiples of 100) for instant bill discounts at these official Panchayat partner store IDs:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ borderLeft: '4px solid #ea580c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🌾</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#ffedd5', color: '#c2410c', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  SHOP-RATION-101
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '800', marginBottom: '0.25rem' }}>
                GramSeva Fair Price Ration Shop
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: '700', marginBottom: '0.5rem' }}>
                Ration Store & Essential Commodities
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, fontWeight: '600' }}>
                You can avail discount in these shops and firms.
              </p>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem' }}>⚡</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  SHOP-ELEC-202
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '800', marginBottom: '0.25rem' }}>
                Electricity Bill Payment Counter
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', marginBottom: '0.5rem' }}>
                Electricity Bill Discount
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, fontWeight: '600' }}>
                You can avail discount in these shops and firms.
              </p>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem' }}>💧</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#d1fae5', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  SHOP-WATER-303
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '800', marginBottom: '0.25rem' }}>
                Panchayat Drinking Water Board
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700', marginBottom: '0.5rem' }}>
                Water Supply & Sanitation Bill
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, fontWeight: '600' }}>
                You can avail discount in these shops and firms.
              </p>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🔥</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  SHOP-GAS-404
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '800', marginBottom: '0.25rem' }}>
                PM Ujjwala Gas Agency Outlet
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: '700', marginBottom: '0.5rem' }}>
                Cooking Gas Cylinder Booking
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, fontWeight: '600' }}>
                You can avail discount in these shops and firms.
              </p>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #7c3aed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🌱</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#f3e8ff', color: '#6b21a8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  SHOP-AGRI-505
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '800', marginBottom: '0.25rem' }}>
                Fertilizer & Seed Co-operative Store
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '700', marginBottom: '0.5rem' }}>
                Agricultural Seeds & Fertilizer
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, fontWeight: '600' }}>
                You can avail discount in these shops and firms.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Jurisdictions & Categories */}
        <div className="grid-2" style={{ marginBottom: '3.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', color: '#004071', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <Building2 color="#0284c7" /> Active Local Jurisdictions
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Integrated with Panchayat & Municipality authorities across districts:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {districts.map((d, i) => (
                <span key={i} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                  📍 {d} District
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', color: '#004071', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <AlertTriangle color="#d97706" /> Reportable Issue Categories
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#334155' }}>
              <li>⚡ Damaged Electric Pole / Exposed Wires (Critical Priority)</li>
              <li>🕳️ Open Manholes & Dangerous Drain Openings (High Priority)</li>
              <li>🛣️ Damaged Roads & Potholes (High Priority)</li>
              <li>🗑️ Garbage Accumulation & Illegal Waste Dumps</li>
              <li>🚰 Non-functional Public Tube Wells & Water Leakages</li>
              <li>💡 Broken Streetlights & Electrical Safety</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', color: '#004071', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
            <HelpCircle color="#059669" /> Frequently Asked Questions (FAQ)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Q: How are complaints routed to the right authority?</div>
              <div style={{ color: '#475569', fontSize: '0.875rem' }}>
                When you select your District, Block, and Panchayat/Municipality, the system automatically resolves the jurisdiction code and places your report directly into that local authority staff queue.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Q: How do Reward Coins work?</div>
              <div style={{ color: '#475569', fontSize: '0.875rem' }}>
                When local staff completes the complaint as a genuine eligible report, you are credited 20 reward coins. Once accumulated, you can generate a short-lived 6-digit OTP to redeem your coins at participating stores.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
