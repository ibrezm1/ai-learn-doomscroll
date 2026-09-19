import {
  AIConfig,
  AIProvider,
  DiagnosticQuestion,
  UserProficiencyLevel,
  LearningPlan,
  PlanStep,
  FeedCard,
  QuestionCard,
  FlashCard,
  DidYouKnowCard,
  CardDifficulty,
  DeepDiveTarget,
  DeepDiveResponse
} from '../types';
import { loggerService } from './loggerService';

// Standard Free models list for OpenRouter
export interface OpenRouterFetchedModel {
  id: string;
  name: string;
  description?: string;
  isFree: boolean;
  contextLength?: number;
  promptPrice?: string;
  completionPrice?: string;
}

export const OPENROUTER_FREE_MODELS: OpenRouterFetchedModel[] = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free)', isFree: true, contextLength: 131072 },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)', isFree: true, contextLength: 1048576 },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 Reasoning (Free)', isFree: true, contextLength: 64000 },
  { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', isFree: true, contextLength: 32768 },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', isFree: true, contextLength: 32768 }
];

export const OPENROUTER_SEARCH_MODELS: OpenRouterFetchedModel[] = [
  { id: 'perplexity/sonar-reasoning', name: 'Perplexity Sonar Reasoning (Web Search)', isFree: false },
  { id: 'perplexity/sonar', name: 'Perplexity Sonar (Fast Search)', isFree: false },
  { id: 'meta-llama/llama-3.3-70b-instruct:online', name: 'Llama 3.3 70B (Online Web)', isFree: false },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (with Search plugin)', isFree: true }
];

/**
 * Dynamically fetches live models from OpenRouter endpoint (https://openrouter.ai/api/v1/models)
 */
