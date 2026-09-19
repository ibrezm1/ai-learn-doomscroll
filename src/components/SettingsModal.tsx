import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  X,
  Key,
  Globe,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  Search,
  Cpu,
  Bot
} from 'lucide-react';
import { OPENROUTER_FREE_MODELS, OPENROUTER_SEARCH_MODELS, aiService } from '../services/aiService';
import { AIProvider } from '../types';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, config, setConfig } = useApp();

  const [testStatus, setTestStatus] = useState<{
    running: boolean;
    provider?: AIProvider;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ running: false });

  if (!isSettingsOpen) return null;

  const handleTestConnection = async (targetProvider: AIProvider) => {
    setTestStatus({ running: true, provider: targetProvider });
    try {
      const res = await aiService.testConnectivity(config, targetProvider);
      setTestStatus({
        running: false,
        provider: targetProvider,
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs
      });
    } catch (err: any) {
      setTestStatus({
        running: false,
        provider: targetProvider,
        success: false,
        message: err.message || 'Test failed'
      });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '640px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings className="text-indigo-400" size={22} />
            <span>AI Configuration & Batch Settings</span>
          </div>
          <button className="icon-btn" onClick={() => setIsSettingsOpen(false)} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Provider Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              ACTIVE AI PROVIDER
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
              {(
                [
                  { id: 'openrouter', label: 'OpenRouter', badge: 'Free & Web' },
                  { id: 'gemini', label: 'Gemini', badge: 'Fast & Pro' },
                  { id: 'openai', label: 'OpenAI', badge: 'GPT-4o' },
                  { id: 'custom', label: 'Custom AI', badge: 'Self-Hosted' },
                  { id: 'demo', label: 'Demo Mode', badge: 'Instant Offline' }
                ] as const
              ).map((p) => {
                const isSelected = config.activeProvider === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setConfig({ ...config, activeProvider: p.id })}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-card)',
                      border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem'
                    }}
                  >
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {p.label}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Status Banner */}
          {testStatus.provider && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: testStatus.running
                  ? 'rgba(245, 158, 11, 0.1)'
                  : testStatus.success
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(244, 63, 94, 0.12)',
                border: `1px solid ${
                  testStatus.running
                    ? 'rgba(245, 158, 11, 0.3)'
                    : testStatus.success
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(244, 63, 94, 0.3)'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.84rem'
              }}
            >
              {testStatus.running ? (
                <Sparkles size={16} className="animate-spin text-amber-400" />
              ) : testStatus.success ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="text-rose-400" />
              )}
              <div style={{ flex: 1 }}>
                <strong>{testStatus.running ? `Testing ${testStatus.provider}...` : testStatus.success ? 'Success:' : 'Failed:'}</strong>{' '}
                {testStatus.message}
              </div>
            </div>
          )}

          {/* Provider Specific Settings */}
          {config.activeProvider === 'openrouter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={config.openRouterApiKey}
                  onChange={(e) => setConfig({ ...config, openRouterApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Free Models Selector */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Select Free Model Preset
                </label>
                <select
                  value={config.openRouterModel}
                  onChange={(e) => setConfig({ ...config, openRouterModel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <optgroup label="Popular Free Models">
                    {OPENROUTER_FREE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Search & Web Models">
                    {OPENROUTER_SEARCH_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Web Search Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Enable Web Search Plugin
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Injects live web references and search citations into generated cards.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.openRouterWebSearch}
                  onChange={(e) => setConfig({ ...config, openRouterWebSearch: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <button
                className="btn-secondary"
                onClick={() => handleTestConnection('openrouter')}
                disabled={testStatus.running}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
              >
                <Play size={12} />
                <span>Test OpenRouter Connectivity</span>
              </button>
            </div>
          )}

          {config.activeProvider === 'gemini' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={config.geminiApiKey}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Gemini Model
                </label>
                <select
                  value={config.geminiModel}
                  onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem'
                  }}
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Super Fast)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>

              <button
                className="btn-secondary"
                onClick={() => handleTestConnection('gemini')}
                disabled={testStatus.running}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
              >
                <Play size={12} />
                <span>Test Gemini Connectivity</span>
              </button>
            </div>
          )}

          {config.activeProvider === 'openai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={config.openaiApiKey}
                  onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Model
                </label>
                <select
                  value={config.openaiModel}
                  onChange={(e) => setConfig({ ...config, openaiModel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem'
                  }}
                >
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>

              <button
                className="btn-secondary"
                onClick={() => handleTestConnection('openai')}
                disabled={testStatus.running}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
              >
                <Play size={12} />
                <span>Test OpenAI Connectivity</span>
              </button>
            </div>
          )}

          {config.activeProvider === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Base URL (OpenAI-compatible)
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434/v1"
                  value={config.customBaseUrl}
                  onChange={(e) => setConfig({ ...config, customBaseUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Custom Model Name
                </label>
                <input
                  type="text"
                  placeholder="llama3, mistral, custom-model"
                  value={config.customModel}
                  onChange={(e) => setConfig({ ...config, customModel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <button
                className="btn-secondary"
                onClick={() => handleTestConnection('custom')}
                disabled={testStatus.running}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
              >
                <Play size={12} />
                <span>Test Custom AI Connectivity</span>
              </button>
            </div>
          )}

          {/* Batch Size Configuration */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
              BATCH CARDS GENERATION COUNTS
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span>Questions per batch:</span>
                  <strong>{config.batchQuestionsCount}</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={config.batchQuestionsCount}
                  onChange={(e) => setConfig({ ...config, batchQuestionsCount: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span>3D Flashcards per batch:</span>
                  <strong>{config.batchFlashcardsCount}</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={config.batchFlashcardsCount}
                  onChange={(e) => setConfig({ ...config, batchFlashcardsCount: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span>"Did You Know?" Cards per batch:</span>
                  <strong>{config.batchDidYouKnowCount}</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={config.batchDidYouKnowCount}
                  onChange={(e) => setConfig({ ...config, batchDidYouKnowCount: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={() => setIsSettingsOpen(false)}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
