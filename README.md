# 🧠 ScrollLearn AI — Doomscroll to Master Anything

An interactive educational web application that transforms structured learning into a **TikTok / Reels-style vertical doomscrolling feed**, powered by **OpenRouter (with Web Search & Free Models)**, **Google Gemini**, **OpenAI**, and **Custom AI** endpoints.

---

## 🌟 Key Features

- 🤖 **Multi-Provider AI Engine**:
  - **OpenRouter**: Access full model catalog, curated **Free Models** (Llama 3.3 70B, Gemini 2.0 Flash, DeepSeek R1), and **Web Search Integration** (`plugins: [{ id: 'web' }]` / `:online`).
  - **Google Gemini**: Direct API (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`).
  - **OpenAI**: Direct API (`gpt-4o`, `gpt-4o-mini`).
  - **Custom AI Endpoint**: Connect any local or self-hosted OpenAI-compatible server (Ollama, LM Studio, vLLM, Groq).
  - **Built-in Demo Generator**: High-quality instant offline courses for testing.

- 🎯 **Diagnostic Knowledge Assessment**:
  - Asks 3 interactive multiple-choice questions on any topic to gauge baseline know-how (**Beginner**, **Intermediate**, **Advanced**) before creating the curriculum.

- 🗺️ **Dynamic Roadmap & Live Plan Editor**:
  - View the structured multi-step plan at any time.
  - **Edit steps**, add new milestones, delete, reorder, or toggle completion status.
  - **Prompt AI to Refine Plan**: Type custom instructions (*"Make it more practical with code exercises"*, *"Add security milestone"*) to re-structure the roadmap on the fly.

- 📱 **TikTok / Reels-Style Vertical Doomscrolling Feed**:
  - 60fps smooth snap scrolling.
  - **Full Mobile Support**: Touch drag, swipe up/down with velocity detection.
  - **Desktop Controls**: Keyboard navigation (Arrow Up/Down, Spacebar, J/K) and floating quick-jump buttons.

- 🃏 **Interactive Card Formats**:
  - **Multiple-Choice Questions (MCQ)**: Instant feedback + expandable **Guiding Answer** breakdown (core principle, why right, why others fail, pro tip).
  - **3D Flip Flashcards**: Interactive 360/180-degree card flip with deep dive breakdowns, formulas, and self-ratings.
  - **"Did You Know?" Cards**: Counter-intuitive trivia with real-world impact and animated **"Mind Blown 🤯"** reaction counter.

- ✨ **AI Deep Dive Explorer on Every Card**:
  - Glowing AI action button on every card.
  - Choose target AI: **Perplexity** (with web sources), **Meta Llama 3**, **ChatGPT**, **Google Gemini**, or **Custom AI**.
  - Auto-crafts contextual prompts ready to execute inside the app or launch directly in Perplexity / ChatGPT / Meta AI.

- 📊 **Real-Time API Call Activity & Log Panel**:
  - Tracks all outgoing requests, responses, latency in milliseconds, and JSON payload inspector.

- 🔌 **Settings with Test Connectivity**:
  - One-click ping verification for every configured AI provider with response speed and status badge.
  - Configure batch card counts (questions, flashcards, facts per batch).

- 🏆 **Gamification & Badges**:
  - Top HUD progress gauge (% completed, active step indicator).
  - XP counter, daily streak flame 🔥, unlockable achievement badge shelf.

- 🌓 **Themes**: Radiant Dark Mode and crisp Light Mode with glassmorphic styling.

---

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/<your-username>/ai-Learn-with-ddom-scrolling.git
cd ai-Learn-with-ddom-scrolling

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Deploy to GitHub Pages

### Option 1: Automatic GitHub Actions (Recommended)
1. Push your repository to GitHub (`main` or `master` branch).
2. On GitHub, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically build and publish your app on every commit!

### Option 2: Manual CLI Deployment
```bash
npm run deploy
```

---

## 🔒 Privacy & Security

All API keys entered in the Settings modal are stored locally in the browser's `localStorage` and sent directly to the respective AI endpoints. Keys are never sent to any intermediary server.