export async function fetchLiveOpenRouterModels(apiKey?: string): Promise<OpenRouterFetchedModel[]> {
  const headers: Record<string, string> = {
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
    'X-Title': 'ScrollLearn AI'
  };
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`OpenRouter models API returned HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const modelsData: any[] = json?.data || [];

  if (!Array.isArray(modelsData)) {
    throw new Error('Unexpected response format from OpenRouter models endpoint');
  }

  const mapped: OpenRouterFetchedModel[] = modelsData.map((m: any) => {
    const promptPricing = m.pricing?.prompt;
    const completionPricing = m.pricing?.completion;
    const isFree =
      (promptPricing === '0' || promptPricing === 0) &&
      (completionPricing === '0' || completionPricing === 0) ||
      (typeof m.id === 'string' && (m.id.endsWith(':free') || m.id.includes(':free')));

    return {
      id: m.id,
      name: m.name || m.id,
      description: m.description,
      isFree,
      contextLength: m.context_length,
      promptPrice: promptPricing != null ? String(promptPricing) : undefined,
      completionPrice: completionPricing != null ? String(completionPricing) : undefined
    };
  });

  // Sort free models to the front, then alphabetically by name
  mapped.sort((a, b) => {
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;
    return a.name.localeCompare(b.name);
  });

  return mapped;
}

/**
 * Utility to extract clean JSON object/array from model output that might contain markdown fences.
 */
function extractJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const jsonStart = cleaned.indexOf('{');
    const arrayStart = cleaned.indexOf('[');
    let startIdx = -1;

    if (jsonStart !== -1 && arrayStart !== -1) {
      startIdx = Math.min(jsonStart, arrayStart);
    } else if (jsonStart !== -1) {
      startIdx = jsonStart;
    } else if (arrayStart !== -1) {
      startIdx = arrayStart;
    }

    if (startIdx !== -1) {
      const slice = cleaned.substring(startIdx);
      return JSON.parse(slice);
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('JSON parsing failed, returning fallback:', err, text);
    return fallback;
  }
}

/**
 * Core Multi-Provider AI Dispatcher
 */
async function callLLM(
  prompt: string,
  systemInstruction: string,
  config: AIConfig,
  action: Parameters<typeof loggerService.startCall>[2],
  overrideProvider?: AIProvider,
  overrideModel?: string
): Promise<string> {
  const provider = overrideProvider || config.activeProvider;
  let model = overrideModel || '';
  const startTime = Date.now();

  if (provider === 'demo') {
    // Return empty to allow procedural fallback
    return '';
  }

  if (provider === 'openrouter') {
    model = model || config.openRouterModel || 'meta-llama/llama-3.3-70b-instruct:free';
    if (!config.openRouterApiKey) {
      throw new Error('OpenRouter API Key is missing. Please add it in Settings or switch to Demo mode.');
    }

    const payload: any = {
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    };

    // Support OpenRouter web search plugin if requested
    if (config.openRouterWebSearch) {
      payload.plugins = [{ id: 'web' }];
    }

    const logId = loggerService.startCall(provider, model, action, prompt.slice(0, 150) + '...', payload);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openRouterApiKey.trim()}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ScrollLearn AI'
        },
        body: JSON.stringify(payload)
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        loggerService.failCall(logId, errorMsg, latencyMs, response.status);
        throw new Error(`OpenRouter Error: ${errorMsg}`);
      }

      const content = data?.choices?.[0]?.message?.content || '';
      loggerService.completeCall(logId, response.status, latencyMs, content.slice(0, 150) + '...', data);
      return content;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      loggerService.failCall(logId, err.message, latencyMs);
      throw err;
    }
  }

  if (provider === 'gemini') {
    model = model || config.geminiModel || 'gemini-1.5-flash';
    if (!config.geminiApiKey) {
      throw new Error('Google Gemini API Key is missing. Please add it in Settings.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey.trim()}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7
      }
    };

    const logId = loggerService.startCall(provider, model, action, prompt.slice(0, 150) + '...', payload);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status}`;
        loggerService.failCall(logId, errorMsg, latencyMs, response.status);
        throw new Error(`Gemini Error: ${errorMsg}`);
      }

      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      loggerService.completeCall(logId, response.status, latencyMs, content.slice(0, 150) + '...', data);
      return content;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      loggerService.failCall(logId, err.message, latencyMs);
      throw err;
    }
  }

  if (provider === 'openai') {
    model = model || config.openaiModel || 'gpt-4o-mini';
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API Key is missing. Please add it in Settings.');
    }

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    };

    const logId = loggerService.startCall(provider, model, action, prompt.slice(0, 150) + '...', payload);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey.trim()}`
        },
        body: JSON.stringify(payload)
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status}`;
        loggerService.failCall(logId, errorMsg, latencyMs, response.status);
        throw new Error(`OpenAI Error: ${errorMsg}`);
      }

      const content = data?.choices?.[0]?.message?.content || '';
      loggerService.completeCall(logId, response.status, latencyMs, content.slice(0, 150) + '...', data);
      return content;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      loggerService.failCall(logId, err.message, latencyMs);
      throw err;
    }
  }

  if (provider === 'custom') {
    model = model || config.customModel || 'custom-model';
    const baseUrl = (config.customBaseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '');

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.customApiKey) {
      headers.Authorization = `Bearer ${config.customApiKey.trim()}`;
    }

    const logId = loggerService.startCall(provider, model, action, prompt.slice(0, 150) + '...', payload);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status}`;
        loggerService.failCall(logId, errorMsg, latencyMs, response.status);
        throw new Error(`Custom AI Error: ${errorMsg}`);
      }

      const content = data?.choices?.[0]?.message?.content || '';
      loggerService.completeCall(logId, response.status, latencyMs, content.slice(0, 150) + '...', data);
      return content;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      loggerService.failCall(logId, err.message, latencyMs);
      throw err;
    }
  }

  return '';
}

/**
 * Procedural Fallback Generator (Produces rich authentic curriculum when offline/demo)
 */
function getMockDiagnosticQuestions(topic: string): DiagnosticQuestion[] {
  return [
    {
      id: 'diag_1',
      question: `What is the foundational principle or primary goal of ${topic}?`,
      options: [
        `It establishes basic conceptual models and rules for solving core problems in ${topic}.`,
        `It is solely an obsolete theory with no practical contemporary application.`,
        `It requires no foundational knowledge and operates entirely at random.`,
        `It only deals with physical hardware manufacturing.`
      ],
      correctIndex: 0,
      explanation: `Understanding the fundamental principles and scope of ${topic} is essential before diving into specialized mechanisms.`,
      levelTarget: 'beginner'
    },
    {
      id: 'diag_2',
      question: `When applying ${topic} in real-world scenarios, how do trade-offs typically manifest?`,
      options: [
        `There are never any trade-offs; every approach yields identical perfection.`,
        `Balancing complexity, performance, resource efficiency, and correctness is key.`,
        `Trade-offs only exist in theoretical academic papers.`,
        `You must always prioritize execution speed over safety and correctness.`
      ],
      correctIndex: 1,
      explanation: `Intermediate practitioners must evaluate system constraints, trade-offs, and practical edge cases in ${topic}.`,
      levelTarget: 'intermediate'
    },
    {
      id: 'diag_3',
      question: `Which advanced pattern or cutting-edge architectural challenge is most relevant to ${topic}?`,
      options: [
        `Simple repetitive manual execution of basic scripts.`,
        `Ignoring concurrency, scalability, and distributed fault tolerance.`,
        `High-throughput scalability, robust error boundaries, and modern paradigms.`,
        `Replacing all dynamic logic with static lookups.`
      ],
      correctIndex: 2,
      explanation: `Advanced mastery of ${topic} involves high-level architectural decisions, fault tolerance, and novel optimization strategies.`,
      levelTarget: 'advanced'
    }
  ];
}

function getMockPlan(topic: string, level: UserProficiencyLevel): LearningPlan {
  const steps: PlanStep[] = [
    {
      id: 'step_1',
      stepNumber: 1,
      title: `Core Foundations & Mental Model of ${topic}`,
      description: `Understand the fundamental vocabulary, core concepts, and key principles behind ${topic}.`,
      estimatedMinutes: 15,
      targetConcepts: ['Foundational Terminology', 'Core Mechanisms', 'Mental Model'],
      status: 'active',
      masteryScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0
    },
    {
      id: 'step_2',
      stepNumber: 2,
      title: `Mechanisms, Architecture & Best Practices`,
      description: `Deep-dive into how components interact, common design patterns, and critical heuristics.`,
      estimatedMinutes: 20,
      targetConcepts: ['Architectural Flow', 'Trade-offs & Constraints', 'Best Practices'],
      status: 'locked',
      masteryScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0
    },
    {
      id: 'step_3',
      stepNumber: 3,
      title: `Real-World Application, Pitfalls & Optimization`,
      description: `Analyze practical edge-cases, common beginner traps, and advanced performance techniques.`,
      estimatedMinutes: 25,
      targetConcepts: ['Debugging Pitfalls', 'Optimization Strategies', 'Case Studies'],
      status: 'locked',
      masteryScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0
    },
    {
      id: 'step_4',
      stepNumber: 4,
      title: `Advanced Paradigms & Future Frontiers in ${topic}`,
      description: `Synthesize high-level mastery with novel methodologies, ecosystem trends, and state-of-the-art developments.`,
      estimatedMinutes: 30,
      targetConcepts: ['Advanced Paradigms', 'Cutting-Edge Trends', 'System Synthesis'],
      status: 'locked',
      masteryScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0
    }
  ];

  return {
    id: 'plan_' + Date.now(),
    topic,
    assessedLevel: level,
    totalEstimatedMinutes: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps,
    activeStepIndex: 0
  };
}

function getMockCardsForStep(step: PlanStep, topic: string, config: AIConfig): FeedCard[] {
  const cards: FeedCard[] = [];
  const qCount = Math.max(1, config.batchQuestionsCount || 3);
  const fCount = Math.max(1, config.batchFlashcardsCount || 3);
  const dykCount = Math.max(1, config.batchDidYouKnowCount || 2);

  // Generate Questions
  for (let i = 0; i < qCount; i++) {
    cards.push({
      id: `q_${step.id}_${i}_${Date.now()}`,
      stepId: step.id,
      type: 'question',
      topic,
      concept: step.targetConcepts[i % step.targetConcepts.length] || step.title,
      difficulty: i === 0 ? 'easy' : i === 1 ? 'medium' : 'hard',
      question: `In the context of ${step.title}, how should one handle ${step.targetConcepts[i % step.targetConcepts.length] || 'core execution'}?`,
      options: [
        `Apply standard modular separation and maintain clear boundaries.`,
        `Combine all logic into a single monolithic block without validation.`,
        `Bypass error checking to maximize initial loading speed.`,
        `Rely exclusively on default global configurations without tuning.`
      ],
      correctIndex: 0,
      guidingAnswer: {
        corePrinciple: `Maintaining modular boundaries ensures that changes in one section of ${topic} don't cause cascading regressions elsewhere.`,
        whyCorrect: `Modular separation guarantees testability, composability, and clear lifecycle management.`,
        whyWrongBreakdown: [
          `Option B causes tight coupling and makes debugging nearly impossible.`,
          `Option C leads to silent data corruption and runtime crashes.`,
          `Option D ignores environment-specific constraints and scale factors.`
        ],
        keyTakeaway: `Always encapsulate ${step.targetConcepts[i % step.targetConcepts.length] || 'critical logic'} with explicit contracts.`
      }
    });
  }

  // Generate Flashcards
  for (let i = 0; i < fCount; i++) {
    const concept = step.targetConcepts[i % step.targetConcepts.length] || 'Core Concept';
    cards.push({
      id: `fc_${step.id}_${i}_${Date.now()}`,
      stepId: step.id,
      type: 'flashcard',
      topic,
      concept,
      front: {
        term: `${concept} in ${topic}`,
        subtext: `Step ${step.stepNumber}: ${step.title}`,
        categoryBadge: 'Key Paradigm'
      },
      back: {
        definition: `A critical framework rule in ${topic} that governs how ${concept.toLowerCase()} behaves under real workload.`,
        deepExplanation: `When working with ${topic}, ${concept} acts as the linchpin between theoretical requirements and practical deployment. Mastering this allows you to anticipate edge cases and scale effortlessly.`,
        exampleOrAnalogy: `Think of ${concept} like a gearbox in a sports car: it transfers raw power into controlled, scalable forward momentum.`,
        formulaOrRule: `Rule: Explicit invariants > Implicit assumptions.`,
        proTip: `Verify your assumptions with automated regression benchmarks.`
      }
    });
  }

  // Generate Did You Know Cards
  for (let i = 0; i < dykCount; i++) {
    cards.push({
      id: `dyk_${step.id}_${i}_${Date.now()}`,
      stepId: step.id,
      type: 'did_you_know',
      topic,
      concept: step.title,
      headline: `The Surprising Reality of ${topic}`,
      fact: `Over 70% of performance bottlenecks in ${topic} stem not from raw computation, but from inefficient state transitions and cache misses.`,
      contextOrImpact: `By structuring ${step.targetConcepts[0] || 'core architectures'} thoughtfully, engineers frequently achieve 5x-10x throughput increases without upgrading hardware.`,
      surprisingElement: `Optimization is mostly about removing unnecessary work rather than executing tasks faster!`,
      mindBlownCount: 42 + i * 17
    });
  }

  // Shuffle cards for dynamic doomscroll stream (TikTok-style feed interleaving)
  return cards.sort(() => Math.random() - 0.5);
}

