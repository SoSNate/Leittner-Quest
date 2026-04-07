import { useRef, useEffect, useCallback, useState } from 'react';

interface MatchItem {
  id: string;
  fn: (x: number) => number;
  equation: string;
}

// Graph display colors — order is intentionally different from item ID order
// so students CANNOT match by color
const DISPLAY_COLORS = ['#38bdf8', '#f59e0b', '#a78bfa', '#34d399'];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LINEAR_ITEMS: MatchItem[] = [
  { id: 'l1', fn: x => 2 * x + 1,    equation: 'y = 2x + 1'   },
  { id: 'l2', fn: x => -x + 3,       equation: 'y = -x + 3'   },
  { id: 'l3', fn: x => 0.5 * x - 2,  equation: 'y = 0.5x - 2' },
  { id: 'l4', fn: _ => 2,             equation: 'y = 2'        },
];

const PARABOLA_ITEMS: MatchItem[] = [
  { id: 'p1', fn: x => x * x - 1,        equation: 'y = x² - 1'    },
  { id: 'p2', fn: x => -x * x + 2,       equation: 'y = -x² + 2'   },
  { id: 'p3', fn: x => 0.5 * x * x - 2,  equation: 'y = 0.5x² - 2' },
  { id: 'p4', fn: x => x * x - 2 * x,    equation: 'y = x² - 2x'   },
];

interface Props {
  type: 'linear' | 'parabola';
  darkMode: boolean;
  onDone?: () => void;
}

function MiniGraph({ item, displayColor, darkMode, size = 120 }: {
  item: MatchItem; displayColor: string; darkMode: boolean; size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = darkMode ? '#1e293b' : '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    const pad = 10, pw = size - pad * 2;
    const xMin = -4, xMax = 4, yMin = -5, yMax = 5;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => pad + pw - ((y - yMin) / (yMax - yMin)) * pw;

    // Axes
    ctx.strokeStyle = darkMode ? '#334155' : '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + pw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke();

    // Curve — use displayColor, not item color
    ctx.strokeStyle = displayColor; ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px <= pw; px++) {
      const x = xMin + (px / pw) * (xMax - xMin);
      const y = item.fn(x);
      if (y < yMin - 1 || y > yMax + 1) { first = true; continue; }
      first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
      first = false;
    }
    ctx.stroke();
  }, [item, displayColor, darkMode, size]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

