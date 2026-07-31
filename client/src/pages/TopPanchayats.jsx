import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationAPI } from '../services/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function TopPanchayats() {
  const navigate = useNavigate();
  const [topPanchayats, setTopPanchayats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTopPanchayats();
  }, []);

  const fetchTopPanchayats = async () => {
    setLoading(true);
    try {
      const res = await locationAPI.getTopPanchayats();
      setTopPanchayats(res.topPanchayats || []);
    } catch (err) {
      console.error('Failed to fetch top panchayats leaderboard:', err);
      setError('Unable to load top performing panchayats list.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="app-container" style={{ maxWidth: '960px' }}>
        <button
          onClick={() => navigate('/')}
          className="btn"
          style={{
            marginBottom: '1.25rem',
            background: '#ffffff',
            color: '#004071',
            border: '1px solid #cbd5e1',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Main Portal
        </button>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '2rem' }}>
          {/* Header Title */}
          <div style={{ borderBottom: '2px solid #004071', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', color: '#004071', fontWeight: '800', margin: 0 }}>
              Top 10 Performing Panchayats
            </h1>
            <p style={{ color: '#475569', fontSize: '0.925rem', marginTop: '0.35rem', fontWeight: '500' }}>
              Public performance leaderboard of Panchayats ranked by total completed civic issue resolutions.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#475569', fontWeight: '600' }}>
              Loading top performing panchayats data...
            </div>
          ) : error ? (
            <div style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '6px', textAlign: 'center', fontWeight: '600' }}>
              {error}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', color: '#004071', fontWeight: '800' }}>Rank</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#004071', fontWeight: '800' }}>Panchayat Name</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#004071', fontWeight: '800' }}>Block</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#004071', fontWeight: '800' }}>District</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#004071', fontWeight: '800', textAlign: 'center' }}>Total Grievances</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#004071', fontWeight: '800', textAlign: 'center' }}>Completed Complaints</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#004071', fontWeight: '800', textAlign: 'right' }}>Resolution Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPanchayats.map((p) => (
                    <tr key={p.rank} style={{ borderBottom: '1px solid #e2e8f0', background: p.rank % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#004071' }}>
                        #{p.rank}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0f172a' }}>
                        {p.panchayat}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '500' }}>
                        {p.block}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '500' }}>
                        {p.district}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: '700', color: '#334155' }}>
                        {p.totalComplaints}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: '800', color: '#059669' }}>
                        {p.completedCount}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>
                        {p.resolutionRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