/**
 * Public AI Service Interface
 */
export const aiService = {
  /**
   * Test Connectivity for a specific provider or current configuration
   */
  async testConnectivity(
    config: AIConfig,
    targetProvider?: AIProvider
  ): Promise<{ success: boolean; latencyMs: number; message: string; model: string }> {
    const provider = targetProvider || config.activeProvider;
    const startTime = Date.now();

    if (provider === 'demo') {
      return {
        success: true,
        latencyMs: 15,
        message: 'Demo mode active — Instant offline mock generator ready.',
        model: 'built-in-demo-engine'
      };
    }

    try {
      const pingPrompt = 'Respond with exactly: {"status": "ok", "message": "connected"} in JSON format.';
      const res = await callLLM(
        pingPrompt,
        'You are a connectivity test bot. Return valid JSON only.',
        config,
        'test_connectivity',
        provider
      );

      const latencyMs = Date.now() - startTime;
      const parsed = extractJSON<{ status: string; message: string }>(res, { status: 'ok', message: 'connected' });

      return {
        success: true,
        latencyMs,
        message: `Successfully connected! Latency: ${latencyMs}ms`,
        model:
          provider === 'openrouter'
            ? config.openRouterModel || 'Llama 3.3 70B'
            : provider === 'gemini'
            ? config.geminiModel || 'Gemini 1.5 Flash'
            : provider === 'openai'
            ? config.openaiModel || 'GPT-4o Mini'
            : config.customModel || 'Custom AI'
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        message: err.message || 'Connection failed',
        model: 'Error'
      };
    }
  },

  /**
   * Diagnostic assessment generation (3 quick questions)
   */
  async generateDiagnosticQuiz(topic: string, config: AIConfig): Promise<DiagnosticQuestion[]> {
    if (config.activeProvider === 'demo') {
      return getMockDiagnosticQuestions(topic);
    }

    const systemPrompt = `You are an expert diagnostic educator. Create 3 multiple choice diagnostic questions to gauge a student's know-how on the topic: "${topic}".
Output ONLY valid JSON matching this schema:
[
  {
    "id": "diag_1",
    "question": "Question text testing beginner fundamentals",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation",
    "levelTarget": "beginner"
  },
  {
    "id": "diag_2",
    "question": "Question text testing intermediate application and trade-offs",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "explanation": "Brief explanation",
    "levelTarget": "intermediate"
  },
  {
    "id": "diag_3",
    "question": "Question text testing advanced edge-cases and architecture",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 2,
    "explanation": "Brief explanation",
    "levelTarget": "advanced"
  }
]`;

    try {
      const responseText = await callLLM(
        `Create 3 diagnostic multiple choice questions for topic: "${topic}"`,
        systemPrompt,
        config,
        'diagnostic'
      );

      const parsed = extractJSON<DiagnosticQuestion[]>(responseText, []);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed;
      }
    } catch (err) {
      console.warn('AI diagnostic call failed, falling back to mock:', err);
    }

    return getMockDiagnosticQuestions(topic);
  },

  /**
   * Generate structured multi-step learning plan roadmap
   */
  async generateLearningPlan(
    topic: string,
    assessedLevel: UserProficiencyLevel,
    config: AIConfig,
    userGoal?: string
  ): Promise<LearningPlan> {
    if (config.activeProvider === 'demo') {
      return getMockPlan(topic, assessedLevel);
    }

    const systemPrompt = `You are a curriculum designer. Create a 4 to 5 step structured learning plan roadmap for "${topic}" tailored for a student at the "${assessedLevel}" level.
${userGoal ? `The student's goal is: "${userGoal}".` : ''}

Output ONLY valid JSON matching this schema:
{
  "topic": "${topic}",
  "totalEstimatedMinutes": 90,
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "Engaging description of what the user will master",
      "estimatedMinutes": 15,
      "targetConcepts": ["Concept 1", "Concept 2", "Concept 3"]
    }
  ]
}`;

    try {
      const responseText = await callLLM(
        `Generate a step-by-step learning plan for "${topic}" at level "${assessedLevel}"`,
        systemPrompt,
        config,
        'plan_generation'
      );

      const parsed = extractJSON<{ totalEstimatedMinutes?: number; steps?: any[] }>(responseText, {});
      if (parsed.steps && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        const formattedSteps: PlanStep[] = parsed.steps.map((s, idx) => ({
          id: `step_${idx + 1}_${Date.now()}`,
          stepNumber: idx + 1,
          title: s.title || `Step ${idx + 1}`,
          description: s.description || 'Master this module.',
          estimatedMinutes: s.estimatedMinutes || 20,
          targetConcepts: s.targetConcepts || [s.title || 'Core Concept'],
          status: idx === 0 ? 'active' : 'locked',
          masteryScore: 0,
          questionsAnswered: 0,
          correctAnswers: 0
        }));

        return {
          id: 'plan_' + Date.now(),
          topic,
          userGoal,
          assessedLevel,
          totalEstimatedMinutes: parsed.totalEstimatedMinutes || formattedSteps.length * 20,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          steps: formattedSteps,
          activeStepIndex: 0
        };
      }
    } catch (err) {
      console.warn('AI plan generation failed, falling back to mock:', err);
    }

    return getMockPlan(topic, assessedLevel);
  },

  /**
   * Refine and customize plan based on user prompt (Requested feature)
   */
  async refinePlanWithAI(
    currentPlan: LearningPlan,
    userPrompt: string,
    config: AIConfig
  ): Promise<LearningPlan> {
    if (config.activeProvider === 'demo') {
      const updatedSteps = [...currentPlan.steps];
      updatedSteps.push({
        id: `step_custom_${Date.now()}`,
        stepNumber: updatedSteps.length + 1,
        title: `Deep Focus: ${userPrompt.slice(0, 30)}`,
        description: `Customized step added to focus on: ${userPrompt}`,
        estimatedMinutes: 25,
        targetConcepts: ['Custom Application', 'Hands-on Practice'],
        status: 'locked',
        masteryScore: 0,
        questionsAnswered: 0,
        correctAnswers: 0
      });
      return {
        ...currentPlan,
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
        isCustomized: true
      };
    }

    const systemPrompt = `You are a learning plan refiner. The user has an existing learning plan for "${currentPlan.topic}" and wants to customize it according to this instruction:
