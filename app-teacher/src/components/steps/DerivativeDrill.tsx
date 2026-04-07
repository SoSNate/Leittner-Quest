import { useState, useRef, useEffect, useCallback } from 'react';
import { normalizeInput } from './utils';

// Problem: y = x² − 8x + 3
// a=1, b=−8, c=3
// y' = 2x − 8
// Vertex x: x_v = −(−8)/(2·1) = 4
// Vertex y: y(4) = 16 − 32 + 3 = −13
// f'(1) = 2(1) − 8 = −6

interface Field { label: string; answer: string | string[]; hint: string; placeholder: string }
const FIELDS: Field[] = [
  { label: "מהי הנגזרת y′(x)?", answer: ['2x-8', '2x−8'], hint: "כלל החזקה: x² → 2x. −8x → −8. 3 → 0. לכן y′ = 2x−8", placeholder: 'למשל: 2x−8' },
  { label: 'x של הקודקוד (y′ = 0):', answer: '4', hint: "שוויון לאפס: 2x−8=0 → 2x=8 → x=4", placeholder: '?' },
  { label: 'y של הקודקוד:', answer: '-13', hint: "הציבו x=4: y = 16−32+3 = −13", placeholder: '?' },
  { label: "ערך הנגזרת בנקודה f′(1):", answer: '-6', hint: "f′(1) = 2·1−8 = 2−8 = −6", placeholder: '?' },
];

interface Props { darkMode: boolean; onDone?: () => void }

