import { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  darkMode: boolean;
  onDone?: () => void;
}

const M = 5;       // rate of change: +1 right, +5 up
const RANGE = 9;   // show 9 steps

export default function SteppingGraph({ darkMode, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0); // 0 = no points yet
  const [celebrated, setCelebrated] = useState(false);
  const rafRef = useRef<number>(0);

  const bg = darkMode ? '#0f172a' : '#f8fafc';
  const axisCol = darkMode ? '#475569' : '#94a3b8';
  const textCol = darkMode ? '#cbd5e1' : '#475569';
  const lineCol = '#34d399';
  const dotCol = '#38bdf8';
  const stepCol = '#f59e0b';

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    let el: HTMLElement | null = canvas.parentElement;
    let w = 0;
    while (el && w < 10) { w = el.clientWidth; el = el.parentElement; }
    const h = w < 480 ? 200 : 280;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const pad = 40;
    const pw = w - pad * 2;
    const ph = h - pad * 2;

    // math range: x from -1 to 8, y from -5 to 45
    const xMin = -1, xMax = 8, yMin = -5, yMax = 45;
    const toCanvasX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const toCanvasY = (y: number) => pad + ph - ((y - yMin) / (yMax - yMin)) * ph;

    // Grid lines
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 8; x++) {
      ctx.beginPath(); ctx.moveTo(toCanvasX(x), pad); ctx.lineTo(toCanvasX(x), pad + ph); ctx.stroke();
    }
    for (let y = 0; y <= 40; y += 5) {
      ctx.beginPath(); ctx.moveTo(pad, toCanvasY(y)); ctx.lineTo(pad + pw, toCanvasY(y)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = axisCol; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(toCanvasX(0), pad); ctx.lineTo(toCanvasX(0), pad + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toCanvasY(0)); ctx.lineTo(pad + pw, toCanvasY(0)); ctx.stroke();

    // Axis labels
    ctx.fillStyle = textCol; ctx.font = '11px Nunito, sans-serif'; ctx.textAlign = 'center';
    for (let x = 0; x <= 8; x++) {
      ctx.fillText(String(x), toCanvasX(x), pad + ph + 16);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y <= 40; y += 10) {
      ctx.fillText(String(y), pad - 6, toCanvasY(y) + 4);
    }

    // Generate points up to current step
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < step; i++) {
      points.push({ x: i, y: M * i });
    }

    // Draw connecting line segments (emerald)
    if (points.length >= 2) {
      ctx.strokeStyle = lineCol; ctx.lineWidth = 2.5; ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
      }
      ctx.stroke();
    }

    // Draw step arrows (amber) — show Δx=1, Δy=5
    if (points.length >= 2) {
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        // Δx arrow (horizontal)
        ctx.strokeStyle = stepCol; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(p0.x), toCanvasY(p0.y));
        ctx.lineTo(toCanvasX(p1.x), toCanvasY(p0.y));
        ctx.stroke();
        // Δy arrow (vertical)
        ctx.beginPath();
        ctx.moveTo(toCanvasX(p1.x), toCanvasY(p0.y));
        ctx.lineTo(toCanvasX(p1.x), toCanvasY(p1.y));
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        if (i === 1) {
          ctx.fillStyle = stepCol; ctx.font = 'bold 11px Nunito, sans-serif'; ctx.textAlign = 'center';
          const midX = (toCanvasX(p0.x) + toCanvasX(p1.x)) / 2;
          ctx.fillText('+1', midX, toCanvasY(p0.y) + 14);
          ctx.textAlign = 'left';
          const midY = (toCanvasY(p0.y) + toCanvasY(p1.y)) / 2;
          ctx.fillText(`+${M}`, toCanvasX(p1.x) + 4, midY);
        }
      }
    }

    // Draw points (sky blue)
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(toCanvasX(p.x), toCanvasY(p.y), i === points.length - 1 ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = dotCol;
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      // Coordinate label on last point
      if (i === points.length - 1) {
        ctx.fillStyle = textCol; ctx.font = 'bold 12px Nunito, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`(${p.x}, ${p.y})`, toCanvasX(p.x) + 10, toCanvasY(p.y) - 6);
      }
    });
  }, [step, darkMode, bg, axisCol, textCol]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  function handleAdvance() {
    if (step >= RANGE) return;
    const next = step + 1;
    setStep(next);
    if (next === RANGE) {
      setCelebrated(true);
      onDone?.();
    }
  }

  function handleReset() {
    setStep(0);
    setCelebrated(false);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
      <div className="bg-slate-50 dark:bg-slate-900/40 p-3">
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
        <div className="flex items-center justify-center gap-2 mt-2 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-xl">
          <span className="font-mono font-black text-base" style={{ color: '#34d399' }} dir="ltr">y = {M}x</span>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {/* Rate badge */}
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
          <span className="text-amber-700 dark:text-amber-300 font-bold text-sm">
            ⬆️ +{M} למעלה &nbsp;|&nbsp; ➡️ +1 ימינה — תמיד אותו יחס!
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all duration-300 rounded-full" style={{ width: `${(step / RANGE) * 100}%` }} />
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{step} / {RANGE} נקודות</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAdvance}
            disabled={step >= RANGE}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            style={{ minHeight: 44 }}
          >
            {step === 0 ? '▶ הוסף נקודה ראשונה' : step >= RANGE ? '✅ הושלם!' : `▶ צעד ${step + 1}`}
          </button>
          {step > 0 && (
            <button onClick={handleReset} className="px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-400 transition-colors font-bold" style={{ minHeight: 44 }}>
              איפוס
            </button>
          )}
        </div>

        {celebrated && (
          <div className="bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-600 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <p className="font-black text-emerald-700 dark:text-emerald-300">כל הנקודות על קו אחד!</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">הקצב הקבוע (+{M} לכל +1) הוא מה שיוצר קו ישר.</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2 font-semibold">
              שים לב: +{M} לכל +1 — זה בדיוק ה-<span dir="ltr" className="inline font-mono font-black">m</span> בנוסחה <span dir="ltr" className="inline font-mono">y = {M}x + b</span>!<br/>
              המקדם של x תמיד = קצב השינוי.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