"${userPrompt}"

Existing steps:
${JSON.stringify(currentPlan.steps.map((s) => ({ stepNumber: s.stepNumber, title: s.title, description: s.description })))}

Refine the steps while keeping completed progress intact if possible.
Output ONLY valid JSON matching this schema:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Title",
      "description": "Description",
      "estimatedMinutes": 20,
      "targetConcepts": ["Concept A", "Concept B"]
    }
  ]
}`;

    try {
      const responseText = await callLLM(
        `Refine learning plan according to user feedback: "${userPrompt}"`,
        systemPrompt,
        config,
        'plan_refine'
      );

      const parsed = extractJSON<{ steps: any[] }>(responseText, { steps: [] });
      if (parsed.steps && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        const newSteps: PlanStep[] = parsed.steps.map((s, idx) => {
          const existing = currentPlan.steps[idx];
          return {
            id: existing ? existing.id : `step_${idx + 1}_${Date.now()}`,
            stepNumber: idx + 1,
            title: s.title || `Step ${idx + 1}`,
            description: s.description || 'Master key principles.',
            estimatedMinutes: s.estimatedMinutes || 20,
            targetConcepts: s.targetConcepts || [s.title],
            status: existing ? existing.status : idx === 0 ? 'active' : 'locked',
            masteryScore: existing ? existing.masteryScore : 0,
            questionsAnswered: existing ? existing.questionsAnswered : 0,
            correctAnswers: existing ? existing.correctAnswers : 0
          };
        });

        return {
          ...currentPlan,
          steps: newSteps,
          updatedAt: new Date().toISOString(),
          isCustomized: true
        };
      }
    } catch (err) {
      console.warn('AI plan refine failed:', err);
    }

    return currentPlan;
  },

  /**
   * Generate card batch (MCQ, 3D Flashcards, Did-You-Know) for the active step
   */
  async generateStepBatch(
    step: PlanStep,
    topic: string,
    config: AIConfig,
    difficulty: CardDifficulty = 'medium'
  ): Promise<FeedCard[]> {
    if (config.activeProvider === 'demo') {
      return getMockCardsForStep(step, topic, config);
    }

    const qCount = Math.max(1, config.batchQuestionsCount || 3);
    const fCount = Math.max(1, config.batchFlashcardsCount || 3);
    const dykCount = Math.max(1, config.batchDidYouKnowCount || 2);

    const systemPrompt = `You are a viral TikTok-style educational content creator and master tutor.
