import React, { useState, useRef, useMemo } from 'react';
import { UserStats, TenseKey, LeitnerCard } from '../types';
import { TENSE_NAMES } from '../engine/conjugator';
import {
  INITIAL_STATS,
  saveUserStats,
  saveSRSQueue,
  downloadJsonBackup,
  generateSyncPayload,
  parseSyncPayload,
} from '../engine/srs';
import { downloadSelfContainedHtml } from '../utils/exportHtml';
import {
  Flame,
  Award,
  CheckCircle,
  BarChart3,
  AlertTriangle,
  RotateCcw,
  Download,
  Settings,
  Volume2,
  Trash2,
  HelpCircle,
  Share2,
  Upload,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Globe,
  BookA,
  TrendingUp,
  Layers,
  KeyRound,
} from 'lucide-react';
import { PyramidProgressView } from './PyramidProgressView';
import { PyramidType } from '../engine/pyramid';

interface StatsScreenProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  srsCards: LeitnerCard[];
  onUpdateSRS: (newCards: LeitnerCard[]) => void;
  onResetAllData: () => void;
  onOpenRoadmap?: (type?: PyramidType) => void;
}

const TENSE_KEYS: TenseKey[] = [
  'presente',
  'preterito',
  'imperfecto',
  'futuro',
  'condicional',
  'preterito_perfecto',
  'presente_subjuntivo',
  'imperfecto_subjuntivo',
  'imperativo_afirmativo',
  'imperativo_negativo',
];

