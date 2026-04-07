import React, { useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';

// Splits Hebrew+math text and wraps math expressions as dir="ltr"
function renderPrompt(text: string): React.ReactNode {
  // Match: full equations (y = 2x + 2), coordinate pairs ((-3,4)), slope values (m=-1)
  // Stop equation match only at ? ! , | — allow spaces inside (for "2x + 2")
  const mathRe = /(\([^)]+\)|[a-zA-Z]\s*=\s*[^?!،|,]+|m\s*=\s*[-\d.]+)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = mathRe.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={last}>{text.slice(last, match.index)}</span>);
    parts.push(<span key={match.index} dir="ltr" className="inline font-mono">{match[0]}</span>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
  return parts;
}

type QuestionType = 'mcq' | 'input' | 'visual-mcq' | 'visual-input';

interface VisualConfig {
  type: 'linear' | 'parabola';
  m?: number;
  b?: number;
  a?: number;
  bCoef?: number;
  c?: number;
  labelPoints?: { x: number; y: number; label: string }[];
}

interface PracticeQuestion {
  id: string;
  prompt: string;
  explanation: string;
  type?: QuestionType; // default: 'mcq' for backwards compatibility

  // MCQ fields
  options?: string[];
  correct?: number; // index

  // Input fields (text answer)
  inputAnswer?: string | string[]; // accepted answers or variants
  inputPlaceholder?: string;

  // Visual fields (graph above question)
  visualConfig?: VisualConfig;
}

// ─── Mini Graph Renderer (inline SVG) ────────────────────────────
function MiniGraph({ config, darkMode }: { config: VisualConfig; darkMode: boolean }) {
  const width = 200, height = 160;
  const padding = 20;
  const w = width - 2 * padding, h = height - 2 * padding;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const scale = 30; // pixels per unit

  const centerX = padding + w / 2;
  const centerY = padding + h / 2;

  const axisColor = darkMode ? '#6b7280' : '#d1d5db';
  const gridColor = darkMode ? '#374151' : '#f3f4f6';
  const lineColor = darkMode ? '#fbbf24' : '#f59e0b';
  const pointColor = darkMode ? '#34d399' : '#10b981';

  // Draw canvas-based graph
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI scaling
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = darkMode ? '#1c1b1f' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX + i * scale, padding);
      ctx.lineTo(centerX + i * scale, padding + h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, centerY - i * scale);
      ctx.lineTo(padding + w, centerY - i * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(padding + w, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX, padding + h);
    ctx.stroke();

    // Draw function
    if (config.type === 'linear' && config.m !== undefined && config.b !== undefined) {
      const m = config.m;
      const b = config.b;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -5; x <= 5; x += 0.1) {
        const y = m * x + b;
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        if (x === -5) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (config.type === 'parabola' && config.a !== undefined && config.bCoef !== undefined && config.c !== undefined) {
      const a = config.a;
      const b = config.bCoef;
      const c = config.c;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -5; x <= 5; x += 0.1) {
        const y = a * x * x + b * x + c;
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        if (x === -5) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Draw labeled points
    if (config.labelPoints) {
      for (const pt of config.labelPoints) {
        const px = centerX + pt.x * scale;
        const py = centerY - pt.y * scale;
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = darkMode ? '#f3f4f6' : '#111827';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pt.label, px, py - 12);
      }
    }
  }, [config, darkMode]);

  return <canvas ref={canvasRef} width={width} height={height} className="mx-auto mb-4 rounded border" style={{ borderColor: darkMode ? '#374151' : '#d1d5db' }} />;
}

// ─── Input Answer Component ──────────────────────────────────────
interface InputAnswerProps {
  placeholder?: string;
  onSubmit: (answer: string) => void;
  answered: boolean;
}

function InputAnswer({ placeholder = 'כתוב תשובה...', onSubmit, answered }: InputAnswerProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    onSubmit(input);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !answered && handleSubmit()}
        placeholder={placeholder}
        disabled={answered}
        className="flex-1 border-2 border-[#e0dbe3] dark:border-slate-600 rounded-xl px-4 py-3 font-semibold transition-all"
        style={{ minHeight: 48 }}
        dir="ltr"
      />
      <button
        onClick={handleSubmit}
        disabled={answered}
        className="border-2 border-[#e0dbe3] dark:border-slate-600 rounded-xl px-4 py-3 font-semibold transition-all disabled:opacity-50"
        style={{ minHeight: 48 }}>
        בדוק ←
      </button>
    </div>
  );
}

// ─── Normalize and match input answer ────────────────────────────
function normalizeAnswer(s: string): string {
  return s
    .trim()
    .replace(/−/g, '-')  // Unicode minus to ASCII minus
    .replace(/\s+/g, '')   // Remove all whitespace
    .toLowerCase();
}

function checkAnswer(input: string, correct: string | string[]): boolean {
  const normalized = normalizeAnswer(input);
  const correctAnswers = Array.isArray(correct) ? correct.map(normalizeAnswer) : [normalizeAnswer(correct)];
  return correctAnswers.includes(normalized);
}

