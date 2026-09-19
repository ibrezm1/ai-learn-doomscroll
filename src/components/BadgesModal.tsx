import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, X, Lock, CheckCircle2, Sparkles } from 'lucide-react';

export const BadgesModal: React.FC = () => {
  const { isBadgesOpen, setIsBadgesOpen, badges } = useApp();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!isBadgesOpen) return null;

  const unlockedCount = badges.filter((b) => b.unlockedAt).length;

  const filteredBadges = badges.filter((b) => {
    if (filter === 'unlocked') return !!b.unlockedAt;
    if (filter === 'locked') return !b.unlockedAt;
    return true;
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '580px', maxHeight: '85vh' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Award className="text-amber-400" size={22} />
            <span>Achievement Badges & Trophy Shelf</span>
          </div>
          <button className="icon-btn" onClick={() => setIsBadgesOpen(false)} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Stats strip */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.15))',
            borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>
              COLLECTION PROGRESS
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {unlockedCount} of {badges.length} Badges Unlocked ({Math.round((unlockedCount / badges.length) * 100)}%)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['all', 'unlocked', 'locked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: filter === f ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                  color: filter === f ? 'white' : 'var(--text-secondary)'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {filteredBadges.map((badge) => {
              const isUnlocked = !!badge.unlockedAt;

              return (
                <div
                  key={badge.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: isUnlocked ? 'var(--bg-card)' : 'rgba(15, 20, 32, 0.5)',
                    border: `1.5px solid ${isUnlocked ? 'rgba(251, 191, 36, 0.35)' : 'var(--border-subtle)'}`,
                    boxShadow: isUnlocked ? '0 0 15px rgba(251, 191, 36, 0.1)' : 'none',
                    opacity: isUnlocked ? 1 : 0.6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isUnlocked ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      marginBottom: '0.5rem',
                      filter: isUnlocked ? 'none' : 'grayscale(100%)'
                    }}
                  >
                    {isUnlocked ? badge.icon : <Lock size={20} className="text-gray-500" />}
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {badge.title}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginBottom: '0.5rem' }}>
                    {badge.description}
                  </div>

                  <div style={{ marginTop: 'auto', fontSize: '0.68rem', fontWeight: 700, color: isUnlocked ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                    {isUnlocked ? `Unlocked on ${badge.unlockedAt}` : 'Locked'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setIsBadgesOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
