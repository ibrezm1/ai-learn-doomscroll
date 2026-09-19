import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Brain, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export const DiagnosticModal: React.FC = () => {
  const {
    diagnosticQuestions,
    isDiagnosticOpen,
    pendingTopic,
    submitDiagnosticQuiz,
    isLoadingFeed
  } = useApp();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  if (!isDiagnosticOpen || diagnosticQuestions.length === 0) return null;

  const currentQ = diagnosticQuestions[currentIdx];
  const isLastQuestion = currentIdx === diagnosticQuestions.length - 1;
  const hasSelectedCurrent = typeof selectedAnswers[currentQ.id] === 'number';

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optIndex
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const formattedAnswers = Object.entries(selectedAnswers).map(([qId, idx]) => ({
        questionId: qId,
        selectedIndex: idx
      }));
      submitDiagnosticQuiz(formattedAnswers);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Brain className="text-indigo-400" size={22} />
            <span>Gauging Your Know-How</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Question {currentIdx + 1} of {diagnosticQuestions.length}
          </span>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              Topic: {pendingTopic}
            </span>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', lineHeight: 1.4 }}>
            {currentQ.question}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  className={`option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(optIdx)}
                  style={{
                    borderColor: isSelected ? 'var(--accent-primary)' : undefined,
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : undefined
                  }}
                >
                  <span className="option-prefix">{String.fromCharCode(65 + optIdx)}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-primary"
            disabled={!hasSelectedCurrent || isLoadingFeed}
            onClick={handleNext}
          >
            {isLastQuestion ? (
              <>
                <CheckCircle2 size={16} />
                <span>Generate Adaptive Plan</span>
              </>
            ) : (
              <>
                <span>Next Question</span>
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