// ─── Module 1 question generators ────────────────────────────────
const SLOPES = [-3, -2, -1, 1, 2, 3];
const INTERCEPTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function distractors(correct: number, pool: number[], count = 3): number[] {
  const diffs = [-3, -2, -1, 1, 2, 3, -4, 4];
  const result: number[] = [];
  const candidates = shuffle([...pool.filter(x => x !== correct), ...diffs.map(d => correct + d)]);
  for (const c of candidates) {
    if (c !== correct && !result.includes(c)) {
      result.push(c);
      if (result.length === count) break;
    }
  }
  return result;
}

// Wrap negative numbers in parens when used after an operator (e.g. 3−(-5))
function fmt(n: number, afterOp = false): string {
  return afterOp && n < 0 ? `(${n})` : String(n);
}

// Format linear equation with standardized spacing
function formatInputEquation(m: number, b: number): string {
  const mStr = m === 1 ? '' : m === -1 ? '-' : String(m);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` \u2212 ${Math.abs(b)}`;
  return `y = ${mStr}x${bStr}`;
}

function genSlopeFromPoints(): PracticeQuestion {
  const x1 = pick([-3, -2, -1, 0, 1, 2]);
  const x2 = x1 + pick([1, 2, 3, 4]);
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const y1 = m * x1 + b;
  const y2 = m * x2 + b;
  const correct = m;
  const opts = shuffle([correct, ...distractors(correct, SLOPES)]);
  const dy = y2 - y1, dx = x2 - x1;
  return {
    id: 'practice_slope_pts',
    prompt: `מה השיפוע בין (${x1},${y1}) ל-(${x2},${y2})?`,
    options: opts.map(String),
    correct: opts.indexOf(correct),
    explanation: `שינוי Y = ${y2}−${fmt(y1, true)} = ${dy} | שינוי X = ${x2}−${fmt(x1, true)} = ${dx} | m = ${dy}÷${dx} = ${m}`,
  };
}

function genIdentifySlope(): PracticeQuestion {
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`;
  const mStr = m === 1 ? '' : m === -1 ? '-' : String(m);
  const eq = `y = ${mStr}x${bStr}`;
  const opts = shuffle([m, ...distractors(m, SLOPES)]);
  return {
    id: 'practice_id_slope',
    prompt: `מה השיפוע של ${eq}?`,
    options: opts.map(String),
    correct: opts.indexOf(m),
    explanation: `m הוא המקדם שכופל את x. בנוסחה ${eq} → m = ${m}`,
  };
}

function genIdentifyIntercept(): PracticeQuestion {
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`;
  const mStr = m === 1 ? '' : m === -1 ? '-' : String(m);
  const eq = `y = ${mStr}x${bStr}`;
  const opts = shuffle([b, ...distractors(b, INTERCEPTS)]);
  return {
    id: 'practice_id_int',
    prompt: `מה חיתוך Y של ${eq}?`,
    options: opts.map(String),
    correct: opts.indexOf(b),
    explanation: `b הוא הקבוע : מה y כש-x=0. ב-${eq} → b = ${b}`,
  };
}

function genLineDirection(): PracticeQuestion {
  const m = pick([...SLOPES, 0]);
  let dir: string, wrong1: string, wrong2: string, wrong3: string;
  if (m > 0) { dir = 'עולה (m>0)'; wrong1 = 'יורד (m<0)'; wrong2 = 'אופקי (m=0)'; wrong3 = 'לא ניתן לדעת'; }
  else if (m < 0) { dir = 'יורד (m<0)'; wrong1 = 'עולה (m>0)'; wrong2 = 'אופקי (m=0)'; wrong3 = 'לא ניתן לדעת'; }
  else { dir = 'אופקי (m=0)'; wrong1 = 'עולה (m>0)'; wrong2 = 'יורד (m<0)'; wrong3 = 'לא ניתן לדעת'; }
  const opts = shuffle([dir, wrong1, wrong2, wrong3]);
  return {
    id: 'practice_dir',
    prompt: `קו עם שיפוע m=${m} : לאיזה כיוון?`,
    options: opts,
    correct: opts.indexOf(dir),
    explanation: m > 0 ? 'שיפוע חיובי = עולה משמאל לימין' : m < 0 ? 'שיפוע שלילי = יורד משמאל לימין' : 'שיפוע 0 = קו אופקי',
  };
}

