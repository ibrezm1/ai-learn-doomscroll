import React, { useState } from 'react';
import { QuestionCard } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ShieldAlert,
  Info
} from 'lucide-react';

export const QuestionCardView: React.FC<{ card: QuestionCard }> = ({ card }) => {
  const { answerQuestionCard, openDeepDiveModal, activeDifficulty } = useApp();
  const [showGuidingAnswer, setShowGuidingAnswer] = useState(true);

  const hasAnswered = typeof card.selectedOptionIndex === 'number';

  const handleSelect = (idx: number) => {
    if (!hasAnswered) {
      answerQuestionCard(card.id, idx);
      setShowGuidingAnswer(true);
    }
  };

  return (
    <div className="feed-card-inner">
      {/* Meta Bar */}
      <div className="card-meta-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="card-type-badge question">
            <HelpCircle size={13} />
            <span>Quiz Question</span>
          </span>
          <span className={`difficulty-pill ${card.difficulty || activeDifficulty}`}>
            {card.difficulty || activeDifficulty}
          </span>
        </div>

        <div className="card-actions-right">
          {/* AI Deep Dive Button with Glow & Sparkles */}
          <button
            className="ai-deepdive-btn"
            onClick={() => openDeepDiveModal(card)}
            title="Deep Dive with Perplexity, Meta, ChatGPT, or Gemini"
          >
            <Sparkles size={13} />
            <span>AI Deep Dive</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card-content-scrollable">
        <div className="question-prompt">{card.question}</div>

        {/* Options */}
        <div className="options-container">
          {card.options.map((option, idx) => {
            const isSelected = card.selectedOptionIndex === idx;
            const isCorrect = card.correctIndex === idx;

            let optionClass = 'option-btn';
            if (hasAnswered) {
              if (isCorrect) optionClass += ' correct';
              else if (isSelected) optionClass += ' incorrect';
            } else if (isSelected) {
              optionClass += ' selected';
            }

            return (
              <button
                key={idx}
                className={optionClass}
                onClick={() => handleSelect(idx)}
                disabled={hasAnswered}
              >
                <span className="option-prefix">
                  {hasAnswered && isCorrect ? (
                    <CheckCircle2 size={16} />
                  ) : hasAnswered && isSelected && !isCorrect ? (
                    <XCircle size={16} />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Guiding Answer Drawer (Unfolds upon answering) */}
        {hasAnswered && (
          <div className="guiding-answer-box">
            <div
              className="guiding-answer-title"
              onClick={() => setShowGuidingAnswer(!showGuidingAnswer)}
              style={{ cursor: 'pointer', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lightbulb size={16} />
                <span>Guiding Answer & Explanation</span>
              </span>
              {showGuidingAnswer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {showGuidingAnswer && (
              <div style={{ marginTop: '0.5rem', animation: 'fade-in 0.2s ease' }}>
                <p className="guiding-principle">
                  <strong>Core Principle:</strong> {card.guidingAnswer.corePrinciple}
                </p>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--accent-emerald)' }}>Why it's right:</strong>{' '}
                  {card.guidingAnswer.whyCorrect}
                </p>

                {card.guidingAnswer.whyWrongBreakdown && card.guidingAnswer.whyWrongBreakdown.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      Why other options fail:
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {card.guidingAnswer.whyWrongBreakdown.map((item, wIdx) => (
                        <li key={wIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="guiding-takeaway">
                  <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
                  <span>
                    <strong>Pro Takeaway:</strong> {card.guidingAnswer.keyTakeaway}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Footer info */}
        <div className="card-footer-bar">
          <span>Concept: {card.concept}</span>
          <span>{hasAnswered ? 'Swipe or press ↓ to continue' : 'Select an answer'}</span>
        </div>
    </div>
  );
};
