import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Map,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  Target
} from 'lucide-react';
import { PlanStep, LearningPlan } from '../types';
import { aiService } from '../services/aiService';

export const PlanRoadmapModal: React.FC = () => {
  const {
    learningPlan,
    isRoadmapOpen,
    setIsRoadmapOpen,
    updateLearningPlan,
    advanceToStep,
    config,
    isLoadingFeed
  } = useApp();

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMinutes, setEditMinutes] = useState(20);
  const [aiRefinePrompt, setAiRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  if (!isRoadmapOpen || !learningPlan) return null;

  const handleStartEdit = (step: PlanStep) => {
    setEditingStepId(step.id);
    setEditTitle(step.title);
    setEditDesc(step.description);
    setEditMinutes(step.estimatedMinutes);
  };

  const handleSaveEdit = (stepId: string) => {
    const updatedSteps = learningPlan.steps.map((s) =>
      s.id === stepId
        ? {
            ...s,
            title: editTitle.trim() || s.title,
            description: editDesc.trim() || s.description,
            estimatedMinutes: Number(editMinutes) || s.estimatedMinutes
          }
        : s
    );

    updateLearningPlan({
      ...learningPlan,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
      isCustomized: true
    });
    setEditingStepId(null);
  };

  const handleAddNewStep = () => {
    const newStepNum = learningPlan.steps.length + 1;
    const newStep: PlanStep = {
      id: `step_custom_${Date.now()}`,
      stepNumber: newStepNum,
      title: `Custom Milestone ${newStepNum}`,
      description: 'Add your custom topic notes, concepts, and goals here.',
      estimatedMinutes: 20,
      targetConcepts: ['Custom Practice', 'Hands-on Goal'],
      status: 'locked',
      masteryScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0
    };

    updateLearningPlan({
      ...learningPlan,
      steps: [...learningPlan.steps, newStep],
      updatedAt: new Date().toISOString(),
      isCustomized: true
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (learningPlan.steps.length <= 1) return;
    const updatedSteps = learningPlan.steps
      .filter((s) => s.id !== stepId)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

    const nextActive = Math.min(learningPlan.activeStepIndex, updatedSteps.length - 1);

    updateLearningPlan({
      ...learningPlan,
      steps: updatedSteps,
      activeStepIndex: nextActive,
      updatedAt: new Date().toISOString(),
      isCustomized: true
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= learningPlan.steps.length) return;

    const newSteps = [...learningPlan.steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    const renumbered = newSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

    updateLearningPlan({
      ...learningPlan,
      steps: renumbered,
      updatedAt: new Date().toISOString(),
      isCustomized: true
    });
  };

  const handleToggleStepStatus = (stepId: string) => {
    const updatedSteps = learningPlan.steps.map((s) => {
      if (s.id !== stepId) return s;
      const nextStatus: PlanStep['status'] = s.status === 'completed' ? 'active' : 'completed';
      return {
        ...s,
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toLocaleDateString() : undefined
      };
    });

    updateLearningPlan({
      ...learningPlan,
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAIRefinePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiRefinePrompt.trim() || isRefining) return;

    setIsRefining(true);
    try {
      const refinedPlan = await aiService.refinePlanWithAI(learningPlan, aiRefinePrompt.trim(), config);
      updateLearningPlan(refinedPlan);
      setAiRefinePrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Map className="text-indigo-400" size={22} />
            <span>Learning Roadmap & Plan Editor</span>
          </div>
          <button className="icon-btn" onClick={() => setIsRoadmapOpen(false)} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {learningPlan.topic}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Assessed Level: <strong style={{ color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{learningPlan.assessedLevel}</strong> • {learningPlan.steps.length} Milestones
              </p>
            </div>
            <button className="btn-secondary" onClick={handleAddNewStep} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} />
              <span>Add Step</span>
            </button>
          </div>

          {/* Steps List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {learningPlan.steps.map((step, idx) => {
              const isActive = idx === learningPlan.activeStepIndex;
              const isCompleted = step.status === 'completed';
              const isEditing = editingStepId === step.id;

              return (
                <div
                  key={step.id}
                  className={`roadmap-step-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="step-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="step-num-badge">{step.stepNumber}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isCompleted ? 'var(--accent-emerald)' : isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        {isCompleted ? 'Completed' : isActive ? 'Current Active Step' : 'Locked'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {/* Move up / down */}
                      <button
                        className="icon-btn"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === learningPlan.steps.length - 1}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>

                      {/* Edit */}
                      <button
                        className="icon-btn"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => (isEditing ? handleSaveEdit(step.id) : handleStartEdit(step))}
                        title={isEditing ? 'Save' : 'Edit Step'}
                      >
                        {isEditing ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Edit2 size={14} />}
                      </button>

                      {/* Delete */}
                      <button
                        className="icon-btn"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => handleDeleteStep(step.id)}
                        disabled={learningPlan.steps.length <= 1}
                        title="Delete Step"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Step Title"
                        style={{
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.9rem'
                        }}
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Step Description"
                        rows={2}
                        style={{
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '0.84rem'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Estimated minutes:</span>
                        <input
                          type="number"
                          value={editMinutes}
                          onChange={(e) => setEditMinutes(Number(e.target.value))}
                          style={{
                            width: '70px',
                            padding: '0.2rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-medium)',
                            fontSize: '0.84rem'
                          }}
                        />
                        <button
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', marginLeft: 'auto' }}
                          onClick={() => handleSaveEdit(step.id)}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.description}</div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <Clock size={12} />
                            {step.estimatedMinutes}m
                          </span>
                          {step.targetConcepts.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>
                              <Target size={12} />
                              {step.targetConcepts.join(', ')}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => handleToggleStepStatus(step.id)}
                          >
                            {isCompleted ? 'Mark Incomplete' : 'Mark Done'}
                          </button>
                          {!isActive && (
                            <button
                              className="btn-primary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                advanceToStep(idx);
                                setIsRoadmapOpen(false);
                              }}
                              disabled={isLoadingFeed}
                            >
                              <Play size={12} />
                              <span>Switch to Step</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Refine Plan Section */}
          <div className="plan-refine-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
              <Sparkles size={16} />
              <span>Prompt AI to Refine or Expand Plan</span>
            </div>
            <form onSubmit={handleAIRefinePlan} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={aiRefinePrompt}
                onChange={(e) => setAiRefinePrompt(e.target.value)}
                placeholder="e.g., 'Make it more hands-on with practical exercises' or 'Add a milestone on security'"
                disabled={isRefining}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.84rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!aiRefinePrompt.trim() || isRefining}
                style={{ padding: '0.5rem 0.95rem', fontSize: '0.82rem' }}
              >
                {isRefining ? 'Refining...' : 'Refine'}
              </button>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setIsRoadmapOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