export default function MatchDrill({ type, darkMode, onDone }: Props) {
  const items = type === 'linear' ? LINEAR_ITEMS : PARABOLA_ITEMS;

  // Shuffle equation chips display order — but graph grid stays fixed
  const [equationOrder] = useState(() => shuffle(items));
  // Shuffle which display color goes to which graph position (so color can't hint graph→equation)
  const [graphColors] = useState(() => shuffle(DISPLAY_COLORS));

  const [matches, setMatches] = useState<Record<string, string>>({}); // graphId → equationId
  const [touchEq, setTouchEq] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  function dropOnGraph(graphId: string) {
    if (!touchEq) return;
    const cleaned = Object.fromEntries(Object.entries(matches).filter(([, v]) => v !== touchEq));
    setMatches({ ...cleaned, [graphId]: touchEq });
    setTouchEq(null);
  }

  function removeMatch(graphId: string) {
    if (revealed) return;
    const next = { ...matches };
    delete next[graphId];
    setMatches(next);
  }

  function isCorrect(graphId: string) {
    return matches[graphId] === graphId;
  }

  function checkAnswers() {
    setRevealed(true);
    const allCorrect = items.every(item => isCorrect(item.id));
    if (allCorrect) onDone?.();
  }

  function reset() {
    setMatches({});
    setRevealed(false);
    setTouchEq(null);
  }

  const allPlaced = Object.keys(matches).length === items.length;
  const usedEqIds = new Set(Object.values(matches));
  const score = revealed ? items.filter(i => isCorrect(i.id)).length : 0;

  return (
    <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 p-4 sm:p-5 mb-6">
      <p className="text-sm font-bold text-[#5d5b5f] dark:text-slate-300 mb-1 text-right">
        🧠 שייכו משוואה לגרף המתאים לה
      </p>
      <p className="text-xs text-[#78767b] dark:text-slate-500 mb-4 text-right">
        לחצו על משוואה ואז על הגרף כדי לשייך — אין רמזי צבע!
      </p>

      {/* Equation chips — all neutral color, no item-specific color */}
      <div className="flex flex-wrap gap-2 mb-5 justify-end">
        {equationOrder.map(item => {
          const isUsed = usedEqIds.has(item.id);
          const isSelected = touchEq === item.id;
          return (
            <button
              key={item.id}
              disabled={isUsed && !isSelected}
              onClick={() => {
                if (revealed) return;
                setTouchEq(prev => prev === item.id ? null : item.id);
              }}
              className={`font-mono font-bold text-sm px-3 py-2 rounded-xl border-2 transition-all select-none
                ${isSelected
                  ? 'border-[#fde403] bg-[#fde403]/20 scale-105 text-[#484000] dark:text-[#fde403]'
                  : isUsed
                    ? 'border-[#e0dbe3] dark:border-slate-700 text-[#c4c2c6] dark:text-slate-600 opacity-40 cursor-not-allowed'
                    : 'border-[#e0dbe3] dark:border-slate-600 text-[#2f2e32] dark:text-slate-100 hover:border-[#34d399] hover:scale-105 cursor-pointer'
                }
              `}
              style={{ minHeight: 44 }}
              dir="ltr"
            >
              {item.equation}
            </button>
          );
        })}
      </div>

      {/* Graph grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 mb-5">
        {items.map((item, idx) => {
          const matchedEqId = matches[item.id];
          const matchedEq = items.find(e => e.id === matchedEqId);
          const hasMatch = !!matchedEqId;
          const correct = revealed && isCorrect(item.id);
          const wrong = revealed && hasMatch && !isCorrect(item.id);
          const selectable = touchEq !== null && !revealed;

          return (
            <div
              key={item.id}
              onClick={() => selectable ? dropOnGraph(item.id) : (hasMatch && !revealed ? removeMatch(item.id) : undefined)}
              className={`rounded-xl overflow-hidden border-2 transition-all cursor-pointer
                ${selectable ? 'border-[#fde403] ring-2 ring-[#fde403]/30 scale-[1.02]' : ''}
                ${correct ? 'border-emerald-400 ring-2 ring-emerald-400/30' : ''}
                ${wrong ? 'border-red-400 ring-2 ring-red-400/30' : ''}
                ${!selectable && !correct && !wrong ? 'border-[#e0dbe3] dark:border-slate-700 hover:border-slate-400' : ''}
              `}
            >
              <div className="bg-[#f4eff5] dark:bg-slate-900/50 flex justify-center p-1">
                <MiniGraph item={item} displayColor={graphColors[idx]} darkMode={darkMode}
                  size={typeof window !== 'undefined' && window.innerWidth < 400 ? 140 : 120} />
              </div>
              {/* Match slot */}
              <div className={`px-2 py-1.5 text-center text-xs font-mono font-bold min-h-[32px] flex items-center justify-center
                ${darkMode ? 'bg-slate-800' : 'bg-white'}
              `}>
                {hasMatch ? (
                  <span dir="ltr" className={correct ? 'text-emerald-500' : wrong ? 'text-red-400' : 'text-[#2f2e32] dark:text-slate-100'}>
                    {correct && '✓ '}{wrong && '✗ '}{matchedEq?.equation}
                  </span>
                ) : (
                  <span className="text-[#c4c2c6] dark:text-slate-600">הכניסו משוואה</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!revealed ? (
        <button
          onClick={checkAnswers}
          disabled={!allPlaced}
          className="w-full font-black py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            minHeight: 44,
            background: allPlaced ? '#fde403' : undefined,
            color: allPlaced ? '#484000' : undefined,
            border: allPlaced ? 'none' : '2px solid #e0dbe3',
          }}
        >
          {allPlaced ? 'בדוק תשובות ✓' : `שייכו עוד ${items.length - Object.keys(matches).length} משוואות`}
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 text-center font-bold
            ${score === items.length
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
            {score === items.length
              ? '🏆 מושלם! כל ההתאמות נכונות!'
              : `${score}/${items.length} נכון — ירוק = נכון, אדום = לא נכון`}
          </div>
          {score === items.length && (
            <div className="space-y-2">
              {items.map(item => {
                const hint = {
                  l1: 'y=2x+1: שיפוע חיובי (m=2), חוצה Y ב-1 — ישר עולה תלול',
                  l2: 'y=−x+3: שיפוע שלילי (m=−1) — ישר יורד, מתחיל גבוה',
                  l3: 'y=0.5x−2: שיפוע עדין (m=0.5), חוצה Y ב-−2 — ישר עולה לאט',
                  l4: 'y=2: שיפוע 0 — קו אופקי ב-y=2',
                  p1: 'y=x²−1: פרבולה רגילה, קודקוד ב-(0,−1)',
                  p2: 'y=−x²+2: פתוחה למטה (a<0), קודקוד ב-(0,2)',
                  p3: 'y=0.5x²−2: פרבולה רחבה (|a|<1), קודקוד ב-(0,−2)',
                  p4: 'y=x²−2x: קודקוד ב-(1,−1) — פרבולה זזה ימינה',
                }[item.id];
                return hint ? (
                  <div key={item.id} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span dir="ltr" className="font-mono font-bold">{item.equation}</span>: {hint.split(': ').slice(1).join(': ')}
                  </div>
                ) : null;
              })}
            </div>
          )}
          <button onClick={reset}
            className="w-full border-2 border-[#e0dbe3] dark:border-slate-600 text-[#5d5b5f] dark:text-slate-400 font-bold py-3 rounded-xl hover:border-emerald-400 transition-colors"
            style={{ minHeight: 44 }}>
            נסו שוב
          </button>
          {score === items.length && (
            <button onClick={() => onDone?.()}
              className="w-full font-black py-3 rounded-xl transition-all"
              style={{ minHeight: 44, background: '#fde403', color: '#484000' }}>
              המשך ←
            </button>
          )}
          {score < items.length && (
            <button onClick={() => onDone?.()}
              className="w-full font-bold py-3 rounded-xl border-2 border-[#e0dbe3] dark:border-slate-600 text-[#78767b] dark:text-slate-400 transition-colors hover:border-slate-400"
              style={{ minHeight: 44 }}>
              המשך בכל זאת ←
            </button>
          )}
        </div>
      )}
    </div>
  );
}
