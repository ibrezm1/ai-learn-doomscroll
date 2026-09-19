import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, ArrowRight, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

export const StepCelebrationModal: React.FC = () => {
  const {
    isCelebrationOpen,
    setIsCelebrationOpen,
    celebrationStep,
    learningPlan,
    advanceToStep,
    isLoadingFeed
  } = useApp();

  if (!isCelebrationOpen || !celebrationStep || !learningPlan) return null;

  const currentStepIdx = learningPlan.steps.findIndex((s) => s.id === celebrationStep.id);
  const hasNextStep = currentStepIdx !== -1 && currentStepIdx < learningPlan.steps.length - 1;
  const nextStep = hasNextStep ? learningPlan.steps[currentStepIdx + 1] : null;

  const handleContinueNext = async () => {
    setIsCelebrationOpen(false);
    if (hasNextStep) {
      await advanceToStep(currentStepIdx + 1);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div className="modal-body" style={{ padding: '2rem 1.5rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.25))',
              border: '2px solid var(--accent-emerald)',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              margin: '0 auto 1.25rem'
            }}
          >
            🏆
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent-emerald)',
              display: 'block',
              marginBottom: '0.35rem'
            }}
          >
            COMPETENCE VERIFIED
          </span>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            Milestone Mastered!
          </h2>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            You demonstrated full competence on <strong>"{celebrationStep.title}"</strong>.
          </p>

          {/* Stats Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {celebrationStep.masteryScore || 90}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Accuracy Score</div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                +150 XP
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bonus Reward</div>
            </div>
          </div>

          {hasNextStep ? (
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--border-glow)',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>
                UP NEXT:
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {nextStep?.title}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '1.5rem' }}>
              🎉 Incredible achievement! You completed all steps in this learning plan!
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => setIsCelebrationOpen(false)}>
              Stay on Step
            </button>
            {hasNextStep && (
              <button className="btn-primary" onClick={handleContinueNext} disabled={isLoadingFeed}>
                <span>Doomscroll Next Step</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
