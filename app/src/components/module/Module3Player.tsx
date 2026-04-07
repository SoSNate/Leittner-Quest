import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import DerivativeDrill from '../steps/DerivativeDrill';
import DragDerivativeBuilder from '../steps/DragDerivativeBuilder';
import ModuleHeader from './ModuleHeader';
import { getRobotMessage, getCorrectMessage, getWrongMessage } from '../mascot/robotMessages';

// ─── Step types ───────────────────────────────────────────────────────────────
type CanvasMode = 0 | 1 | 2 | 3 | 4 | 5;

type LearnStep = {
  type: 'learn';
  canvasMode: CanvasMode;
  title: string;
  desc: string;
  controls: string[];
  eq: string;
  // optional inline formula cards shown below description
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
type DragStep = { type: 'drag'; terms: { coefficient: number; exponent: number }[] };
type AnyStep = LearnStep | PracticeStep | DrillStep | DragStep;

// ─── Curriculum (10 steps) ────────────────────────────────────────────────────
const STEPS: AnyStep[] = [
  // ── 0 ── zoom intro
  {
    type: 'learn', canvasMode: 0,
    title: 'הפרבולה תחת מיקרוסקופ',
    desc: `כשמסתכלים על <span dir="ltr" class="inline font-mono font-bold text-[#6200EE] dark:text-[#a78bfa]">f(x) = x²</span> מרחוק, ברור שהיא עקומה. אבל מה קורה כשמתמקדים בנקודה <em>בודדת</em> ומגדילים?<br/><br/><strong>נסו:</strong> בחרו נקודה עם הסליידר ואז הגדילו את הזום לסוף — שימו לב מה קורה לצורת הפרבולה.`,
    controls: ['xVal', 'zoom'],
    eq: 'f(x) = x^2',
  },
  // ── 1 ── practice: zoom
  {
    type: 'practice',
    question: 'כשמגדילים מאוד (Zoom ×30) לנקודה על הפרבולה, היא נראית כמו...',
    options: ['קו ישר לחלוטין', 'פרבולה קטנה יותר', 'עיגול', 'גל'],
    correct: 0,
    explanation: 'נכון! כל עקומה חלקה "מתיישרת" כשמגדילים מספיק. זו לינאריות מקומית — הבסיס של כל חשבון דיפרנציאלי.',
  },
  // ── 2 ── tangent
  {
    type: 'learn', canvasMode: 1,
    title: 'המשיק — קו הרגע',
    desc: `הקו שהפרבולה "הפכה" אליו נקרא <strong>משיק (Tangent)</strong>.<br/><br/>המשיק נוגע בעקומה בנקודה אחת בדיוק — הוא מחקה אותה רגע קצר, ואז מתרחק. <strong>שיפוע המשיק = קצב השינוי המיידי</strong> באותה נקודה.<br/><br/>הזיזו את הנמלה — שימו לב כיצד הקו האדום מסתובב: שמאלה הוא יורד, ימינה הוא עולה, ובדיוק במרכז הוא אופקי.`,
    controls: ['xVal', 'zoom'],
    eq: 'f(x) = x^2',
  },
  // ── 3 ── practice: tangent meaning
  {
    type: 'practice',
    question: 'שיפוע המשיק בנקודה x = 2 הוא 4. מה זה אומר?',
    options: [
      'גובה הפרבולה: f(2) = 4',
      'קרוב ל-x=2: כל +1 ב-x מביא +4 ב-y (בקירוב)',
      'המשיק חוצה את ציר Y ב-4',
      'הפרבולה מגיעה למקסימום ב-x = 4',
    ],
    correct: 1,
    explanation: 'שיפוע = קצב שינוי מיידי. f(2)=4 הוא הגובה — לא השיפוע! שיפוע 4 אומר: "ממש ליד x=2, כל צעד של +1 ב-x גורם לעלייה של ≈4 ב-y".',
  },
  // ── 4 ── trail
  {
    type: 'learn', canvasMode: 2,
    title: 'מתעדים את השיפוע — נקודה אחרי נקודה',
    desc: `עכשיו נתעד את שיפוע המשיק <em>בכל נקודה</em>. כל <span class="font-bold" style="color:#fbbf24">נקודה צהובה</span> מראה: ב-x הזה, השיפוע הוא זה.<br/><br/><strong>הזיזו לאט מ−3 עד +3</strong> ועיקבו אחרי הנקודות הצהובות. איזה צורה הן מציירות?`,
    controls: ['xVal'],
    eq: "f'(x) = ?",
  },
  // ── 5 ── practice: slope at -2
  {
    type: 'practice',
    question: `ב-f(x) = x², מה שיפוע המשיק בנקודה x = −2?`,
    options: ['−4', '4', '−2', '2'],
    correct: 0,
    explanation: `f'(x) = 2x, לכן f'(−2) = 2·(−2) = −4. שיפוע שלילי = הפרבולה יורדת בצד שמאל הקודקוד. הגיוני!`,
  },
  // ── 6 ── derivative revealed
  {
    type: 'learn', canvasMode: 3,
    title: `הנגזרת — נוסחה לכל הרגעים`,
    desc: `הנקודות הצהובות יצרו קו ישר: <span dir="ltr" class="inline font-mono font-bold" style="color:#fbbf24">f'(x) = 2x</span>. הנגזרת היא <strong>פונקציה חדשה</strong> שנותנת את השיפוע בכל נקודה.<br/><br/>במקום לחשב משיק בכל פעם — הנגזרת פותרת הכל:<br/><span dir="ltr" class="inline font-mono text-xs">x=1 → m=2 &nbsp; x=3 → m=6 &nbsp; x=−2 → m=−4</span>`,
    controls: ['xVal'],
    eq: "f'(x) = 2x",
  },
  // ── 7 ── power rule — how to FIND the derivative
  {
    type: 'learn', canvasMode: 3,
    title: 'כלל החזקה — איך מוצאים נגזרת?',
    desc: `כדי למצוא את הנגזרת, לא צריך לצייר נקודות — יש <strong>כלל אחד פשוט</strong>:<br/><br/><div dir="ltr" class="text-center my-2 font-mono font-black text-lg" style="color:#6200EE">y = xⁿ &nbsp;→&nbsp; y' = n·xⁿ⁻¹</div>כלומר: <strong>הורידו את החזקה לפני ה-x, והפחיתו 1 מהחזקה.</strong><br/><br/>מקדם? כופלים אותו: <span dir="ltr" class="inline font-mono">5x³ → 15x²</span><br/>סכום? גוזרים כל איבר בנפרד: <span dir="ltr" class="inline font-mono">(x² + x) → 2x + 1</span>`,
    controls: ['xVal'],
    eq: "y = x^n \\to y' = nx^{n-1}",
    formulaCards: [
      { label: 'x²', from: 'y = x²', to: "y' = 2x", color: '#7c3aed' },
      { label: 'x³', from: 'y = x³', to: "y' = 3x²", color: '#2563eb' },
      { label: '5x⁴', from: 'y = 5x⁴', to: "y' = 20x³", color: '#059669' },
    ],
  },
  // ── 8 ── drag: build derivative interactively
  {
    type: 'drag',
    terms: [{ coefficient: 3, exponent: 2 }, { coefficient: -5, exponent: 1 }, { coefficient: 2, exponent: 0 }],
    // y = 3x² − 5x + 2  →  y' = 6x − 5
  },
  // ── 9 ── C disappears
  {
    type: 'learn', canvasMode: 4,
    title: 'למה ה-C נעלם בגזירה?',
    desc: `בגרף רואים שתי פרבולות: <span dir="ltr" class="inline font-mono" style="color:#7c3aed">f(x) = x²</span> ו-<span dir="ltr" class="inline font-mono" style="color:#10b981">g(x) = x² + 3</span>.<br/><br/>שימו לב: בכל נקודה x, <strong>שני המשיקים מקבילים לחלוטין</strong> — אותו שיפוע בדיוק! מדוע?<br/><br/>כי קבוע <em>מזיז את הגרף למעלה/למטה</em> אבל <em>לא משנה את הצורה</em>. שיפוע = כמה מהר הפונקציה עולה — וזה לא תלוי בגובה ההתחלתי.<br/><br/>לכן: <span dir="ltr" class="inline font-mono font-bold">נגזרת של קבוע = 0</span>`,
    controls: ['xVal'],
    eq: "(x^2 + c)' = 2x",
    formulaCards: [
      { label: 'x²+3', from: "y = x² + 3", to: "y' = 2x", color: '#10b981' },
      { label: 'x²−5', from: "y = x² − 5", to: "y' = 2x", color: '#f59e0b' },
      { label: 'c', from: "y = c", to: "y' = 0", color: '#ef4444' },
    ],
  },
  // ── 9 ── practice: find derivative
  {
    type: 'practice',
    question: 'מה הנגזרת של f(x) = 3x² − 2x + 7 ?',
    options: ["f'(x) = 6x − 2", "f'(x) = 6x − 2 + 7", "f'(x) = 3x − 2", "f'(x) = 6x"],
    correct: 0,
    explanation: "גוזרים כל איבר: 3x² → 6x | 2x → 2 | 7 (קבוע!) → 0. התוצאה: f'(x) = 6x − 2. ה-7 נעלם!",
  },
  // ── 10 ── connection to parabola: vertex, increasing/decreasing
  {
    type: 'learn', canvasMode: 3,
    title: 'הנגזרת מגלה את הפרבולה',
    desc: `הנגזרת <span dir="ltr" class="inline font-mono" style="color:#fbbf24">f'(x) = 2x</span> חושפת מידע מבני:<br/><br/>
<strong>📍 הקודקוד:</strong> כשהמשיק אופקי — הפרבולה עוברת מירידה לעלייה. שיפוע = 0:<br/>
<span dir="ltr" class="inline font-mono">2x = 0 → x = 0</span> — זה הקודקוד!<br/><br/>
<strong>📉 יורד:</strong> כשהנגזרת שלילית <span dir="ltr" class="inline font-mono">(f' < 0)</span> — הפרבולה יורדת<br/>
<strong>📈 עולה:</strong> כשהנגזרת חיובית <span dir="ltr" class="inline font-mono">(f' > 0)</span> — הפרבולה עולה<br/><br/>
<span dir="ltr" class="inline font-mono">x < 0 → f' < 0 (יורד) &nbsp; x > 0 → f' > 0 (עולה)</span>`,
    controls: ['xVal'],
    eq: "f'(x) = 0 \\to \\text{vertex}",
  },
  // ── 11 ── general parabola derivative
  {
    type: 'learn', canvasMode: 5,
    title: 'נגזרת הפרבולה הכללית — y=ax²+bx+c',
    desc: `עד עכשיו גזרנו רק <span dir="ltr" class="inline font-mono">x²</span>. עכשיו הכלל הכללי:<br/><br/>
<div dir="ltr" class="text-center my-2 font-mono font-black text-base" style="color:#6200EE">y = ax² + bx + c &nbsp;→&nbsp; y' = 2ax + b</div>
<strong>כל מקדם מוכפל</strong>, קבוע נגזר ל-0.<br/><br/>
<strong>בגרף:</strong> הפרבולה הסגולה + קו הנגזרת הצהוב. שינויו ב-<strong>a</strong> משנה את השיפוע של הנגזרת, <strong>b</strong> משנה את נקודת החיתוך עם ציר Y.`,
    controls: ['xVal', 'a', 'b'],
    formulaCards: [
      { label: '2x²−3x+1', from: "y = 2x²−3x+1", to: "y' = 4x−3", color: '#7c3aed' },
      { label: '5x²+2x', from: "y = 5x²+2x", to: "y' = 10x+2", color: '#2563eb' },
      { label: '−x²+4', from: "y = −x²+4", to: "y' = −2x", color: '#ef4444' },
    ],
    eq: "y' = 2ax + b",
  },
  // ── 12 ── practice: general derivative
  {
    type: 'practice',
    question: 'מה הנגזרת של y = 4x² − 6x + 2 ?',
    options: ["y' = 8x − 6", "y' = 8x − 6 + 2", "y' = 4x − 6", "y' = 8x"],
    correct: 0,
    explanation: "גוזרים: 4x² → 8x | 6x → 6 | 2 (קבוע) → 0. התוצאה: y' = 8x − 6.",
  },
  // ── 13 ── practice: derivative to vertex
  {
    type: 'practice',
    question: "ב-f(x) = 3x² − 12x + 1, קודקוד ב-x = ?",
    options: ['x = 2', 'x = −2', 'x = 4', 'x = 6'],
    correct: 0,
    explanation: "f'(x) = 6x − 12. קודקוד כש-f'=0: 6x−12=0 → x=2. הנגזרת חושפת את הקודקוד!",
  },
  // ── 14 ── drill
  { type: 'drill' },
];

interface Props { onBack: () => void }

const MODULE_ID = 4;

export default function Module3Player({ onBack }: Props) {
  const { theme, progress, setStep, completeModule, triggerMascot } = useAppStore();
  const isDark = theme === 'dark';

  const [stepIdx, setStepIdxRaw] = useState(() => progress[MODULE_ID]?.step ?? 0);

  function setStepIdx(idx: number) {
    setStepIdxRaw(idx);
    setStep(MODULE_ID, idx);
  }
  const [xVal, setXVal] = useState(1.0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [aSlider, setASlider] = useState(1);
  const [bSlider, setBSlider] = useState(-2);
  const [showZoomAlert, setShowZoomAlert] = useState(false);
  const [practiceAnswered, setPracticeAnswered] = useState<number | null>(null);
  const [drillDone, setDrillDone] = useState(false);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
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

  const renderMath = (s: string) => {
    const w = window as unknown as { katex?: { renderToString: (s: string, o: object) => string } };
    try { return w.katex?.renderToString(s, { throwOnError: false }) ?? s; }
    catch { return s; }
  };

  const fmtNum = (n: number) => {
    const r = Math.round(n * 100) / 100;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };

  useEffect(() => {
    if (canvasMode <= 1 && zoomLevel > 20) {
      setShowZoomAlert(true);
      const t = setTimeout(() => setShowZoomAlert(false), 3000);
      return () => clearTimeout(t);
    }
    setShowZoomAlert(false);
  }, [zoomLevel, canvasMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    if (cur.type === 'learn' && canvasMode >= 2 && canvasMode < 4 && canvasMode !== 5) {
      const s = 2 * xVal;
      if (!trailRef.current.find(p => Math.abs(p.x - xVal) < 0.025)) {
        trailRef.current.push({ x: xVal, y: s });
      }
    }

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width, h = rect.height;
      const cx = w / 2;
      const cy = (canvasMode >= 2 && canvasMode <= 3) ? h / 2 + 20 : h / 2;
      const baseScale = 40;
      const currentScale = canvasMode === 5 ? baseScale * 1.2 : canvasMode >= 2 ? baseScale * 1.5 : baseScale * zoomLevel;

      ctx.clearRect(0, 0, w, h);

      const tgtX = canvasMode <= 1 ? xVal : 0;
      const tgtY = canvasMode <= 1 ? xVal * xVal : canvasMode === 4 ? 3 : canvasMode === 5 ? 2 : 1.5;
      const toS = (mx: number, my: number) => ({
        px: cx + (mx - tgtX) * currentScale,
        py: cy - (my - tgtY) * currentScale,
      });

      // Grid
      ctx.strokeStyle = isDark ? '#252535' : '#ede9f5';
      ctx.lineWidth = 1;
      const gStep = canvasMode <= 1 && zoomLevel > 20 ? 0.05 : canvasMode <= 1 && zoomLevel > 8 ? 0.2 : canvasMode <= 1 && zoomLevel > 3 ? 0.5 : 1;
      const vrX = w / 2 / currentScale, vrY = h / 2 / currentScale;
      for (let i = Math.floor(tgtX - vrX); i <= Math.ceil(tgtX + vrX); i += gStep) {
        const { px } = toS(i, 0);
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
      }
      for (let i = Math.floor(tgtY - vrY); i <= Math.ceil(tgtY + vrY); i += gStep) {
        const { py } = toS(0, i);
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = isDark ? '#4a5568' : '#c4bdd0';
      ctx.lineWidth = 1.5;
      const { px: axX } = toS(0, 0), { py: axY } = toS(0, 0);
      if (axX >= 0 && axX <= w) { ctx.beginPath(); ctx.moveTo(axX, 0); ctx.lineTo(axX, h); ctx.stroke(); }
      if (axY >= 0 && axY <= h) { ctx.beginPath(); ctx.moveTo(0, axY); ctx.lineTo(w, axY); ctx.stroke(); }

      // Tick labels
      ctx.save();
      ctx.direction = 'ltr';
      ctx.fillStyle = isDark ? '#64748b' : '#a09ab0';
      ctx.font = '10px Nunito, Heebo, sans-serif';
      const tStep = canvasMode <= 1 && zoomLevel > 6 ? 0.5 : 1;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let i = Math.ceil(tgtX - vrX); i <= Math.floor(tgtX + vrX); i += tStep) {
        if (Math.abs(i) < 0.01) continue;
        const { px } = toS(i, 0);
        if (px < 15 || px > w - 15) continue;
        ctx.fillText(String(Math.round(i * 10) / 10), px, axY + 4);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let j = Math.ceil(tgtY - vrY); j <= Math.floor(tgtY + vrY); j += tStep) {
        if (Math.abs(j) < 0.01) continue;
        const { py } = toS(0, j);
        if (py < 10 || py > h - 10) continue;
        ctx.fillText(String(Math.round(j * 10) / 10), axX - 5, py);
      }
      ctx.restore();

      const antY = xVal * xVal;
      const slope = 2 * xVal;

      // ── canvasMode 5: general parabola y=ax²+bx + derivative y'=2ax+b ──
      if (canvasMode === 5) {
        const a = aSlider, b = bSlider;
        const fn = (x: number) => a * x * x + b * x;
        const dfn = (x: number) => 2 * a * x + b;
        // Parabola
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
        for (let sx = 0; sx <= w; sx += 2) {
          const mx = tgtX + (sx - cx) / currentScale;
          const fy = fn(mx);
          if (fy < tgtY - h / currentScale - 2 || fy > tgtY + h / currentScale + 2) { continue; }
          const { py } = toS(mx, fy);
          sx === 0 ? ctx.moveTo(sx, py) : ctx.lineTo(sx, py);
        }
        ctx.stroke();
        // Derivative line y'=2ax+b
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let sx = 0; sx <= w; sx += 4) {
          const mx = tgtX + (sx - cx) / currentScale;
          const dy = dfn(mx);
          if (dy < tgtY - h / currentScale - 2 || dy > tgtY + h / currentScale + 2) { continue; }
          const { py } = toS(mx, dy);
          sx === 0 ? ctx.moveTo(sx, py) : ctx.lineTo(sx, py);
        }
        ctx.stroke();
        // Tangent at xVal
        const fxV = fn(xVal), dfxV = dfn(xVal);
        const tLen = w / currentScale;
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath();
        const p1t = toS(xVal - tLen, fxV - tLen * dfxV);
        const p2t = toS(xVal + tLen, fxV + tLen * dfxV);
        ctx.moveTo(p1t.px, p1t.py); ctx.lineTo(p2t.px, p2t.py);
        ctx.stroke(); ctx.setLineDash([]);
        // Dot on parabola
        const { px: dpx, py: dpy } = toS(xVal, fxV);
        ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(dpx, dpy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        // Dot on derivative line
        const { px: ddpx, py: ddpy } = toS(xVal, dfxV);
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(ddpx, ddpy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        // Labels
        ctx.save(); ctx.direction = 'ltr';
        ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 10px Nunito, Heebo, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        const lbp = toS(-2.5, fn(-2.5));
        if (lbp.px > 0 && lbp.px < w - 80) ctx.fillText(`y=${a}x²${b>=0?'+':''}${b}x`, lbp.px + 4, lbp.py - 2);
        ctx.fillStyle = '#f59e0b'; ctx.textBaseline = 'top';
        const lbd = toS(1.5, dfn(1.5));
        if (lbd.px > 0 && lbd.px < w - 80) ctx.fillText(`y'=${2*a}x${b>=0?'+':''}${b}`, lbd.px + 4, lbd.py + 2);
        ctx.restore();
        return;
      }

      // ── canvasMode 4: two parabolas (C disappears) ──
      if (canvasMode === 4) {
        const C = 3;
        // f(x) = x² — purple
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3;
        ctx.lineCap = 'round'; ctx.beginPath();
        for (let sx = 0; sx <= w; sx += 2) {
          const mx = tgtX + (sx - cx) / currentScale;
          const { py } = toS(mx, mx * mx);
          sx === 0 ? ctx.moveTo(sx, py) : ctx.lineTo(sx, py);
        }
        ctx.stroke();

        // g(x) = x² + C — teal
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let sx = 0; sx <= w; sx += 2) {
          const mx = tgtX + (sx - cx) / currentScale;
          const { py } = toS(mx, mx * mx + C);
          sx === 0 ? ctx.moveTo(sx, py) : ctx.lineTo(sx, py);
        }
        ctx.stroke();

        // Labels for the two parabolas
        ctx.save(); ctx.direction = 'ltr';
        ctx.font = 'bold 10px Nunito, Heebo, sans-serif';
        const lx1 = toS(-2.2, 4.84);
        ctx.fillStyle = '#7c3aed'; ctx.textAlign = 'right';
        if (lx1.px > 5 && lx1.px < w - 5) ctx.fillText('f(x)=x²', lx1.px - 4, lx1.py);
        const lx2 = toS(-2.2, 4.84 + C);
        ctx.fillStyle = '#10b981';
        if (lx2.px > 5 && lx2.px < w - 5) ctx.fillText('g(x)=x²+3', lx2.px - 4, lx2.py);
        ctx.restore();

        // Tangent on f(x)=x²
        const tLen = w / currentScale;
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath();
        const p1f = toS(xVal - tLen, antY - tLen * slope);
        const p2f = toS(xVal + tLen, antY + tLen * slope);
        ctx.moveTo(p1f.px, p1f.py); ctx.lineTo(p2f.px, p2f.py);
        ctx.stroke();

        // Tangent on g(x)=x²+C — same slope!
        const antYG = antY + C;
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.beginPath();
        const p1g = toS(xVal - tLen, antYG - tLen * slope);
        const p2g = toS(xVal + tLen, antYG + tLen * slope);
        ctx.moveTo(p1g.px, p1g.py); ctx.lineTo(p2g.px, p2g.py);
        ctx.stroke(); ctx.setLineDash([]);

        // Dots on both curves
        const { px: apxF, py: apyF } = toS(xVal, antY);
        const { px: apxG, py: apyG } = toS(xVal, antYG);
        ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(apxF, apyF, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(apxG, apyG, 5, 0, Math.PI * 2); ctx.fill();

        // "same slope" annotation
        ctx.save(); ctx.direction = 'ltr';
        ctx.fillStyle = isDark ? '#fbbf24' : '#92400e';
        ctx.font = 'bold 10px Nunito, Heebo, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const mid = toS(xVal + 0.1, (antY + antYG) / 2);
        if (mid.px < w - 100) ctx.fillText(`m = ${slope.toFixed(1)} (שניהם!)`, mid.px + 8, mid.py);
        ctx.restore();

        return; // skip rest of draw for mode 4
      }

      // ── regular parabola f(x)=x² ──
      ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let sx = 0; sx <= w; sx += 2) {
        const mx = tgtX + (sx - cx) / currentScale;
        const { py } = toS(mx, mx * mx);
        sx === 0 ? ctx.moveTo(sx, py) : ctx.lineTo(sx, py);
      }
      ctx.stroke();

      const { px: apx, py: apy } = toS(xVal, antY);

      // Tangent (mode >= 1)
      if (canvasMode >= 1) {
        const tLen = canvasMode >= 2 ? w / currentScale : Math.min(1.2, 6 / currentScale * 40);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = canvasMode >= 2 ? 1.5 : 2.5;
        if (canvasMode >= 2) ctx.setLineDash([6, 5]);
        ctx.beginPath();
        const p1 = toS(xVal - tLen, antY - tLen * slope);
        const p2 = toS(xVal + tLen, antY + tLen * slope);
        ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py);
        ctx.stroke(); ctx.setLineDash([]);
      }

      // Derivative trail (mode 2–3)
      if (canvasMode >= 2 && canvasMode <= 3) {
        ctx.fillStyle = '#fbbf24';
        trailRef.current.forEach(p => {
          const tp = toS(p.x, p.y);
          ctx.beginPath(); ctx.arc(tp.px, tp.py, 3, 0, Math.PI * 2); ctx.fill();
        });
        const dp = toS(xVal, slope);
        ctx.beginPath(); ctx.arc(dp.px, dp.py, 6.5, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = 'rgba(251,191,36,0.3)';
        ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(apx, apy); ctx.lineTo(dp.px, dp.py); ctx.stroke();
        ctx.setLineDash([]);

        ctx.save(); ctx.direction = 'ltr';
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px Nunito, Heebo, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(`(${xVal.toFixed(1)}, ${slope.toFixed(1)})`, dp.px + 6, dp.py - 3);
        ctx.restore();
      }

      // Full f'(x)=2x line (mode 3)
      if (canvasMode === 3) {
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let sx = 0; sx <= w; sx += 4) {
          const mx = tgtX + (sx - cx) / currentScale;
          const { py } = toS(mx, 2 * mx);
          sx === 0 ? ctx.moveTo(sx, py) : ctx.lineTo(sx, py);
        }
        ctx.stroke();
        ctx.save(); ctx.direction = 'ltr';
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 11px Nunito, Heebo, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const lp = toS(1.8, 3.6);
        if (lp.px > 0 && lp.px < w - 80) ctx.fillText("f'(x) = 2x", lp.px + 8, lp.py);
        ctx.restore();

        // Vertex dot + label at x=0
        const { px: vx, py: vy } = toS(0, 0);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(vx, vy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); ctx.direction = 'ltr';
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Nunito, Heebo, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        if (vx < w - 80) ctx.fillText('קודקוד (0,0)', vx + 7, vy - 4);
        ctx.restore();
      }

      // Ant glow + dot
      const glowR = canvasMode <= 1 ? 18 : 11;
      const glow = ctx.createRadialGradient(apx, apy, 0, apx, apy, glowR);
      glow.addColorStop(0, 'rgba(252,227,0,0.45)');
      glow.addColorStop(1, 'rgba(252,227,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(apx, apy, glowR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = canvasMode >= 2 ? '#7c3aed' : '#FCE300';
      ctx.beginPath(); ctx.arc(apx, apy, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      if (canvasMode <= 1) {
        ctx.save(); ctx.direction = 'ltr';
        ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
        ctx.font = 'bold 10px Nunito, Heebo, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(`(${xVal.toFixed(1)}, ${antY.toFixed(2)})`, apx + 9, apy - 8);
        ctx.restore();
      }
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [xVal, zoomLevel, stepIdx, isDark, canvasMode, cur.type, aSlider, bSlider]);

  // ─── Navigation ───────────────────────────────────────────────────────────────
  function getCanvasModeAt(idx: number): CanvasMode {
    for (let i = idx; i >= 0; i--) {
      if (STEPS[i].type === 'learn') return (STEPS[i] as LearnStep).canvasMode;
    }
    return 0;
  }

  function handleNext() {
    if (stepIdx >= STEPS.length - 1) { completeModule(MODULE_ID); onBack(); return; }
    const next = stepIdx + 1;
    const nextMode = getCanvasModeAt(next);
    if (nextMode === 2 && canvasMode < 2) {
      setZoomLevel(1); setXVal(-2.5); trailRef.current = [];
    }
    if (nextMode < 2 && canvasMode >= 2) {
      trailRef.current = [];
    }
    setStepIdx(next);
    setPracticeAnswered(null);
  }

  function handlePrev() {
    if (stepIdx <= 0) return;
    const prev = stepIdx - 1;
    const prevMode = getCanvasModeAt(prev);
    if (prevMode < 2) trailRef.current = [];
    setStepIdx(prev);
    setPracticeAnswered(null);
  }

  // ─── Live values ──────────────────────────────────────────────────────────────
  const antYVal = xVal * xVal;
  const slopeVal = 2 * xVal;
  const tangentB = antYVal - slopeVal * xVal;

  const learnStep = cur.type === 'learn' ? (cur as LearnStep) : null;
  const practiceStep = cur.type === 'practice' ? (cur as PracticeStep) : null;
  const isDrillStep = cur.type === 'drill';
  const dragStep = cur.type === 'drag' ? (cur as DragStep) : null;

  // ─── Mascot triggers ──────────────────────────────────────────────────────
  useEffect(() => {
    const msg = getRobotMessage(`step-${stepIdx}`, stepIdx * 7 + 3);
    triggerMascot(msg.text, msg.mood as Parameters<typeof triggerMascot>[1], 8000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  useEffect(() => {
    if (practiceAnswered === null) return;
    const isRight = practiceAnswered === (practiceStep?.correct ?? -1);
    const msg = isRight ? getCorrectMessage(stepIdx) : getWrongMessage(stepIdx + 13);
    triggerMascot(msg.text, msg.mood as Parameters<typeof triggerMascot>[1], 7000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceAnswered]);


  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen bg-[#faf5fb] dark:bg-[#0e0e11] text-[#2f2e32] dark:text-slate-100 flex flex-col"
      style={{ fontFamily: 'Nunito, Heebo, sans-serif' }}>

      <ModuleHeader
        onBack={onBack}
        title="📐 מודול 4: סוד הנגזרת"
        accentColor="#6200EE"
        stepIdx={stepIdx}
        totalSteps={STEPS.length}
        steps={STEPS}
      />

      {/* Main */}
      <main className="flex-grow flex flex-col lg:flex-row p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto w-full">

        {/* LEFT: Canvas + live bar + sliders */}
        <div className="flex-[3] flex flex-col">
          <div className="bg-white dark:bg-[#1c1b1f] rounded-t-2xl border border-[#e0dbe3] dark:border-slate-700/60 border-b-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full
                ${cur.type === 'practice'
                  ? 'text-[#92400e] dark:text-[#fde403] bg-[#fde403]/20 dark:bg-[#fde403]/10'
                  : 'text-[#6200EE] dark:text-[#a78bfa] bg-[#6200EE]/10 dark:bg-[#a78bfa]/10'}`}>
                {cur.type === 'practice' ? '🧠 תרגול' : `שלב ${stepIdx + 1} / ${STEPS.length}`}
              </span>
              {learnStep && (
                <div className="text-sm font-bold bg-[#f4eff5] dark:bg-slate-800 px-3 py-1 rounded-xl border border-[#e0dbe3] dark:border-slate-700 overflow-x-auto max-w-[55%]"
                  dir="ltr" dangerouslySetInnerHTML={{ __html: renderMath(learnStep.eq) }} />
              )}
            </div>
            <div className="relative bg-[#f4eff5] dark:bg-[#16162a] overflow-hidden" style={{ height: 'clamp(240px, 42vw, 360px)' }}>
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              {showZoomAlert && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/55 backdrop-blur-sm text-[#FCE300] px-5 py-2.5 rounded-full font-black animate-pulse text-sm">
                    הפרבולה מתיישרת! 🤯
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live equation bar */}
          {canvasMode >= 1 && canvasMode <= 3 && (
            <div className="bg-[#f4eff5] dark:bg-[#1c1b1f] border-x border-[#e0dbe3] dark:border-slate-700/60 px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 overflow-x-auto" dir="ltr">
              <span className="font-mono text-xs font-bold text-[#2f2e32] dark:text-slate-200">x = {xVal.toFixed(2)}</span>
              <span className="text-[#afacb1]">·</span>
              <span className="font-mono text-xs text-[#5d5b5f] dark:text-slate-400">f(x) = {fmtNum(antYVal)}</span>
              <span className="text-[#afacb1]">·</span>
              <span className="font-mono text-xs font-bold text-red-500">f'(x) = {fmtNum(slopeVal)}</span>
              <span className="text-[#afacb1]">·</span>
              <span className="font-mono text-xs text-[#6200EE] dark:text-[#a78bfa] whitespace-nowrap">
                משיק: y = {fmtNum(slopeVal)}x{tangentB < -0.005 ? ` \u2212 ${fmtNum(-tangentB)}` : tangentB > 0.005 ? ` + ${fmtNum(tangentB)}` : ''}
              </span>
            </div>
          )}
          {canvasMode === 4 && (
            <div className="bg-[#f4eff5] dark:bg-[#1c1b1f] border-x border-[#e0dbe3] dark:border-slate-700/60 px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 overflow-x-auto" dir="ltr">
              <span className="font-mono text-xs font-bold text-[#7c3aed]">f'(x) = {fmtNum(slopeVal)}</span>
              <span className="text-[#afacb1]">=</span>
              <span className="font-mono text-xs font-bold text-[#10b981]">g'(x) = {fmtNum(slopeVal)}</span>
              <span className="font-mono text-xs text-[#78767b] dark:text-slate-500 mr-2" dir="rtl">— אותו שיפוע לשניהם!</span>
            </div>
          )}
          {canvasMode === 5 && (
            <div className="bg-[#f4eff5] dark:bg-[#1c1b1f] border-x border-[#e0dbe3] dark:border-slate-700/60 px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 overflow-x-auto" dir="ltr">
              <span className="font-mono text-xs font-bold text-[#7c3aed]">y={aSlider}x²{bSlider>=0?'+':''}{bSlider}x</span>
              <span className="text-[#afacb1]">·</span>
              <span className="font-mono text-xs font-bold text-[#f59e0b]">y'={2*aSlider}x{bSlider>=0?'+':''}{bSlider}</span>
              <span className="text-[#afacb1]">·</span>
              <span className="font-mono text-xs text-red-500">שיפוע ב-x={xVal.toFixed(1)}: {fmtNum(2*aSlider*xVal+bSlider)}</span>
            </div>
          )}

          {/* Sliders */}
          <div className="bg-white dark:bg-[#1c1b1f] rounded-b-2xl border border-[#e0dbe3] dark:border-slate-700/60 border-t-0 px-4 py-3">
            {cur.type === 'learn' ? (
              <div className="flex flex-col gap-2.5">
                {activeControls.includes('xVal') && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">
                        {canvasMode === 4 ? 'נקודה על שתי הפרבולות — x' : 'מיקום על הפרבולה — x'}
                      </label>
                      <span className="font-mono text-xs font-black bg-[#f4eff5] dark:bg-slate-800 text-[#6200EE] dark:text-[#a78bfa] px-2 py-0.5 rounded-lg" dir="ltr">{xVal.toFixed(2)}</span>
                    </div>
                    <input type="range" min="-3" max="3" step="0.05" value={xVal}
                      onChange={e => setXVal(parseFloat(e.target.value))}
                      className="w-full cursor-pointer" style={{ accentColor: '#6200EE' }} />
                  </div>
                )}
                {activeControls.includes('zoom') && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">זום</label>
                      <span className="font-mono text-xs font-black bg-[#6200EE]/10 dark:bg-[#a78bfa]/10 text-[#6200EE] dark:text-[#a78bfa] px-2 py-0.5 rounded-lg" dir="ltr">×{zoomLevel < 2 ? zoomLevel.toFixed(1) : Math.round(zoomLevel)}</span>
                    </div>
                    <input type="range" min="1" max="30" step="0.5" value={zoomLevel}
                      onChange={e => setZoomLevel(parseFloat(e.target.value))}
                      className="w-full cursor-pointer" style={{ accentColor: '#6200EE' }} />
                  </div>
                )}
                {canvasMode >= 2 && canvasMode <= 3 && (
                  <div className="flex items-center gap-3 bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">שיפוע כעת:</span>
                    <span className="font-mono font-black text-lg text-red-500" dir="ltr">{fmtNum(slopeVal)}</span>
                    {Math.abs(xVal) < 0.08 && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">← קודקוד! (שיפוע = 0)</span>}
                  </div>
                )}
                {activeControls.includes('a') && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">מקדם a (פתיחת הפרבולה)</label>
                      <span className="font-mono text-xs font-black bg-[#f4eff5] dark:bg-slate-800 text-[#7c3aed] px-2 py-0.5 rounded-lg" dir="ltr">a={aSlider}</span>
                    </div>
                    <input type="range" min="-3" max="3" step="0.5" value={aSlider}
                      onChange={e => setASlider(parseFloat(e.target.value) || 0.5)}
                      className="w-full cursor-pointer" style={{ accentColor: '#7c3aed' }} />
                  </div>
                )}
                {activeControls.includes('b') && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#5d5b5f] dark:text-slate-400">מקדם b (הזזה אופקית)</label>
                      <span className="font-mono text-xs font-black bg-[#f4eff5] dark:bg-slate-800 text-[#f59e0b] px-2 py-0.5 rounded-lg" dir="ltr">b={bSlider}</span>
                    </div>
                    <input type="range" min="-4" max="4" step="1" value={bSlider}
                      onChange={e => setBSlider(parseFloat(e.target.value))}
                      className="w-full cursor-pointer" style={{ accentColor: '#f59e0b' }} />
                  </div>
                )}
                {canvasMode === 5 && (
                  <div className="flex items-center gap-3 bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl px-3 py-2" dir="ltr">
                    <span className="font-mono text-xs font-bold text-[#7c3aed]">y'({xVal.toFixed(1)}) = {fmtNum(2 * aSlider * xVal + bSlider)}</span>
                    <span className="text-[#afacb1]">·</span>
                    <span className="font-mono text-xs text-[#5d5b5f] dark:text-slate-400">קודקוד x = {aSlider !== 0 ? fmtNum(-bSlider / (2 * aSlider)) : '∞'}</span>
                  </div>
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
                <h2 className="text-base sm:text-lg font-black mb-3 text-[#6200EE] dark:text-[#a78bfa]">{learnStep.title}</h2>

                <div className="text-sm text-[#5d5b5f] dark:text-slate-300 learn-desc"
                  dangerouslySetInnerHTML={{ __html: learnStep.desc }} />

                {/* Formula cards */}
                {learnStep.formulaCards && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {learnStep.formulaCards.map((fc, i) => (
                      <div key={i} className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-3 text-center border border-[#e0dbe3] dark:border-slate-700">
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
                    className="py-3 px-4 bg-[#ebe7ed] dark:bg-slate-800 text-[#5d5b5f] dark:text-slate-300 font-bold rounded-xl hover:bg-[#e0dbe3] dark:hover:bg-slate-700 transition-all text-sm">
                    ← קודם
                  </button>
                )}
                <button onClick={handleNext}
                  style={{ minHeight: 44, background: stepIdx === STEPS.length - 1 ? '#fde403' : '#6200EE', color: stepIdx === STEPS.length - 1 ? '#484000' : '#fff' }}
                  className="flex-grow py-3 font-black rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5 text-sm flex items-center justify-center gap-1.5">
                  {stepIdx === STEPS.length - 1 ? 'סיום מודול ✓' : 'המשך ←'}
                </button>
              </div>
            </>
          )}

          {dragStep && (
            <div className="flex flex-col gap-3 flex-grow">
              <DragDerivativeBuilder
                terms={dragStep.terms}
                darkMode={isDark}
                onDone={handleNext}
              />
              {stepIdx > 0 && (
                <button onClick={handlePrev} style={{ minHeight: 44 }}
                  className="py-3 px-4 bg-[#ebe7ed] dark:bg-slate-800 text-[#5d5b5f] dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-[#e0dbe3] transition-all">
                  ← קודם
                </button>
              )}
            </div>
          )}

          {isDrillStep && (
            <div className="flex flex-col gap-3 flex-grow">
              <DerivativeDrill darkMode={isDark} onDone={() => setDrillDone(true)} />
              {drillDone && (
                <div className="flex gap-3">
                  <button onClick={handlePrev} style={{ minHeight: 44 }}
                    className="py-3 px-4 bg-[#ebe7ed] dark:bg-slate-800 text-[#5d5b5f] dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-[#e0dbe3] transition-all">
                    ← קודם
                  </button>
                  <button onClick={handleNext}
                    style={{ minHeight: 44, background: '#fde403', color: '#484000' }}
                    className="flex-grow py-3 font-black rounded-xl text-sm hover:opacity-90 transition-all">
                    סיום מודול ✓
                  </button>
                </div>
              )}
            </div>
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
                  let cls = 'border-[#e0dbe3] dark:border-slate-700 text-[#5d5b5f] dark:text-slate-300 hover:border-[#6200EE] dark:hover:border-[#a78bfa]';
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
                    <button onClick={handleNext}
                      style={{ minHeight: 44, background: '#6200EE', color: '#fff' }}
                      className="flex-grow py-3 font-black rounded-xl text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all">
                      המשך ←
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
