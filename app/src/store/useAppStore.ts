import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleProgress, LeitnerBox } from '../types';

interface SimulatorValues {
  m: number;
  b: number;
  a: number;
  c: number;
}

export type MascotType = 'explain' | 'cheer' | 'hint' | 'challenge' | 'correct' | 'wrong' | 'idle';

interface MascotState {
  mascotText: string;
  mascotType: MascotType;
  mascotVisible: boolean;
  mascotDuration: number;
}

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Module progress
  progress: Record<number, ModuleProgress>;
  setStep: (moduleId: number, step: number) => void;
  completeModule: (moduleId: number) => void;
  resetProgress: () => void;

  // Simulator state (shared)
  sim: SimulatorValues;
  setSim: (values: Partial<SimulatorValues>) => void;

  // Leitner
  leitnerBoxes: LeitnerBox[];
  updateBox: (questionId: string, moduleId: number, correct: boolean) => void;
  getDueQuestions: (moduleId: number) => LeitnerBox[];

  // Mascot (not persisted)
  mascot: MascotState;
  triggerMascot: (text: string, type: MascotType, duration?: number) => void;
  hideMascot: () => void;
}

const BOX_INTERVALS = [0, 3, 7, 14, 30]; // days per box level

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Theme ──
      theme: 'dark',
      setTheme: (t) => {
        set({ theme: t });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },

      // ── Progress ──
      progress: {},
      setStep: (moduleId, step) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [moduleId]: { moduleId, step, completed: s.progress[moduleId]?.completed ?? false },
          },
        })),
      completeModule: (moduleId) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [moduleId]: { moduleId, step: s.progress[moduleId]?.step ?? 0, completed: true },
          },
        })),
      resetProgress: () =>
        set({ progress: {}, leitnerBoxes: [], sim: { m: 1, b: 0, a: 1, c: 0 } }),

      // ── Simulator ──
      sim: { m: 1, b: 0, a: 1, c: 0 },
      setSim: (values) => set((s) => ({ sim: { ...s.sim, ...values } })),

      // ── Leitner ──
      leitnerBoxes: [],
      updateBox: (questionId, moduleId, correct) => {
        const now = Date.now();
        set((s) => {
          const existing = s.leitnerBoxes.find(
            (b) => b.questionId === questionId && b.moduleId === moduleId
          );
          const currentLevel = existing?.boxLevel ?? 0;
          const newLevel = correct ? Math.min(currentLevel + 1, 5) : 0;
          const days = BOX_INTERVALS[newLevel] ?? 0;
          const nextReviewDate = now + days * 86_400_000;

          const updated: LeitnerBox = { questionId, moduleId, boxLevel: newLevel, nextReviewDate };
          const filtered = s.leitnerBoxes.filter(
            (b) => !(b.questionId === questionId && b.moduleId === moduleId)
          );
          return { leitnerBoxes: [...filtered, updated] };
        });
      },
      getDueQuestions: (moduleId) => {
        const now = Date.now();
        return get().leitnerBoxes.filter(
          (b) => b.moduleId === moduleId && b.nextReviewDate <= now
        );
      },

      // ── Mascot ──
      mascot: { mascotText: '', mascotType: 'idle', mascotVisible: false, mascotDuration: 0 },
      triggerMascot: (text, type, duration = 6000) =>
        set({ mascot: { mascotText: text, mascotType: type, mascotVisible: true, mascotDuration: duration } }),
      hideMascot: () =>
        set((s) => ({ mascot: { ...s.mascot, mascotVisible: false } })),
    }),
    {
      name: 'lq-store',
      partialize: (s) => ({ theme: s.theme, progress: s.progress, leitnerBoxes: s.leitnerBoxes, sim: s.sim }),
    }
  )
);

// DEBUG — expose store for console testing
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__lqStore = useAppStore;
}