function genEquationFromMB(): PracticeQuestion {
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`;
  const mStr = m === 1 ? '' : m === -1 ? '-' : String(m);
  const correct = `y = ${mStr}x${bStr}`;
  const fakes = shuffle(SLOPES.filter(s => s !== m)).slice(0, 2).map(fm => {
    const fmStr = fm === 1 ? '' : fm === -1 ? '-' : String(fm);
    return `y = ${fmStr}x${bStr}`;
  });
  const fb = pick(INTERCEPTS.filter(i => i !== b));
  const fbStr = fb === 0 ? '' : fb > 0 ? ` + ${fb}` : ` − ${Math.abs(fb)}`;
  fakes.push(`y = ${mStr}x${fbStr}`);
  const opts = shuffle([correct, ...fakes]);
  return {
    id: 'practice_eq_mb',
    prompt: `קו עם שיפוע ${m} וחיתוך Y ב-${b} : מה המשוואה?`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `m=${m}, b=${b} → ${correct}`,
  };
}

// ─── New Module 1 generators (visual-mcq + input) ────────────────

function genGraphToSlope(): PracticeQuestion {
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const opts = shuffle([m, ...distractors(m, SLOPES)]);
  return {
    id: 'practice_graph_slope',
    type: 'visual-mcq',
    prompt: 'מה השיפוע של הקו בגרף?',
    visualConfig: { type: 'linear', m, b },
    options: opts.map(String),
    correct: opts.indexOf(m),
    explanation: `הקו עולה ${Math.abs(m)} יחידות Y לכל יחידת X → m = ${m}`,
  };
}

function genGraphToEquation(): PracticeQuestion {
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const mStr = m === 1 ? '' : m === -1 ? '-' : String(m);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`;
  const correct = `y = ${mStr}x${bStr}`;
  const fakes = shuffle(SLOPES.filter(s => s !== m)).slice(0, 2).map(fm => {
    const fmStr = fm === 1 ? '' : fm === -1 ? '-' : String(fm);
    return `y = ${fmStr}x${bStr}`;
  });
  const fb = pick(INTERCEPTS.filter(i => i !== b));
  const fbStr = fb === 0 ? '' : fb > 0 ? ` + ${fb}` : ` − ${Math.abs(fb)}`;
  fakes.push(`y = ${mStr}x${fbStr}`);
  const opts = shuffle([correct, ...fakes]);
  return {
    id: 'practice_graph_eq',
    type: 'visual-mcq',
    prompt: 'איזו משוואה מתאימה לקו בגרף?',
    visualConfig: { type: 'linear', m, b },
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `הקו: m=${m}, b=${b} → ${correct}`,
  };
}

function genPointsToEquation(): PracticeQuestion {
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const x1 = pick([-2, -1, 0, 1, 2]);
  const y1 = m * x1 + b;
  const x2 = x1 + pick([2, 3]);
  const y2 = m * x2 + b;
  return {
    id: 'practice_pts_to_eq',
    type: 'input',
    prompt: `הקו עובר דרך (${x1},${y1}) ו-(${x2},${y2}). כתבו את משוואת הקו:`,
    inputAnswer: [formatInputEquation(m, b)],
    inputPlaceholder: 'y = ...',
    explanation: `m = (${y2}−${fmt(y1, true)})÷(${x2}−${fmt(x1, true)}) = ${m}. ב = ${b} → ${formatInputEquation(m, b)}`,
  };
}

function genReverseIntercept(): PracticeQuestion {
  const m = pick(SLOPES);
  const x0 = pick([-2, -1, 0, 1, 2]);
  const y0 = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
  const b = y0 - m * x0;
  return {
    id: 'practice_reverse_intercept',
    type: 'input',
    prompt: `קו בשיפוע ${m} עובר ב-(${x0},${y0}). מה חיתוך Y (b)?`,
    inputAnswer: [String(b)],
    inputPlaceholder: 'b = ...',
    explanation: `y = mx + b → ${y0} = ${m}·${x0} + b → b = ${b}`,
  };
}

function genGraphToIntercept(): PracticeQuestion {
  const m = pick(SLOPES);
  const b = pick(INTERCEPTS);
  const opts = shuffle([b, ...distractors(b, INTERCEPTS)]);
  return {
    id: 'practice_graph_intercept',
    type: 'visual-mcq',
    prompt: 'מה חיתוך Y של הקו בגרף?',
    visualConfig: { type: 'linear', m, b },
    options: opts.map(String),
    correct: opts.indexOf(b),
    explanation: `הקו חותך את Y בנקודה (0,${b}) → חיתוך Y = ${b}`,
  };
}

function genPartialDataLine(): PracticeQuestion {
  const m = pick(SLOPES);
  const x0 = pick([-2, -1, 0, 1, 2]);
  const y0 = pick([-4, -2, 0, 2, 4]);
  const b = y0 - m * x0;
  return {
    id: 'practice_partial_data',
    type: 'input',
    prompt: `קו עם m=${m} עובר ב-(${x0},${y0}). מה b?`,
    inputAnswer: [String(b)],
    inputPlaceholder: 'b = ...',
    explanation: `y = mx + b → ${y0} = ${m}·${x0} + b → b = ${b}`,
  };
}

// ─── Module 2 generators ─────────────────────────────────────────
function genParabolaDirection(): PracticeQuestion {

  const a = pick([-3, -2, -1, 1, 2, 3]);
  const dir = a > 0 ? 'פתוחה למעלה 😊' : 'פתוחה למטה 😢';
  const wrong1 = a > 0 ? 'פתוחה למטה 😢' : 'פתוחה למעלה 😊';
  const opts = shuffle([dir, wrong1, 'קו ישר', 'תלוי ב-b']);
  return {
    id: 'practice_para_dir',
    prompt: `y = ${a}x² : לאיזה כיוון הפרבולה פתוחה?`,
    options: opts,
    correct: opts.indexOf(dir),
    explanation: a > 0 ? 'a>0 = פרבולה "מחייכת" = פתוחה למעלה' : 'a<0 = פרבולה "עצובה" = פתוחה למטה',
  };
}

