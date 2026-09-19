import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, BookOpen, Layers, Cpu, Code2, Globe2, BrainCircuit } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Quantum Computing 101', icon: BrainCircuit },
  { label: 'System Design Architecture', icon: Layers },
  { label: 'Neural Networks & Transformers', icon: Cpu },
  { label: 'Rust Memory & Concurrency', icon: Code2 },
  { label: 'Conversational Spanish', icon: Globe2 },
  { label: 'Macroeconomics & Inflation', icon: BookOpen }
];

export const TopicInputHero: React.FC = () => {
  const { startTopicLearning, isLoadingFeed } = useApp();
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoadingFeed) {
      startTopicLearning(topic.trim(), goal.trim() || undefined);
    }
  };

  const handleSelectSuggestion = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
    startTopicLearning(suggestedTopic);
  };

  return (
    <div className="hero-screen-container">
      <div className="hero-glow-pill">
        <Sparkles size={14} className="text-indigo-400" />
        <span>Adaptive AI Doomscrolling</span>
      </div>

      <h1 className="hero-title">
        Master Any Subject Through{' '}
        <span className="hero-gradient-text">Infinite Doomscrolling</span>
      </h1>

      <p className="hero-subtitle">
        Enter what you want to learn. Our multi-model AI gauges your know-how, designs a custom roadmap, and feeds you bite-sized interactive cards.
      </p>

      <div className="topic-input-card">
        <form onSubmit={handleSubmit}>
          <div className="topic-input-wrapper">
            <input
              type="text"
              className="topic-text-input"
              placeholder="What do you want to learn today? (e.g., Quantum Computing, Rust, Philosophy)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoadingFeed}
              autoFocus
            />
            <button
              type="submit"
              className="topic-submit-btn"
              disabled={!topic.trim() || isLoadingFeed}
              title="Start Diagnostic Assessment"
            >
              <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Optional: Target goal (e.g. for interview, exam, or practical coding)"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem',
                fontSize: '0.82rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)'
              }}
            />
          </div>
        </form>

        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            POPULAR STARTING POINTS
          </div>
          <div className="suggestions-container">
            {SUGGESTIONS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={idx}
                  className="suggestion-pill"
                  onClick={() => handleSelectSuggestion(s.label)}
                  disabled={isLoadingFeed}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icon size={13} style={{ color: 'var(--accent-primary)' }} />
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
