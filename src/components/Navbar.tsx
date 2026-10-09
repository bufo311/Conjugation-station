import React from 'react';
import { Target, BookA, RotateCcw, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';

export type TabKey = 'practice' | 'vocab' | 'review' | 'verbs' | 'tenses' | 'stats';

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  dueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  dueCount,
}) => {
  const tabs = [
    { id: 'practice', label: 'Quiz', icon: Target },
    { id: 'vocab', label: 'Vocab', icon: BookA },
    { id: 'review', label: 'Review', icon: RotateCcw, badge: dueCount },
    { id: 'verbs', label: 'Verbs', icon: BookOpen },
    { id: 'tenses', label: 'Tenses', icon: GraduationCap },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-[padding-bottom] duration-150 shadow-lg"
      style={{
        paddingBottom: 'calc(max(8px, env(safe-area-inset-bottom, 8px)) + var(--browser-bottom-inset, 0px))',
      }}
    >
      <div className="max-w-md mx-auto px-1 flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabKey)}
              className={`relative flex flex-col items-center justify-center flex-1 max-w-[62px] h-14 rounded-2xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black leading-tight ring-2 ring-white dark:ring-slate-900">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

