import { PlanStep, QuestionCard, CardDifficulty, Badge } from '../types';

export interface MasteryEvaluation {
  isCompetent: boolean;
  scorePercentage: number;
  shouldDropDifficulty: boolean;
  recommendedDifficulty: CardDifficulty;
  remedialConceptNeeded?: string;
  feedbackMessage: string;
}

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_scroll',
    title: 'First Doomscroll',
    description: 'Swiped through your first knowledge card!',
    icon: '⚡',
    category: 'milestone',
    unlockedAt: undefined
  },
  {
    id: 'quiz_prodigy',
    title: 'Quiz Prodigy',
    description: 'Answered 3 questions correctly in a row without mistakes.',
    icon: '🎯',
    category: 'mastery',
    unlockedAt: undefined
  },
  {
    id: 'deep_diver',
    title: 'Deep Diver',
    description: 'Executed an AI Deep Dive with Perplexity, Meta, or ChatGPT.',
    icon: '🔬',
    category: 'deep_dive',
    unlockedAt: undefined
  },
  {
    id: 'comeback_kid',
    title: 'Adaptive Phoenix',
    description: 'Recovered from a dropped difficulty level and conquered the step!',
    icon: '🔥',
    category: 'mastery',
    unlockedAt: undefined
  },
  {
    id: 'flash_master',
    title: 'Flash Master',
    description: 'Flipped and mastered 5 3D flashcards.',
    icon: '🃏',
    category: 'milestone',
    unlockedAt: undefined
  },
  {
    id: 'step_master',
    title: 'Milestone Conqueror',
    description: 'Demonstrated full competence on a plan step.',
    icon: '🏆',
    category: 'mastery',
    unlockedAt: undefined
  },
  {
    id: 'course_graduate',
    title: 'Master Mind Scholar',
    description: 'Completed every single milestone in a learning plan!',
    icon: '🎓',
    category: 'milestone',
    unlockedAt: undefined
  }
];

export const adaptiveEngine = {
  /**
   * Evaluate step competence and difficulty adjustment after a question answer
   */
  evaluatePerformance(
    step: PlanStep,
    answeredQuestions: QuestionCard[],
    consecutiveWrong: number
  ): MasteryEvaluation {
    const totalAnswered = answeredQuestions.filter((q) => typeof q.selectedOptionIndex === 'number').length;
    const totalCorrect = answeredQuestions.filter((q) => q.isCorrect).length;

    if (totalAnswered === 0) {
      return {
        isCompetent: false,
        scorePercentage: 0,
        shouldDropDifficulty: false,
        recommendedDifficulty: 'medium',
        feedbackMessage: 'Keep scrolling to build mastery!'
      };
    }

    const accuracy = Math.round((totalCorrect / totalAnswered) * 100);

    // Adaptive drop condition: 2 consecutive wrong answers or accuracy < 50% after at least 2 questions
    const shouldDrop = consecutiveWrong >= 2 || (totalAnswered >= 2 && accuracy < 50);

    // Competence condition: at least 2 questions answered and >= 75% accuracy
    const isCompetent = totalAnswered >= 2 && accuracy >= 75;

    let recDiff: CardDifficulty = 'medium';
    if (shouldDrop) {
      recDiff = 'easy';
    } else if (accuracy >= 85 && totalAnswered >= 3) {
      recDiff = 'hard';
    }

    let feedback = '';
    if (isCompetent) {
      feedback = `Outstanding! You achieved ${accuracy}% competence on this module. Step marked complete!`;
    } else if (shouldDrop) {
      feedback = `Difficulty temporarily lowered to Easy with scaffolding concepts to strengthen intuition.`;
    } else {
      feedback = `Accuracy: ${accuracy}%. Keep practicing!`;
    }

    return {
      isCompetent,
      scorePercentage: accuracy,
      shouldDropDifficulty: shouldDrop,
      recommendedDifficulty: recDiff,
      remedialConceptNeeded: shouldDrop ? step.targetConcepts[0] : undefined,
      feedbackMessage: feedback
    };
  },

  /**
   * Check for newly unlockable badges
   */
  checkBadgeUnlocks(
    currentBadges: Badge[],
    stats: {
      totalCardsReviewed: number;
      consecutiveCorrect: number;
      deepDivesExecuted: number;
      flashcardsFlipped: number;
      completedSteps: number;
      isPlanFinished: boolean;
      hadDifficultyDropAndRecovered: boolean;
    }
  ): { updatedBadges: Badge[]; newlyUnlocked: Badge[] } {
    const newlyUnlocked: Badge[] = [];
    const now = new Date().toLocaleDateString();

    const updated = currentBadges.map((badge) => {
      if (badge.unlockedAt) return badge;

      let unlock = false;
      if (badge.id === 'first_scroll' && stats.totalCardsReviewed >= 1) unlock = true;
      if (badge.id === 'quiz_prodigy' && stats.consecutiveCorrect >= 3) unlock = true;
      if (badge.id === 'deep_diver' && stats.deepDivesExecuted >= 1) unlock = true;
      if (badge.id === 'comeback_kid' && stats.hadDifficultyDropAndRecovered) unlock = true;
      if (badge.id === 'flash_master' && stats.flashcardsFlipped >= 5) unlock = true;
      if (badge.id === 'step_master' && stats.completedSteps >= 1) unlock = true;
      if (badge.id === 'course_graduate' && stats.isPlanFinished) unlock = true;

      if (unlock) {
        const unlockedBadge = { ...badge, unlockedAt: now };
        newlyUnlocked.push(unlockedBadge);
        return unlockedBadge;
      }
      return badge;
    });

    return { updatedBadges: updated, newlyUnlocked };
  }
};