function genVertexX(): PracticeQuestion {
  const a = pick([1, 2, -1, -2]);
  const b = pick([-4, -2, 0, 2, 4, 6]);
  const xv = -b / (2 * a);
  const opts = shuffle([xv, xv + 1, xv - 1, -xv].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 4);
  if (!opts.includes(xv)) opts[0] = xv;
  const shuffled = shuffle(opts);
  return {
    id: 'practice_vertex_x',
    prompt: `מה ה-x של הקודקוד של y = ${a}x² ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}x?`,
    options: shuffled.map(String),
    correct: shuffled.indexOf(xv),
    explanation: `x_v = \u2212b \u00f7 2a = \u2212(${b}) \u00f7 (2\u00b7${a}) = ${-b} \u00f7 ${2 * a} = ${xv}`,
  };
}

// ─── New Module 2 generators (visual + input) ────────────────────

function genVertexY(): PracticeQuestion {
  const a = pick([1, 2, -1, -2]);
  const b = pick([-4, -2, 0, 2, 4]);
  const c = pick([-3, -1, 0, 1, 3]);
  const xv = -b / (2 * a);
  const yv = a * xv * xv + b * xv + c;
  return {
    id: 'practice_vertex_y',
    type: 'input',
    prompt: `מה ה-y של הקודקוד של y = ${a}x² ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '− ' + Math.abs(c)}?`,
    inputAnswer: [String(yv), String(Math.round(yv * 100) / 100)],
    inputPlaceholder: 'y_v = ...',
    explanation: `x_v = ${xv}, y_v = f(${xv}) = ${yv}`,
  };
}

function genMinMaxM2(): PracticeQuestion {
  const a = pick([-3, -2, -1, 1, 2, 3]);
  const b = pick([-4, -2, 0, 2, 4]);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const correct = a > 0 ? 'מינימום (הכי נמוך)' : 'מקסימום (הכי גבוה)';
  const opts = shuffle([correct, a > 0 ? 'מקסימום (הכי גבוה)' : 'מינימום (הכי נמוך)', 'תלוי ב-c', 'לא ניתן לדעת']);
  return {
    id: 'practice_minmax_m2',
    prompt: `לפרבולה y = ${aStr}x²${bStr} : הקודקוד הוא`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: a > 0
      ? `a=${a} > 0 → פרבולה "מחייכת" → קודקוד = נקודת מינימום`
      : `a=${a} < 0 → פרבולה "עצובה" → קודקוד = נקודת מקסימום`,
  };
}

function genGraphToParabolaDir(): PracticeQuestion {
  const a = pick([-2, -1, 1, 2]);
  const b = pick([-4, -2, 0, 2, 4]);
  const c = pick([-2, 0, 2]);
  const correct = a > 0 ? 'a > 0' : 'a < 0';
  const opts = shuffle([correct, a > 0 ? 'a < 0' : 'a > 0', 'a = 0', 'לא ניתן לדעת']);
  return {
    id: 'practice_graph_para_dir',
    type: 'visual-mcq',
    prompt: 'רואה פרבולה בגרף. מה סימן a?',
    visualConfig: { type: 'parabola', a, bCoef: b, c },
    options: opts,
    correct: opts.indexOf(correct),
    explanation: a > 0
      ? 'הפרבולה פתוחה למעלה "😊" → a > 0'
      : 'הפרבולה פתוחה למטה "😢" → a < 0',
  };
}

function genGraphToVertex(): PracticeQuestion {
  const a = pick([1, -1, 2, -2]);
  const xv = pick([-2, -1, 0, 1, 2]);
  const yv = pick([-4, -2, 0, 2, 4]);
  const b = -2 * a * xv;
  const c = yv + a * xv * xv;
  const correct = `(${xv}, ${yv})`;
  const fakes = [
    `(${xv + 1}, ${yv})`,
    `(${xv}, ${yv + 1})`,
    `(${-xv}, ${yv})`,
  ].filter(f => f !== correct);
  const opts = shuffle([correct, ...fakes.slice(0, 3)]);
  return {
    id: 'practice_graph_vertex',
    type: 'visual-mcq',
    prompt: 'מה קואורדינטות הקודקוד המסומן בגרף?',
    visualConfig: { type: 'parabola', a, bCoef: b, c, labelPoints: [{ x: xv, y: yv, label: 'V' }] },
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `הקודקוד המסומן בגרף נמצא ב-x=${xv}, y=${yv}`,
  };
}

