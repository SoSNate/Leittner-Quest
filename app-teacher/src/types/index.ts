// ─── Step Types ───────────────────────────────────────────────
export type StepType =
  | 'visual-slider'
  | 'formula-reveal'
  | 'stepping-graph'
  | 'simulator'
  | 'target-drill'
  | 'identify-drill'
  | 'leitner-quiz'
  | 'real-math'
  | 'impossible-challenge'
  | 'match-drill'
  | 'x2-reminder'
  | 'slope-formula';

export interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  color: string; // tailwind color class e.g. 'emerald'
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'input';
  prompt: string;        // LaTeX string
  options?: string[];    // for mcq
  correct: number | string; // index for mcq, string for input
  hint: string;
}

export interface Step {
  stepId: number;
  type: StepType;
  title: string;
  subtitle?: string;
  mascotText: string;
  controls?: SliderConfig[];
  questions?: QuizQuestion[];
  showGuide?: boolean;
  formulaVariant?: string; // for formula-reveal: 'linear' | 'parabola-full' | 'vertex'
}

export interface Lesson {
  moduleId: number;
  title: string;
  color: string;       // e.g. 'emerald'
  icon: string;        // emoji
  steps: Step[];
}

// ─── Leitner Types ────────────────────────────────────────────
export interface LeitnerBox {
  questionId: string;
  moduleId: number;
  boxLevel: number;       // 1–5
  nextReviewDate: number; // timestamp ms
}

// ─── User Progress ────────────────────────────────────────────
export interface ModuleProgress {
  moduleId: number;
  step: number;
  completed: boolean;
}