Generate an engaging doomscrolling feed batch for topic "${topic}", step "${step.title}".
Concepts: ${step.targetConcepts.join(', ')}.
Target Difficulty: ${difficulty}.

Generate exactly:
- ${qCount} Multiple Choice Questions (each with detailed Guiding Answers).
- ${fCount} 3D Flashcards (front term + rich back explanation with examples/analogies).
- ${dykCount} "Did You Know?" Fact cards (fascinating counter-intuitive trivia).

Output ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "concept": "Name of concept",
      "difficulty": "${difficulty}",
      "question": "Engaging multiple choice question",
      "options": ["Correct Option", "Misconception Option 1", "Misconception Option 2", "Misconception Option 3"],
      "correctIndex": 0,
      "guidingAnswer": {
        "corePrinciple": "Core explanation of why it works",
        "whyCorrect": "Detailed reason why correctIndex is right",
        "whyWrongBreakdown": ["Why option B is wrong", "Why option C is wrong", "Why option D is wrong"],
        "keyTakeaway": "Pro mnemonic or rule of thumb"
      }
    }
  ],
  "flashcards": [
    {
      "concept": "Concept name",
      "front": {
        "term": "Term or Key Paradigm",
        "subtext": "Subtext / Context",
        "categoryBadge": "Core Law / Pattern"
      },
      "back": {
        "definition": "Clear concise definition",
        "deepExplanation": "Deeper explanation for intuition",
        "exampleOrAnalogy": "Vivid real world analogy or code example",
        "formulaOrRule": "Golden Rule",
        "proTip": "Pro engineering tip"
      }
    }
  ],
  "didYouKnow": [
    {
      "concept": "Concept",
      "headline": "Mind-blowing title",
      "fact": "Fascinating counter-intuitive fact",
      "contextOrImpact": "Why this matters in practice",
      "surprisingElement": "The surprising realization"
    }
  ]
}`;

    try {
      const responseText = await callLLM(
        `Generate doomscroll card batch for step: "${step.title}" (${topic})`,
        systemPrompt,
        config,
        'batch_cards'
      );

      const parsed = extractJSON<{ questions?: any[]; flashcards?: any[]; didYouKnow?: any[] }>(responseText, {});
      const cards: FeedCard[] = [];

      if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions.forEach((q, i) => {
          cards.push({
            id: `q_${step.id}_${i}_${Date.now()}`,
            stepId: step.id,
            type: 'question',
            topic,
            concept: q.concept || step.title,
            difficulty: q.difficulty || difficulty,
            question: q.question,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            guidingAnswer: q.guidingAnswer || {
              corePrinciple: 'Key concept breakdown.',
              whyCorrect: 'This choice aligns with best practices.',
              whyWrongBreakdown: ['Alternative options have flaws.'],
              keyTakeaway: 'Master the fundamentals.'
            }
          });
        });
      }

      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        parsed.flashcards.forEach((f, i) => {
          cards.push({
            id: `fc_${step.id}_${i}_${Date.now()}`,
            stepId: step.id,
            type: 'flashcard',
            topic,
            concept: f.concept || step.title,
            front: f.front || { term: 'Key Term', categoryBadge: 'Concept' },
            back: f.back || {
              definition: 'Definition',
              deepExplanation: 'Explanation',
              exampleOrAnalogy: 'Analogy'
            }
          });
        });
      }

      if (parsed.didYouKnow && Array.isArray(parsed.didYouKnow)) {
        parsed.didYouKnow.forEach((d, i) => {
          cards.push({
            id: `dyk_${step.id}_${i}_${Date.now()}`,
            stepId: step.id,
            type: 'did_you_know',
            topic,
            concept: d.concept || step.title,
            headline: d.headline || 'Did You Know?',
            fact: d.fact || 'Fascinating fact about ' + topic,
            contextOrImpact: d.contextOrImpact || 'High impact concept.',
            surprisingElement: d.surprisingElement || 'Insightful realization.',
            mindBlownCount: 35 + i * 19
          });
        });
      }

      if (cards.length > 0) {
        // Interleave / shuffle
        return cards.sort(() => Math.random() - 0.5);
      }
    } catch (err) {
      console.warn('AI card batch failed, using mock generator:', err);
    }

    return getMockCardsForStep(step, topic, config);
  },

  /**
   * Craft tailored Deep-Dive prompt for any card (Question, Flashcard, DYK)
   */
  craftDeepDivePrompt(
    card: FeedCard,
    stepTitle: string,
    topic: string,
    targetEngine: DeepDiveTarget
  ): string {
    let cardDetail = '';
    if (card.type === 'question') {
      const q = card as QuestionCard;
      cardDetail = `Question: "${q.question}"\nCore Concept: "${q.concept}"\nGuiding Principle: "${q.guidingAnswer.corePrinciple}"`;
    } else if (card.type === 'flashcard') {
      const f = card as FlashCard;
      cardDetail = `Term / Paradigm: "${f.front.term}"\nDefinition: "${f.back.definition}"\nContext: "${f.back.deepExplanation}"`;
    } else {
      const d = card as DidYouKnowCard;
      cardDetail = `Fact Headline: "${d.headline}"\nFact: "${d.fact}"\nImpact: "${d.contextOrImpact}"`;
    }

    return `Please provide a rigorous, fascinating, in-depth explanation of the following topic within "${topic}" (Module: "${stepTitle}"):