export const StatsScreen: React.FC<StatsScreenProps> = ({
  stats,
  onUpdateStats,
  srsCards,
  onUpdateSRS,
  onResetAllData,
  onOpenRoadmap,
}) => {
  const [subView, setSubView] = useState<'roadmap' | 'stats'>('stats');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importCodeText, setImportCodeText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ultra-compact mathematical progress code
  const syncCode = useMemo(() => generateSyncPayload(stats, srsCards), [stats, srsCards]);

  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 0;

  // Vocab metrics
  const vocabCards = srsCards.filter((c) => c.itemType === 'vocab');
  const dueVocabCount = vocabCards.filter((c) => c.nextReviewDate <= Date.now()).length;
  const masteredVocabCount = vocabCards.filter((c) => c.level >= 4).length;

  const core500Stats = stats.vocabStats?.['core500'] || { answered: 0, correct: 0 };
  const frasesStats = stats.vocabStats?.['frases'] || { answered: 0, correct: 0 };

  const core500Accuracy =
    core500Stats.answered > 0
      ? Math.round((core500Stats.correct / core500Stats.answered) * 100)
      : 0;

  const frasesAccuracy =
    frasesStats.answered > 0
      ? Math.round((frasesStats.correct / frasesStats.answered) * 100)
      : 0;

  // 10 Weakest verbs
  const weakVerbsList = Object.entries(stats.verbErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Settings update helpers
  const handleToggleVosotros = () => {
    onUpdateStats({
      ...stats,
      settings: {
        ...stats.settings,
        includeVosotros: !stats.settings.includeVosotros,
      },
    });
  };

  const handleToggleMode = () => {
    onUpdateStats({
      ...stats,
      settings: {
        ...stats.settings,
        defaultMode: stats.settings.defaultMode === 'choice' ? 'type' : 'choice',
      },
    });
  };

  const handleToggleSound = () => {
    onUpdateStats({
      ...stats,
      settings: {
        ...stats.settings,
        soundEffects: !stats.settings.soundEffects,
      },
    });
  };

  const handleToggleAutoSpeak = () => {
    onUpdateStats({
      ...stats,
      settings: {
        ...stats.settings,
        autoSpeak: !stats.settings.autoSpeak,
      },
    });
  };

  // Generate transfer link & copy to clipboard
  const handleCopySyncLink = async () => {
    try {
      const payload = generateSyncPayload(stats, srsCards);
      const url = `${window.location.origin}${window.location.pathname}#sync=${payload}`;
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (e) {
      // Fallback without prompt
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  // Copy ultra-compact short code directly
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 3000);
    } catch (e) {
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 3000);
    }
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        if (parsed.stats) {
          onUpdateStats(parsed.stats);
          if (Array.isArray(parsed.srsCards)) {
            onUpdateSRS(parsed.srsCards);
          }
          setShowImportModal(false);
          setRestoreSuccessMessage('¡Progreso restaurado correctamente desde el archivo JSON!');
          setTimeout(() => setRestoreSuccessMessage(null), 4000);
        } else {
          setImportError('Formato de archivo inválido.');
        }
      } catch (err) {
        setImportError('Error al procesar el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Import text / sync payload
  const handleImportTextSubmit = () => {
    setImportError(null);
    let code = importCodeText.trim();
    if (!code) return;

    if (code.includes('#sync=')) {
      code = code.split('#sync=')[1].split('&')[0];
    } else if (code.includes('?sync=')) {
      code = code.split('?sync=')[1].split('&')[0];
    }

    const syncResult = parseSyncPayload(code);
    if (syncResult) {
      onUpdateStats(syncResult.stats);
      onUpdateSRS(syncResult.srsCards);
      setShowImportModal(false);
      setImportCodeText('');
      setRestoreSuccessMessage('¡Progreso, racha y tarjetas sincronizados correctamente!');
      setTimeout(() => setRestoreSuccessMessage(null), 4000);
      return;
    }

    try {
      const parsed = JSON.parse(code);
      if (parsed.stats) {
        onUpdateStats(parsed.stats);
        if (Array.isArray(parsed.srsCards)) {
          onUpdateSRS(parsed.srsCards);
        }
        setShowImportModal(false);
        setImportCodeText('');
        setRestoreSuccessMessage('¡Progreso restaurado con éxito!');
        setTimeout(() => setRestoreSuccessMessage(null), 4000);
        return;
      }
    } catch (e) {
      // ignore
    }

    setImportError('No se pudo reconocer el código de progreso o archivo. Verifica que esté completo.');
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-16">
      {restoreSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{restoreSuccessMessage}</span>
        </div>
      )}

      {/* Top Section View Toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setSubView('roadmap')}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            subView === 'roadmap'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Roadmap de Progreso</span>
        </button>
        <button
          onClick={() => setSubView('stats')}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            subView === 'stats'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas & Ajustes</span>
        </button>
      </div>

      {/* VIEW 1: PYRAMID PROGRESS ROADMAP */}
      {subView === 'roadmap' && (
        <div className="animate-in fade-in space-y-4">
          <PyramidProgressView srsCards={srsCards} />
        </div>
      )}

      {/* VIEW 2: STATS, METRICS, SYNC & SETTINGS */}
      {subView === 'stats' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top metrics summary */}
          <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
          <div className="w-8 h-8 mx-auto rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mb-1">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.streak}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Day Streak
          </div>
        </div>

        {/* Total answered */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
          <div className="w-8 h-8 mx-auto rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-1">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalAnswered}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Answered
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
          <div className="w-8 h-8 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {overallAccuracy}%
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Accuracy
          </div>
        </div>
      </div>

      {/* ULTRA-COMPACT PROGRESS CODE & BACKUP CARD */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 border-2 border-blue-200 dark:border-blue-900/60 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Código de Respaldo y Progreso
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Guarda este código para no perder nunca tus avances
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {syncCode.length} caracteres
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Tus datos se guardan de forma privada en tu navegador. Para conservar tu racha, respuestas, tarjetas Leitner y niveles de pirámides si borras el historial o cambias de dispositivo, <strong>copia este código corto</strong>:
        </p>

        {/* Display Short Code Box */}
        <div className="relative">
          <div className="p-3 bg-white dark:bg-slate-950 border border-blue-300 dark:border-slate-800 rounded-2xl font-mono text-xs text-blue-900 dark:text-blue-200 break-all select-all max-h-24 overflow-y-auto leading-relaxed shadow-inner">
            {syncCode}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopyCode}
            className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {copyCodeSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copyCodeSuccess ? '¡Código Copiado!' : 'Copiar Código'}</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Restaurar Progreso</span>
          </button>
        </div>

        {copyCodeSuccess && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold text-center animate-in fade-in">
            ✓ ¡Código copiado al portapapeles! Guárdalo en tus notas para restaurarlo cuando quieras.
          </p>
        )}

        {/* Secondary sync link & file backup */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 dark:border-slate-800">
          <button
            onClick={handleCopySyncLink}
            className="py-2.5 px-3 rounded-xl bg-blue-50/70 dark:bg-slate-800/60 hover:bg-blue-100/70 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{copySuccess ? '¡Enlace Copiado!' : 'Enlace Directo'}</span>
          </button>

          <button
            onClick={() => downloadJsonBackup(stats, srsCards)}
            className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .json</span>
          </button>
        </div>
      </div>

      {/* Accuracy per tense */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Accuracy Per Tense
          </h3>
          <span className="text-[11px] text-slate-400">
            Live local tracking
          </span>
        </div>

        <div className="space-y-2.5">
          {TENSE_KEYS.map((tense) => {
            const data = stats.tenseStats[tense] || { answered: 0, correct: 0 };
            const pct = data.answered > 0 ? Math.round((data.correct / data.answered) * 100) : 0;
            return (
              <div key={tense} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">
                    {TENSE_NAMES[tense]}
                  </span>
                  <span className="text-slate-500">
                    {data.answered > 0 ? `${pct}% (${data.correct}/${data.answered})` : 'Unattempted'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vocabulary Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookA className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Progreso de Vocabulario
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mazos Core 500 y Frases
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {vocabCards.length} en SRS
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {vocabCards.length}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
              En Memoria
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {masteredVocabCount}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
              Dominadas (L4+)
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-lg font-black text-blue-600 dark:text-blue-400">
              {dueVocabCount}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
              Pendientes Hoy
            </div>
          </div>
        </div>

        {/* Breakdown by deck */}
        <div className="space-y-3 pt-1">
          {/* Core 500 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800 dark:text-slate-200">
                Core 500 (Frecuencia)
              </span>
              <span className="text-slate-500">
                {core500Stats.answered > 0
                  ? `${core500Accuracy}% (${core500Stats.correct}/${core500Stats.answered})`
                  : 'Sin intentos'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${core500Accuracy}%` }}
              />
            </div>
          </div>

          {/* Frases */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800 dark:text-slate-200">
                Frases & Giros Naturales
              </span>
              <span className="text-slate-500">
                {frasesStats.answered > 0
                  ? `${frasesAccuracy}% (${frasesStats.correct}/${frasesStats.answered})`
                  : 'Sin intentos'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${frasesAccuracy}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 10 Weakest Verbs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Top 10 Weakest Verbs
          </h3>
          <span className="text-[11px] text-slate-400">
            Targeted for Leitner review
          </span>
        </div>

        {weakVerbsList.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No missed verbs recorded yet. Keep practicing to identify weak spots!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {weakVerbsList.map(([inf, count], i) => (
              <div
                key={inf}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[10px]">
                    #{i + 1}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {inf}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                  {count} {count === 1 ? 'error' : 'errors'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences & Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Preferences & Settings
        </h3>

        {/* Toggle Vosotros */}
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Include Vosotros Forms
            </div>
            <div className="text-xs text-slate-500">
              Default is OFF for Latin American focus. Enable for Spain (Castilian).
            </div>
          </div>
          <button
            onClick={handleToggleVosotros}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              stats.settings.includeVosotros ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                stats.settings.includeVosotros ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Default Mode */}
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Default Answer Mode
            </div>
            <div className="text-xs text-slate-500">
              Current: {stats.settings.defaultMode === 'choice' ? 'Multiple Choice' : 'Type-in with Keyboard'}
            </div>
          </div>
          <button
            onClick={handleToggleMode}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
          >
            Switch to {stats.settings.defaultMode === 'choice' ? 'Type' : 'Choice'}
          </button>
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Audio Chimes
            </div>
            <div className="text-xs text-slate-500">
              Synthesized audio feedback on answer check.
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              stats.settings.soundEffects ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                stats.settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto pronunciation */}
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Auto-Pronounce Sentences
            </div>
            <div className="text-xs text-slate-500">
              Hear Spanish speech synthesized offline when answering.
            </div>
          </div>
          <button
            onClick={handleToggleAutoSpeak}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              stats.settings.autoSpeak ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                stats.settings.autoSpeak ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Offline Export button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={downloadSelfContainedHtml}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Standalone Single-File HTML (Airplane Mode)</span>
          </button>
        </div>

        {/* Reset progress button */}
        <div className="pt-2">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset All Progress & SRS Queue</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 space-y-3 animate-in fade-in">
              <div className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                Are you sure? This will permanently delete your streak, answers, accuracy history, and Leitner spaced repetition cards on this device.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onResetAllData();
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* IMPORT / RESTORE MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Restore Progress
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Option A: Paste code/link */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Opción 1: Pegar Código de Progreso (CS-...) o Enlace
              </div>
              <textarea
                value={importCodeText}
                onChange={(e) => setImportCodeText(e.target.value)}
                placeholder="Pega tu código de progreso (ej. CS-...) o enlace aquí..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none focus:border-blue-500"
              />
              <button
                onClick={handleImportTextSubmit}
                disabled={!importCodeText.trim()}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
              >
                Restaurar Progreso
              </button>
            </div>

            {/* Option B: Upload JSON */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 pt-3 border-t">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Opción 2: Subir Archivo de Respaldo (.json)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Seleccionar Archivo JSON
              </button>
            </div>

            {importError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-medium">
                {importError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
