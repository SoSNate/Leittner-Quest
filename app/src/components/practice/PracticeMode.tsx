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

interface PracticeQuestion {
  id: string;
  prompt: string;
  options: string[];
  correct: number; // index
  explanation: string;
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
    explanation: `b הוא הקבוע — מה y כש-x=0. ב-${eq} → b = ${b}`,
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
    prompt: `קו עם שיפוע m=${m} — לאיזה כיוון?`,
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
    prompt: `קו עם שיפוע ${m} וחיתוך Y ב-${b} — מה המשוואה?`,
    options: opts,
    correct: opts.indexOf(correct),
    explanation: `m=${m}, b=${b} → ${correct}`,
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
    prompt: `y = ${a}x² — לאיזה כיוון הפרבולה פתוחה?`,
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
  const pool1 = [genSlopeFromPoints, genIdentifySlope, genIdentifyIntercept, genLineDirection, genEquationFromMB];
  const pool2 = [genParabolaDirection, genVertexX, genIdentifyIntercept, genSlopeFromPoints];
  const pool3 = [genDiscriminant, genVertexXM3, genParabolaRange, genRootSign];
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
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[currentIdx];
  const isCorrect = selected === q?.correct;
  const answered = selected !== null;
  const pct = Math.round(((currentIdx) / questions.length) * 100);

  const handleSelect = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    const correct = idx === q.correct;
    if (correct) setScore(s => s + 1);
    updateBox(q.id, moduleId, correct);
  }, [answered, q, moduleId, updateBox]);

  function next() {
    if (currentIdx + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
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
            <button onClick={() => { setCurrentIdx(0); setSelected(null); setScore(0); setDone(false); }}
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
      dir="rtl" style={{ fontFamily: 'Rubik, Heebo, sans-serif' }}>

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
          <p className="font-bold text-lg text-right mb-5 text-[#2f2e32] dark:text-slate-100" dir="rtl">
            {renderPrompt(q.prompt)}
          </p>

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
