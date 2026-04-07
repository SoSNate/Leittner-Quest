import { useRef, useEffect, useCallback, useState } from 'react';

interface MiniGraph {
  id: number;
  label: string;
  isLinear: boolean;
  fn: (x: number) => number;
  color: string;
  dotXs?: number[];
}

const GRAPHS: MiniGraph[] = [
  { id: 1, label: 'y = 2x + 1',   isLinear: true,  fn: x => 2 * x + 1,    color: '#34d399' },
  { id: 2, label: 'y = x²',       isLinear: false, fn: x => x * x,         color: '#f87171' },
  { id: 3, label: 'y = -x + 3',   isLinear: true,  fn: x => -x + 3,        color: '#38bdf8' },
  { id: 4, label: 'y = x³',       isLinear: false, fn: x => x * x * x,     color: '#fb923c', dotXs: [-1.5, -1.1, -0.7, 0, 0.7, 1.1, 1.5] },
  { id: 5, label: 'y = 0.5x - 2', isLinear: true,  fn: x => 0.5 * x - 2,  color: '#a78bfa' },
  { id: 6, label: 'y = 3',        isLinear: true,  fn: _ => 3,             color: '#facc15' },
];

const CORRECT_COUNT = GRAPHS.filter(g => g.isLinear).length; // 4

interface MiniCanvasProps {
  graph: MiniGraph;
  selected: boolean;
  revealed: boolean;
  darkMode: boolean;
  onClick: () => void;
}

function MiniCanvas({ graph, selected, revealed, darkMode, onClick }: MiniCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    // Responsive size: fill parent width
    let el: HTMLElement | null = canvas.parentElement;
    let w = 0; while (el && w < 10) { w = el.clientWidth; el = el.parentElement; }
    const size = Math.min(w || 140, 160);
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = darkMode ? '#1e293b' : '#f8fafc';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);

    const pad = 12;
    const pw = size - pad * 2;
    const xMin = -4, xMax = 4, yMin = -5, yMax = 5;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => pad + pw - ((y - yMin) / (yMax - yMin)) * pw;

    // Axes
    ctx.strokeStyle = darkMode ? '#334155' : '#cbd5e1'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + pw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke();

    // Draw as scattered dots so student infers the pattern
    const dotXs = [-3, -2, -1, 0, 1, 2, 3];
    dotXs.forEach(x => {
      const y = graph.fn(x);
      if (y < yMin - 0.5 || y > yMax + 0.5) return;
      ctx.beginPath();
      ctx.arc(tx(x), ty(y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = graph.color;
      ctx.fill();
      ctx.strokeStyle = darkMode ? '#0f172a' : '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [graph, darkMode]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  let borderStyle = 'border-2 border-slate-200 dark:border-slate-600';
  if (revealed) {
    borderStyle = graph.isLinear
      ? 'border-2 border-emerald-400 ring-2 ring-emerald-400/30'
      : 'border-2 border-red-400 ring-2 ring-red-400/30';
  } else if (selected) {
    borderStyle = 'border-2 border-sky-400 ring-2 ring-sky-400/30';
  }

  return (
    <div
      className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${borderStyle}`}
      onClick={onClick}
    >
      <div className="relative">
        <canvas ref={canvasRef} style={{ display: 'block' }} />
        {selected && !revealed && (
          <div className="absolute inset-0 bg-sky-400/20 flex items-center justify-center">
            <span className="text-sky-600 dark:text-sky-300 text-2xl">✓</span>
          </div>
        )}
        {revealed && (
          <div className={`absolute inset-0 flex items-center justify-center ${graph.isLinear ? 'bg-emerald-400/20' : 'bg-red-400/20'}`}>
            <span className="text-2xl">{graph.isLinear ? '✅' : '❌'}</span>
          </div>
        )}
      </div>
      <div className={`px-2 py-1.5 text-center text-xs font-mono font-bold ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>
        {graph.label}
      </div>
    </div>
  );
}

interface Props {
  darkMode: boolean;
  onDone?: () => void;
}

export default function IdentifyDrill({ darkMode, onDone }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  function toggleSelect(id: number) {
    if (revealed) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleCheck() {
    let correct = 0;
    GRAPHS.forEach(g => {
      const sel = selected.has(g.id);
      if (sel === g.isLinear) correct++;
    });
    setScore(correct);
    setRevealed(true);
    if (correct === GRAPHS.length) onDone?.();
  }

  function handleReset() {
    setSelected(new Set());
    setRevealed(false);
    setScore(null);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
      <div className="bg-[#f4eff5] dark:bg-slate-800/60 rounded-xl p-4 mb-4 text-right">
        <p className="font-black text-[#2f2e32] dark:text-slate-100 text-sm mb-1">🔍 מסדר זיהוי!</p>
        <p className="text-sm text-[#5d5b5f] dark:text-slate-400">
          כל גרף מראה <strong>נקודות</strong>. קו ישר = נקודות שיושבות על קו אחד — כלומר בכל צעד ימינה, הן עולות (או יורדות) <strong>בדיוק אותו הדבר</strong>.
        </p>
        <p className="text-xs text-[#78767b] dark:text-slate-500 mt-1.5">לחצו על {CORRECT_COUNT} הגרפים שלדעתכם הם קווים ישרים</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center mb-5">
        {GRAPHS.map(g => (
          <MiniCanvas
            key={g.id}
            graph={g}
            selected={selected.has(g.id)}
            revealed={revealed}
            darkMode={darkMode}
            onClick={() => toggleSelect(g.id)}
          />
        ))}
      </div>

      {!revealed ? (
        <button
          onClick={handleCheck}
          disabled={selected.size === 0}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          style={{ minHeight: 44 }}
        >
          בדוק את הבחירה שלי ({selected.size} נבחרו)
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 text-center font-bold ${score === GRAPHS.length ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
            {score === GRAPHS.length
              ? `🏆 מושלם! כל ${GRAPHS.length} תשובות נכונות!`
              : `${score}/${GRAPHS.length} נכון — ירוק = קו ישר, אדום = לא קו ישר`}
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-400">
            💡 <strong>קו ישר = קצב שינוי קבוע</strong>. y=x² ו-y=x³ משנים את הקצב — לכן הם עקומות, לא קווים.
          </div>
          <button onClick={handleReset} className="w-full border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-xl hover:border-emerald-400 transition-colors" style={{ minHeight: 44 }}>
            נסו שוב
          </button>
        </div>
      )}
    </div>
  );
}
