import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AIConfig,
  LearningPlan,
  PlanStep,
  FeedCard,
  QuestionCard,
  FlashCard,
  DidYouKnowCard,
  DiagnosticQuestion,
  UserStats,
  Badge,
  APILogEntry,
  CardDifficulty,
  DeepDiveTarget
} from '../types';
import { aiService } from '../services/aiService';
import { adaptiveEngine, INITIAL_BADGES } from '../services/adaptiveEngine';
import { loggerService } from '../services/loggerService';
import confetti from 'canvas-confetti';

interface AppContextType {
  // State
  config: AIConfig;
  learningPlan: LearningPlan | null;
  feedCards: FeedCard[];
  currentCardIndex: number;
  stats: UserStats;
  badges: Badge[];
  apiLogs: APILogEntry[];
  isLoadingFeed: boolean;
  activeDifficulty: CardDifficulty;

  // Diagnostic state
  diagnosticQuestions: DiagnosticQuestion[];
  isDiagnosticOpen: boolean;
  pendingTopic: string;

  // Modals
  isRoadmapOpen: boolean;
  isSettingsOpen: boolean;
  isDeepDiveOpen: boolean;
  isAPILogOpen: boolean;
  isBadgesOpen: boolean;
  isCelebrationOpen: boolean;
  selectedDeepDiveCard: FeedCard | null;
  celebrationStep: PlanStep | null;

  // Actions
  setConfig: (config: AIConfig) => void;
  startTopicLearning: (topic: string, goal?: string) => Promise<void>;
  submitDiagnosticQuiz: (answers: { questionId: string; selectedIndex: number }[]) => Promise<void>;
  answerQuestionCard: (cardId: string, optionIndex: number) => void;
  flipFlashcardCard: (cardId: string) => void;
  rateFlashcardCard: (cardId: string, rating: 'mastered' | 'need_practice') => void;
  reactDidYouKnowCard: (cardId: string) => void;
  openDeepDiveModal: (card: FeedCard) => void;
  closeDeepDiveModal: () => void;
  setCurrentCardIndex: (index: number) => void;
  nextCard: () => void;
  prevCard: () => void;
  updateLearningPlan: (updatedPlan: LearningPlan) => void;
  advanceToStep: (stepIndex: number) => Promise<void>;
  toggleTheme: () => void;

  // Modal setters
  setIsRoadmapOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsAPILogOpen: (open: boolean) => void;
  setIsBadgesOpen: (open: boolean) => void;
  setIsCelebrationOpen: (open: boolean) => void;
  resetCurrentPlan: () => void;
}

const DEFAULT_CONFIG: AIConfig = {
  activeProvider: 'demo',
  openRouterApiKey: '',
  openRouterModel: 'meta-llama/llama-3.3-70b-instruct:free',
  openRouterWebSearch: false,
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  customBaseUrl: 'http://localhost:11434/v1',
  customApiKey: '',
  customModel: 'llama3',
  batchQuestionsCount: 3,
  batchFlashcardsCount: 3,
  batchDidYouKnowCount: 2,
  theme: 'dark',
  soundEnabled: true,
  autoScrollOnSuccess: true
};

