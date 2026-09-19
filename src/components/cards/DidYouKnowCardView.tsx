import React from 'react';
import { DidYouKnowCard } from '../../types';
import { useApp } from '../../context/AppContext';
import { Lightbulb, Sparkles, Flame, Share2, Bookmark } from 'lucide-react';

export const DidYouKnowCardView: React.FC<{ card: DidYouKnowCard }> = ({ card }) => {
  const { reactDidYouKnowCard, openDeepDiveModal } = useApp();

  return (
    <div className="feed-card-inner">
      {/* Meta Bar */}
      <div className="card-meta-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="card-type-badge did_you_know">
            <Lightbulb size={13} />
            <span>Did You Know?</span>
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {card.concept}
          </span>
        </div>

        <div className="card-actions-right">
          {/* AI Deep Dive Trigger */}
          <button
            className="ai-deepdive-btn"
            onClick={() => openDeepDiveModal(card)}
            title="Explore deeper with Perplexity, Meta, ChatGPT, or Gemini"
          >
            <Sparkles size={13} />
            <span>AI Deep Dive</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card-content-scrollable">
        <div className="did-you-know-card">
          <div className="dyk-icon-bubble">
            <span>💡</span>
          </div>

          <h2 className="dyk-headline">{card.headline}</h2>

          <p className="dyk-fact-text">
            {card.fact}
          </p>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px dashed rgba(6, 182, 212, 0.3)',
              marginBottom: '1.25rem',
              width: '100%',
              maxWidth: '460px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
              WHY THIS MATTERS:
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {card.contextOrImpact}
            </div>
          </div>

          {/* Reaction Button */}
          <div className="dyk-reaction-box">
            <button
              className={`reaction-btn ${card.userReacted ? 'reacted' : ''}`}
              onClick={() => reactDidYouKnowCard(card.id)}
              title="React Mind Blown (+10 XP)"
            >
              <span>🤯</span>
              <span>Mind Blown ({card.mindBlownCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="card-footer-bar">
        <span>Scroll to explore more</span>
        <span>⚡ Quick Insight</span>
      </div>
    </div>
  );
};