// ─── Module 3 generators — Parabola Investigation ────────────────
function genDiscriminant(): PracticeQuestion {
  const a = pick([1, -1, 2, -2, 1, 1]); // weight towards a=1
  const b = pick([-4, -2, 0, 2, 4]);
  const cOptions = [-5, -3, -1, 0, 1, 3, 5];
  const c = pick(cOptions);
  const disc = b * b - 4 * a * c;
  const numRoots = disc > 0 ? 2 : disc === 0 ? 1 : 0;
  const correct = numRoots === 2 ? 'שני שורשים' : numRoots === 1 ? 'שורש אחד' : 'אין שורשים ממשיים';
  const opts = shuffle(['שני שורשים', 'שורש אחד', 'אין שורשים ממשיים', 'לא ניתן לדעת']);
  const cStr = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  return {
    id: 'practice_discriminant',
    prompt: `כמה שורשים יש ל-y = ${aStr}x²${bStr}${cStr}?`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `Δ = b²−4ac = ${b}²−4·${a}·${c} = ${b * b}−${4 * a * c} = ${disc}. ${disc > 0 ? 'Δ>0 → שני שורשים' : disc === 0 ? 'Δ=0 → שורש אחד' : 'Δ<0 → אין שורשים ממשיים'}`,
  };
}

function genVertexXM3(): PracticeQuestion {
  const a = pick([1, -1, 2, -2]);
  const b = pick([-6, -4, -2, 2, 4, 6]);
  const xv = -b / (2 * a);
  const opts = shuffle([xv, xv + 1, xv - 1, xv * -1].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 4);
  if (!opts.includes(xv)) opts[0] = xv;
  const shuffled = shuffle(opts);
  const bStr = b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  return {
    id: 'practice_vertex_x_m3',
    prompt: `מה ה-x של קודקוד y = ${aStr}x²${bStr}?`,
    options: shuffled.map(String),
    correct: shuffled.indexOf(xv),
    explanation: `x_קודקוד = −b ÷ 2a = −(${b}) ÷ (2·${a}) = ${-b} ÷ ${2 * a} = ${xv}`,
  };
}

function genParabolaRange(): PracticeQuestion {
  const a = pick([1, -1, 2, -2]);
  const xv = pick([-2, -1, 0, 1, 2]);
  const b = -2 * a * xv;
  const yv = pick([-3, -1, 0, 1, 3, 4]);
  const dir = a > 0 ? 'פתוחה למעלה' : 'פתוחה למטה';
  const range = a > 0 ? `y ≥ ${yv}` : `y ≤ ${yv}`;
  const wrong1 = a > 0 ? `y ≤ ${yv}` : `y ≥ ${yv}`;
  const wrong2 = `y ≥ ${xv}`;
  const wrong3 = 'כל המספרים הממשיים';
  const opts = shuffle([range, wrong1, wrong2, wrong3]);
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  return {
    id: 'practice_range',
    prompt: `הפרבולה y = ${aStr}x²${bStr} ${dir}, קודקוד ב-y = ${yv}. מה תחום הערכים?`,
    options: opts,
    correct: opts.indexOf(range),
    explanation: `הפרבולה ${dir} עם קודקוד y=${yv}. לכן תחום הערכים: ${range}`,
  };
}

function genRootSign(): PracticeQuestion {
  // Simple cases: both positive, both negative, or one of each
  const cases = [
    { roots: [2, 5], answer: 'שני שורשים חיוביים', wrong: ['שני שורשים שליליים', 'שורש חיובי ושלילי', 'אין שורשים'] },
    { roots: [-5, -2], answer: 'שני שורשים שליליים', wrong: ['שני שורשים חיוביים', 'שורש חיובי ושלילי', 'אין שורשים'] },
    { roots: [-3, 4], answer: 'שורש חיובי ושלילי', wrong: ['שני שורשים חיוביים', 'שני שורשים שליליים', 'אין שורשים'] },
  ];
  const c = pick(cases);
  const [r1, r2] = c.roots;
  // y = (x-r1)(x-r2) = x² - (r1+r2)x + r1*r2
  const bVal = -(r1 + r2);
  const cVal = r1 * r2;
  const bStr = bVal === 0 ? '' : bVal > 0 ? ` + ${bVal}x` : ` − ${Math.abs(bVal)}x`;
  const cStr = cVal === 0 ? '' : cVal > 0 ? ` + ${cVal}` : ` − ${Math.abs(cVal)}`;
  const opts = shuffle([c.answer, ...c.wrong]);
  return {
    id: 'practice_root_sign',
    prompt: `לפרבולה y = x²${bStr}${cStr} יש שורשים. מה סימניהם?`,
    options: opts,
    correct: opts.indexOf(c.answer),
    explanation: `השורשים הם x = ${r1} ו-x = ${r2}: ${c.answer}`,
  };
}

// ─── Module 3 additional generators ─────────────────────────────
function genTrinomialFactoring(): PracticeQuestion {
  const ROOTS = [-4, -3, -2, 2, 3, 4];
  const r1 = pick(ROOTS);
  const r2 = pick(ROOTS.filter(r => r !== r1));
  const b = -(r1 + r2);
  const c = r1 * r2;
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const cStr = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
  const correct = `x = ${r1} ו-x = ${r2}`;
  const fakes = [
    `x = ${r1 + 1} ו-x = ${r2}`,
    `x = ${r1} ו-x = ${r2 - 1}`,
    `x = ${-r1} ו-x = ${-r2}`,
  ].filter(f => f !== correct);
  const opts = shuffle([correct, ...fakes.slice(0, 3)]);
  return {
    id: 'practice_trinomial',
    prompt: `פרקו לגורמים ומצאו שורשים: y = x²${bStr}${cStr}`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `r₁·r₂ = ${c}, r₁+r₂ = ${-(b)} → (x−${r1})(x−${r2}) → שורשים: x=${r1}, x=${r2}`,
  };
}

