import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DeepDiveTarget, DeepDiveResponse } from '../types';
import { aiService } from '../services/aiService';
import {
  Sparkles,
  X,
  Search,
  Bot,
  Cpu,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Play,
  Lightbulb,
  HelpCircle,
  BookOpen
} from 'lucide-react';

const ENGINES: { id: DeepDiveTarget; name: string; icon: any; desc: string; badge: string }[] = [
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    icon: Search,
    desc: 'Live web search with real-time sources & academic citations',
    badge: 'Web Citations'
  },
  {
    id: 'meta',
    name: 'Meta Llama 3',
    icon: Bot,
    desc: 'Deep open-weights reasoning via OpenRouter',
    badge: 'Open Weights'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT (OpenAI)',
    icon: Cpu,
    desc: 'GPT-4o comprehensive explanations and step-by-step breakdown',
    badge: 'GPT-4o'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: Sparkles,
    desc: 'Multimodal knowledge synthesis and instant recall',
    badge: 'Fast & Deep'
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    icon: Globe,
    desc: 'Your custom local Ollama / LMStudio / Groq endpoint',
    badge: 'Self-Hosted'
  }
];

export const AIDeepDiveModal: React.FC = () => {
  const {
    isDeepDiveOpen,
    closeDeepDiveModal,
    selectedDeepDiveCard,
    learningPlan,
    config
  } = useApp();

  const [selectedEngine, setSelectedEngine] = useState<DeepDiveTarget>('perplexity');
  const [craftedPrompt, setCraftedPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<DeepDiveResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Craft prompt whenever modal opens with a card
  useEffect(() => {
    if (selectedDeepDiveCard && learningPlan) {
      const activeStep = learningPlan.steps[learningPlan.activeStepIndex];
      const prompt = aiService.craftDeepDivePrompt(
        selectedDeepDiveCard,
        activeStep?.title || 'Core Module',
        learningPlan.topic,
        selectedEngine
      );
      setCraftedPrompt(prompt);
      setResult(null);
    }
  }, [selectedDeepDiveCard, learningPlan, selectedEngine]);

  if (!isDeepDiveOpen || !selectedDeepDiveCard) return null;

  const handleExecute = async () => {
    if (!craftedPrompt.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await aiService.executeDeepDive(
        craftedPrompt,
        selectedEngine,
        selectedDeepDiveCard.concept,
        config
      );
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(craftedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = (service: 'perplexity' | 'chatgpt' | 'meta') => {
    const encoded = encodeURIComponent(craftedPrompt);
    let url = '';
    if (service === 'perplexity') url = `https://www.perplexity.ai/search?q=${encoded}`;
    else if (service === 'chatgpt') url = `https://chatgpt.com/?q=${encoded}`;
    else if (service === 'meta') url = `https://www.meta.ai/?q=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '680px', height: '90vh' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles className="text-purple-400" size={22} />
            <span>AI Deep Dive & Prompt Crafter</span>
          </div>
          <button className="icon-btn" onClick={closeDeepDiveModal} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Target Concept Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.15))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#c084fc' }}>
                EXPLORING CONCEPT
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedDeepDiveCard.concept}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', background: 'rgba(255, 255, 255, 0.1)' }}>
              {selectedDeepDiveCard.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Engine Selector */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              SELECT TARGET AI ENGINE:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
              {ENGINES.map((engine) => {
                const isSelected = selectedEngine === engine.id;
                const Icon = engine.icon;
                return (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine.id)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-card)',
                      border: `1.5px solid ${isSelected ? 'var(--accent-secondary)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={18} style={{ color: isSelected ? 'var(--accent-secondary)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {engine.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>{engine.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crafted Prompt Box */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                AUTO-CRAFTED CONTEXTUAL PROMPT:
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={handleCopyPrompt}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={craftedPrompt}
              onChange={(e) => setCraftedPrompt(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.84rem',
                lineHeight: 1.4,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className="btn-secondary"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => handleOpenExternal('perplexity')}
                title="Launch this prompt in Perplexity.ai"
              >
                <ExternalLink size={12} />
                <span>Perplexity</span>
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => handleOpenExternal('chatgpt')}
                title="Launch this prompt in ChatGPT"
              >
                <ExternalLink size={12} />
                <span>ChatGPT</span>
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => handleOpenExternal('meta')}
                title="Launch this prompt in Meta AI"
              >
                <ExternalLink size={12} />
                <span>Meta AI</span>
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={handleExecute}
              disabled={isExecuting || !craftedPrompt.trim()}
              style={{ padding: '0.5rem 1.25rem' }}
            >
              {isExecuting ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Calling {selectedEngine}...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Execute Deep Dive</span>
                </>
              )}
            </button>
          </div>

          {/* Rendered Deep Dive Result */}
          {result && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(10, 14, 26, 0.95)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                boxShadow: 'var(--shadow-md)',
                animation: 'fade-in 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                  DEEP DIVE REPORT ({result.model})
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '1rem'
                }}
              >
                {result.explanation}
              </div>

              {result.realWorldAnalogy && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderLeft: '3px solid var(--accent-primary)',
                    marginBottom: '0.85rem',
                    fontSize: '0.84rem'
                  }}
                >
                  <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    💡 Mental Model & Analogy:
                  </strong>
                  {result.realWorldAnalogy}
                </div>
              )}

              {result.keyInsights && result.keyInsights.length > 0 && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    KEY INSIGHTS:
                  </span>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {result.keyInsights.map((insight, idx) => (
                      <li key={idx} style={{ marginBottom: '0.2rem' }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.followUpQuestions && result.followUpQuestions.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    NEXT QUESTIONS TO EXPLORE:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
                    {result.followUpQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCraftedPrompt(q)}
                        style={{
                          textAlign: 'left',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        → {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={closeDeepDiveModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
