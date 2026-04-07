import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import InvestigationDrill from '../steps/InvestigationDrill';
import ModuleHeader from './ModuleHeader';

// ─── Types ────────────────────────────────────────────────────────────────────
type CanvasMode = 0 | 1 | 2 | 3 | 4 | 5;

type LearnStep = {
  type: 'learn';
  canvasMode: CanvasMode;
  title: string;
  desc: string;
  controls: string[];
  formulaCards?: { label: string; from: string; to: string; color: string }[];
};
type PracticeStep = {
  type: 'practice';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};
type DrillStep = { type: 'drill' };
type AnyStep = LearnStep | PracticeStep | DrillStep;

// ─── Curriculum ───────────────────────────────────────────────────────────────
const STEPS: AnyStep[] = [
  // 0: Overview
  {
    type: 'learn', canvasMode: 0,
    title: 'שלד הפרבולה — 5 שאלות שחוקר שואל',
    desc: `כשחוקרים פרבולה, תמיד שואלים את אותן 5 שאלות:<br/><br/>
<span style="color:#3b82f6">🔵 חיתוך ציר Y</span> — כשx=0, מה y?<br/>
<span style="color:#10b981">🟢 שורשים</span> — כשy=0, מה x?<br/>
<span style="color:#ef4444">🔴 קודקוד</span> — הנמוך/גבוה ביותר<br/>
<span style="color:#f59e0b">🟡 תחום שלילי/חיובי</span> — מתחת/מעל לציר X<br/>
<span style="color:#8b5cf6">🟣 עלייה/ירידה</span> — מתי הפרבולה עולה?<br/><br/>
בגרף: <span dir="ltr" class="inline font-mono">y = x²−2x−3</span> עם כל 5 הנקודות.`,
    controls: [],
  },
  // 1: Y-intercept
  {
    type: 'learn', canvasMode: 1,
    title: 'חיתוך ציר Y — בן שנייה!',
    desc: `מציבים <strong>x=0</strong> בפונקציה:<br/><br/>
<span dir="ltr" class="inline font-mono">y = a·0² + b·0 + <strong style="color:#3b82f6">c</strong> = c</span><br/><br/>
זהו! חיתוך ציר Y = <strong style="color:#3b82f6">c</strong> תמיד.<br/><br/>
הזיזו את c עם הסליידר וראו כיצד נקודת החיתוך זזה.`,
    controls: ['c'],
    formulaCards: [
      { label: 'y=x²+5', from: 'x=0 → y=5', to: 'c=5', color: '#3b82f6' },
      { label: 'y=x²−3', from: 'x=0 → y=−3', to: 'c=−3', color: '#3b82f6' },
      { label: 'y=2x²+x+7', from: 'x=0 → y=7', to: 'c=7', color: '#3b82f6' },
    ],
  },
  // 2: Practice Y-intercept
  {
    type: 'practice',
    question: 'מה חיתוך ציר Y של y = 3x² − 7x + 4?',
    options: ['4', '7', '3', '−4'],
    correct: 0,
    explanation: 'x=0 → y = 0 − 0 + 4 = 4. חיתוך Y = c תמיד!',
  },
  // 3: Trinomial roots
  {
    type: 'learn', canvasMode: 2,
    title: 'שורשים שיטה 1 — פירוק לגורמים',
    desc: `<strong>הרעיון:</strong> <span dir="ltr" class="inline font-mono">x²+bx+c = (x−r₁)(x−r₂)</span><br/><br/>
מחפשים r₁, r₂ שמקיימים:<br/>
<span dir="ltr" class="inline font-mono font-bold">r₁ · r₂ = c</span> (מכפלה = c)<br/>
<span dir="ltr" class="inline font-mono font-bold">r₁ + r₂ = −b</span> (סכום = −b)<br/><br/>
השורשים הם: <span dir="ltr" class="inline font-mono">x = r₁</span> ו-<span dir="ltr" class="inline font-mono">x = r₂</span>.<br/><br/>
הזיזו את x וראו את הנקודה הצהובה זזה על הפרבולה.`,
    controls: ['xVal'],
    formulaCards: [
      { label: 'x²−5x+6', from: '2·3=6 ✓  2+3=5 ✓', to: 'x=2 ו-x=3', color: '#10b981' },
      { label: 'x²+x−6', from: '3·(−2)=−6 ✓  −3+2=−1 ✓', to: 'x=−3 ו-x=2', color: '#10b981' },
      { label: 'x²−4', from: '(x−2)(x+2)', to: 'x=2 ו-x=−2', color: '#10b981' },
    ],
  },
  // 4: Practice trinomial
  {
    type: 'practice',
    question: 'פרקו x² − 7x + 12. מה השורשים?',
    options: ['x=3 ו-x=4', 'x=2 ו-x=6', 'x=1 ו-x=12', 'x=−3 ו-x=−4'],
    correct: 0,
    explanation: 'מכפלה=12, סכום=7. 3×4=12 ✓, 3+4=7 ✓ → (x−3)(x−4)',
  },
  // 5: Delta + quadratic formula
  {
    type: 'learn', canvasMode: 3,
    title: 'כשהטרינום לא עובד — נוסחת השורשים',
    desc: `<strong>הדלתא:</strong> <span dir="ltr" class="inline font-mono font-bold">δ = b²−4ac</span><br/><br/>
<span style="color:#10b981">δ > 0</span> → 2 שורשים שונים<br/>
<span style="color:#3b82f6">δ = 0</span> → שורש כפול אחד<br/>
<span style="color:#ef4444">δ < 0</span> → אין שורשים<br/><br/>
<strong>הנוסחה:</strong><br/>
<span dir="ltr" class="inline font-mono font-black text-base">x = (−b ± √δ) / 2a</span><br/><br/>
שנו a, b, c וראו את השורשים!`,
    controls: ['a', 'b', 'c'],
    formulaCards: [
      { label: 'x²+2x−3', from: 'δ=4+12=16', to: 'x=1 ו-x=−3', color: '#10b981' },
      { label: '2x²−4x−6', from: 'δ=16+48=64', to: 'x=3 ו-x=−1', color: '#10b981' },
      { label: 'x²−2x+1', from: 'δ=4−4=0', to: 'x=1 (כפול)', color: '#3b82f6' },
    ],
  },
  // 6: Practice quadratic formula
  {
    type: 'practice',
    question: 'פתרו x² − 3x − 4 = 0',
    options: ['x=4 ו-x=−1', 'x=3 ו-x=4', 'x=−4 ו-x=1', 'x=2 ו-x=−2'],
    correct: 0,
    explanation: 'δ = 9+16 = 25. x = (3±5)/2 → x=4 או x=−1',
  },
  // 7: Vertex min/max
  {
    type: 'learn', canvasMode: 4,
    title: 'הקודקוד — מינימום ומקסימום',
    desc: `נוסחת x הקודקוד:<br/>
<span dir="ltr" class="inline font-mono font-black text-base">x_v = −b / (2a)</span><br/><br/>
ואז מציבים: <span dir="ltr" class="inline font-mono">y_v = f(x_v)</span><br/><br/>
<strong>a > 0</strong> → קודקוד = <span style="color:#10b981">מינימום</span> 😊<br/>
<strong>a < 0</strong> → קודקוד = <span style="color:#ef4444">מקסימום</span> 😢<br/><br/>
שנו a ו-b וראו את הקודקוד זז!`,
    controls: ['a', 'b'],
  },
  // 8: Positive/negative + increasing/decreasing
  {
    type: 'learn', canvasMode: 5,
    title: 'תחומים — שלילי, חיובי, עלייה, ירידה',
    desc: `לפרבולה <span dir="ltr" class="inline font-mono">y = x²−2x−3</span><br/>
שורשים: x=−1 ו-x=3, קודקוד: x=1<br/><br/>
<span style="color:#ef4444">🔴 שלילי:</span> <span dir="ltr" class="inline font-mono">−1 < x < 3</span><br/>
<span style="color:#10b981">🟢 חיובי:</span> <span dir="ltr" class="inline font-mono">x < −1</span> או <span dir="ltr" class="inline font-mono">x > 3</span><br/><br/>
<span style="color:#8b5cf6">↘ יורדת:</span> <span dir="ltr" class="inline font-mono">x < 1</span><br/>
<span style="color:#f59e0b">↗ עולה:</span> <span dir="ltr" class="inline font-mono">x > 1</span>`,
    controls: [],
  },
  // 9: Drill
  { type: 'drill' },
];

