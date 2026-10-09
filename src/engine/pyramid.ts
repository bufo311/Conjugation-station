import { Verb, VocabEntry, LeitnerCard } from '../types';
import { VERB_LIBRARY, conjugate } from '../data/verbs';
import { VOCAB_CORE_500, VOCAB_FRASES, VOCAB_ADVANCED } from '../data/vocab';

export type PyramidType = 'verbs' | 'vocab' | 'frases' | 'advanced';

export interface PyramidLayer<T = any> {
  layerNumber: number;
  name: string;
  items: T[];
  isUnlocked: boolean;
  isCompleted: boolean;
  masteredCount: number;
  totalCount: number;
  requiredToUnlock: number;
  unlockCondition: string;
  progressPct: number;
}

export interface PyramidStatus<T = any> {
  type: PyramidType;
  title: string;
  layers: PyramidLayer<T>[];
  currentLayerNumber: number; // Highest unlocked layer
  totalMastered: number;
  totalUnlockedItems: number;
  totalItems: number;
  unlockedItems: T[];
  summaryText: string;
}

// Mastery check: An item is MASTERED at Leitner level >= 3 (of 5)
export function getVerbLevel(infinitive: string, cards: LeitnerCard[]): number {
  let maxLvl = 0;
  for (const c of cards) {
    if (c.infinitive === infinitive || c.id.startsWith(`${infinitive}:`)) {
      if (c.level > maxLvl) maxLvl = c.level;
    }
  }
  return maxLvl;
}

export function getVocabLevel(vocabId: string, cards: LeitnerCard[]): number {
  let maxLvl = 0;
  for (const c of cards) {
    if (
      c.vocabId === vocabId ||
      c.id === `vocab:${vocabId}` ||
      c.id === vocabId
    ) {
      if (c.level > maxLvl) maxLvl = c.level;
    }
  }
  return maxLvl;
}

// Compute Verbs Pyramid (12 verbs per layer)
export function computeVerbsPyramid(cards: LeitnerCard[], unlockAll: boolean = false): PyramidStatus<Verb> {
  const LAYER_SIZE = 12;
  const totalLayers = Math.ceil(VERB_LIBRARY.length / LAYER_SIZE);
  const layers: PyramidLayer<Verb>[] = [];

  let previousLayerUnlocked = true;
  let previousLayerMasteredCount = 0;
  let previousLayerTotal = 0;
  let currentLayerNumber = 1;
  let totalMasteredOverall = 0;
  const unlockedItems: Verb[] = [];

  for (let i = 0; i < totalLayers; i++) {
    const layerNum = i + 1;
    const startIdx = i * LAYER_SIZE;
    const endIdx = Math.min(startIdx + LAYER_SIZE, VERB_LIBRARY.length);
    const layerItems = VERB_LIBRARY.slice(startIdx, endIdx);

    const masteredCount = layerItems.filter(
      (v) => getVerbLevel(v.infinitive, cards) >= 3
    ).length;

    totalMasteredOverall += masteredCount;
    const totalCount = layerItems.length;
    const requiredToUnlockNext = Math.ceil(totalCount * 0.8);

    let isUnlocked = false;
    let unlockCondition = '';

    if (unlockAll || layerNum === 1) {
      isUnlocked = true;
    } else {
      const prevReq = Math.ceil(previousLayerTotal * 0.8);
      if (previousLayerUnlocked && previousLayerMasteredCount >= prevReq) {
        isUnlocked = true;
      } else {
        const remaining = Math.max(0, prevReq - previousLayerMasteredCount);
        unlockCondition = `Master at least ${prevReq}/${previousLayerTotal} verbs in Layer ${layerNum - 1} (${remaining} more needed at Leitner Level 3+)`;
      }
    }

    if (isUnlocked) {
      currentLayerNumber = layerNum;
      unlockedItems.push(...layerItems);
    }

    const isCompleted = masteredCount === totalCount;
    const progressPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    layers.push({
      layerNumber: layerNum,
      name: `Layer ${layerNum}`,
      items: layerItems,
      isUnlocked,
      isCompleted,
      masteredCount,
      totalCount,
      requiredToUnlock: requiredToUnlockNext,
      unlockCondition,
      progressPct,
    });

    previousLayerUnlocked = isUnlocked;
    previousLayerMasteredCount = masteredCount;
    previousLayerTotal = totalCount;
  }

  // Summary e.g. "Verbs — Layer 3: 30/36 mastered · 6 to go"
  const currentLayer = layers[currentLayerNumber - 1];
  const totalUnlockedCount = unlockedItems.length;
  const neededToUnlock = Math.max(
    0,
    currentLayer.requiredToUnlock - currentLayer.masteredCount
  );

  let summaryText = unlockAll
    ? `Verbos — Modo Libre (${unlockedItems.length} verbos activos)`
    : `Verbs — Layer ${currentLayerNumber}: ${totalMasteredOverall}/${totalUnlockedCount} mastered`;
  if (!unlockAll && currentLayerNumber < totalLayers && neededToUnlock > 0) {
    summaryText += ` · ${neededToUnlock} to go to unlock Layer ${currentLayerNumber + 1}`;
  } else if (!unlockAll && currentLayerNumber < totalLayers) {
    summaryText += ` · Layer ${currentLayerNumber + 1} ready to unlock!`;
  }

  return {
    type: 'verbs',
    title: 'Verbs Pyramid',
    layers,
    currentLayerNumber: unlockAll ? totalLayers : currentLayerNumber,
    totalMastered: totalMasteredOverall,
    totalUnlockedItems: totalUnlockedCount,
    totalItems: VERB_LIBRARY.length,
    unlockedItems,
    summaryText,
  };
}

