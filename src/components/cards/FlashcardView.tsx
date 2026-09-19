import React from 'react';
import { FlashCard } from '../../types';
import { useApp } from '../../context/AppContext';
import { Layers, Rotate3d, CheckCircle, RefreshCw, Sparkles, BookOpen, Lightbulb } from 'lucide-react';

export const FlashcardView: React.FC<{ card: FlashCard }> = ({ card }) => {
  const { flipFlashcardCard, rateFlashcardCard, openDeepDiveModal } = useApp();

  const isFlipped = !!card.isFlipped;

  return (
    <div className="feed-card-inner">
      {/* Meta Bar */}
      <div className="card-meta-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="card-type-badge flashcard">
            <Layers size={13} />
            <span>3D Flashcard</span>
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {card.front.categoryBadge || 'Key Concept'}
          </span>
        </div>

        <div className="card-actions-right">
          {/* AI Deep Dive Trigger */}
          <button
            className="ai-deepdive-btn"
            onClick={(e) => {
              e.stopPropagation();
              openDeepDiveModal(card);
            }}
            title="Deep Dive with Perplexity, Meta, ChatGPT, or Gemini"
          >
            <Sparkles size={13} />
            <span>AI Deep Dive</span>
          </button>
        </div>
      </div>

      {/* Main 3D Flashcard Container */}
      <div className="card-content-scrollable" style={{ padding: '0.5rem 1rem' }}>
        <div className="flashcard-3d-scene" onClick={() => flipFlashcardCard(card.id)}>
          <div className={`flashcard-3d-card ${isFlipped ? 'flipped' : ''}`}>
            {/* FRONT FACE */}
            <div className="flashcard-face flashcard-front">
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-secondary)',
                  marginBottom: '0.5rem'
                }}
              >
                {card.front.categoryBadge || 'Core Principle'}
              </div>

              <h2 className="flashcard-term">{card.front.term}</h2>

              {card.front.subtext && (
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                  {card.front.subtext}
                </p>
              )}

              <div className="flip-hint-pill">
                <Rotate3d size={14} />
                <span>Tap card to flip for breakdown</span>
              </div>
            </div>

            {/* BACK FACE */}
            <div className="flashcard-face flashcard-back">
              <div style={{ width: '100%', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--accent-secondary)'
                  }}
                >
                  Deep Breakdown
                </span>
                <h3 className="flashcard-back-title">{card.front.term}</h3>
              </div>

              <p className="flashcard-definition">
                <strong>Definition:</strong> {card.back.definition}
              </p>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                {card.back.deepExplanation}
              </p>

              {card.back.exampleOrAnalogy && (
                <div className="flashcard-example-box">
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Lightbulb size={13} style={{ color: 'var(--accent-secondary)' }} />
                    <span>Real-World Analogy:</span>
                  </div>
                  {card.back.exampleOrAnalogy}
                </div>
              )}

              {card.back.formulaOrRule && (
                <div style={{ fontSize: '0.8rem', color: '#c084fc', marginBottom: '0.6rem', fontWeight: 600 }}>
                  ⚡ {card.back.formulaOrRule}
                </div>
              )}

              {/* Rating Actions */}
              <div
                className="flashcard-actions-bar"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`rating-btn practice ${card.userRating === 'need_practice' ? 'active' : ''}`}
                  onClick={() => rateFlashcardCard(card.id, 'need_practice')}
                >
                  <RefreshCw size={13} />
                  <span>Review Later</span>
                </button>
                <button
                  className={`rating-btn mastered ${card.userRating === 'mastered' ? 'active' : ''}`}
                  onClick={() => rateFlashcardCard(card.id, 'mastered')}
                >
                  <CheckCircle size={13} />
                  <span>Got it (+15 XP)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="card-footer-bar">
        <span>Concept: {card.concept}</span>
        <span>{isFlipped ? 'Tap to flip back' : 'Tap to reveal answer'}</span>
      </div>
    </div>
  );
};
