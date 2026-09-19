import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuestionCardView } from './cards/QuestionCardView';
import { FlashcardView } from './cards/FlashcardView';
import { DidYouKnowCardView } from './cards/DidYouKnowCardView';
import {
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Layers,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { QuestionCard, FlashCard, DidYouKnowCard } from '../types';

export const DoomscrollFeed: React.FC = () => {
  const {
    feedCards,
    currentCardIndex,
    setCurrentCardIndex,
    nextCard,
    prevCard,
    isLoadingFeed,
    learningPlan,
    advanceToStep
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Sync scroll position when index changes
  useEffect(() => {
    if (containerRef.current && feedCards.length > 0) {
      const cardElements = containerRef.current.querySelectorAll('.feed-card-wrapper');
      const targetEl = cardElements[currentCardIndex];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentCardIndex, feedCards.length]);

  // Handle scroll snap updates from user scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight === 0) return;
    const newIdx = Math.round(scrollTop / clientHeight);
    if (newIdx >= 0 && newIdx < feedCards.length && newIdx !== currentCardIndex) {
      setCurrentCardIndex(newIdx);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        prevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    const diff = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 45;

    if (diff > minSwipeDistance) {
      // Swipe Up -> Next Card
      nextCard();
    } else if (diff < -minSwipeDistance) {
      // Swipe Down -> Prev Card
      prevCard();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (isLoadingFeed && feedCards.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Crafting personalized doomscroll stream...
        </p>
      </div>
    );
  }

  if (feedCards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
        <p>No cards available. Pick a topic to begin doomscrolling!</p>
      </div>
    );
  }

  const currentCard = feedCards[currentCardIndex];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Top Floating Batch Progress Pill */}
      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 35,
          background: 'rgba(10, 14, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '0.25rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <span>Card {currentCardIndex + 1} of {feedCards.length}</span>
        <span style={{ color: 'var(--border-medium)' }}>•</span>
        <span style={{ color: 'var(--accent-primary)' }}>
          {currentCard?.type === 'question' ? 'Quiz' : currentCard?.type === 'flashcard' ? '3D Flashcard' : 'Fact'}
        </span>
      </div>

      {/* Main Snap Scrolling Container */}
      <div
        ref={containerRef}
        className="doomscroll-container"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {feedCards.map((card, idx) => (
          <div key={card.id} className="feed-card-wrapper">
            {card.type === 'question' && <QuestionCardView card={card as QuestionCard} />}
            {card.type === 'flashcard' && <FlashcardView card={card as FlashCard} />}
            {card.type === 'did_you_know' && <DidYouKnowCardView card={card as DidYouKnowCard} />}
          </div>
        ))}
      </div>

      {/* Floating Action Buttons for Quick Desktop Nav */}
      <div className="floating-nav-controls">
        <button
          className="nav-fab-btn"
          onClick={prevCard}
          disabled={currentCardIndex === 0}
          title="Previous Card (↑ / k)"
          style={{ opacity: currentCardIndex === 0 ? 0.3 : 1 }}
        >
          <ChevronUp size={22} />
        </button>

        <button
          className="nav-fab-btn"
          onClick={nextCard}
          disabled={currentCardIndex === feedCards.length - 1}
          title="Next Card (↓ / j / Space)"
          style={{
            opacity: currentCardIndex === feedCards.length - 1 ? 0.3 : 1,
            background: currentCardIndex < feedCards.length - 1 ? 'var(--accent-primary)' : undefined,
            color: currentCardIndex < feedCards.length - 1 ? 'white' : undefined
          }}
        >
          <ChevronDown size={22} />
        </button>
      </div>
    </div>
  );
};
