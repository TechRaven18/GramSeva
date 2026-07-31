import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, UserCheck, Award } from 'lucide-react';

export default function StatusTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No status history recorded yet.</div>;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '1.5rem', marginTop: '1rem' }}>
      <div style={{
        position: 'absolute',
        left: '7px',
        top: '10px',
        bottom: '10px',
        width: '2px',
        background: 'var(--border-glass)'
      }} />

      {history.map((step, idx) => (
        <div key={idx} style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <div style={{
            position: 'absolute',
            left: '-1.5rem',
            top: '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: step.toStatus === 'COMPLETED' ? '#10b981' : step.toStatus === 'ACCEPTED' ? '#3b82f6' : step.toStatus === 'REJECTED' ? '#ef4444' : '#f59e0b',
            border: '3px solid var(--bg-main)',
            boxShadow: '0 0 8px rgba(0,0,0,0.5)'
          }} />

          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.75rem 1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className={`badge status-${step.toStatus.toLowerCase()}`}>{step.toStatus}</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>from {step.fromStatus}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                {new Date(step.timestamp).toLocaleString()}
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#0f172a', marginTop: '0.25rem', fontWeight: '600' }}>
              {step.message}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
              <UserCheck size={14} /> By {step.actorName} ({step.actorRole})
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
