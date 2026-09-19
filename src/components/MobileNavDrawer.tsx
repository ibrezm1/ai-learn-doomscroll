import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Settings,
  Map,
  Award,
  Activity,
  Sun,
  Moon,
  Sparkles,
  Flame,
  RotateCcw,
  Zap,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { loggerService } from '../services/loggerService';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const {
    learningPlan,
    stats,
    badges,
    config,
    toggleTheme,
    setIsRoadmapOpen,
    setIsSettingsOpen,
    setIsAPILogOpen,
    setIsBadgesOpen,
    resetCurrentPlan
  } = useApp();

  const inFlight = loggerService.hasInFlightCalls();
  const hasErrors = loggerService.hasRecentErrors();

  const unlockedBadgesCount = badges.filter((b) => b.unlockedAt).length;

  const completedSteps = learningPlan ? learningPlan.steps.filter((s) => s.status === 'completed').length : 0;
  const totalSteps = learningPlan ? learningPlan.steps.length : 1;
  const progressPercent = learningPlan ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const userLevel = Math.floor(stats.xp / 100) + 1;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="brand-logo" onClick={() => handleAction(resetCurrentPlan)}>
            <Zap size={22} className="text-indigo-400 fill-indigo-400" />
            <span>ScrollLearn</span>
          </div>
          <button className="icon-btn mobile-drawer-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* User Stats & Gamification Card */}
        <div className="mobile-stats-card">
          <div className="mobile-stats-row">
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Level</span>
              <span className="mobile-stat-val text-gradient">Lvl {userLevel}</span>
            </div>
            <div className="mobile-stat-divider" />
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Experience</span>
              <div className="flex-align-center gap-1">
                <Sparkles size={14} className="text-amber-400 fill-amber-400" />
                <span className="mobile-stat-val">{stats.xp} XP</span>
              </div>
            </div>
            <div className="mobile-stat-divider" />
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Streak</span>
              <div className="flex-align-center gap-1">
                <Flame size={14} className="text-rose-500 fill-rose-500" />
                <span className="mobile-stat-val">{stats.streakDays}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Learning Plan HUD */}
        {learningPlan && (
          <div className="mobile-plan-card" onClick={() => handleAction(() => setIsRoadmapOpen(true))}>
            <div className="mobile-plan-top">
              <span className="mobile-plan-tag">Active Topic</span>
              <span className="mobile-plan-pct">{progressPercent}% Completed</span>
            </div>
            <div className="mobile-plan-title">📚 {learningPlan.topic}</div>
            <div className="progress-bar-track" style={{ height: '8px', margin: '0.4rem 0' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.max(6, progressPercent)}%` }} />
            </div>
            <div className="mobile-plan-action">
              <span>Step {learningPlan.activeStepIndex + 1} of {totalSteps}</span>
              <span className="link-text flex-align-center gap-1">
                Roadmap <ChevronRight size={14} />
              </span>
            </div>
          </div>
        )}

        {/* Navigation / Actions Menu */}
        <div className="mobile-menu-section">
          <div className="mobile-menu-section-title">Navigation & Tools</div>

          {/* AI Settings & API Keys */}
          <button
            className="mobile-menu-item highlight-item"
            onClick={() => handleAction(() => setIsSettingsOpen(true))}
          >
            <div className="mobile-menu-item-icon settings-icon-wrap">
              <Settings size={20} />
            </div>
            <div className="mobile-menu-item-content">
              <div className="mobile-menu-item-title">
                AI & API Keys Settings
                <span className="mini-badge-pill">Local Storage</span>
              </div>
              <div className="mobile-menu-item-desc">
                OpenRouter, Gemini, OpenAI, or Custom keys
              </div>
            </div>
            <ChevronRight size={18} className="mobile-menu-arrow" />
          </button>

          {/* Roadmap Plan */}
          {learningPlan && (
            <button
              className="mobile-menu-item"
              onClick={() => handleAction(() => setIsRoadmapOpen(true))}
            >
              <div className="mobile-menu-item-icon roadmap-icon-wrap">
                <Map size={20} />
              </div>
              <div className="mobile-menu-item-content">
                <div className="mobile-menu-item-title">Learning Roadmap</div>
                <div className="mobile-menu-item-desc">Interactive curriculum & step nodes</div>
              </div>
              <ChevronRight size={18} className="mobile-menu-arrow" />
            </button>
          )}

          {/* Badges & Achievements */}
          <button
            className="mobile-menu-item"
            onClick={() => handleAction(() => setIsBadgesOpen(true))}
          >
            <div className="mobile-menu-item-icon badge-icon-wrap">
              <Award size={20} />
            </div>
            <div className="mobile-menu-item-content">
              <div className="mobile-menu-item-title">
                Badges & Achievements
                <span className="mini-count-pill">{unlockedBadgesCount}/{badges.length}</span>
              </div>
              <div className="mobile-menu-item-desc">Track unlocks, milestones & streak awards</div>
            </div>
            <ChevronRight size={18} className="mobile-menu-arrow" />
          </button>

          {/* API Activity & Real-time Logs */}
          <button
            className="mobile-menu-item"
            onClick={() => handleAction(() => setIsAPILogOpen(true))}
          >
            <div className="mobile-menu-item-icon log-icon-wrap">
              <Activity size={20} />
              {inFlight && <span className="status-dot-indicator calling" />}
              {hasErrors && !inFlight && <span className="status-dot-indicator error" />}
            </div>
            <div className="mobile-menu-item-content">
              <div className="mobile-menu-item-title">
                Live AI API Logs
                {inFlight ? (
                  <span className="live-status calling">Calling AI...</span>
                ) : hasErrors ? (
                  <span className="live-status error">Recent Error</span>
                ) : (
                  <span className="live-status idle">Ready</span>
                )}
              </div>
              <div className="mobile-menu-item-desc">Prompts, latency & real-time responses</div>
            </div>
            <ChevronRight size={18} className="mobile-menu-arrow" />
          </button>

          {/* Theme Switcher */}
          <div className="mobile-menu-item theme-switch-item" onClick={toggleTheme}>
            <div className="mobile-menu-item-icon theme-icon-wrap">
              {config.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div className="mobile-menu-item-content">
              <div className="mobile-menu-item-title">Appearance</div>
              <div className="mobile-menu-item-desc">
                Currently: {config.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </div>
            </div>
            <div className="theme-toggle-indicator">
              <span>{config.theme === 'dark' ? '🌙' : '☀️'}</span>
            </div>
          </div>

          {/* Reset / New Topic */}
          {learningPlan && (
            <button
              className="mobile-menu-item danger-subtle"
              onClick={() => handleAction(resetCurrentPlan)}
            >
              <div className="mobile-menu-item-icon reset-icon-wrap">
                <RotateCcw size={18} />
              </div>
              <div className="mobile-menu-item-content">
                <div className="mobile-menu-item-title">Start New Topic</div>
                <div className="mobile-menu-item-desc">Choose another subject or reset progress</div>
              </div>
            </button>
          )}
        </div>

        {/* Footer Info: Active Provider & Security */}
        <div className="mobile-drawer-footer">
          <div className="active-provider-box">
            <div className="provider-header">
              <span className="provider-label">ACTIVE AI ENGINE</span>
              <span className="brand-badge">
                {config.activeProvider === 'openrouter'
                  ? 'OpenRouter'
                  : config.activeProvider === 'gemini'
                  ? 'Google Gemini'
                  : config.activeProvider === 'openai'
                  ? 'OpenAI'
                  : config.activeProvider === 'custom'
                  ? 'Custom AI'
                  : 'Demo AI'}
              </span>
            </div>
            <div className="security-note flex-align-center gap-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Keys stored safely in browser LocalStorage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