// Compute Vocab Pyramid (25 words per layer)
export function computeVocabPyramid(cards: LeitnerCard[], unlockAll: boolean = false): PyramidStatus<VocabEntry> {
  const LAYER_SIZE = 25;
  const totalLayers = Math.ceil(VOCAB_CORE_500.length / LAYER_SIZE);
  const layers: PyramidLayer<VocabEntry>[] = [];

  let previousLayerUnlocked = true;
  let previousLayerMasteredCount = 0;
  let previousLayerTotal = 0;
  let currentLayerNumber = 1;
  let totalMasteredOverall = 0;
  const unlockedItems: VocabEntry[] = [];

  for (let i = 0; i < totalLayers; i++) {
    const layerNum = i + 1;
    const startIdx = i * LAYER_SIZE;
    const endIdx = Math.min(startIdx + LAYER_SIZE, VOCAB_CORE_500.length);
    const layerItems = VOCAB_CORE_500.slice(startIdx, endIdx);

    const masteredCount = layerItems.filter(
      (v) => getVocabLevel(v.id, cards) >= 3
    ).length;

    totalMasteredOverall += masteredCount;
    const totalCount = layerItems.length;
    const requiredToUnlockNext = Math.ceil(totalCount * 0.8);

    let isUnlocked = false;
    let unlockCondition = '';

    if (unlockAll || layerNum === 1) {
      isUnlocked = true;
    } else {
      const prevReq = Math.ceil(previousLayerTotal * 0.8);
      if (previousLayerUnlocked && previousLayerMasteredCount >= prevReq) {
        isUnlocked = true;
      } else {
        const remaining = Math.max(0, prevReq - previousLayerMasteredCount);
        unlockCondition = `Master at least ${prevReq}/${previousLayerTotal} words in Layer ${layerNum - 1} (${remaining} more needed at Level 3+)`;
      }
    }

    if (isUnlocked) {
      currentLayerNumber = layerNum;
      unlockedItems.push(...layerItems);
    }

    const isCompleted = masteredCount === totalCount;
    const progressPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    layers.push({
      layerNumber: layerNum,
      name: `Layer ${layerNum}`,
      items: layerItems,
      isUnlocked,
      isCompleted,
      masteredCount,
      totalCount,
      requiredToUnlock: requiredToUnlockNext,
      unlockCondition,
      progressPct,
    });

    previousLayerUnlocked = isUnlocked;
    previousLayerMasteredCount = masteredCount;
    previousLayerTotal = totalCount;
  }

  const currentLayer = layers[currentLayerNumber - 1];
  const totalUnlockedCount = unlockedItems.length;
  const neededToUnlock = Math.max(
    0,
    currentLayer.requiredToUnlock - currentLayer.masteredCount
  );

  let summaryText = unlockAll
    ? `Vocabulario — Modo Libre (${unlockedItems.length} palabras activas)`
    : `Vocab — Layer ${currentLayerNumber}: ${totalMasteredOverall}/${totalUnlockedCount} mastered`;
  if (!unlockAll && currentLayerNumber < totalLayers && neededToUnlock > 0) {
    summaryText += ` · ${neededToUnlock} to go to unlock Layer ${currentLayerNumber + 1}`;
  }

  return {
    type: 'vocab',
    title: 'Vocab Pyramid',
    layers,
    currentLayerNumber: unlockAll ? totalLayers : currentLayerNumber,
    totalMastered: totalMasteredOverall,
    totalUnlockedItems: totalUnlockedCount,
    totalItems: VOCAB_CORE_500.length,
    unlockedItems,
    summaryText,
  };
}

