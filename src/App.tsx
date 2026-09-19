import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { TopicInputHero } from './components/TopicInputHero';
import { DoomscrollFeed } from './components/DoomscrollFeed';
import { DiagnosticModal } from './components/DiagnosticModal';
import { PlanRoadmapModal } from './components/PlanRoadmapModal';
import { SettingsModal } from './components/SettingsModal';
import { AIDeepDiveModal } from './components/AIDeepDiveModal';
import { APILogPanel } from './components/APILogPanel';
import { StepCelebrationModal } from './components/StepCelebrationModal';
import { BadgesModal } from './components/BadgesModal';

const MainContent: React.FC = () => {
  const { learningPlan } = useApp();

  return (
    <div className="app-container">
      <Header />
      <main className="main-viewport">
        {learningPlan ? <DoomscrollFeed /> : <TopicInputHero />}
      </main>

      {/* Global Modals & Drawers */}
      <DiagnosticModal />
      <PlanRoadmapModal />
      <SettingsModal />
      <AIDeepDiveModal />
      <APILogPanel />
      <StepCelebrationModal />
      <BadgesModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
