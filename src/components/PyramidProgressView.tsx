import React, { useState } from 'react';
import { LeitnerCard } from '../types';
import {
  PyramidType,
  computeVerbsPyramid,
  computeVocabPyramid,
  computeFrasesPyramid,
  PyramidLayer,
  getVerbLevel,
  getVocabLevel,
} from '../engine/pyramid';
import { speakSpanish } from '../utils/audio';
import {
  Layers,
  Lock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Volume2,
  Award,
  ArrowRight,
  TrendingUp,
  X,
  Target,
  BookA,
  MessageSquare,
} from 'lucide-react';

interface PyramidProgressViewProps {
  srsCards: LeitnerCard[];
  initialType?: PyramidType;
  onStartPractice?: (type: PyramidType) => void;
  onClose?: () => void;
}

export const PyramidProgressView: React.FC<PyramidProgressViewProps> = ({
  srsCards,
  initialType = 'verbs',
  onStartPractice,
  onClose,
}) => {
  const [selectedPyramid, setSelectedPyramid] = useState<PyramidType>(initialType);
  const [activeLayerModal, setActiveLayerModal] = useState<PyramidLayer | null>(null);

  const verbsPyramid = computeVerbsPyramid(srsCards);
  const vocabPyramid = computeVocabPyramid(srsCards);
  const frasesPyramid = computeFrasesPyramid(srsCards);

  const currentPyramid =
    selectedPyramid === 'verbs'
      ? verbsPyramid
      : selectedPyramid === 'vocab'
      ? vocabPyramid
      : frasesPyramid;

  const getItemLevel = (item: any): number => {
    if (selectedPyramid === 'verbs') {
      return getVerbLevel(item.infinitive, srsCards);
    }
    return getVocabLevel(item.id, srsCards);
  };

  const getItemLabel = (item: any): { es: string; en: string; article?: string } => {
    if (selectedPyramid === 'verbs') {
      return {
        es: item.infinitive,
        en: item.translation,
      };
    }
    return {
      es: item.es,
      en: item.en,
      article: item.article,
    };
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
              Pirámide de Progresión Adaptativa
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              Roadmap de Dominio
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                aria-label="Cerrar Roadmap"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Cada capa desbloquea nuevos elementos cuando dominas al menos el <strong>80%</strong> en Nivel Leitner 3+.
          Toca cualquier capa para ver qué elementos faltan para el siguiente desbloqueo.
        </p>

        {/* Pyramid switcher chips */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setSelectedPyramid('verbs')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedPyramid === 'verbs'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Verbos</span>
          </button>
          <button
            onClick={() => setSelectedPyramid('vocab')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedPyramid === 'vocab'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookA className="w-3.5 h-3.5" />
            <span>Vocab</span>
          </button>
          <button
            onClick={() => setSelectedPyramid('frases')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedPyramid === 'frases'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Frases</span>
          </button>
        </div>
      </div>

      {/* Pyramid Overview Metric Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold opacity-90">
          <span>{currentPyramid.title}</span>
          <span>
            Capa {currentPyramid.currentLayerNumber} de {currentPyramid.layers.length}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-black tracking-tight">
            {currentPyramid.totalMastered} / {currentPyramid.totalUnlockedItems}
          </div>
          <span className="text-xs bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full font-bold">
            {currentPyramid.totalUnlockedItems > 0
              ? Math.round((currentPyramid.totalMastered / currentPyramid.totalUnlockedItems) * 100)
              : 0}
            % Dominado
          </span>
        </div>
        <p className="text-xs opacity-85">{currentPyramid.summaryText}</p>
      </div>

      {/* Stacked Triangle / Stepped Pyramid Visualization */}
      <div className="space-y-2">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
          Capas de la Pirámide ({currentPyramid.layers.length})
        </div>

        <div className="flex flex-col-reverse gap-2">
          {currentPyramid.layers.map((layer) => {
            const isCurrent = layer.layerNumber === currentPyramid.currentLayerNumber;
            const isCompleted = layer.masteredCount >= layer.requiredToUnlock;

            // Width narrowing slightly towards the summit for pyramid feel
            const maxLayers = currentPyramid.layers.length;
            const widthPct = 100 - (layer.layerNumber - 1) * (20 / maxLayers);

            return (
              <div
                key={layer.layerNumber}
                onClick={() => setActiveLayerModal(layer)}
                style={{ width: `${Math.max(82, widthPct)}%`, margin: '0 auto' }}
                className={`cursor-pointer rounded-2xl p-3.5 border transition-all active:scale-[0.98] select-none ${
                  !layer.isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 opacity-75 hover:opacity-90'
                    : isCurrent
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/30'
                    : isCompleted
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Status Icon */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        !layer.isUnlocked
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {!layer.isUnlocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>L{layer.layerNumber}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900 dark:text-white">
                        <span>Capa {layer.layerNumber}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-black uppercase">
                            Activa
                          </span>
                        )}
                        {isCompleted && layer.isUnlocked && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black uppercase">
                            Desbloqueada
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {layer.isUnlocked
                          ? `${layer.masteredCount}/${layer.totalCount} dominados (Meta: ${layer.requiredToUnlock})`
                          : layer.unlockCondition}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-xs font-bold">{layer.progressPct}%</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Layer mini progress bar */}
                {layer.isUnlocked && (
                  <div className="mt-2 w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${layer.progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Layer Detail Modal (lists items with per-item Leitner level dots) */}
      {activeLayerModal && (
        <div
          onClick={() => setActiveLayerModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[85vh] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col space-y-4"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Capa {activeLayerModal.layerNumber}
                  </span>
                  {activeLayerModal.isUnlocked ? (
                    <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                      {activeLayerModal.masteredCount}/{activeLayerModal.totalCount} Dominados (L3+)
                    </span>
                  ) : (
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Bloqueada
                    </span>
                  )}
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white mt-0.5">
                  Elementos de la Capa ({activeLayerModal.totalCount})
                </h3>
              </div>
              <button
                onClick={() => setActiveLayerModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unlock Status Notice */}
            {!activeLayerModal.isUnlocked ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Condición de desbloqueo:</strong> {activeLayerModal.unlockCondition}
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Los elementos con <strong className="text-emerald-600">Nivel 3+</strong> cuentan como dominados.
                Necesitas {activeLayerModal.requiredToUnlock} para desbloquear la siguiente capa.
              </div>
            )}

            {/* Items list with 5 Leitner level dots */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1 space-y-1">
              {activeLayerModal.items.map((item: any, idx: number) => {
                const info = getItemLabel(item);
                const lvl = getItemLevel(item);
                const isMastered = lvl >= 3;

                return (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1.5 font-black text-sm text-slate-900 dark:text-white">
                        {info.article && (
                          <span className="text-slate-400 text-xs font-semibold">
                            {info.article}
                          </span>
                        )}
                        <span>{info.es}</span>
                        <button
                          onClick={() => speakSpanish(info.es)}
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                          title="Pronunciar"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500">{info.en}</div>
                    </div>

                    {/* Leitner Level Dots & Badge */}
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        {[1, 2, 3, 4, 5].map((dotLvl) => (
                          <span
                            key={dotLvl}
                            className={`w-2.5 h-2.5 rounded-full inline-block transition-colors ${
                              lvl >= dotLvl
                                ? dotLvl >= 3
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-600'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                            title={`Nivel ${dotLvl}`}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] font-bold">
                        {isMastered ? (
                          <span className="text-emerald-600 font-extrabold">
                            ✓ Nivel {lvl} (Dominado)
                          </span>
                        ) : lvl > 0 ? (
                          <span className="text-amber-600 font-semibold">
                            Nivel {lvl} (Falta {3 - lvl})
                          </span>
                        ) : (
                          <span className="text-slate-400">Nivel 1 (Nuevo)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveLayerModal(null);
                  if (onStartPractice) {
                    onStartPractice(selectedPyramid);
                  }
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Practicar este Mazo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