// Compute Frases Pyramid (15 phrases per layer)
export function computeFrasesPyramid(cards: LeitnerCard[], unlockAll: boolean = false): PyramidStatus<VocabEntry> {
  const LAYER_SIZE = 15;
  const totalLayers = Math.ceil(VOCAB_FRASES.length / LAYER_SIZE);
  const layers: PyramidLayer<VocabEntry>[] = [];

  let previousLayerUnlocked = true;
  let previousLayerMasteredCount = 0;
  let previousLayerTotal = 0;
  let currentLayerNumber = 1;
  let totalMasteredOverall = 0;
  const unlockedItems: VocabEntry[] = [];

  for (let i = 0; i < totalLayers; i++) {
    const layerNum = i + 1;
    const startIdx = i * LAYER_SIZE;
    const endIdx = Math.min(startIdx + LAYER_SIZE, VOCAB_FRASES.length);
    const layerItems = VOCAB_FRASES.slice(startIdx, endIdx);

    const masteredCount = layerItems.filter(
      (v) => getVocabLevel(v.id, cards) >= 3
    ).length;

    totalMasteredOverall += masteredCount;
    const totalCount = layerItems.length;
    const requiredToUnlockNext = Math.ceil(totalCount * 0.8);

    let isUnlocked = false;
    let unlockCondition = '';

    if (unlockAll || layerNum === 1) {
      isUnlocked = true;
    } else {
      const prevReq = Math.ceil(previousLayerTotal * 0.8);
      if (previousLayerUnlocked && previousLayerMasteredCount >= prevReq) {
        isUnlocked = true;
      } else {
        const remaining = Math.max(0, prevReq - previousLayerMasteredCount);
        unlockCondition = `Master at least ${prevReq}/${previousLayerTotal} phrases in Layer ${layerNum - 1} (${remaining} more needed at Level 3+)`;
      }
    }

    if (isUnlocked) {
      currentLayerNumber = layerNum;
      unlockedItems.push(...layerItems);
    }

    const isCompleted = masteredCount === totalCount;
    const progressPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    layers.push({
      layerNumber: layerNum,
      name: `Layer ${layerNum}`,
      items: layerItems,
      isUnlocked,
      isCompleted,
      masteredCount,
      totalCount,
      requiredToUnlock: requiredToUnlockNext,
      unlockCondition,
      progressPct,
    });

    previousLayerUnlocked = isUnlocked;
    previousLayerMasteredCount = masteredCount;
    previousLayerTotal = totalCount;
  }

  const currentLayer = layers[currentLayerNumber - 1];
  const totalUnlockedCount = unlockedItems.length;
  const neededToUnlock = Math.max(
    0,
    currentLayer.requiredToUnlock - currentLayer.masteredCount
  );

  let summaryText = unlockAll
    ? `Frases — Modo Libre (${unlockedItems.length} giros activos)`
    : `Frases — Layer ${currentLayerNumber}: ${totalMasteredOverall}/${totalUnlockedCount} mastered`;
  if (!unlockAll && currentLayerNumber < totalLayers && neededToUnlock > 0) {
    summaryText += ` · ${neededToUnlock} to go to unlock Layer ${currentLayerNumber + 1}`;
  }

  return {
    type: 'frases',
    title: 'Frases Pyramid',
    layers,
    currentLayerNumber: unlockAll ? totalLayers : currentLayerNumber,
    totalMastered: totalMasteredOverall,
    totalUnlockedItems: totalUnlockedCount,
    totalItems: VOCAB_FRASES.length,
    unlockedItems,
    summaryText,
  };
}