const DEFAULT_STATS: UserStats = {
  xp: 120,
  level: 1,
  streakDays: 3,
  lastActiveDate: new Date().toISOString(),
  totalCardsReviewed: 0,
  questionsAttempted: 0,
  questionsCorrect: 0,
  flashcardsFlipped: 0,
  deepDivesExecuted: 0,
  plansCompleted: 0
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Config & Persistence
  const [config, setConfigState] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem('scrolllearn_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const setConfig = (newConfig: AIConfig) => {
    setConfigState(newConfig);
    try {
      localStorage.setItem('scrolllearn_config', JSON.stringify(newConfig));
    } catch (err) {
      console.error(err);
    }
  };

  // Learning Plan & Stream
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(() => {
    try {
      const saved = localStorage.getItem('scrolllearn_active_plan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState<CardDifficulty>('medium');

  // Stats & Gamification
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('scrolllearn_stats');
      return saved ? JSON.parse(saved) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const saved = localStorage.getItem('scrolllearn_badges');
      return saved ? JSON.parse(saved) : INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  });

  // Diagnostic
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>([]);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [pendingTopic, setPendingTopic] = useState('');
  const [pendingGoal, setPendingGoal] = useState<string | undefined>(undefined);

  // Modals & Panels
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [isAPILogOpen, setIsAPILogOpen] = useState(false);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [selectedDeepDiveCard, setSelectedDeepDiveCard] = useState<FeedCard | null>(null);
  const [celebrationStep, setCelebrationStep] = useState<PlanStep | null>(null);

  // API Logs Subscription
  const [apiLogs, setApiLogs] = useState<APILogEntry[]>([]);

  useEffect(() => {
    const unsub = loggerService.subscribe(setApiLogs);
    return unsub;
  }, []);

  // Theme synchronization
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
  }, [config.theme]);

  // Save state helpers
  const savePlan = useCallback((plan: LearningPlan | null) => {
    setLearningPlan(plan);
    try {
      if (plan) {
        localStorage.setItem('scrolllearn_active_plan', JSON.stringify(plan));
      } else {
        localStorage.removeItem('scrolllearn_active_plan');
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const saveStats = useCallback((newStats: UserStats) => {
    setStats(newStats);
    try {
      localStorage.setItem('scrolllearn_stats', JSON.stringify(newStats));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const saveBadges = useCallback((newBadges: Badge[]) => {
    setBadges(newBadges);
    try {
      localStorage.setItem('scrolllearn_badges', JSON.stringify(newBadges));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Helper to trigger confetti celebration
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // ignore in test environments
    }
  };

  /**
   * Load card batch for a given plan step
   */
  const loadBatchForStep = useCallback(
    async (step: PlanStep, topic: string, difficulty: CardDifficulty = 'medium') => {
      setIsLoadingFeed(true);
      try {
        const batch = await aiService.generateStepBatch(step, topic, config, difficulty);
        setFeedCards(batch);
        setCurrentCardIndex(0);
        setActiveDifficulty(difficulty);
      } catch (err) {
        console.error('Failed to load batch cards:', err);
      } finally {
        setIsLoadingFeed(false);
      }
    },
    [config]
  );

  // If there is an active plan but no cards loaded, load batch for current step
  useEffect(() => {
    if (learningPlan && feedCards.length === 0 && !isLoadingFeed) {
      const activeStep = learningPlan.steps[learningPlan.activeStepIndex];
      if (activeStep) {
        loadBatchForStep(activeStep, learningPlan.topic);
      }
    }
  }, [learningPlan, feedCards.length, isLoadingFeed, loadBatchForStep]);

  /**
   * Initiate topic journey -> Fetch diagnostic questions
   */
  const startTopicLearning = async (topic: string, goal?: string) => {
    setPendingTopic(topic);
    setPendingGoal(goal);
    setIsLoadingFeed(true);
    try {
      const questions = await aiService.generateDiagnosticQuiz(topic, config);
      setDiagnosticQuestions(questions);
      setIsDiagnosticOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  /**
   * Submit diagnostic quiz -> Determine baseline level -> Generate Learning Plan
   */
  const submitDiagnosticQuiz = async (answers: { questionId: string; selectedIndex: number }[]) => {
    setIsDiagnosticOpen(false);
    setIsLoadingFeed(true);

    let correctCount = 0;
    answers.forEach((ans) => {
      const q = diagnosticQuestions.find((dq) => dq.id === ans.questionId);
      if (q && q.correctIndex === ans.selectedIndex) {
        correctCount++;
      }
    });

    let assessedLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (correctCount === 3) assessedLevel = 'advanced';
    else if (correctCount >= 1) assessedLevel = 'intermediate';

    try {
      const plan = await aiService.generateLearningPlan(pendingTopic, assessedLevel, config, pendingGoal);
      savePlan(plan);
      const activeStep = plan.steps[0];
      if (activeStep) {
        await loadBatchForStep(activeStep, plan.topic);
      }
      // Award XP for completing diagnostic
      saveStats({
        ...stats,
        xp: stats.xp + 50,
        totalCardsReviewed: stats.totalCardsReviewed + 3
      });
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  /**
   * Answer a Question Card
   */
  const answerQuestionCard = (cardId: string, optionIndex: number) => {
    if (!learningPlan) return;

    setFeedCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId || card.type !== 'question') return card;
        const qCard = card as QuestionCard;
        const isCorrect = qCard.correctIndex === optionIndex;

        return {
          ...qCard,
          selectedOptionIndex: optionIndex,
          isCorrect,
          userInteracted: true
        };
      })
    );

    const targetCard = feedCards.find((c) => c.id === cardId) as QuestionCard | undefined;
    if (!targetCard) return;

    const isCorrect = targetCard.correctIndex === optionIndex;
    const xpGain = isCorrect ? 25 : 5;

    // Update Stats
    const updatedStats: UserStats = {
      ...stats,
      xp: stats.xp + xpGain,
      questionsAttempted: stats.questionsAttempted + 1,
      questionsCorrect: stats.questionsCorrect + (isCorrect ? 1 : 0),
      totalCardsReviewed: stats.totalCardsReviewed + 1
    };
    saveStats(updatedStats);

    // Evaluate step performance & adaptive difficulty
    const currentStep = learningPlan.steps[learningPlan.activeStepIndex];
    const allStepQuestions = feedCards.filter((c) => c.type === 'question' && c.stepId === currentStep.id) as QuestionCard[];
    // Mock the updated card in list
    const updatedList = allStepQuestions.map((q) => (q.id === cardId ? { ...q, selectedOptionIndex: optionIndex, isCorrect } : q));

    const evalResult = adaptiveEngine.evaluatePerformance(currentStep, updatedList, isCorrect ? 0 : 2);

    if (evalResult.shouldDropDifficulty && activeDifficulty !== 'easy') {
      setActiveDifficulty('easy');
    }

    // Step Competence Achieved!
    if (evalResult.isCompetent && currentStep.status !== 'completed') {
      triggerConfetti();
      setCelebrationStep(currentStep);
      setIsCelebrationOpen(true);

      const updatedSteps = learningPlan.steps.map((s, idx) => {
        if (idx === learningPlan.activeStepIndex) {
          return {
            ...s,
            status: 'completed' as const,
            masteryScore: evalResult.scorePercentage,
            completedAt: new Date().toLocaleDateString()
          };
        }
        if (idx === learningPlan.activeStepIndex + 1 && s.status === 'locked') {
          return { ...s, status: 'active' as const };
        }
        return s;
      });

      const updatedPlan: LearningPlan = {
        ...learningPlan,
        steps: updatedSteps,
        updatedAt: new Date().toISOString()
      };
      savePlan(updatedPlan);

      // Check badge unlocks
      const isPlanFinished = updatedSteps.every((s) => s.status === 'completed');
      const { updatedBadges } = adaptiveEngine.checkBadgeUnlocks(badges, {
        totalCardsReviewed: updatedStats.totalCardsReviewed,
        consecutiveCorrect: isCorrect ? 3 : 0,
        deepDivesExecuted: updatedStats.deepDivesExecuted,
        flashcardsFlipped: updatedStats.flashcardsFlipped,
        completedSteps: updatedSteps.filter((s) => s.status === 'completed').length,
        isPlanFinished,
        hadDifficultyDropAndRecovered: activeDifficulty === 'easy' && isCorrect
      });
      saveBadges(updatedBadges);
    }
  };

  /**
   * Flip Flashcard (3D)
   */
  const flipFlashcardCard = (cardId: string) => {
    setFeedCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId || card.type !== 'flashcard') return card;
        const fc = card as FlashCard;
        return {
          ...fc,
          isFlipped: !fc.isFlipped,
          userInteracted: true
        };
      })
    );

    saveStats({
      ...stats,
      flashcardsFlipped: stats.flashcardsFlipped + 1,
      totalCardsReviewed: stats.totalCardsReviewed + 1,
      xp: stats.xp + 10
    });
  };

  /**
   * Rate Flashcard
   */
  const rateFlashcardCard = (cardId: string, rating: 'mastered' | 'need_practice') => {
    setFeedCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId || card.type !== 'flashcard') return card;
        return {
          ...(card as FlashCard),
          userRating: rating
        };
      })
    );

    if (rating === 'mastered') {
      saveStats({ ...stats, xp: stats.xp + 15 });
    }
  };

  /**
   * React to Did You Know Card
   */
  const reactDidYouKnowCard = (cardId: string) => {
    setFeedCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId || card.type !== 'did_you_know') return card;
        const dyk = card as DidYouKnowCard;
        const isReacted = !dyk.userReacted;
        return {
          ...dyk,
          userReacted: isReacted,
          mindBlownCount: dyk.mindBlownCount + (isReacted ? 1 : -1)
        };
      })
    );

    saveStats({ ...stats, xp: stats.xp + 10 });
  };

  /**
   * Deep Dive Modal Management
   */
  const openDeepDiveModal = (card: FeedCard) => {
    setSelectedDeepDiveCard(card);
    setIsDeepDiveOpen(true);
  };

  const closeDeepDiveModal = () => {
    setIsDeepDiveOpen(false);
    setSelectedDeepDiveCard(null);
  };

  /**
   * Stream navigation
   */
  const nextCard = () => {
    if (currentCardIndex < feedCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  /**
   * Plan updates & manual edits
   */
  const updateLearningPlan = (updatedPlan: LearningPlan) => {
    savePlan(updatedPlan);
  };

  /**
   * Step advance
   */
  const advanceToStep = async (stepIndex: number) => {
    if (!learningPlan || !learningPlan.steps[stepIndex]) return;
    const targetStep = learningPlan.steps[stepIndex];

    const updatedPlan: LearningPlan = {
      ...learningPlan,
      activeStepIndex: stepIndex,
      steps: learningPlan.steps.map((s, i) => (i === stepIndex ? { ...s, status: 'active' } : s))
    };
    savePlan(updatedPlan);
    await loadBatchForStep(targetStep, learningPlan.topic);
  };

  /**
   * Theme toggle
   */
  const toggleTheme = () => {
    const next = config.theme === 'dark' ? 'light' : 'dark';
    setConfig({ ...config, theme: next });
  };

  const resetCurrentPlan = () => {
    savePlan(null);
    setFeedCards([]);
    setCurrentCardIndex(0);
  };

  return (
    <AppContext.Provider
      value={{
        config,
        learningPlan,
        feedCards,
        currentCardIndex,
        stats,
        badges,
        apiLogs,
        isLoadingFeed,
        activeDifficulty,
        diagnosticQuestions,
        isDiagnosticOpen,
        pendingTopic,
        isRoadmapOpen,
        isSettingsOpen,
        isDeepDiveOpen,
        isAPILogOpen,
        isBadgesOpen,
        isCelebrationOpen,
        selectedDeepDiveCard,
        celebrationStep,
        setConfig,
        startTopicLearning,
        submitDiagnosticQuiz,
        answerQuestionCard,
        flipFlashcardCard,
        rateFlashcardCard,
        reactDidYouKnowCard,
        openDeepDiveModal,
        closeDeepDiveModal,
        setCurrentCardIndex,
        nextCard,
        prevCard,
        updateLearningPlan,
        advanceToStep,
        toggleTheme,
        setIsRoadmapOpen,
        setIsSettingsOpen,
        setIsAPILogOpen,
        setIsBadgesOpen,
        setIsCelebrationOpen,
        resetCurrentPlan
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