${cardDetail}

Specifically address:
1. First-principles explanation and underlying mechanics.
2. Real-world architectural applications and industry case studies.
3. Common misconceptions or hidden traps.
4. Future trends and related advanced concepts.`;
  },

  /**
   * Execute AI Deep Dive using selected engine (Perplexity / Meta Llama / ChatGPT / Gemini / Custom)
   */
  async executeDeepDive(
    craftedPrompt: string,
    targetEngine: DeepDiveTarget,
    concept: string,
    config: AIConfig
  ): Promise<DeepDiveResponse> {
    let overrideProvider: AIProvider = config.activeProvider;
    let overrideModel = '';

    if (targetEngine === 'perplexity') {
      overrideProvider = 'openrouter';
      overrideModel = 'perplexity/sonar-reasoning';
    } else if (targetEngine === 'meta') {
      overrideProvider = 'openrouter';
      overrideModel = 'meta-llama/llama-3.3-70b-instruct:free';
    } else if (targetEngine === 'chatgpt') {
      overrideProvider = 'openai';
      overrideModel = 'gpt-4o';
    } else if (targetEngine === 'gemini') {
      overrideProvider = 'gemini';
      overrideModel = 'gemini-2.0-flash';
    } else if (targetEngine === 'custom') {
      overrideProvider = 'custom';
    }

    const systemPrompt = `You are a world-class academic tutor and research scientist.
