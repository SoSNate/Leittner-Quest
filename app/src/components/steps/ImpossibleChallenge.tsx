import { useRef, useEffect, useCallback, useState } from 'react';
import SliderController from '../ui/SliderController';
import { useAppStore } from '../../store/useAppStore';

// 4 curved points that clearly don't fit a straight line (from y = x²)
const CURVE_POINTS = [
  { x: -2, y: 4 },
  { x: -1, y: 1 },
  { x:  1, y: 1 },
  { x:  2, y: 4 },
];

interface Props {
  darkMode: boolean;
  onDone: () => void;
}

export default function ImpossibleChallenge({ darkMode, onDone }: Props) {
  const { sim, setSim } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    let el: HTMLElement | null = canvas.parentElement;
    let w = 0; while (el && w < 10) { w = el.clientWidth; el = el.parentElement; }
    const h = w < 480 ? 200 : 260;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = 40;
    const pw = w - pad * 2, ph = h - pad * 2;
    const xMin = -5, xMax = 5, yMin = -1, yMax = 7;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => pad + ph - ((y - yMin) / (yMax - yMin)) * ph;

    ctx.fillStyle = darkMode ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'; ctx.lineWidth = 1;
    for (let x = xMin; x <= xMax; x++) { ctx.beginPath(); ctx.moveTo(tx(x), pad); ctx.lineTo(tx(x), pad + ph); ctx.stroke(); }
    for (let y = 0; y <= yMax; y++) { ctx.beginPath(); ctx.moveTo(pad, ty(y)); ctx.lineTo(pad + pw, ty(y)); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke();

    // Axis labels
    ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'; ctx.font = '11px Nunito, Heebo, sans-serif';
    ctx.textAlign = 'center';
    for (let x = xMin; x <= xMax; x++) ctx.fillText(String(x), tx(x), pad + ph + 16);
    ctx.textAlign = 'right';
    for (let y = 0; y <= yMax; y += 2) ctx.fillText(String(y), pad - 5, ty(y) + 4);

    // The straight line (student's attempt)
    const m = sim.m, b = sim.b;
    const lineColor = gaveUp ? '#f87171' : '#38bdf8';
    ctx.strokeStyle = lineColor; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx(xMin), ty(m * xMin + b));
    ctx.lineTo(tx(xMax), ty(m * xMax + b));
    ctx.stroke();

    // If revealed — also draw the true parabola
    if (gaveUp) {
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 3]);
      ctx.beginPath();
      let first = true;
      for (let px = 0; px <= pw; px++) {
        const x = xMin + (px / pw) * (xMax - xMin);
        const y = x * x;
        if (y < yMin - 1 || y > yMax + 1) { first = true; continue; }
        first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        first = false;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Target points
    CURVE_POINTS.forEach((p) => {
      const lineY = m * p.x + b;
      const hit = Math.abs(lineY - p.y) < 0.35;
      ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 9, 0, Math.PI * 2);
      ctx.fillStyle = hit ? '#fde403' : '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = darkMode ? '#0f172a' : '#484000';
      ctx.font = 'bold 12px Nunito, Heebo, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('★', tx(p.x), ty(p.y) + 4);
    });
  }, [sim.m, sim.b, darkMode, gaveUp]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  // Count hits
  const hits = CURVE_POINTS.filter(p => Math.abs(sim.m * p.x + sim.b - p.y) < 0.35).length;

  function handleGiveUp() {
    setGaveUp(true);
    setAttempts(a => a + 1);
  }

  return (
    <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 overflow-hidden mb-6">
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50 px-5 py-4">
        <h3 className="font-black text-lg text-red-700 dark:text-red-400">🚨 המשימה הבלתי אפשרית</h3>
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">יש 4 כוכבים. נסו לכוון קו ישר שעובר דרך כולם!</p>
      </div>

      <div className="bg-[#f4eff5] dark:bg-slate-900/40 p-3">
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl px-4 py-2">
          <span className="text-sm font-bold text-[#5d5b5f] dark:text-slate-400">כוכבים שנפגעו:</span>
          <div className="flex gap-1">
            {CURVE_POINTS.map((p, i) => {
              const hit = Math.abs(sim.m * p.x + sim.b - p.y) < 0.35;
              return <span key={i} className={`text-xl transition-all ${hit ? 'scale-110' : 'opacity-30'}`}>★</span>;
            })}
          </div>
          <span className="text-xs font-bold text-[#78767b] mr-auto">{hits}/4</span>
        </div>

        <SliderController id="m" label="שיפוע (m)" min={-5} max={5} step={0.25} value={sim.m} color="sky" onChange={v => { setSim({ m: v }); setAttempts(a => a + 1); }} />
        <SliderController id="b" label="חיתוך Y (b)" min={-2} max={8} step={0.25} value={sim.b} color="amber" onChange={v => { setSim({ b: v }); setAttempts(a => a + 1); }} />

        {!gaveUp ? (
          <button
            onClick={handleGiveUp}
            disabled={attempts < 5}
            className="w-full border-2 border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 font-bold py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ minHeight: 44 }}
          >
            {attempts < 5 ? `נסו עוד קצת... (${5 - attempts} נסיונות נוספים)` : '😤 אני מוותר — הסבר לי למה'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-right space-y-2">
              <p className="font-black text-amber-800 dark:text-amber-300">💡 זה אכן בלתי אפשרי — וזו הנקודה!</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">הנקודות יושבות על <strong>עקומה</strong> — לא על קו. מ-<span dir="ltr" className="inline font-mono">(-2, 4)</span> ל-<span dir="ltr" className="inline font-mono">(-1, 1)</span> השינוי ב-y הוא <span dir="ltr" className="inline font-mono">−3</span>, אבל מ-<span dir="ltr" className="inline font-mono">(-1, 1)</span> ל-<span dir="ltr" className="inline font-mono">(1, 1)</span> השינוי ב-y הוא <span dir="ltr" className="inline font-mono">0</span>. הקצב משתנה בכל נקודה!</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">קו ישר = קצב <em>קבוע</em>. כשהקצב משתנה — צריך <strong>פרבולה</strong>. זה בדיוק מה שנלמד עכשיו.</p>
            </div>
            <button
              onClick={onDone}
              className="w-full font-black py-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: '#fde403', color: '#484000', minHeight: 44 }}
            >
              בואו ללמוד על פרבולות! ←
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
