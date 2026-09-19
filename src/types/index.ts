export type AIProvider = 'openrouter' | 'gemini' | 'openai' | 'custom' | 'demo';

export type UserProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export type CardDifficulty = 'easy' | 'medium' | 'hard' | 'scaffolding';

export type DeepDiveTarget = 'perplexity' | 'meta' | 'chatgpt' | 'gemini' | 'custom';

export interface AIConfig {
  activeProvider: AIProvider;
  openRouterApiKey: string;
  openRouterModel: string;
  openRouterWebSearch: boolean;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;
  batchQuestionsCount: number; // 1-10
  batchFlashcardsCount: number; // 1-10
  batchDidYouKnowCount: number; // 1-5
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  autoScrollOnSuccess: boolean;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  levelTarget: UserProficiencyLevel;
}

export interface DiagnosticResult {
  topic: string;
  score: number;
  total: number;
  assessedLevel: UserProficiencyLevel;
  summary: string;
}

export interface PlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  targetConcepts: string[];
  status: 'locked' | 'active' | 'completed' | 'skipped';
  masteryScore: number; // 0-100
  questionsAnswered: number;
  correctAnswers: number;
  completedAt?: string;
}

export interface LearningPlan {
  id: string;
  topic: string;
  userGoal?: string;
  assessedLevel: UserProficiencyLevel;
  totalEstimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
  steps: PlanStep[];
  activeStepIndex: number;
  isCustomized?: boolean;
}

export type FeedCardType = 'question' | 'flashcard' | 'did_you_know';

export interface BaseCard {
  id: string;
  stepId: string;
  type: FeedCardType;
  concept: string;
  topic: string;
  tags?: string[];
  userInteracted?: boolean;
}

export interface QuestionCard extends BaseCard {
  type: 'question';
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: CardDifficulty;
  guidingAnswer: {
    corePrinciple: string;
    whyCorrect: string;
    whyWrongBreakdown: string[];
    keyTakeaway: string;
  };
  hint?: string;
  selectedOptionIndex?: number;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
}

export interface FlashCard extends BaseCard {
  type: 'flashcard';
  front: {
    term: string;
    subtext?: string;
    categoryBadge?: string;
  };
  back: {
    definition: string;
    deepExplanation: string;
    exampleOrAnalogy: string;
    formulaOrRule?: string;
    proTip?: string;
  };
  isFlipped?: boolean;
  userRating?: 'mastered' | 'need_practice';
}

export interface DidYouKnowCard extends BaseCard {
  type: 'did_you_know';
  headline: string;
  fact: string;
  contextOrImpact: string;
  surprisingElement: string;
  visualIcon?: string;
  accentGradient?: string;
  mindBlownCount: number;
  userReacted?: boolean;
}

export type FeedCard = QuestionCard | FlashCard | DidYouKnowCard;

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'mastery' | 'streak' | 'deep_dive' | 'speed' | 'milestone';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface APILogEntry {
  id: string;
  timestamp: string;
  provider: AIProvider;
  model: string;
  action: 'diagnostic' | 'plan_generation' | 'plan_refine' | 'batch_cards' | 'scaffold_cards' | 'deep_dive' | 'test_connectivity';
  status: 'pending' | 'success' | 'error';
  statusCode?: number;
  latencyMs?: number;
  requestSnippet: string;
  responseSnippet?: string;
  errorMessage?: string;
  fullPayload?: any;
}

export interface DeepDiveResponse {
  target: DeepDiveTarget;
  model: string;
  concept: string;
  craftedPrompt: string;
  explanation: string;
  keyInsights: string[];
  realWorldAnalogy: string;
  webCitations?: { title: string; url: string; snippet?: string }[];
  followUpQuestions: string[];
}

export interface UserStats {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  totalCardsReviewed: number;
  questionsAttempted: number;
  questionsCorrect: number;
  flashcardsFlipped: number;
  deepDivesExecuted: number;
  plansCompleted: number;
}
