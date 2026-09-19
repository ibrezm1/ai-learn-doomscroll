import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { loggerService } from '../services/loggerService';
import { APILogEntry } from '../types';

export const APILogPanel: React.FC = () => {
  const { isAPILogOpen, setIsAPILogOpen, apiLogs } = useApp();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');

  if (!isAPILogOpen) return null;

  const filteredLogs = apiLogs.filter((log) => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const handleClear = () => {
    loggerService.clearLogs();
    setSelectedLogId(null);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '720px', height: '85vh' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Activity className="text-emerald-400" size={22} />
            <span>Real-Time AI API Activity & Logs</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn-secondary"
              onClick={handleClear}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
              title="Clear log history"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
            <button className="icon-btn" onClick={() => setIsAPILogOpen(false)} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            padding: '0.6rem 1.5rem',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          {(['all', 'success', 'pending', 'error'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: filter === f ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {f} ({apiLogs.filter((l) => (f === 'all' ? true : l.status === f)).length})
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="modal-body" style={{ padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Activity size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No API activity recorded yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Calls to OpenRouter, Gemini, OpenAI, and Deep Dives will be tracked here in real-time.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = selectedLogId === log.id;
              const isSuccess = log.status === 'success';
              const isError = log.status === 'error';
              const isPending = log.status === 'pending';

              return (
                <div
                  key={log.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: `1px solid ${
                      isError
                        ? 'rgba(244, 63, 94, 0.35)'
                        : isSuccess
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'var(--border-subtle)'
                    }`,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    onClick={() => setSelectedLogId(isExpanded ? null : log.id)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {isSuccess ? (
                        <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
                      ) : isError ? (
                        <XCircle size={16} style={{ color: 'var(--accent-rose)' }} />
                      ) : (
                        <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--accent-amber)' }} />
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                            {log.action.replace('_', ' ')}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--accent-primary)',
                              fontWeight: 600
                            }}
                          >
                            {log.provider} • {log.model}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {log.timestamp} • {log.requestSnippet}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {typeof log.latencyMs === 'number' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {log.latencyMs}ms
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded Inspector */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {log.errorMessage && (
                        <div style={{ color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
                          <strong>Error:</strong> {log.errorMessage}
                        </div>
                      )}

                      {log.responseSnippet && (
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Response Snippet:</strong>{' '}
                          {log.responseSnippet}
                        </div>
                      )}

                      {log.fullPayload && (
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Full Payload & Metadata:</strong>
                          <pre
                            style={{
                              marginTop: '0.35rem',
                              padding: '0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(0, 0, 0, 0.5)',
                              maxHeight: '180px',
                              overflowY: 'auto',
                              color: '#a5b4fc'
                            }}
                          >
                            {JSON.stringify(log.fullPayload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setIsAPILogOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
