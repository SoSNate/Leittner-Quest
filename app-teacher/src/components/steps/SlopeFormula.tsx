import { useRef, useEffect, useCallback } from 'react';

interface Props {
  darkMode: boolean;
}

function SlopeCanvas({ darkMode }: { darkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    let el: HTMLElement | null = canvas.parentElement;
    let w = 0; while (el && w < 10) { w = el.clientWidth; el = el.parentElement; }
    const h = Math.min(w < 480 ? 200 : 240, 240);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.direction = 'ltr';

    ctx.fillStyle = darkMode ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const pad = 40;
    const pw = w - pad * 2;
    const ph = h - pad * 2;
    const xMin = -1, xMax = 6, yMin = -1, yMax = 8;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => pad + ph - ((y - yMin) / (yMax - yMin)) * ph;

    // Grid
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'; ctx.lineWidth = 1;
    for (let x = 0; x <= 6; x++) { ctx.beginPath(); ctx.moveTo(tx(x), pad); ctx.lineTo(tx(x), pad + ph); ctx.stroke(); }
    for (let y = 0; y <= 8; y++) { ctx.beginPath(); ctx.moveTo(pad, ty(y)); ctx.lineTo(pad + pw, ty(y)); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke();

    // Axis labels
    ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8';
    ctx.font = `bold 10px Rubik, Heebo, sans-serif`;
    ctx.textAlign = 'center';
    for (let x = 0; x <= 6; x += 2) {
      ctx.fillText(String(x), tx(x), pad + ph + 14);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y <= 8; y += 2) {
      ctx.fillText(String(y), pad - 6, ty(y) + 4);
    }

    // Two points: A(1,2) and B(4,8)
    const p1 = { x: 1, y: 2 }, p2 = { x: 4, y: 8 };

    // Line through points (extended)
    const slope = (p2.y - p1.y) / (p2.x - p1.x); // = 2
    const getY = (x: number) => p1.y + slope * (x - p1.x);
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(tx(xMin), ty(getY(xMin))); ctx.lineTo(tx(xMax), ty(getY(xMax))); ctx.stroke();

    // Rise/Run triangle
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    // Run (horizontal)
    ctx.beginPath(); ctx.moveTo(tx(p1.x), ty(p1.y)); ctx.lineTo(tx(p2.x), ty(p1.y)); ctx.stroke();
    // Rise (vertical)
    ctx.beginPath(); ctx.moveTo(tx(p2.x), ty(p1.y)); ctx.lineTo(tx(p2.x), ty(p2.y)); ctx.stroke();
    ctx.setLineDash([]);

    // Run label
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 11px Rubik, Heebo, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('שינוי ב-X = 3', (tx(p1.x) + tx(p2.x)) / 2, ty(p1.y) + 16);
    // Rise label
    ctx.textAlign = 'left';
    ctx.fillText('שינוי ב-Y = 6', tx(p2.x) + 5, (ty(p1.y) + ty(p2.y)) / 2 + 4);

    // Points
    [p1, p2].forEach((p, i) => {
      ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399'; ctx.fill();
      ctx.strokeStyle = darkMode ? '#0f172a' : '#f8fafc'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = darkMode ? '#e2e8f0' : '#334155';
      ctx.font = `bold 11px Rubik, Heebo, sans-serif`;
      ctx.textAlign = i === 0 ? 'right' : 'left';
      ctx.fillText(`(${p.x},${p.y})`, tx(p.x) + (i === 0 ? -8 : 8), ty(p.y) - 8);
    });
  }, [darkMode]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />;
}

export default function SlopeFormula({ darkMode }: Props) {
  return (
    <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 p-6 sm:p-8 mb-6 space-y-6">

      {/* The formula */}
      <div className="text-center space-y-3">
        <p className="text-sm font-bold text-[#78767b] dark:text-slate-400">השיפוע m מחושב כך:</p>
        <div className="flex items-center justify-center gap-3" dir="ltr">
          <span className="text-xl sm:text-2xl font-black font-mono" style={{ color: '#34d399' }}>m =</span>
          <div className="inline-flex flex-col items-center font-black font-mono text-xl leading-none" style={{ color: '#f59e0b' }}>
            <span className="pb-1">שינוי ב-Y</span>
            <span className="w-full border-t-2 border-current" />
            <span className="pt-1">שינוי ב-X</span>
          </div>
          <span className="text-2xl font-black font-mono text-[#78767b] dark:text-slate-500">=</span>
          <div className="inline-flex flex-col items-center font-black font-mono text-xl leading-none" style={{ color: '#f59e0b' }}>
            <span className="pb-1">y₂ − y₁</span>
            <span className="w-full border-t-2 border-current" />
            <span className="pt-1">x₂ − x₁</span>
          </div>
        </div>
      </div>

      {/* Visual example */}
      <div className="bg-[#f4eff5] dark:bg-slate-900/40 rounded-xl overflow-hidden p-2">
        <SlopeCanvas darkMode={darkMode} />
      </div>

      {/* Worked example */}
      <div className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
        <p className="font-black text-[#2f2e32] dark:text-slate-100 text-sm text-right">📐 דוגמה: נקודות <span dir="ltr" className="inline font-mono">(1,2)</span> ו-<span dir="ltr" className="inline font-mono">(4,8)</span></p>
        <div className="flex items-center justify-end gap-3 flex-wrap" dir="ltr">
          <span className="font-mono font-black" style={{ color: '#34d399' }}>m =</span>
          <div className="inline-flex flex-col items-center font-mono font-bold text-sm leading-none" style={{ color: '#f59e0b' }}>
            <span className="pb-0.5">8 − 2</span>
            <span className="w-full border-t border-current" />
            <span className="pt-0.5">4 − 1</span>
          </div>
          <span className="font-mono font-black" style={{ color: '#34d399' }}>=</span>
          <div className="inline-flex flex-col items-center font-mono font-bold text-sm leading-none" style={{ color: '#f59e0b' }}>
            <span className="pb-0.5">6</span>
            <span className="w-full border-t border-current" />
            <span className="pt-0.5">3</span>
          </div>
          <span className="font-mono font-black" style={{ color: '#34d399' }}>= 2</span>
        </div>
        <p className="text-xs text-[#78767b] dark:text-slate-500 text-right">
          כל צעד ימינה (+1 ב-X) → הקו עולה <strong>2</strong> יחידות ב-Y
        </p>
      </div>

      {/* Why it works */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-right">
          <p className="font-black text-emerald-700 dark:text-emerald-300 text-sm mb-1">💡 למה זה עובד?</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            שיפוע = קצב שינוי. בכל קו ישר הקצב קבוע — לא משנה אילו שתי נקודות בוחרים, התוצאה תמיד אותה!
          </p>
        </div>
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 text-right">
          <p className="font-black text-sky-700 dark:text-sky-300 text-sm mb-1">⚠️ שים לב לסדר!</p>
          <div className="text-xs text-sky-600 dark:text-sky-400 space-y-1" dir="ltr">
            <div className="flex items-center gap-1">
              <span className="inline-flex flex-col items-center font-mono leading-none"><span className="pb-0.5">y₂−y₁</span><span className="border-t border-current w-full"/><span className="pt-0.5">x₂−x₁</span></span>
              <span>✓</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex flex-col items-center font-mono leading-none"><span className="pb-0.5">y₁−y₂</span><span className="border-t border-current w-full"/><span className="pt-0.5">x₁−x₂</span></span>
              <span>✓ (גם נכון)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex flex-col items-center font-mono leading-none text-red-500"><span className="pb-0.5">y₂−y₁</span><span className="border-t border-current w-full"/><span className="pt-0.5">x₁−x₂</span></span>
              <span>✗ (שגוי!)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