// Compute Advanced B2/C1 Pyramid (15 items per layer)
export function computeAdvancedPyramid(cards: LeitnerCard[], unlockAll: boolean = false): PyramidStatus<VocabEntry> {
  const LAYER_SIZE = 15;
  const totalLayers = Math.ceil(VOCAB_ADVANCED.length / LAYER_SIZE);
  const layers: PyramidLayer<VocabEntry>[] = [];

  let previousLayerUnlocked = true;
  let previousLayerMasteredCount = 0;
  let previousLayerTotal = 0;
  let currentLayerNumber = 1;
  let totalMasteredOverall = 0;
  const unlockedItems: VocabEntry[] = [];

  for (let i = 0; i < totalLayers; i++) {
    const layerNum = i + 1;
    const startIdx = i * LAYER_SIZE;
    const endIdx = Math.min(startIdx + LAYER_SIZE, VOCAB_ADVANCED.length);
    const layerItems = VOCAB_ADVANCED.slice(startIdx, endIdx);

    const masteredCount = layerItems.filter(
      (v) => getVocabLevel(v.id, cards) >= 3
    ).length;

    totalMasteredOverall += masteredCount;
    const totalCount = layerItems.length;
    const requiredToUnlockNext = Math.ceil(totalCount * 0.8);

    let isUnlocked = false;
    let unlockCondition = '';

    if (unlockAll || layerNum === 1) {
      isUnlocked = true;
    } else {
      const prevReq = Math.ceil(previousLayerTotal * 0.8);
      if (previousLayerUnlocked && previousLayerMasteredCount >= prevReq) {
        isUnlocked = true;
      } else {
        const remaining = Math.max(0, prevReq - previousLayerMasteredCount);
        unlockCondition = `Master at least ${prevReq}/${previousLayerTotal} items in Layer ${layerNum - 1} (${remaining} more needed at Level 3+)`;
      }
    }

    if (isUnlocked) {
      currentLayerNumber = layerNum;
      unlockedItems.push(...layerItems);
    }

    const isCompleted = masteredCount === totalCount;
    const progressPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    layers.push({
      layerNumber: layerNum,
      name: `Capa Avanzada ${layerNum}`,
      items: layerItems,
      isUnlocked,
      isCompleted,
      masteredCount,
      totalCount,
      requiredToUnlock: requiredToUnlockNext,
      unlockCondition,
      progressPct,
    });

    previousLayerUnlocked = isUnlocked;
    previousLayerMasteredCount = masteredCount;
    previousLayerTotal = totalCount;
  }

  const currentLayer = layers[currentLayerNumber - 1];
  const totalUnlockedCount = unlockedItems.length;

  let summaryText = unlockAll
    ? `Avanzado C1 — Modo Libre (${unlockedItems.length} ítems activos)`
    : `Avanzado C1 — Capa ${currentLayerNumber}: ${totalMasteredOverall}/${totalUnlockedCount} dominados`;

  return {
    type: 'advanced',
    title: 'Pirámide Avanzada (B2/C1)',
    layers,
    currentLayerNumber: unlockAll ? totalLayers : currentLayerNumber,
    totalMastered: totalMasteredOverall,
    totalUnlockedItems: totalUnlockedCount,
    totalItems: VOCAB_ADVANCED.length,
    unlockedItems,
    summaryText,
  };
}

