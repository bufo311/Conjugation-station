/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabKey, Navbar } from './components/Navbar';
import { PracticeScreen } from './components/PracticeScreen';
import { VocabScreen } from './components/VocabScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { VerbsScreen } from './components/VerbsScreen';
import { TensesScreen } from './components/TensesScreen';
import { StatsScreen } from './components/StatsScreen';
import { PyramidProgressView } from './components/PyramidProgressView';
import {
  loadSRSQueue,
  saveSRSQueue,
  loadUserStats,
  saveUserStats,
  INITIAL_STATS,
  getDueCards,
  parseSyncPayload,
} from './engine/srs';
import { syncPyramidsToSRS, PyramidType } from './engine/pyramid';
import { LeitnerCard, UserStats, TenseKey } from './types';
import { Flame, Settings2, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('practice');
  const [stats, setStats] = useState<UserStats>(loadUserStats);
  const [srsCards, setSrsCards] = useState<LeitnerCard[]>(() => {
    const loaded = loadSRSQueue();
    const synced = syncPyramidsToSRS(loaded);
    if (synced.length !== loaded.length) {
      saveSRSQueue(synced);
    }
    return synced;
  });
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);
  const [roadmapInitialType, setRoadmapInitialType] = useState<PyramidType>('verbs');
  const [pendingSync, setPendingSync] = useState<{
    stats: UserStats;
    srsCards: LeitnerCard[];
  } | null>(null);

  // Check URL on load for #sync= or ?sync= and request persistent storage
  useEffect(() => {
    // Request persistent storage protection against browser cache eviction
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    try {
      const hash = window.location.hash;
      const search = window.location.search;
      let syncCode = '';

      if (hash.includes('sync=')) {
        syncCode = hash.split('sync=')[1]?.split('&')[0];
      } else if (search.includes('sync=')) {
        syncCode = search.split('sync=')[1]?.split('&')[0];
      }

      if (syncCode) {
        const decoded = parseSyncPayload(syncCode);
        if (decoded) {
          setPendingSync(decoded);
        }
      }
    } catch (e) {
      console.warn('Sync URL check error:', e);
    }
  }, []);

  const handleApplySync = () => {
    if (!pendingSync) return;
    setStats(pendingSync.stats);
    setSrsCards(pendingSync.srsCards);
    saveUserStats(pendingSync.stats);
    saveSRSQueue(pendingSync.srsCards);
    setPendingSync(null);

    // Clean URL
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      // ignore
    }
    setActiveTab('stats');
  };

  const handleDismissSync = () => {
    setPendingSync(null);
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      // ignore
    }
  };

  // Sync to localStorage and synchronize pyramid layers
  const handleUpdateStats = (newStats: UserStats) => {
    setStats(newStats);
    saveUserStats(newStats);
  };

  const handleUpdateSRS = (newCards: LeitnerCard[]) => {
    const synced = syncPyramidsToSRS(newCards);
    setSrsCards(synced);
    saveSRSQueue(synced);
  };

  const handleResetAllData = () => {
    setStats(INITIAL_STATS);
    const initialSynced = syncPyramidsToSRS([]);
    setSrsCards(initialSynced);
    saveUserStats(INITIAL_STATS);
    saveSRSQueue(initialSynced);
  };

  const handleStartTensePractice = (tense: TenseKey) => {
    setActiveTab('practice');
  };

  const handleOpenRoadmap = (type: PyramidType = 'verbs') => {
    setRoadmapInitialType(type);
    setShowRoadmapModal(true);
  };

  const dueCards = getDueCards(srsCards);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-blue-200">
      {/* Pending Sync Banner Modal */}
      {pendingSync && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Sync Data Found!
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              We detected a progress transfer link from another device. Would you like to load:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div>• <strong>{pendingSync.stats.streak} day streak</strong></div>
              <div>• <strong>{pendingSync.stats.totalAnswered} answers</strong> logged</div>
              <div>• <strong>{pendingSync.srsCards.length} Leitner cards</strong></div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplySync}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Import & Sync
              </button>
              <button
                onClick={handleDismissSync}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              CS
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                Conjugation Station
              </h1>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <span>100% Offline</span>
                <span>·</span>
                <span>Spaced Repetition</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Pyramid Roadmap shortcut */}
            <button
              onClick={() => handleOpenRoadmap('verbs')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              title="Pirámides de Progresión"
              aria-label="Roadmap de Dominio"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[11px]">Roadmap</span>
            </button>

            {/* Streak indicator */}
            <div
              onClick={() => setActiveTab('stats')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 font-black text-xs cursor-pointer active:scale-95 transition-all"
              title="Day streak"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{stats.streak}</span>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setActiveTab('stats')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-20">
        {activeTab === 'practice' && (
          <PracticeScreen
            stats={stats}
            onUpdateStats={handleUpdateStats}
            srsCards={srsCards}
            onUpdateSRS={handleUpdateSRS}
            onOpenSettings={() => setActiveTab('stats')}
            onOpenRoadmap={handleOpenRoadmap}
          />
        )}

        {activeTab === 'vocab' && (
          <VocabScreen
            stats={stats}
            onUpdateStats={handleUpdateStats}
            srsCards={srsCards}
            onUpdateSRS={handleUpdateSRS}
            onOpenRoadmap={handleOpenRoadmap}
          />
        )}

        {activeTab === 'review' && (
          <ReviewScreen
            srsCards={srsCards}
            onUpdateSRS={handleUpdateSRS}
            stats={stats}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeTab === 'verbs' && (
          <VerbsScreen
            stats={stats}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeTab === 'tenses' && (
          <TensesScreen
            onStartTensePractice={handleStartTensePractice}
          />
        )}

        {activeTab === 'stats' && (
          <StatsScreen
            stats={stats}
            onUpdateStats={handleUpdateStats}
            srsCards={srsCards}
            onUpdateSRS={handleUpdateSRS}
            onResetAllData={handleResetAllData}
            onOpenRoadmap={handleOpenRoadmap}
          />
        )}
      </main>

      {/* Full-Screen / Modal Pyramid Progress Roadmap */}
      {showRoadmapModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-lg max-h-[92vh] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto">
            <PyramidProgressView
              srsCards={srsCards}
              initialType={roadmapInitialType}
              onClose={() => setShowRoadmapModal(false)}
              onStartPractice={(type) => {
                setShowRoadmapModal(false);
                if (type === 'vocab' || type === 'frases') {
                  setActiveTab('vocab');
                } else {
                  setActiveTab('practice');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dueCount={dueCards.length}
      />
    </div>
  );
}
