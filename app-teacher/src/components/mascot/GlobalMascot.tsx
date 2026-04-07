import { useEffect, useState, useCallback, useRef } from 'react';
import MascotRobot from './MascotRobot';
import { useAppStore } from '../../store/useAppStore';

const INACTIVITY_MS = 50_000;
const INACTIVITY_MSG = 'היי, אנחנו באמצע שיעור! הכל בסדר? 😊';

type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const CORNER_STYLE: Record<Corner, React.CSSProperties> = {
  'bottom-right': { bottom: 24, right: 24 },
  'bottom-left':  { bottom: 24, left:  24 },
  'top-right':    { top:    24, right: 24 },
  'top-left':     { top:    24, left:  24 },
};

function isCornerBlocked(corner: Corner): boolean {
  const W = window.innerWidth;
  const H = window.innerHeight;

  const pts: [number, number][] = {
    'bottom-right': [[W - 40, H - 40], [W - 140, H - 140]],
    'bottom-left':  [[40,     H - 40], [140,     H - 140]],
    'top-right':    [[W - 40, 40],     [W - 140, 140]],
    'top-left':     [[40,     40],     [140,     140]],
  }[corner] as [number, number][];

  return pts.some(([x, y]) =>
    document.elementsFromPoint(x, y).some(el => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'canvas') return true;
      if (tag === 'svg' && el.getBoundingClientRect().width > 150) return true;
      return /simulator|chart|graph|canvas-wrap/i.test(
        (el.className?.toString() ?? '') + (el.id ?? '')
      );
    })
  );
}

function pickBestCorner(current: Corner): Corner {
  const isMobile = window.innerWidth < 640;
  const priority: Corner[] = isMobile
    ? ['bottom-right', 'bottom-left']
    : ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  return priority.find(c => !isCornerBlocked(c)) ?? current;
}

export default function GlobalMascot() {
  const [displayedText, setDisplayedText] = useState('');
  const [corner, setCorner]               = useState<Corner>('bottom-right');
  const [speed, setSpeed]                 = useState(1);
  const speedRef                          = useRef(1);

  const mascotText     = useAppStore((s) => s.mascot.mascotText);
  const mascotVisible  = useAppStore((s) => s.mascot.mascotVisible);
  const mascotDuration = useAppStore((s) => s.mascot.mascotDuration);
  const triggerMascot  = useAppStore((s) => s.triggerMascot);
  const hideMascot     = useAppStore((s) => s.hideMascot);

  const reposition = useCallback(() => {
    setCorner(prev => pickBestCorner(prev));
  }, []);

  // Reposition on resize
  useEffect(() => {
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [reposition]);

  // Reposition when mascot becomes visible
  useEffect(() => {
    if (mascotVisible) {
      const t = setTimeout(reposition, 80);
      return () => clearTimeout(t);
    }
  }, [mascotVisible, reposition]);

  // Typewriter effect
  useEffect(() => {
    if (!mascotVisible || !mascotText) {
      setDisplayedText('');
      return;
    }
    setDisplayedText('');
    let i = 0;
    setSpeed(1.8);
    speedRef.current = 1.8;

    const timer = setInterval(() => {
      setDisplayedText(mascotText.slice(0, i + 1));
      i++;
      if (i >= mascotText.length) {
        clearInterval(timer);
        setSpeed(1);
        speedRef.current = 1;
      }
    }, 40);

    return () => clearInterval(timer);
  }, [mascotText, mascotVisible]);

  // Auto-hide after duration
  useEffect(() => {
    if (!mascotVisible || mascotDuration === 0) return;
    const t = setTimeout(hideMascot, mascotDuration);
    return () => clearTimeout(t);
  }, [mascotVisible, mascotText, mascotDuration, hideMascot]);

  // Inactivity detection — always runs
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => triggerMascot(INACTIVITY_MSG, 'hint', 10_000), INACTIVITY_MS);
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    reset();
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [triggerMascot]);

  if (!mascotVisible) return null;

  const isRight  = corner.endsWith('right');
  const isBottom = corner.startsWith('bottom');

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: isBottom ? 'column-reverse' : 'column',
        alignItems: isRight ? 'flex-end' : 'flex-start',
        gap: 8,
        animation: 'mascotSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        pointerEvents: 'none',
        ...CORNER_STYLE[corner],
      }}
      dir="rtl"
    >
      {/* Speech Bubble */}
      {displayedText && (
        <div
          onClick={hideMascot}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            background: '#1e293b',
            border: '2px solid #38bdf8',
            borderRadius: isRight ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            padding: '12px 16px',
            maxWidth: 280,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.7, textAlign: 'right', margin: 0, fontFamily: 'Rubik, Heebo, sans-serif' }}>
            {displayedText}
          </p>
          <p style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', margin: '4px 0 0', fontFamily: 'Rubik, Heebo, sans-serif' }}>
            לחץ לסגירה
          </p>
        </div>
      )}

      {/* Robot with Mustard Holographic Glow */}
      <div
        onClick={hideMascot}
        style={{ width: 128, height: 128, position: 'relative', pointerEvents: 'auto', cursor: 'pointer', flexShrink: 0 }}
      >
        {/* Mustard glow */}
        <div style={{
          position: 'absolute',
          inset: 8,
          background: 'radial-gradient(circle, rgba(234,179,8,0.35) 0%, rgba(234,179,8,0) 70%)',
          borderRadius: '50%',
          filter: 'blur(12px)',
          pointerEvents: 'none',
        }} />

        {/* SVG Robot */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px rgba(253,216,53,0.3))' }}>
          <MascotRobot size={128} speed={speed} />
        </div>
      </div>
    </div>
  );
}