function genQuadraticFormula(): PracticeQuestion {
  const ROOTS = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
  const r1 = pick(ROOTS);
  const r2 = pick(ROOTS.filter(r => r !== r1));
  const b = -(r1 + r2);
  const c = r1 * r2;
  const disc = b * b - 4 * c;
  const sqd = Math.round(Math.sqrt(Math.abs(disc)));
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const cStr = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
  const correct = `x = ${r1} ו-x = ${r2}`;
  const fakes = [
    `x = ${r1 + 1} ו-x = ${r2 - 1}`,
    `x = ${-r1} ו-x = ${-r2}`,
    `x = ${b} ו-x = ${c}`,
  ].filter(f => f !== correct);
  const opts = shuffle([correct, ...fakes.slice(0, 3)]);
  return {
    id: 'practice_quad_formula',
    prompt: `פתרו ע"י נוסחת השורשים: x²${bStr}${cStr} = 0`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `Δ = ${b}²−4·${c} = ${disc}. x = (−(${b})±√${disc})/2 = (${-b}±${sqd})/2 → x=${r1} ו-x=${r2}`,
  };
}

function genMinMax(): PracticeQuestion {
  const a = pick([-3, -2, -1, 1, 2, 3]);
  const b = pick([-4, -2, 0, 2, 4]);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const correct = a > 0 ? 'מינימום (הכי נמוך)' : 'מקסימום (הכי גבוה)';
  const opts = shuffle([correct, a > 0 ? 'מקסימום (הכי גבוה)' : 'מינימום (הכי נמוך)', 'תלוי ב-b', 'לא ניתן לדעת']);
  return {
    id: 'practice_minmax',
    prompt: `לפרבולה y = ${aStr}x²${bStr} : הקודקוד הוא`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: a > 0
      ? `a=${a} > 0 → פרבולה "מחייכת" → קודקוד = נקודת מינימום`
      : `a=${a} < 0 → פרבולה "עצובה" → קודקוד = נקודת מקסימום`,
  };
}

function genMonotonicity(): PracticeQuestion {
  const a = pick([1, 2, -1, -2]);
  const xv = pick([-3, -2, -1, 0, 1, 2, 3]);
  const b = -2 * a * xv;
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const isUp = a > 0;
  const decRange = isUp ? `x < ${xv}` : `x > ${xv}`;
  const incRange = isUp ? `x > ${xv}` : `x < ${xv}`;
  const correct = decRange;
  const rawOpts = [decRange, incRange, `x < 0`, `x > 0`];
  const opts = shuffle(rawOpts.filter((v, i, arr) => arr.indexOf(v) === i));
  return {
    id: 'practice_monotonicity',
    prompt: `בפרבולה y = ${aStr}x²${bStr} : באיזה תחום הפונקציה יורדת?`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: isUp
      ? `a>0 → פרבולה "מחייכת" → יורדת עד הקודקוד (x=${xv}), עולה אחריו. ירידה: x < ${xv}`
      : `a<0 → פרבולה "עצובה" → עולה עד הקודקוד (x=${xv}), יורדת אחריו. ירידה: x > ${xv}`,
  };
}

// ─── Module 4 generators — Derivatives ───────────────────────────
function genPowerRule(): PracticeQuestion {
  const n = pick([2, 3, 4, 5]);
  const a = pick([1, 2, 3, -1, -2]);
  // y = ax^n → y' = n·a·x^(n-1)
  const coeff = n * a;
  const newExp = n - 1;
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const correct = newExp === 1 ? `${coeff}x` : newExp === 0 ? String(coeff) : `${coeff}x^${newExp}`;
  const fakes = [
    newExp === 1 ? `${a}x` : `${a}x^${newExp}`,           // forgot to multiply by n
    coeff + 'x^' + n,                                        // forgot to reduce power
    newExp === 1 ? `${coeff + 1}x` : `${coeff + 1}x^${newExp}`,  // off-by-one
  ].filter(f => f !== correct);
  const opts = shuffle([correct, ...fakes.slice(0, 3)]);
  return {
    id: 'practice_power_rule',
    prompt: `מה הנגזרת של y = ${aStr}x^${n}?`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `כלל החזקה: ${aStr}x^${n} → ${n}·${a === 1 ? '' : a}·x^${n}⁻¹ = ${correct}`,
  };
}

