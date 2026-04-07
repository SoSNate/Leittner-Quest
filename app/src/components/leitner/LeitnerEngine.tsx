import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { QuizQuestion } from '../../types';
import type { MascotType } from '../../store/useAppStore';

interface Props {
  moduleId: number;
  questions: QuizQuestion[];
  onComplete: () => void;
}

// Detects coordinate patterns like (0,2) and (4,10) in prompt text
function parseCoords(prompt: string): { x: number; y: number }[] | null {
  const matches = [...prompt.matchAll(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g)];
  if (matches.length < 2) return null;
  return matches.map(m => ({ x: parseFloat(m[1]), y: parseFloat(m[2]) }));
}

interface SlopeGraphProps { points: { x: number; y: number }[]; darkMode: boolean; }
function SlopeGraph({ points, darkMode }: SlopeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    let el: HTMLElement | null = canvas.parentElement;
    let w = 0; while (el && w < 10) { w = el.clientWidth; el = el.parentElement; }
    const h = w < 480 ? 140 : 180;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.direction = 'ltr';

    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const xMin = Math.min(...xs) - 2, xMax = Math.max(...xs) + 2;
    const yMin = Math.min(...ys) - 2, yMax = Math.max(...ys) + 2;
    const pad = 36;
    const pw = w - pad * 2, ph = h - pad * 2;
    const tx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * pw;
    const ty = (y: number) => pad + ph - ((y - yMin) / (yMax - yMin)) * ph;

    ctx.fillStyle = darkMode ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'; ctx.lineWidth = 1;
    for (let x = Math.floor(xMin); x <= xMax; x++) { ctx.beginPath(); ctx.moveTo(tx(x), pad); ctx.lineTo(tx(x), pad + ph); ctx.stroke(); }
    for (let y = Math.floor(yMin); y <= yMax; y++) { ctx.beginPath(); ctx.moveTo(pad, ty(y)); ctx.lineTo(pad + pw, ty(y)); ctx.stroke(); }

    ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'; ctx.lineWidth = 1.5;
    if (xMin <= 0 && xMax >= 0) { ctx.beginPath(); ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + ph); ctx.stroke(); }
    if (yMin <= 0 && yMax >= 0) { ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + pw, ty(0)); ctx.stroke(); }

    // Draw line through points (extended)
    if (points.length === 2) {
      const [p1, p2] = points;
      const slope = (p2.y - p1.y) / (p2.x - p1.x);
      const getY = (x: number) => p1.y + slope * (x - p1.x);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(tx(xMin), ty(getY(xMin))); ctx.lineTo(tx(xMax), ty(getY(xMax))); ctx.stroke();
      ctx.setLineDash([]);

      // Δx and Δy arrows
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(tx(p1.x), ty(p1.y)); ctx.lineTo(tx(p2.x), ty(p1.y)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx(p2.x), ty(p1.y)); ctx.lineTo(tx(p2.x), ty(p2.y)); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 10px Nunito, Heebo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`שינוי X: ${p2.x - p1.x}`, (tx(p1.x) + tx(p2.x)) / 2, ty(p1.y) + 14);
      ctx.textAlign = 'left';
      ctx.fillText(`שינוי Y: ${p2.y - p1.y}`, tx(p2.x) + 4, (ty(p1.y) + ty(p2.y)) / 2);
    }

    // Draw points
    points.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = darkMode ? '#cbd5e1' : '#334155';
      ctx.font = 'bold 11px Nunito, Heebo, sans-serif';
      ctx.textAlign = i === 0 ? 'right' : 'left';
      ctx.fillText(`(${p.x},${p.y})`, tx(p.x) + (i === 0 ? -8 : 8), ty(p.y) - 6);
    });
  }, [points, darkMode]);

  useEffect(() => { const id = requestAnimationFrame(draw); return () => cancelAnimationFrame(id); }, [draw]);
  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} className="rounded-xl overflow-hidden" />;
}