// Synchronize all unlocked layers with Leitner queue:
// "New-layer items enter the Leitner queue at level 1: due immediately, interleaved with reviews."
export function syncPyramidsToSRS(cards: LeitnerCard[]): LeitnerCard[] {
  const existingCardIds = new Set(cards.map((c) => c.id));
  const newCardsToAdd: LeitnerCard[] = [];
  const now = Date.now();

  // 1. Verbs: check unlocked verbs
  const verbsPyramid = computeVerbsPyramid(cards);
  for (const verb of verbsPyramid.unlockedItems) {
    const primaryId = `${verb.infinitive}:presente:yo`;
    // If no card for this verb exists at all
    const hasAnyCard = cards.some(
      (c) => c.infinitive === verb.infinitive || c.id.startsWith(`${verb.infinitive}:`)
    );
    if (!hasAnyCard && !existingCardIds.has(primaryId)) {
      existingCardIds.add(primaryId);
      const conjugated = conjugate(verb.infinitive, 'presente', 'yo');
      newCardsToAdd.push({
        id: primaryId,
        itemType: 'verb',
        infinitive: verb.infinitive,
        tense: 'presente',
        pronoun: 'yo',
        correctAnswer: conjugated,
        sentenceContext: `Yo ___ (${verb.infinitive}) todos los días.`,
        englishFull: `I ${verb.translation.split('/')[0].trim()} every day.`,
        level: 1,
        nextReviewDate: now,
        timesReviewed: 0,
        timesCorrect: 0,
      });
    }
  }

  // 2. Vocab: check unlocked words
  const vocabPyramid = computeVocabPyramid(cards);
  for (const item of vocabPyramid.unlockedItems) {
    const cardId = `vocab:${item.id}`;
    if (!existingCardIds.has(cardId)) {
      existingCardIds.add(cardId);
      newCardsToAdd.push({
        id: cardId,
        itemType: 'vocab',
        vocabId: item.id,
        deckId: 'core500',
        correctAnswer: item.es,
        sentenceContext: item.sentence,
        englishFull: item.sentenceEn,
        level: 1,
        nextReviewDate: now,
        timesReviewed: 0,
        timesCorrect: 0,
      });
    }
  }

  // 3. Frases: check unlocked phrases
  const frasesPyramid = computeFrasesPyramid(cards);
  for (const item of frasesPyramid.unlockedItems) {
    const cardId = `vocab:${item.id}`;
    if (!existingCardIds.has(cardId)) {
      existingCardIds.add(cardId);
      newCardsToAdd.push({
        id: cardId,
        itemType: 'vocab',
        vocabId: item.id,
        deckId: 'frases',
        correctAnswer: item.es,
        sentenceContext: item.sentence,
        englishFull: item.sentenceEn,
        level: 1,
        nextReviewDate: now,
        timesReviewed: 0,
        timesCorrect: 0,
      });
    }
  }

  if (newCardsToAdd.length > 0) {
    return [...cards, ...newCardsToAdd];
  }

  return cards;
}

// Build unified Daily Session Queue:
// - Due reviews first (old content from any layer)
// - Then new items from current layer up to daily cap
// - New-layer items are NEVER introduced before due reviews are finished!
export function buildDailySessionQueue(
  cards: LeitnerCard[],
  maxNewItems = 10,
  filterType: 'verbs' | 'vocab' | 'frases' | 'all' = 'verbs'
): {
  dueReviews: LeitnerCard[];
  newItems: LeitnerCard[];
  combinedQueue: LeitnerCard[];
} {
  const now = Date.now();
  let candidateCards = cards;
  if (filterType === 'verbs') {
    candidateCards = cards.filter((c) => c.itemType !== 'vocab');
  } else if (filterType === 'vocab') {
    candidateCards = cards.filter((c) => c.itemType === 'vocab' && c.deckId === 'core500');
  } else if (filterType === 'frases') {
    candidateCards = cards.filter((c) => c.itemType === 'vocab' && c.deckId === 'frases');
  }

  // Due reviews: cards that have already been reviewed (timesReviewed > 0) and are due
  const dueReviews = candidateCards.filter(
    (c) => c.timesReviewed > 0 && c.nextReviewDate <= now
  );

  // New items from active layer: level 1 items that have not yet been reviewed (timesReviewed === 0)
  const newCandidates = candidateCards.filter((c) => c.timesReviewed === 0);
  const newItems = newCandidates.slice(0, Math.max(1, maxNewItems));

  // Queue: Due reviews strictly first!
  const combinedQueue = [...dueReviews, ...newItems];

  return {
    dueReviews,
    newItems,
    combinedQueue,
  };
}