function genPolyDerivative(): PracticeQuestion {
  const a = pick([1, 2, 3, -1, -2]);
  const b = pick([-4, -2, -1, 1, 2, 4]);
  const c = pick([-3, -1, 0, 1, 3, 5]);
  // y = ax² + bx + c → y' = 2ax + b
  const da = 2 * a;
  const correct = `${da}x ${b > 0 ? '+ ' + b : '− ' + Math.abs(b)}`;
  const wrong1 = `${da}x ${b > 0 ? '+ ' + b : '− ' + Math.abs(b)} + ${c}`;  // didn't drop constant
  const wrong2 = `${a}x ${b > 0 ? '+ ' + b : '− ' + Math.abs(b)}`;           // forgot ×2
  const wrong3 = `${da}x`;                                                      // dropped b
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const bStr = b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  const cStr = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
  const opts = shuffle([correct, wrong1, wrong2, wrong3]);
  return {
    id: 'practice_poly_deriv',
    prompt: `מה הנגזרת של f(x) = ${aStr}x²${bStr}${cStr}?`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `גוזרים כל איבר: ${aStr}x² → ${da}x | ${b}x → ${b} | ${c} (קבוע) → 0. נגזרת: ${correct}`,
  };
}

function genDerivativeAtPoint(): PracticeQuestion {
  const a = pick([1, 2, -1]);
  const b = pick([-4, -2, 0, 2, 4]);
  const x0 = pick([-3, -2, -1, 0, 1, 2, 3]);
  // f'(x) = 2ax + b, f'(x0) = 2a·x0 + b
  const result = 2 * a * x0 + b;
  const opts = shuffle([result, result + 2, result - 2, -result].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 4);
  if (!opts.includes(result)) opts[0] = result;
  const shuffled = shuffle(opts);
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const bStr = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  return {
    id: 'practice_deriv_at_point',
    prompt: `f(x) = ${aStr}x²${bStr}. מה f'(${x0})?`,
    options: shuffled.map(String),
    correct: shuffled.indexOf(result),
    explanation: `f'(x) = ${2 * a}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}. f'(${x0}) = ${2 * a}·${x0} + ${b} = ${2 * a * x0} + ${b} = ${result}`,
  };
}

function genVertexViaDerivative(): PracticeQuestion {
  const a = pick([1, 2, -1, 3]);
  const b = pick([-6, -4, -2, 2, 4, 6]);
  // f'(x) = 2ax + b = 0 → x = -b/(2a)
  const xv = -b / (2 * a);
  const opts = shuffle([xv, xv + 1, xv - 1, -xv].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 4);
  if (!opts.includes(xv)) opts[0] = xv;
  const shuffled = shuffle(opts);
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const bStr = b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
  return {
    id: 'practice_vertex_deriv',
    prompt: `מצא את x של הקודקוד של f(x) = ${aStr}x²${bStr} ע"י f'(x) = 0`,
    options: shuffled.map(String),
    correct: shuffled.indexOf(xv),
    explanation: `f'(x) = ${2 * a}x + ${b} = 0 → ${2 * a}x = ${-b} → x = ${xv}`,
  };
}

function generateQuestions(moduleId: number, count = 8): PracticeQuestion[] {
  const pool1 = [
    genSlopeFromPoints, genIdentifySlope, genIdentifyIntercept, genLineDirection, genEquationFromMB,
    genGraphToSlope, genGraphToEquation, genPointsToEquation, genReverseIntercept, genGraphToIntercept, genPartialDataLine,
  ];
  const pool2 = [
    genParabolaDirection, genVertexX,
    genVertexY, genMinMaxM2, genGraphToParabolaDir, genGraphToVertex,
  ];
  const pool3 = [genDiscriminant, genVertexXM3, genParabolaRange, genRootSign, genTrinomialFactoring, genQuadraticFormula, genMinMax, genMonotonicity];
  const pool4 = [genPowerRule, genPolyDerivative, genDerivativeAtPoint, genVertexViaDerivative];
  const poolMap: Record<number, (() => PracticeQuestion)[]> = { 1: pool1, 2: pool2, 3: pool3, 4: pool4 };
  const pool = poolMap[moduleId] ?? pool1;
  const result: PracticeQuestion[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[i % pool.length]());
  }
  return shuffle(result);
}

// ─── Component ──────────────────────────────────────────────────
interface Props {
  moduleId: number;
  onBack: () => void;
  darkMode: boolean;
}