Provide a deep, beautifully formatted markdown breakdown answering the student's inquiry.
Include Key Insights bullets, a vivid Real-World Analogy, and 3 Follow-Up Exploration Questions.`;

    if (config.activeProvider === 'demo') {
      return {
        target: targetEngine,
        model: `${targetEngine}-pro-engine`,
        concept,
        craftedPrompt,
        explanation: `### Deep Dive: ${concept}\n\nUnderstanding **${concept}** from first principles reveals how foundational rules dictate real-world system behavior.\n\n#### 1. First-Principles Mechanics\nAt its core, this concept establishes strict boundaries between internal state and external interaction. By enforcing invariants, systems prevent synchronization lag, deadlocks, and cascading failures.\n\n#### 2. Practical Case Study\nHigh-reliability engineering teams utilize this exact paradigm to isolate critical processing pipelines, enabling 99.999% uptime during massive traffic spikes.\n\n#### 3. Key Takeaway\nAlways optimize for developer mental clarity and deterministic contracts before applying micro-optimizations.`,
        keyInsights: [
          'Guarantees predictable state transitions under high load.',
          'Eliminates hidden coupling across component boundaries.',
          'Provides measurable architectural maintainability gains.'
        ],
        realWorldAnalogy:
          'Like an airlock on a space station, it isolates high-pressure operations so failures remain strictly local without compromising the entire vessel.',
        followUpQuestions: [
          `How does ${concept} interact with distributed fault tolerance?`,
          `What are the memory and latency overheads at extreme scale?`,
          `Which modern frameworks implement this pattern natively?`
        ]
      };
    }

    try {
      const responseText = await callLLM(
        craftedPrompt,
        systemPrompt,
        config,
        'deep_dive',
        overrideProvider,
        overrideModel
      );

      return {
        target: targetEngine,
        model: overrideModel || `${targetEngine}-default`,
        concept,
        craftedPrompt,
        explanation: responseText || 'No response generated.',
        keyInsights: [
          `Directly impacts system resilience and scalability for ${concept}.`,
          'Ensures clean component encapsulation.',
          'Crucial for passing advanced competence evaluations.'
        ],
        realWorldAnalogy: `Acts like a traffic control nexus, orchestrating complex signals smoothly.`,
        followUpQuestions: [
          `How can this be benchmarked in production?`,
          `What are the edge case failure modes?`
        ]
      };
    } catch (err: any) {
      return {
        target: targetEngine,
        model: `${targetEngine}-fallback`,
        concept,
        craftedPrompt,
        explanation: `### Deep Dive Explanation (Offline Mode)\n\n${err.message}\n\n*Here is the core summary:* Understanding ${concept} is central to mastering this step. Focus on why trade-offs exist between simplicity and maximum performance.`,
        keyInsights: ['Core mental model is key.'],
        realWorldAnalogy: 'Think of it as structural scaffolding.',
        followUpQuestions: ['How would you apply this in a personal project?']
      };
    }
  }
};