interface Props { onBack: () => void }

const MODULE_ID = 3;

export default function Module3Investigation({ onBack }: Props) {
  const { theme, progress, setStep, completeModule } = useAppStore();
  const isDark = theme === 'dark';

  const [stepIdx, setStepIdxRaw] = useState(() => progress[MODULE_ID]?.step ?? 0);

  function setStepIdx(idx: number) {
    setStepIdxRaw(idx);
    setStep(MODULE_ID, idx);
  }
  const [xVal, setXVal] = useState(1.0);
  const [aSlider, setASlider] = useState(1);
  const [bSlider, setBSlider] = useState(-2);
  const [cSlider, setCSlider] = useState(-3);
  const [practiceAnswered, setPracticeAnswered] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cur = STEPS[stepIdx];

  const canvasMode: CanvasMode = (() => {
    for (let i = stepIdx; i >= 0; i--) {
      if (STEPS[i].type === 'learn') return (STEPS[i] as LearnStep).canvasMode;
    }
    return 0;
  })();

  const activeControls: string[] = (() => {
    for (let i = stepIdx; i >= 0; i--) {
      if (STEPS[i].type === 'learn') return (STEPS[i] as LearnStep).controls;
    }
    return [];
  })();

  const fmtN = (n: number) => {
    const r = Math.round(n * 100) / 100;
    return Number.isInteger(r) ? String(r) : r.toFixed(2);
  };

  // ─── Canvas draw ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cur.type === 'drill') return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const w = rect.width, h = rect.height;

      // Coordinate system: x in [-5,6], y in [-8,10]
      const xMin = -5, xMax = 6, yMin = -8, yMax = 10;
      const padL = 38, padR = 12, padT = 12, padB = 28;
      const pw = w - padL - padR;
      const ph = h - padT - padB;
      const tx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * pw;
      const ty = (y: number) => padT + ((yMax - y) / (yMax - yMin)) * ph;

      // Background
      ctx.fillStyle = isDark ? '#0d0d1a' : '#f4eff5';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = isDark ? '#1e1e35' : '#e8e3f0';
      ctx.lineWidth = 1;
      for (let x = xMin; x <= xMax; x++) {
        const px = tx(x);
        ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, padT + ph); ctx.stroke();
      }
      for (let y = yMin; y <= yMax; y += 2) {
        const py = ty(y);
        ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(padL + pw, py); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = isDark ? '#4a5568' : '#c4bdd0';
      ctx.lineWidth = 1.5;
      const axX = tx(0), axY = ty(0);
      if (axX >= padL && axX <= w - padR) { ctx.beginPath(); ctx.moveTo(axX, padT); ctx.lineTo(axX, padT + ph); ctx.stroke(); }
      if (axY >= padT && axY <= padT + ph) { ctx.beginPath(); ctx.moveTo(padL, axY); ctx.lineTo(padL + pw, axY); ctx.stroke(); }

      // Tick labels
      ctx.save(); ctx.direction = 'ltr';
      ctx.fillStyle = isDark ? '#64748b' : '#a09ab0'; ctx.font = '10px Rubik, Heebo, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let x = xMin + 1; x <= xMax; x++) {
        if (x === 0) continue;
        const px = tx(x);
        if (px < 15 || px > w - 10) continue;
        ctx.fillText(String(x), px, axY + 4);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let y = yMin; y <= yMax; y += 2) {
        if (y === 0) continue;
        const py = ty(y);
        if (py < 10 || py > h - 10) continue;
        ctx.fillText(String(y), axX - 4, py);
      }
      ctx.restore();

      // ── Mode-specific drawing ──────────────────────────────────────────────

      // Helper: draw parabola y = a*x²+b*x+c
      function drawParabola(a: number, b: number, c: number, color: string, lw: number) {
        ctx.strokeStyle = color; ctx.lineWidth = lw;
        ctx.beginPath();
        let first = true;
        for (let px2 = 0; px2 <= pw; px2++) {
          const x = xMin + (px2 / pw) * (xMax - xMin);
          const y = a * x * x + b * x + c;
          if (y < yMin - 1 || y > yMax + 1) { first = true; continue; }
          first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
          first = false;
        }
        ctx.stroke();
      }

      // Helper: dot with label
      function dot(x: number, y: number, r: number, color: string, label: string, labelX = 1, labelY = -1) {
        ctx.beginPath(); ctx.arc(tx(x), ty(y), r, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        if (label) {
          ctx.save(); ctx.direction = 'ltr';
          ctx.fillStyle = color; ctx.font = 'bold 10px Rubik, Heebo, sans-serif';
          ctx.textAlign = labelX > 0 ? 'left' : 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, tx(x) + labelX * 8, ty(y) + labelY * 2);
          ctx.restore();
        }
      }

      if (canvasMode === 0) {
        // Overview: y=x²-2x-3 with all 5 features
        drawParabola(1, -2, -3, '#7c3aed', 2.5);
        // Y-intercept
        dot(0, -3, 6, '#3b82f6', '(0,−3)');
        // Roots
        dot(-1, 0, 6, '#10b981', 'x=−1', 1, -1);
        dot(3, 0, 6, '#10b981', 'x=3', 1, -1);
        // Vertex
        dot(1, -4, 7, '#ef4444', '(1,−4)');
        // Positive/negative labels
        ctx.save(); ctx.direction = 'ltr';
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = isDark ? '#6ee7b7' : '#065f46';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('(+)', tx(-3), ty(3) - 2);
        ctx.fillText('(+)', tx(5), ty(3) - 2);
        ctx.fillStyle = isDark ? '#fca5a5' : '#991b1b';
        ctx.fillText('(−)', tx(1), ty(-1) + 12);
        ctx.restore();
      }

      else if (canvasMode === 1) {
        // Y-intercept: y = x² + c (b=0, a=1)
        const c1 = cSlider;
        drawParabola(1, 0, c1, '#7c3aed', 2.5);
        // Blue dot at (0, c)
        dot(0, c1, 7, '#3b82f6', `(0, ${fmtN(c1)})`);
        // Dashed horizontal guide
        ctx.save(); ctx.direction = 'ltr';
        ctx.strokeStyle = 'rgba(59,130,246,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(padL, ty(c1)); ctx.lineTo(padL + pw, ty(c1)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      else if (canvasMode === 2) {
        // Trinomial: y = x²-5x+6 (fixed), roots at 2 and 3
        drawParabola(1, -5, 6, '#7c3aed', 2.5);
        dot(2, 0, 7, '#10b981', 'x=2', 1, -1);
        dot(3, 0, 7, '#10b981', 'x=3', 1, -1);
        // Ant at xVal
        const antY = xVal * xVal - 5 * xVal + 6;
        if (antY >= yMin - 0.5 && antY <= yMax + 0.5) {
          const glow = ctx.createRadialGradient(tx(xVal), ty(antY), 0, tx(xVal), ty(antY), 14);
          glow.addColorStop(0, 'rgba(252,227,0,0.4)'); glow.addColorStop(1, 'rgba(252,227,0,0)');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(tx(xVal), ty(antY), 14, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FCE300'; ctx.beginPath(); ctx.arc(tx(xVal), ty(antY), 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
          ctx.save(); ctx.direction = 'ltr';
          ctx.fillStyle = isDark ? '#cbd5e1' : '#475569'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText(`(${xVal.toFixed(1)}, ${antY.toFixed(1)})`, tx(xVal) + 8, ty(antY) - 6);
          ctx.restore();
        }
      }

      else if (canvasMode === 3) {
        // Delta/Quadratic: y = aSlider*x²+bSlider*x+cSlider
        const a = aSlider === 0 ? 0.5 : aSlider;
        const b = bSlider, c = cSlider;
        drawParabola(a, b, c, '#7c3aed', 2.5);
        const delta = b * b - 4 * a * c;
        if (delta > 0.001) {
          const sqd = Math.sqrt(delta);
          const x1 = (-b + sqd) / (2 * a);
          const x2 = (-b - sqd) / (2 * a);
          if (x1 >= xMin - 0.5 && x1 <= xMax + 0.5) dot(x1, 0, 6, '#10b981', `x≈${x1.toFixed(1)}`, x1 > 0 ? 1 : -1, -1);
          if (x2 >= xMin - 0.5 && x2 <= xMax + 0.5) dot(x2, 0, 6, '#10b981', `x≈${x2.toFixed(1)}`, x2 < x1 ? -1 : 1, -1);
        } else if (Math.abs(delta) < 0.001) {
          const x0 = -b / (2 * a);
          if (x0 >= xMin - 0.5 && x0 <= xMax + 0.5) dot(x0, 0, 7, '#3b82f6', `x=${x0.toFixed(1)}`);
        } else {
          // No roots label
          ctx.save(); ctx.direction = 'ltr';
          ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px Rubik, Heebo, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('אין שורשים', w / 2, padT + 20);
          ctx.restore();
        }
        // Delta annotation
        ctx.save(); ctx.direction = 'ltr';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'; ctx.font = 'bold 10px Rubik, Heebo, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`\u03b4 = ${delta.toFixed(1)}`, padL + 4, padT + 4);
        ctx.restore();
      }

      else if (canvasMode === 4) {
        // Vertex: y = aSlider*x² + bSlider*x
        const a = aSlider === 0 ? 0.5 : aSlider;
        const b = bSlider;
        drawParabola(a, b, 0, '#7c3aed', 2.5);
        const xv = -b / (2 * a);
        const yv = a * xv * xv + b * xv;
        if (xv >= xMin - 0.5 && xv <= xMax + 0.5) {
          // Dashed vertical at vertex
          ctx.save(); ctx.direction = 'ltr';
          ctx.strokeStyle = isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.3)';
          ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(tx(xv), padT); ctx.lineTo(tx(xv), padT + ph); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          // Vertex dot
          dot(xv, yv, 7, '#ef4444', `(${xv.toFixed(1)}, ${yv.toFixed(1)})`);
          // Min/Max label
          ctx.save(); ctx.direction = 'ltr';
          ctx.fillStyle = a > 0 ? '#10b981' : '#ef4444';
          ctx.font = 'bold 11px Rubik, Heebo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(a > 0 ? 'מינימום ↓' : 'מקסימום ↑', tx(xv), ty(yv) + (a > 0 ? -12 : 18));
          ctx.restore();
        }
      }

      else if (canvasMode === 5) {
        // Domains: y=x²-2x-3, roots -1 and 3, vertex 1
        // Shading
        const x0 = tx(-1), x1 = tx(3), y0 = ty(0);

        // Positive regions (faint green)
        ctx.fillStyle = 'rgba(16,185,129,0.12)';
        ctx.fillRect(padL, padT, x0 - padL, ph);
        ctx.fillRect(x1, padT, padL + pw - x1, ph);

        // Negative region (faint red, between roots)
        ctx.fillStyle = 'rgba(239,68,68,0.12)';
        ctx.fillRect(x0, padT, x1 - x0, ph);

        drawParabola(1, -2, -3, '#7c3aed', 2.5);

        // Roots
        dot(-1, 0, 6, '#10b981', '', 0, 0);
        dot(3, 0, 6, '#10b981', '', 0, 0);

        // Vertex
        dot(1, -4, 6, '#ef4444', '', 0, 0);

        // Vertex axis line
        ctx.save(); ctx.direction = 'ltr';
        ctx.strokeStyle = isDark ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.3)';
        ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(tx(1), padT); ctx.lineTo(tx(1), padT + ph); ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.font = 'bold 10px Rubik, Heebo, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // Domain labels
        ctx.fillStyle = isDark ? '#6ee7b7' : '#065f46';
        if (x0 - padL > 30) ctx.fillText('(+)', tx(-3.5), ty(2));
        if (padL + pw - x1 > 30) ctx.fillText('(+)', tx(5), ty(2));
        ctx.fillStyle = isDark ? '#fca5a5' : '#991b1b';
        ctx.fillText('(−)', tx(1), ty(-2));

        // Arrows for increasing/decreasing on x-axis
        ctx.fillStyle = isDark ? '#a78bfa' : '#7c3aed';
        ctx.font = 'bold 12px Rubik, Heebo, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        if (tx(-1) > padL + 30) ctx.fillText('↘ יורדת', tx(-2), y0 + 6);
        ctx.fillText('↗ עולה', tx(2.5), y0 + 6);

        ctx.restore();
      }
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [stepIdx, isDark, xVal, aSlider, bSlider, cSlider, canvasMode, cur.type]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  function handleNext() {
    if (stepIdx >= STEPS.length - 1) { completeModule(MODULE_ID); onBack(); return; }
    setStepIdx(stepIdx + 1);
    setPracticeAnswered(null);
  }
  function handlePrev() {
    if (stepIdx <= 0) return;
    setStepIdx(stepIdx - 1);
    setPracticeAnswered(null);
  }

  // ─── Live info ────────────────────────────────────────────────────────────
  const a = aSlider === 0 ? 0.5 : aSlider;
  const delta = bSlider * bSlider - 4 * a * cSlider;
  const xVertex = -bSlider / (2 * a);
  const yVertex = a * xVertex * xVertex + bSlider * xVertex + (activeControls.includes('c') ? cSlider : 0);

  const learnStep = cur.type === 'learn' ? (cur as LearnStep) : null;
  const practiceStep = cur.type === 'practice' ? (cur as PracticeStep) : null;
  const isDrill = cur.type === 'drill';

  const GREEN = '#16a34a';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen bg-[#faf5fb] dark:bg-[#0e0e11] text-[#2f2e32] dark:text-slate-100 flex flex-col"
      style={{ fontFamily: 'Rubik, Heebo, sans-serif' }}>

      <ModuleHeader
        onBack={onBack}
        title="🔬 מודול 3: חקירת הפרבולה"
        accentColor={GREEN}
        stepIdx={stepIdx}
        totalSteps={STEPS.length}
        steps={STEPS}
      />

      {/* Main */}
      <main className="flex-grow flex flex-col lg:flex-row p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto w-full">

        {isDrill ? (
          <div className="flex-1">
            <div className="mb-3 text-center">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: GREEN, background: 'rgba(22,163,74,0.1)' }}>
                🔬 תרגול — חקרו פרבולה!
              </span>
            </div>
            <InvestigationDrill darkMode={isDark} onDone={handleNext} />
            <div className="flex gap-3 mt-4">
              <button onClick={handlePrev} style={{ minHeight: 44 }}
                className="py-3 px-4 bg-[#ebe7ed] dark:bg-slate-800 text-[#5d5b5f] dark:text-slate-300 font-bold rounded-xl hover:bg-[#e0dbe3] transition-all text-sm">
                ← קודם
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT: Canvas + live bar + sliders */}
            <div className="flex-[3] flex flex-col">
              <div className="bg-white dark:bg-[#1c1b1f] rounded-t-2xl border border-[#e0dbe3] dark:border-slate-700/60 border-b-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full
                    ${cur.type === 'practice'
                      ? 'text-[#92400e] dark:text-[#fde403] bg-[#fde403]/20 dark:bg-[#fde403]/10'
                      : 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30'}`}>
                    {cur.type === 'practice' ? '🧠 תרגול' : `שלב ${stepIdx + 1} / ${STEPS.length}`}
                  </span>
                </div>
                <div className="relative bg-[#f4eff5] dark:bg-[#0d1a0f] overflow-hidden" style={{ height: 'clamp(240px, 42vw, 360px)' }}>
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                </div>
              </div>

              {/* Live equation bar */}
              {canvasMode === 1 && (
                <div className="bg-[#f0fdf4] dark:bg-[#1c1b1f] border-x border-[#e0dbe3] dark:border-slate-700/60 px-3 py-1.5 flex flex-wrap items-center gap-x-3 overflow-x-auto" dir="ltr">
                  <span className="font-mono text-xs font-bold text-[#2f2e32] dark:text-slate-200">y = x² + ({fmtN(cSlider)})</span>
                  <span className="text-[#afacb1]">·</span>
                  <span className="font-mono text-xs font-bold" style={{ color: '#3b82f6' }}>חיתוך Y: (0, {fmtN(cSlider)})</span>
                </div>
              )}
              {canvasMode === 2 && (
                <div className="bg-[#f0fdf4] dark:bg-[#1c1b1f] border-x border-[#e0dbe3] dark:border-slate-700/60 px-3 py-1.5 flex flex-wrap items-center gap-x-3 overflow-x-auto" dir="ltr">
                  <span className="font-mono text-xs font-bold text-[#2f2e32] dark:text-slate-200">y = x²−5x+6</span>
                  <span className="text-[#afacb1]">·</span>
                  <span className="font-mono text-xs" style={{ color: '#10b981' }}>שורשים: x=2 ו-x=3</span>
                </div>
              )}
              {canvasMode === 3 && (
                <div className="bg-[#f0fdf4] dark:bg-[#1c1b1f] border-x border-[#e0dbe3] dark:border-slate-700/60 px-3 py-1.5 flex flex-wrap items-center gap-x-3 overflow-x-auto" dir="ltr">
                  <span className="font-mono text-xs font-bold text-[#2f2e32] dark:text-slate-200">
                    y = {fmtN(a)}x² {bSlider >= 0 ? '+' : '−'} {Math.abs(bSlider)}x {cSlider >= 0 ? '+' : '−'} {Math.abs(cSlider)}
                  </span>
                  <span className="text-[#afacb1]">·</span>
                  <span className={`font-mono text-xs font-bold ${delta > 0.001 ? 'text-emerald-500' : delta < -0.001 ? 'text-red-500' : 'text-blue-500'}`}>
                    δ = {delta.toFixed(1)}
                  </span>
                </div>
              )}
              {canvasMode === 4 && (
                <div className="bg-[#f0fdf4] dark:bg-[#1c1b1f] border-x border-[#e0dbe3] dark:border-slate-700/60 px-3 py-1.5 flex flex-wrap items-center gap-x-3 overflow-x-auto" dir="ltr">
                  <span className="font-mono text-xs font-bold text-[#2f2e32] dark:text-slate-200">
                    y = {fmtN(a)}x² {bSlider >= 0 ? '+' : '−'} {Math.abs(bSlider)}x
                  </span>
                  <span className="text-[#afacb1]">·</span>
                  <span className="font-mono text-xs font-bold text-red-500">
                    קודקוד: ({fmtN(xVertex)}, {fmtN(yVertex)})
                  </span>
                  <span className="font-mono text-xs" style={{ color: a > 0 ? '#10b981' : '#ef4444' }}>
                    {a > 0 ? 'מינימום' : 'מקסימום'}
                  </span>
                </div>
              )}

              {/* Sliders */}
              <div className="bg-white dark:bg-[#1c1b1f] rounded-b-2xl border border-[#e0dbe3] dark:border-slate-700/60 border-t-0 px-4 py-3">
                {cur.type === 'learn' ? (
                  <div className="flex flex-col gap-2.5">
                    {activeControls.includes('xVal') && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">מיקום על הפרבולה — x</label>
                          <span className="font-mono text-xs font-black bg-[#f0fdf4] dark:bg-slate-800 px-2 py-0.5 rounded-lg" style={{ color: GREEN }} dir="ltr">{xVal.toFixed(2)}</span>
                        </div>
                        <input type="range" min="-3" max="5" step="0.05" value={xVal}
                          onChange={e => setXVal(parseFloat(e.target.value))}
                          className="w-full cursor-pointer" style={{ accentColor: GREEN }} />
                      </div>
                    )}
                    {activeControls.includes('c') && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">c — חיתוך ציר Y</label>
                          <span className="font-mono text-xs font-black bg-[#eff6ff] dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg" dir="ltr">{fmtN(cSlider)}</span>
                        </div>
                        <input type="range" min="-5" max="5" step="0.5" value={cSlider}
                          onChange={e => setCSlider(parseFloat(e.target.value))}
                          className="w-full cursor-pointer" style={{ accentColor: '#3b82f6' }} />
                      </div>
                    )}
                    {activeControls.includes('a') && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">a — מקדם x²</label>
                          <span className="font-mono text-xs font-black bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg" dir="ltr">{fmtN(aSlider)}</span>
                        </div>
                        <input type="range" min="-2" max="2" step="0.5" value={aSlider}
                          onChange={e => { const v = parseFloat(e.target.value); setASlider(v === 0 ? 0.5 : v); }}
                          className="w-full cursor-pointer" style={{ accentColor: '#f59e0b' }} />
                      </div>
                    )}
                    {activeControls.includes('b') && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">b — מקדם x</label>
                          <span className="font-mono text-xs font-black bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-lg" dir="ltr">{fmtN(bSlider)}</span>
                        </div>
                        <input type="range" min="-4" max="4" step="1" value={bSlider}
                          onChange={e => setBSlider(parseFloat(e.target.value))}
                          className="w-full cursor-pointer" style={{ accentColor: '#8b5cf6' }} />
                      </div>
                    )}
                    {activeControls.length === 0 && (
                      <p className="text-xs text-[#78767b] dark:text-slate-500 text-center py-0.5">הגרף קבוע — התמקדו בהסבר</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#78767b] dark:text-slate-500 text-center py-0.5">הגרף מוקפא — ענו על השאלה בצד</p>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex-[2] flex flex-col gap-3">
              {learnStep && (
                <>
                  <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 p-5 flex-grow overflow-y-auto">
                    <h2 className="text-base sm:text-lg font-black mb-3" style={{ color: GREEN }}>{learnStep.title}</h2>
                    <div className="text-sm text-[#5d5b5f] dark:text-slate-300 learn-desc"
                      dangerouslySetInnerHTML={{ __html: learnStep.desc }} />
                    {learnStep.formulaCards && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {learnStep.formulaCards.map((fc, i) => (
                          <div key={i} className="bg-[#f0fdf4] dark:bg-slate-800/50 rounded-xl p-3 text-center border border-green-100 dark:border-slate-700">
                            <div className="text-xs font-bold text-[#78767b] dark:text-slate-500 mb-1">{fc.label}</div>
                            <div className="font-mono text-xs text-[#5d5b5f] dark:text-slate-400" dir="ltr">{fc.from}</div>
                            <div className="text-[10px] text-[#afacb1] my-0.5">↓</div>
                            <div className="font-mono text-sm font-black" dir="ltr" style={{ color: fc.color }}>{fc.to}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {stepIdx > 0 && (
                      <button onClick={handlePrev} style={{ minHeight: 44 }}
                        className="py-3 px-4 bg-[#ebe7ed] dark:bg-slate-800 text-[#5d5b5f] dark:text-slate-300 font-bold rounded-xl hover:bg-[#e0dbe3] transition-all text-sm">
                        ← קודם
                      </button>
                    )}
                    <button onClick={handleNext} style={{ minHeight: 44, background: GREEN, color: '#fff' }}
                      className="flex-grow py-3 font-black rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5 text-sm">
                      {stepIdx === STEPS.length - 1 ? 'סיום מודול ✓' : 'המשך ←'}
                    </button>
                  </div>
                </>
              )}

              {practiceStep && (
                <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 p-5 flex flex-col gap-3 flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧠</span>
                    <h2 className="text-sm sm:text-base font-black text-[#2f2e32] dark:text-slate-100">בדיקת הבנה</h2>
                  </div>
                  <p className="text-sm font-semibold text-[#2f2e32] dark:text-slate-100 leading-relaxed">{practiceStep.question}</p>
                  <div className="space-y-2">
                    {practiceStep.options.map((opt, i) => {
                      const revealed = practiceAnswered !== null;
                      const isCorrect = i === practiceStep.correct;
                      const isSelected = practiceAnswered === i;
                      let cls = 'border-[#e0dbe3] dark:border-slate-700 text-[#5d5b5f] dark:text-slate-300 hover:border-green-500 dark:hover:border-green-500';
                      if (revealed && isCorrect) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
                      else if (revealed && isSelected) cls = 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
                      return (
                        <button key={i} disabled={revealed} onClick={() => setPracticeAnswered(i)}
                          className={`w-full text-right px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium disabled:cursor-default ${cls}`}
                          style={{ minHeight: 44 }}>
                          {revealed && isCorrect && '✓ '}{revealed && isSelected && !isCorrect && '✗ '}{opt}
                        </button>
                      );
                    })}
                  </div>
                  {practiceAnswered !== null && (
                    <>
                      <div className={`rounded-xl px-4 py-3 text-xs border ${practiceAnswered === practiceStep.correct
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'}`}>
                        <strong>{practiceAnswered === practiceStep.correct ? '🎯 נכון!' : '💡 לא בדיוק —'}</strong>{' '}
                        <span dir="ltr" className="inline font-mono">{practiceStep.explanation}</span>
                      </div>
                      <div className="flex gap-3 mt-auto">
                        <button onClick={handlePrev} style={{ minHeight: 44 }}
                          className="py-3 px-4 bg-[#ebe7ed] dark:bg-slate-800 text-[#5d5b5f] dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-[#e0dbe3] transition-all">
                          ← חזרה
                        </button>
                        <button onClick={handleNext} style={{ minHeight: 44, background: GREEN, color: '#fff' }}
                          className="flex-grow py-3 font-black rounded-xl text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all">
                          המשך ←
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