export default function PracticeMode({ moduleId, onBack, darkMode: _darkMode }: Props) {
  const updateBox = useAppStore((s) => s.updateBox);
  const [questions] = useState(() => generateQuestions(moduleId));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[currentIdx];
  const qType = q?.type ?? 'mcq';

  const isMCQ = qType === 'mcq' || qType === 'visual-mcq';
  const isInput = qType === 'input' || qType === 'visual-input';

  const isCorrect = isMCQ ? (selected === q?.correct) : checkAnswer(inputValue, q?.inputAnswer || '');
  const answered = isMCQ ? (selected !== null) : (inputValue.trim() !== '');
  const pct = Math.round(((currentIdx) / questions.length) * 100);

  const handleSelect = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    const correct = idx === q?.correct;
    if (correct) setScore(s => s + 1);
    updateBox(q.id, moduleId, correct);
  }, [answered, q, moduleId, updateBox]);

  const handleInputSubmit = useCallback((input: string) => {
    if (answered || !q) return;
    setInputValue(input);
    const correct = checkAnswer(input, q.inputAnswer || '');
    if (correct) setScore(s => s + 1);
    updateBox(q.id, moduleId, correct);
  }, [answered, q, moduleId, updateBox]);

  function next() {
    if (currentIdx + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setInputValue('');
    }
  }

  const moduleMeta: Record<number, { title: string; icon: string }> = {
    1: { title: 'קו ישר ושיפוע', icon: '📈' },
    2: { title: 'פרבולה ריבועית', icon: '🔵' },
    3: { title: 'חקירת הפרבולה', icon: '🔬' },
    4: { title: 'נגזרות', icon: '📐' },
  };
  const { title: moduleTitle, icon: moduleIcon } = moduleMeta[moduleId] ?? moduleMeta[1];

  if (done) {
    const pct100 = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-[#faf5fb] dark:bg-[#0e0e11] flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700 p-8 text-center space-y-5">
          <div className="text-5xl">{pct100 >= 80 ? '🏆' : pct100 >= 50 ? '👍' : '💪'}</div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2f2e32] dark:text-slate-100">
            {pct100 >= 80 ? 'מצוין!' : pct100 >= 50 ? 'לא רע!' : 'המשיכו להתאמן!'}
          </h2>
          <p className="text-4xl font-black" style={{ color: '#34d399' }}>{score}/{questions.length}</p>
          <div className="h-3 bg-[#ebe7ed] dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct100}%`, background: pct100 >= 80 ? '#34d399' : pct100 >= 50 ? '#f59e0b' : '#f87171' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onBack}
              className="flex-1 border-2 border-[#e0dbe3] dark:border-slate-600 text-[#5d5b5f] dark:text-slate-400 font-bold py-3 rounded-xl hover:border-emerald-400 transition-colors"
              style={{ minHeight: 44 }}>
              חזרה
            </button>
            <button onClick={() => { setCurrentIdx(0); setSelected(null); setInputValue(''); setScore(0); setDone(false); }}
              className="flex-1 font-black py-3 rounded-xl"
              style={{ minHeight: 44, background: '#fde403', color: '#484000' }}>
              שוב! 🔁
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf5fb] dark:bg-[#0e0e11] text-[#2f2e32] dark:text-slate-100 overflow-x-hidden"
      dir="rtl" style={{ fontFamily: 'Nunito, Heebo, sans-serif' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0e0e11]/90 backdrop-blur border-b border-[#afacb1]/30 dark:border-slate-700/50 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[#78767b] hover:text-[#2f2e32] dark:hover:text-slate-100 font-bold px-3 py-2 rounded-xl hover:bg-[#ebe7ed] dark:hover:bg-slate-800 transition-all group"
            style={{ minHeight: 44 }}>
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 16 16">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            יציאה
          </button>
          <span className="font-black text-sm">{moduleIcon} מגרש תרגול — {moduleTitle}</span>
          <span className="text-xs text-[#78767b] dark:text-slate-500 font-bold">{currentIdx + 1}/{questions.length}</span>
        </div>
        <div className="max-w-xl mx-auto mt-2">
          <div className="h-1.5 bg-[#ebe7ed] dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#34d399,#38bdf8)' }} />
          </div>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 py-8 space-y-5 animate-fade-up">
        {/* Score chip */}
        <div className="flex justify-end">
          <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
            ✅ {score} נכון
          </span>
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700 p-6">
          {/* Visual graph if present */}
          {q?.visualConfig && <MiniGraph config={q.visualConfig} darkMode={_darkMode} />}

          <p className="font-bold text-lg text-right mb-5 text-[#2f2e32] dark:text-slate-100" dir="rtl">
            {renderPrompt(q.prompt)}
          </p>

          {/* MCQ rendering */}
          {isMCQ && q?.options && (
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, i) => {
                let style = 'border-[#e0dbe3] dark:border-slate-600 text-[#2f2e32] dark:text-slate-200 hover:border-[#34d399]';
                if (answered) {
                  if (i === q.correct) style = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
                  else if (i === selected) style = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300';
                  else style = 'border-[#e0dbe3] dark:border-slate-700 opacity-40';
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={answered}
                    className={`w-full border-2 rounded-xl px-4 py-3 font-semibold transition-all disabled:cursor-default ${style}`}
                    style={{ minHeight: 48 }}
                    dir={/^[a-zA-Z=\-\d\s().+*]+$/.test(opt.trim()) ? 'ltr' : 'rtl'}>
                    {renderPrompt(opt)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input rendering */}
          {isInput && (
            <InputAnswer
              placeholder={q?.inputPlaceholder}
              onSubmit={handleInputSubmit}
              answered={answered}
            />
          )}
        </div>

        {/* Explanation + next */}
        {answered && (
          <div className="space-y-3 animate-fade-up">
            <div className={`rounded-xl px-4 py-3 text-sm text-right ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300'}`}>
              {isCorrect ? '✅ נכון! ' : '❌ לא נכון. '}
              <span dir="ltr" className="inline font-mono text-xs">{q.explanation}</span>
            </div>
            <button onClick={next}
              className="w-full font-black py-3 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ minHeight: 48, background: '#fde403', color: '#484000' }}>
              {currentIdx + 1 >= questions.length ? 'סיום ←' : 'שאלה הבאה ←'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
