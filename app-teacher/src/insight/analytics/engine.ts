import type { LeitnerCard, LQStoreState } from '../mock/mockStudents';

// ─── Topic Metadata ──────────────────────────────────────────────────────────

export interface TopicMeta {
  module: 'ישרים' | 'פרבולות';
  topicKey: string;
  hebrewLabel: string;
}

export const QUESTION_TOPICS: Record<string, TopicMeta> = {
  m1q1: { module: 'ישרים',    topicKey: 'slope_positive',    hebrewLabel: 'שיפוע חיובי' },
  m1q2: { module: 'ישרים',    topicKey: 'slope_negative',    hebrewLabel: 'שיפוע שלילי' },
  m1q3: { module: 'ישרים',    topicKey: 'y_intercept',       hebrewLabel: 'חיתוך ציר Y' },
  m1q4: { module: 'ישרים',    topicKey: 'horizontal_line',   hebrewLabel: 'קו אופקי' },
  m1q5: { module: 'ישרים',    topicKey: 'slope_formula',     hebrewLabel: 'נוסחת שיפוע' },
  m1q6: { module: 'ישרים',    topicKey: 'graph_to_equation', hebrewLabel: 'גרף ← משוואה' },
  m1q7: { module: 'ישרים',    topicKey: 'equation_to_graph', hebrewLabel: 'משוואה ← גרף' },
  m1q8: { module: 'ישרים',    topicKey: 'parallel_lines',    hebrewLabel: 'ישרים מקבילים' },
  m2q1: { module: 'פרבולות',  topicKey: 'vertex',            hebrewLabel: 'קודקוד' },
  m2q2: { module: 'פרבולות',  topicKey: 'direction',         hebrewLabel: 'כיוון פתיחה' },
  m2q3: { module: 'פרבולות',  topicKey: 'roots',             hebrewLabel: 'שורשים' },
  m2q4: { module: 'פרבולות',  topicKey: 'discriminant',      hebrewLabel: 'דיסקרימיננטה' },
  m2q5: { module: 'פרבולות',  topicKey: 'standard_form',     hebrewLabel: 'צורה סטנדרטית' },
};

export const ALL_TOPIC_IDS = Object.keys(QUESTION_TOPICS);

// ─── Core Analytics ──────────────────────────────────────────────────────────

/** Average boxLevel / 5, as percentage 0-100 */
export function masteryScore(boxes: Record<string, LeitnerCard>): number {
  const cards = Object.values(boxes);
  if (cards.length === 0) return 0;
  const sum = cards.reduce((acc, c) => acc + c.boxLevel, 0);
  return Math.round((sum / (cards.length * 5)) * 100);
}

/** % of cards stuck in box 0-1 despite ≥3 reviews */
export function struggleIndex(boxes: Record<string, LeitnerCard>): number {
  const all = Object.values(boxes);
  if (all.length === 0) return 0;
  const struggling = all.filter(c => c.boxLevel <= 1 && c.reviewCount >= 3);
  return Math.round((struggling.length / all.length) * 100);
}

/** How many modules are fully completed */
export function modulesCompleted(progress: LQStoreState['progress']): number {
  return Object.values(progress).filter(p => p.completed).length;
}

/** List of topic ids where the student is struggling */
export function struggleTopics(boxes: Record<string, LeitnerCard>): string[] {
  return Object.entries(boxes)
    .filter(([, c]) => c.boxLevel <= 1 && c.reviewCount >= 2)
    .map(([id]) => id);
}

/** List of topic ids that are mastered (box 5) */
export function masteredTopics(boxes: Record<string, LeitnerCard>): string[] {
  return Object.entries(boxes)
    .filter(([, c]) => c.boxLevel === 5)
    .map(([id]) => id);
}

/** Per-topic box level for a student (for heatmap) */
export function topicBoxLevels(boxes: Record<string, LeitnerCard>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of ALL_TOPIC_IDS) {
    result[id] = boxes[id]?.boxLevel ?? -1; // -1 = not started
  }
  return result;
}

/** Color for heatmap cell based on box level */
export function heatColor(boxLevel: number): { bg: string; text: string; label: string } {
  if (boxLevel < 0)  return { bg: '#f1f5f9', text: '#94a3b8', label: '⬜' };
  if (boxLevel === 0) return { bg: '#fee2e2', text: '#991b1b', label: '🔴' };
  if (boxLevel === 1) return { bg: '#fed7aa', text: '#9a3412', label: '🟠' };
  if (boxLevel === 2) return { bg: '#fef9c3', text: '#854d0e', label: '🟡' };
  if (boxLevel === 3) return { bg: '#dcfce7', text: '#166534', label: '🟢' };
  if (boxLevel === 4) return { bg: '#bbf7d0', text: '#14532d', label: '🟢' };
  return                    { bg: '#4ade80', text: '#14532d', label: '⭐' };
}

/** Friendly time-ago string (Hebrew) */
export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}