export default function DerivativeDrill({ darkMode, onDone }: Props) {
  const [inputs, setInputs] = useState<string[]>(FIELDS.map(() => ''));
  const [checked, setChecked] = useState<boolean[]>(FIELDS.map(() => false));
  const [hints, setHints] = useState<boolean[]>(FIELDS.map(() => false));
  const [allDone, setAllDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    let el: HTMLElement | null = canvas.parentElement;
    let w = 0;
    while (el && w < 10) { w = el.clientWidth; el = el.parentElement; }
    const h = w < 480 ? 180 : 230;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.direction = 'ltr';

    ctx.fillStyle = darkMode ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const pad = 38;
    const pw = w - pad - 12;
    const ph = h - pad - 14;
    const xMin = 0, xMax = 8, yMin = -15, yMax = 10;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => 12 + ((yMax - y) / (yMax - yMin)) * ph;
    const fn = (x: number) => x * x - 8 * x + 3;
    const dfn = (x: number) => 2 * x - 8;

    // Grid
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'; ctx.lineWidth = 1;
    for (let x = xMin; x <= xMax; x++) { ctx.beginPath(); ctx.moveTo(tx(x), 12); ctx.lineTo(tx(x), 12 + ph); ctx.stroke(); }
    for (let y = yMin; y <= yMax; y += 5) { ctx.beginPath(); ctx.moveTo(pad, ty(y)); ctx.lineTo(pad + pw, ty(y)); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx(0), 12); ctx.lineTo(tx(0), 12 + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke();

    // Axis labels
    ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8'; ctx.font = '10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let x = xMin + 1; x <= xMax; x++) ctx.fillText(String(x), tx(x), ty(0) + 4);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let y = -15; y <= 10; y += 5) if (y !== 0) ctx.fillText(String(y), tx(0) - 4, ty(y));

    // Parabola y=x²-8x+3
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5; ctx.beginPath();
    let first = true;
    for (let px = 0; px <= pw; px++) {
      const x = xMin + (px / pw) * (xMax - xMin);
      const y = fn(x);
      if (y < yMin - 0.5 || y > yMax + 0.5) { first = true; continue; }
      first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
      first = false;
    }
    ctx.stroke();

    if (allDone) {
      // Derivative line y'=2x-8
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath();
      let firstD = true;
      for (let px = 0; px <= pw; px++) {
        const x = xMin + (px / pw) * (xMax - xMin);
        const y = dfn(x);
        if (y < yMin - 0.5 || y > yMax + 0.5) { firstD = true; continue; }
        firstD ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        firstD = false;
      }
      ctx.stroke();
      // Label derivative line
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText("y' = 2x\u22128", tx(6.5), ty(dfn(6.5)) - 4);

      // Vertex (4, -13)
      ctx.beginPath(); ctx.arc(tx(4), ty(-13), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('(4, \u221213)', tx(4) + 8, ty(-13));

      // f'(1) dot
      ctx.beginPath(); ctx.arc(tx(1), ty(fn(1)), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText("f'(1)=\u22126", tx(1) + 7, ty(fn(1)) - 4);
    }
  }, [darkMode, allDone]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  function checkField(i: number) {
    const val = normalizeInput(inputs[i]);
    const answers = Array.isArray(FIELDS[i].answer) ? FIELDS[i].answer as string[] : [FIELDS[i].answer as string];
    const ok = answers.some(a => normalizeInput(a) === val);
    const next = [...checked]; next[i] = true; setChecked(next);
    if (!ok) {
      const h = [...hints]; h[i] = true; setHints(h);
    } else {
      const newChecked = [...checked]; newChecked[i] = true;
      const done = FIELDS.every((f, j) => {
        if (j === i) return ok;
        if (!newChecked[j]) return false;
        const v = normalizeInput(inputs[j]);
        const ans = Array.isArray(f.answer) ? f.answer as string[] : [f.answer as string];
        return ans.some(a => normalizeInput(a) === v);
      });
      if (done) { setAllDone(true); onDone?.(); }
    }
  }

  function isCorrect(i: number) {
    if (!checked[i]) return false;
    const val = normalizeInput(inputs[i]);
    const answers = Array.isArray(FIELDS[i].answer) ? FIELDS[i].answer as string[] : [FIELDS[i].answer as string];
    return answers.some(a => normalizeInput(a) === val);
  }
  function isWrong(i: number) { return checked[i] && !isCorrect(i); }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
      <div className="bg-violet-50 dark:bg-violet-900/30 border-b border-violet-200 dark:border-violet-700 px-5 py-4 text-center">
        <p className="text-xs text-violet-700 dark:text-violet-400 font-bold mb-1">גזרו ונתחו:</p>
        <div className="text-xl sm:text-2xl font-black text-violet-800 dark:text-violet-200 font-mono overflow-x-auto" dir="ltr">
          y = x² − 8x + 3
        </div>
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">מצאו את הנגזרת ואת נקודות המפתח</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 p-3">
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      </div>

      <div className="p-5 space-y-3">
        {FIELDS.map((field, i) => (
          <div key={i} className={`rounded-xl border-2 p-3 transition-colors ${
            isCorrect(i) ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
            isWrong(i) ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
            'border-slate-200 dark:border-slate-600'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex-1 text-right">{field.label}</span>
              {isCorrect(i) && <span className="text-emerald-500 text-lg">✅</span>}
              {isWrong(i) && <span className="text-red-500 text-lg">❌</span>}
            </div>
            <div className="flex gap-2" dir="ltr">
              <input
                type="text" value={inputs[i]}
                onChange={e => {
                  const n = [...inputs]; n[i] = e.target.value; setInputs(n);
                  const c = [...checked]; c[i] = false; setChecked(c);
                  const h = [...hints]; h[i] = false; setHints(h);
                }}
                onKeyDown={e => e.key === 'Enter' && checkField(i)}
                disabled={isCorrect(i)} placeholder={field.placeholder}
                className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-center font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-400 disabled:opacity-60 text-sm"
                style={{ minHeight: 44 }}
              />
              {!isCorrect(i) && (
                <button onClick={() => checkField(i)} disabled={!inputs[i].trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ minHeight: 44 }}>
                  בדוק
                </button>
              )}
            </div>
            {hints[i] && (
              <div className="mt-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg px-3 py-2 text-xs text-violet-700 dark:text-violet-300 text-right" dir="rtl">
                💡 <span dir="ltr" className="inline font-mono">{field.hint}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <div className="mx-5 mb-5 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-600 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <p className="font-black text-emerald-700 dark:text-emerald-300 text-lg">מושלם! ניתוח הנגזרת הושלם!</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">הנגזרת וקודקוד הפרבולה מסומנים על הגרף</p>
        </div>
      )}
    </div>
  );
}
