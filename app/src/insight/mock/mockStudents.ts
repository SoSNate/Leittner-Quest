// Mock student data in exact LQStore format
// Used by TeacherOverview, StudentReport, ParentReport

export interface LeitnerCard {
  id: string;
  boxLevel: number;       // 0-5
  nextReviewDate: string; // ISO
  lastAnswer: 'correct' | 'wrong' | null;
  reviewCount: number;
}

export interface LQStoreState {
  theme: 'light' | 'dark';
  progress: Record<number, { step: number; completed: boolean }>;
  leitnerBoxes: Record<string, LeitnerCard>;
}

export interface MockStudent {
  id: string;
  displayName: string;
  shareCode: string;
  lastSyncAt: string; // ISO
  store: LQStoreState;
}

const today = new Date();
const daysFromNow = (n: number) => new Date(today.getTime() + n * 86400000).toISOString().split('T')[0];

function makeBoxes(overrides: Partial<Record<string, Partial<LeitnerCard>>>): Record<string, LeitnerCard> {
  const ALL_IDS = ['m1q1','m1q2','m1q3','m1q4','m1q5','m1q6','m1q7','m1q8','m2q1','m2q2','m2q3','m2q4','m2q5'];
  const defaults: Record<string, LeitnerCard> = {};
  for (const id of ALL_IDS) {
    defaults[id] = {
      id,
      boxLevel: 0,
      nextReviewDate: daysFromNow(0),
      lastAnswer: null,
      reviewCount: 0,
      ...(overrides[id] ?? {}),
    };
  }
  return defaults;
}

export const MOCK_STUDENTS: MockStudent[] = [
  {
    id: 'stu-001',
    displayName: 'שירה כהן',
    shareCode: 'X7B-9P2',
    lastSyncAt: new Date(today.getTime() - 2 * 3600000).toISOString(),
    store: {
      theme: 'light',
      progress: { 1: { step: 8, completed: true }, 2: { step: 5, completed: false } },
      leitnerBoxes: makeBoxes({
        m1q1: { boxLevel: 5, reviewCount: 6, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q2: { boxLevel: 5, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q3: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m1q4: { boxLevel: 5, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q5: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m1q6: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m1q7: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m1q8: { boxLevel: 2, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(3) },
        m2q1: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m2q2: { boxLevel: 2, reviewCount: 3, lastAnswer: 'correct', nextReviewDate: daysFromNow(3) },
        m2q3: { boxLevel: 1, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m2q4: { boxLevel: 1, reviewCount: 5, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m2q5: { boxLevel: 2, reviewCount: 3, lastAnswer: 'correct', nextReviewDate: daysFromNow(3) },
      }),
    },
  },
  {
    id: 'stu-002',
    displayName: 'דניאל לוי',
    shareCode: 'M3K-4Q7',
    lastSyncAt: new Date(today.getTime() - 24 * 3600000).toISOString(),
    store: {
      theme: 'dark',
      progress: { 1: { step: 8, completed: true }, 2: { step: 2, completed: false } },
      leitnerBoxes: makeBoxes({
        m1q1: { boxLevel: 5, reviewCount: 7, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q2: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m1q3: { boxLevel: 5, reviewCount: 6, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q4: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m1q5: { boxLevel: 2, reviewCount: 5, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(3) },
        m1q6: { boxLevel: 1, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m1q7: { boxLevel: 2, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(3) },
        m1q8: { boxLevel: 3, reviewCount: 3, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m2q1: { boxLevel: 1, reviewCount: 3, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m2q2: { boxLevel: 0, reviewCount: 2, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m2q3: { boxLevel: 0, reviewCount: 3, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m2q4: { boxLevel: 1, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m2q5: { boxLevel: 0, reviewCount: 2, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
      }),
    },
  },
  {
    id: 'stu-003',
    displayName: 'אורי מזרחי',
    shareCode: 'R5T-2W8',
    lastSyncAt: new Date(today.getTime() - 72 * 3600000).toISOString(),
    store: {
      theme: 'light',
      progress: { 1: { step: 4, completed: false } },
      leitnerBoxes: makeBoxes({
        m1q1: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m1q2: { boxLevel: 2, reviewCount: 3, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(3) },
        m1q3: { boxLevel: 1, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m1q4: { boxLevel: 2, reviewCount: 3, lastAnswer: 'correct', nextReviewDate: daysFromNow(3) },
        m1q5: { boxLevel: 0, reviewCount: 3, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m1q6: { boxLevel: 1, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m1q7: { boxLevel: 0, reviewCount: 2, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m1q8: { boxLevel: 1, reviewCount: 3, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
      }),
    },
  },
  {
    id: 'stu-004',
    displayName: 'מיה אברהם',
    shareCode: 'P9L-6N1',
    lastSyncAt: new Date(today.getTime() - 1 * 3600000).toISOString(),
    store: {
      theme: 'light',
      progress: {
        1: { step: 8, completed: true },
        2: { step: 8, completed: true },
        3: { step: 5, completed: false },
      },
      leitnerBoxes: makeBoxes({
        m1q1: { boxLevel: 5, reviewCount: 8, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q2: { boxLevel: 5, reviewCount: 7, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q3: { boxLevel: 5, reviewCount: 6, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q4: { boxLevel: 5, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q5: { boxLevel: 5, reviewCount: 6, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q6: { boxLevel: 5, reviewCount: 7, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m1q7: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m1q8: { boxLevel: 5, reviewCount: 6, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m2q1: { boxLevel: 5, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(99) },
        m2q2: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m2q3: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m2q4: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m2q5: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
      }),
    },
  },
  {
    id: 'stu-005',
    displayName: 'יוסי פרץ',
    shareCode: 'C2H-8A5',
    lastSyncAt: new Date(today.getTime() - 48 * 3600000).toISOString(),
    store: {
      theme: 'dark',
      progress: { 1: { step: 6, completed: false } },
      leitnerBoxes: makeBoxes({
        m1q1: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m1q2: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m1q3: { boxLevel: 2, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(3) },
        m1q4: { boxLevel: 4, reviewCount: 5, lastAnswer: 'correct', nextReviewDate: daysFromNow(14) },
        m1q5: { boxLevel: 3, reviewCount: 4, lastAnswer: 'correct', nextReviewDate: daysFromNow(7) },
        m1q6: { boxLevel: 2, reviewCount: 3, lastAnswer: 'correct', nextReviewDate: daysFromNow(3) },
        m1q7: { boxLevel: 1, reviewCount: 4, lastAnswer: 'wrong',   nextReviewDate: daysFromNow(0) },
        m1q8: { boxLevel: 2, reviewCount: 3, lastAnswer: 'correct', nextReviewDate: daysFromNow(3) },
      }),
    },
  },
];

// Lookup by share code (mock "backend fetch")
export function getStudentByCode(code: string): MockStudent | undefined {
  return MOCK_STUDENTS.find(s => s.shareCode.toUpperCase() === code.toUpperCase());
}
