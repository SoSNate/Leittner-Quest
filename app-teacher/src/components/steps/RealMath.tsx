import { useState, useRef, useEffect, useCallback } from 'react';

// Fixed problem: y = x² - 4x + 3
// a=1, b=-4, c=3
// Vertex: x_v = -(-4)/(2*1) = 2, y_v = 4-8+3 = -1 → (2, -1)
// y-intercept: x=0 → y=3
// x-intercepts: (x-1)(x-3)=0 → x=1, x=3

interface Field { label: string; answer: string; hint: string; placeholder: string; }

const FIELDS: Field[] = [
  { label: 'x של הקודקוד', answer: '2', hint: 'נוסחה: x_v = −b ÷ (2a) = −(−4) ÷ (2·1) = 4 ÷ 2 = 2', placeholder: '?' },
  { label: 'y של הקודקוד', answer: '-1', hint: 'הציבו x=2: y = 2² − 4·2 + 3 = 4 − 8 + 3 = −1', placeholder: '?' },
  { label: 'חיתוך ציר Y', answer: '3', hint: 'הציבו x=0: y = 0 − 0 + 3 = 3', placeholder: '?' },
];

interface Props {
  darkMode: boolean;
  onDone?: () => void;
}

export default function RealMath({ darkMode, onDone }: Props) {
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
    const h = w < 480 ? 170 : 220;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.direction = 'ltr';

    ctx.fillStyle = darkMode ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const pad = 36;
    const pw = w - pad * 2;
    const ph = h - pad * 2;
    const xMin = -1, xMax = 5, yMin = -3, yMax = 5;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => pad + ph - ((y - yMin) / (yMax - yMin)) * ph;
    const fn = (x: number) => x * x - 4 * x + 3;

    // Grid
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'; ctx.lineWidth = 1;
    for (let x = -1; x <= 5; x++) { ctx.beginPath(); ctx.moveTo(tx(x), pad); ctx.lineTo(tx(x), pad + ph); ctx.stroke(); }
    for (let y = -3; y <= 5; y++) { ctx.beginPath(); ctx.moveTo(pad, ty(y)); ctx.lineTo(pad + pw, ty(y)); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke();

    // Axis labels
    ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'; ctx.font = '11px Rubik, Heebo, sans-serif'; ctx.textAlign = 'center';
    for (let x = -1; x <= 5; x++) ctx.fillText(String(x), tx(x), pad + ph + 16);
    ctx.textAlign = 'right';
    for (let y = -3; y <= 5; y++) ctx.fillText(String(y), pad - 5, ty(y) + 4);

    // Parabola
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px <= pw; px++) {
      const x = xMin + (px / pw) * (xMax - xMin);
      const y = fn(x);
      if (y < yMin - 1 || y > yMax + 1) { first = true; continue; }
      first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
      first = false;
    }
    ctx.stroke();

    if (allDone) {
      // Vertex (2, -1)
      ctx.beginPath(); ctx.arc(tx(2), ty(-1), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 11px Rubik, Heebo, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('(2, \u22121)', tx(2) + 8, ty(-1) - 4);

      // Y-intercept (0, 3)
      ctx.beginPath(); ctx.arc(tx(0), ty(3), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      // X-intercepts (1, 0), (3, 0)
      [1, 3].forEach(x => {
        ctx.beginPath(); ctx.arc(tx(x), ty(0), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      });
    }
  }, [darkMode, allDone]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  function checkField(i: number) {
    const val = inputs[i].trim().replace(/\s/g, '');
    const ok = val === FIELDS[i].answer;
    const next = [...checked]; next[i] = true; setChecked(next);
    if (!ok) {
      const h = [...hints]; h[i] = true; setHints(h);
    } else {
      const newChecked = [...checked]; newChecked[i] = true;
      const done = FIELDS.every((f, j) => newChecked[j] && inputs[j].trim().replace(/\s/g,'') === f.answer);
      if (done) { setAllDone(true); onDone?.(); }
    }
  }

  function isCorrect(i: number) {
    return checked[i] && inputs[i].trim().replace(/\s/g,'') === FIELDS[i].answer;
  }
  function isWrong(i: number) {
    return checked[i] && !isCorrect(i);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
      {/* Equation header */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-5 py-4 text-center">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mb-1">נתון:</p>
        <div className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200 font-mono overflow-x-auto" dir="ltr">
          y = x² − 4x + 3
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">מצאו את כל הנקודות החשובות</p>
      </div>

      {/* Graph */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-3">
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      </div>

      {/* Input fields */}
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
                type="text"
                value={inputs[i]}
                onChange={e => {
                  const n = [...inputs]; n[i] = e.target.value; setInputs(n);
                  const c = [...checked]; c[i] = false; setChecked(c);
                  const h = [...hints]; h[i] = false; setHints(h);
                }}
                onKeyDown={e => e.key === 'Enter' && checkField(i)}
                disabled={isCorrect(i)}
                placeholder={field.placeholder}
                className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-center font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-400 disabled:opacity-60 text-sm"
                style={{ minHeight: 44 }}
              />
              {!isCorrect(i) && (
                <button
                  onClick={() => checkField(i)}
                  disabled={!inputs[i].trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ minHeight: 44 }}
                >
                  בדוק
                </button>
              )}
            </div>
            {hints[i] && (
              <div className="mt-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300 text-right" dir="rtl">
                💡 <span dir="ltr" className="inline font-mono">{field.hint}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <div className="mx-5 mb-5 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-600 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <p className="font-black text-emerald-700 dark:text-emerald-300 text-lg">מושלם! כל התשובות נכונות!</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">הנקודות מסומנות עכשיו על הגרף</p>
        </div>
      )}
    </div>
  );
}
