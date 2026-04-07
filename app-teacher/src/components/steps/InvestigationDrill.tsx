import { useState, useRef, useEffect, useCallback } from 'react';
import { normalizeInput } from './utils';

// Problem: y = x² − x − 6
// a=1, b=−1, c=−6
// Y-intercept: c = −6
// δ = (−1)²−4·1·(−6) = 1+24 = 25
// √δ = 5
// x₁ = (1+5)/2 = 3, x₂ = (1−5)/2 = −2
// Vertex x: x_v = −(−1)/(2·1) = 0.5

interface Field { label: string; answer: string; hint: string; placeholder: string }
const FIELDS: Field[] = [
  { label: 'חיתוך ציר Y', answer: '-6', hint: 'הציבו x=0: y = 0 − 0 − 6 = −6. תמיד = c', placeholder: '?' },
  { label: 'δ = b²−4ac', answer: '25', hint: 'δ = (−1)²−4·1·(−6) = 1+24 = 25', placeholder: '?' },
  { label: 'x₁: שורש ראשון', answer: '3', hint: 'x = (−b+√δ)÷(2a) = (1+5)÷2 = 3', placeholder: '?' },
  { label: 'x₂: שורש שני', answer: '-2', hint: 'x = (−b−√δ)÷(2a) = (1−5)÷2 = −2', placeholder: '?' },
  { label: 'x של הקודקוד', answer: '0.5', hint: 'x_v = −b÷(2a) = −(−1)÷(2·1) = 1÷2 = 0.5', placeholder: '?' },
];

interface Props { darkMode: boolean; onDone?: () => void }

export default function InvestigationDrill({ darkMode, onDone }: Props) {
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
    const xMin = -4, xMax = 5, yMin = -8, yMax = 6;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => 12 + ((yMax - y) / (yMax - yMin)) * ph;
    const fn = (x: number) => x * x - x - 6;

    // Grid
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'; ctx.lineWidth = 1;
    for (let x = xMin; x <= xMax; x++) { ctx.beginPath(); ctx.moveTo(tx(x), 12); ctx.lineTo(tx(x), 12 + ph); ctx.stroke(); }
    for (let y = yMin; y <= yMax; y += 2) { ctx.beginPath(); ctx.moveTo(pad, ty(y)); ctx.lineTo(pad + pw, ty(y)); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx(0), 12); ctx.lineTo(tx(0), 12 + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke();

    // Axis labels
    ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8'; ctx.font = '10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let x = xMin + 1; x <= xMax; x++) if (x !== 0) ctx.fillText(String(x), tx(x), ty(0) + 4);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let y = yMin; y <= yMax; y += 2) if (y !== 0) ctx.fillText(String(y), tx(0) - 4, ty(y));

    // Parabola
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
      // Y-intercept (0, -6)
      ctx.beginPath(); ctx.arc(tx(0), ty(-6), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('(0,−6)', tx(0) + 8, ty(-6));

      // Roots: x=-2 and x=3
      [[-2, 0], [3, 0]].forEach(([rx, ry]) => {
        ctx.beginPath(); ctx.arc(tx(rx), ty(ry), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#10b981'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(`x=${rx}`, tx(rx), ty(ry) - 6);
      });

      // Vertex (0.5, -6.25)
      ctx.beginPath(); ctx.arc(tx(0.5), ty(-6.25), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('(0.5, −6.25)', tx(0.5) + 8, ty(-6.25) + 2);
    }
  }, [darkMode, allDone]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  function checkField(i: number) {
    const val = normalizeInput(inputs[i]);
    const ans = normalizeInput(FIELDS[i].answer);
    const ok = val === ans;
    const next = [...checked]; next[i] = true; setChecked(next);
    if (!ok) {
      const h = [...hints]; h[i] = true; setHints(h);
    } else {
      const newChecked = [...checked]; newChecked[i] = true;
      const done = FIELDS.every((f, j) => {
        const v = j === i ? val : normalizeInput(inputs[j]);
        return (newChecked[j] || j === i) && v === normalizeInput(f.answer);
      });
      if (done) { setAllDone(true); onDone?.(); }
    }
  }

  function isCorrect(i: number) {
    return checked[i] && normalizeInput(inputs[i]) === normalizeInput(FIELDS[i].answer);
  }
  function isWrong(i: number) { return checked[i] && !isCorrect(i); }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
      <div className="bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-700 px-5 py-4 text-center">
        <p className="text-xs text-green-700 dark:text-green-400 font-bold mb-1">חקרו את הפרבולה:</p>
        <div className="text-xl sm:text-2xl font-black text-green-800 dark:text-green-200 font-mono overflow-x-auto" dir="ltr">
          y = x² − x − 6
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">מצאו את כל המרכיבים</p>
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
                className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-center font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-green-400 disabled:opacity-60 text-sm"
                style={{ minHeight: 44 }}
              />
              {!isCorrect(i) && (
                <button onClick={() => checkField(i)} disabled={!inputs[i].trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ minHeight: 44 }}>
                  בדוק
                </button>
              )}
            </div>
            {hints[i] && (
              <div className="mt-2 bg-green-50 dark:bg-green-900/30 rounded-lg px-3 py-2 text-xs text-green-700 dark:text-green-300 text-right" dir="rtl">
                💡 <span dir="ltr" className="inline font-mono">{field.hint}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <div className="mx-5 mb-5 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-600 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <p className="font-black text-emerald-700 dark:text-emerald-300 text-lg">מושלם! חקירת הפרבולה הושלמה!</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">כל הנקודות מסומנות על הגרף</p>
        </div>
      )}
    </div>
  );
}
