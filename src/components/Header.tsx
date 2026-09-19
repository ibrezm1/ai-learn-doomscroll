import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Flame,
  Award,
  Map,
  Settings,
  Sun,
  Moon,
  Activity,
  Zap,
  BookOpen
} from 'lucide-react';
import { loggerService } from '../services/loggerService';

export const Header: React.FC = () => {
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

  // Calculate overall plan progress
  const completedSteps = learningPlan ? learningPlan.steps.filter((s) => s.status === 'completed').length : 0;
  const totalSteps = learningPlan ? learningPlan.steps.length : 1;
  const progressPercent = learningPlan ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <header className="app-header">
      {/* Brand */}
      <div className="header-left">
        <div className="brand-logo" onClick={resetCurrentPlan} title="Start new topic">
          <Zap size={22} className="text-indigo-400 fill-indigo-400" />
          <span>ScrollLearn</span>
        </div>
        <span className="brand-badge">
          {config.activeProvider === 'openrouter'
            ? 'OpenRouter'
            : config.activeProvider === 'gemini'
            ? 'Gemini'
            : config.activeProvider === 'openai'
            ? 'OpenAI'
            : config.activeProvider === 'custom'
            ? 'Custom AI'
            : 'Demo AI'}
        </span>
      </div>

      {/* Center Progress HUD */}
      {learningPlan && (
        <div className="header-center">
          <div className="progress-hud-box">
            <div className="progress-hud-top">
              <span className="progress-hud-topic" title={learningPlan.topic}>
                📚 {learningPlan.topic}
              </span>
              <span className="progress-hud-percent">
                Step {learningPlan.activeStepIndex + 1}/{totalSteps} ({progressPercent}%)
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Right Actions & Gamification */}
      <div className="header-right">
        {/* XP */}
        <div className="gamify-chip xp" title="Total Experience Points">
          <Sparkles size={14} />
          <span>{stats.xp} XP</span>
        </div>

        {/* Streak */}
        <div className="gamify-chip streak" title="Daily Streak">
          <Flame size={14} />
          <span>{stats.streakDays}d</span>
        </div>

        {/* Badges Button */}
        <button
          className="icon-btn"
          onClick={() => setIsBadgesOpen(true)}
          title={`Badges (${unlockedBadgesCount}/${badges.length})`}
        >
          <Award size={18} />
        </button>

        {/* Roadmap / Plan Button */}
        {learningPlan && (
          <button
            className="icon-btn active"
            onClick={() => setIsRoadmapOpen(true)}
            title="View & Edit Learning Plan"
          >
            <Map size={18} />
          </button>
        )}

        {/* Real-time API Activity Log Trigger */}
        <button
          className="icon-btn"
          onClick={() => setIsAPILogOpen(true)}
          title="Live AI API Activity & Logs"
        >
          <Activity size={18} />
          <span
            className={`status-dot-indicator ${
              inFlight ? 'calling' : hasErrors ? 'error' : ''
            }`}
          />
        </button>

        {/* Theme Toggle */}
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {config.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings */}
        <button
          className="icon-btn"
          onClick={() => setIsSettingsOpen(true)}
          title="AI & Batch Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