// Splits Hebrew+math mixed text and renders math spans as LTR
function renderMixedText(text: string): React.ReactNode {
  // Split into Hebrew runs vs math/English runs
  // Hebrew chars: \u05D0-\u05EA, \u05F0-\u05F4, \uFB1D-\uFB4E
  const parts = text.split(/([\u05D0-\u05EA\u05F0-\u05F4\uFB1D-\uFB4E][^a-zA-Z\d=\^+\-*/÷×²³_]*)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    const isHebrew = /[\u05D0-\u05EA\u05F0-\u05F4\uFB1D-\uFB4E]/.test(part);
    if (isHebrew) return <span key={i}>{part}</span>;
    // non-Hebrew: wrap in ltr isolation if it has math/latin content
    if (/[a-zA-Z\d=+\-\^²³_]/.test(part)) {
      return <span key={i} dir="ltr" className="inline font-mono">{part.trim()}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Returns true if option text is primarily mathematical (not Hebrew)
function isMathOption(opt: string): boolean {
  return /^[-\d+.xy²³=\s()]+$/.test(opt.trim()) || /^[a-zA-Z]\s*[><=]/.test(opt.trim());
}

export default function LeitnerEngine({ moduleId, questions, onComplete }: Props) {
  const updateBox = useAppStore((s) => s.updateBox);
  const triggerMascot = useAppStore((s) => s.triggerMascot);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';
  const [queue, setQueue] = useState<QuizQuestion[]>([...questions]);
  const [current, setCurrent] = useState<QuizQuestion | null>(questions[0] ?? null);
  const [answered, setAnswered] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const hintRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const pendingNextRef = useRef<QuizQuestion | null>(null);

  function advance(q: QuizQuestion | null) {
    if (!q) { onComplete(); return; }
    lastIdRef.current = q.id;
    setCurrent(q);
    setAnswered(false);
    setInputVal('');
    setFeedback(null);
    setShowHint(false);
    setWrongStreak(0);
  }

  function submitAnswer(ok: boolean) {
    if (answered) return;
    setAnswered(true);
    updateBox(current!.id, moduleId, ok);

    if (ok) {
      setFeedback({ ok: true, text: '✅ נכון! עברה לקופסה 1.' });
      setWrongStreak(0);
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      pendingNextRef.current = newQueue[0] ?? null;
      // Trigger mascot to reinforce the correct reasoning
      triggerMascot(current!.hint, 'correct' as MascotType, 8000);
    } else {
      const streak = wrongStreak + 1;
      setWrongStreak(streak);
      setFeedback({ ok: false, text: '❌ לא נכון — חוזרת לתור.' });
      const remaining = queue.slice(1);
      let newQueue: QuizQuestion[];
      if (remaining.length >= 2) {
        // Insert current after the first remaining item so it doesn't repeat immediately
        newQueue = [remaining[0], current!, ...remaining.slice(1)];
      } else {
        newQueue = [...remaining, current!];
      }
      setQueue(newQueue);
      if (streak >= 2) {
        setShowHint(true);
        setTimeout(() => {
          hintRef.current?.classList.add('animate-hint');
          setTimeout(() => hintRef.current?.classList.remove('animate-hint'), 500);
        }, 100);
      }
      setTimeout(() => advance(newQueue[0] ?? null), 800);
    }
  }

  function handleMCQ(idx: number) { submitAnswer(idx === current!.correct); }
  function handleInput() {
    const ok = inputVal.trim().replace(/\s/g, '') === String(current!.correct).replace(/\s/g, '');
    submitAnswer(ok);
  }

  const completed = queue.length === 0;

  if (completed) {
    return (
      <div className="text-center py-10">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-amber-500 mb-2">עברתם את כל השאלות!</h3>
        <p className="text-[#5d5b5f] dark:text-slate-400">כל השאלות עברו לקופסה 1 במערכת לייטנר.</p>
        <button onClick={onComplete} className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
          סיים מודול ←
        </button>
      </div>
    );
  }

  if (!current) return null;

  const slopePoints = current.type === 'input' ? parseCoords(current.prompt) : null;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex gap-2 flex-wrap">
        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          ✅ קופסה 1: {questions.length - queue.length}/{questions.length}
        </span>
        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          🔄 בתור: {queue.length}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700 p-6 animate-fade-up" dir="rtl">
        <p className="font-bold text-lg mb-4 text-[#2f2e32] dark:text-slate-100 text-right" dir="rtl">{renderMixedText(current.prompt)}</p>

        {/* Slope mini graph for input questions with coordinates */}
        {slopePoints && (
          <div className="mb-4 rounded-xl overflow-hidden bg-[#f4eff5] dark:bg-slate-900/40 p-2">
            <SlopeGraph points={slopePoints} darkMode={isDark} />
          </div>
        )}

        {current.type === 'mcq' ? (
          <div className="flex flex-col gap-2.5" dir="rtl">
            {(current.options ?? []).map((opt, i) => (
              <button
                key={i}
                disabled={answered}
                onClick={() => handleMCQ(i)}
                className="text-right w-full bg-[#f4eff5] dark:bg-slate-700/50 border-2 border-[#e0dbe3] dark:border-slate-600 rounded-xl px-4 py-3 text-sm sm:text-base font-semibold text-[#2f2e32] dark:text-slate-200 hover:border-emerald-400 transition-colors disabled:cursor-default"
                style={{ minHeight: 44 }}
                dir={isMathOption(opt) ? 'ltr' : 'rtl'}
              >
                {isMathOption(opt) ? <span dir="ltr" className="font-mono">{opt}</span> : renderMixedText(opt)}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 items-center" dir="ltr">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInput()}
              placeholder="תשובה..."
              className="flex-1 bg-[#f4eff5] dark:bg-slate-700 border-2 border-[#e0dbe3] dark:border-slate-600 rounded-xl px-4 py-3 text-base font-mono text-center text-[#2f2e32] dark:text-slate-100 focus:outline-none focus:border-emerald-400"
              style={{ minHeight: '44px' }}
            />
            <button onClick={handleInput} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3 rounded-xl transition-colors" style={{ minHeight: '44px' }}>
              בדוק
            </button>
          </div>
        )}

        {feedback && (
          <p className={`mt-4 font-semibold text-right ${feedback.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {feedback.text}
          </p>
        )}

        {/* Correct: show pedagogical hint + manual Next button */}
        {feedback?.ok && (
          <div className="mt-3 space-y-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl px-4 py-3 text-sm text-right text-emerald-800 dark:text-emerald-200">
              💡 <span dir="ltr" className="inline font-mono">{current.hint}</span>
            </div>
            <button
              onClick={() => advance(pendingNextRef.current)}
              className="w-full font-black py-3 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ minHeight: 44, background: '#fde403', color: '#484000' }}
            >
              הבא ←
            </button>
          </div>
        )}

        {/* Wrong streak: show hint after 2 mistakes */}
        {showHint && (
          <div ref={hintRef} className="mt-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-amber-800 dark:text-amber-200 text-sm text-right">
            💡 רמז: {current.hint}
          </div>
        )}
      </div>
    </div>
  );
}
