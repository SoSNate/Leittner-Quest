import { useRef, useEffect, useCallback } from 'react';

export type GraphType = 'linear' | 'parabola';

export interface Target {
  x: number;
  y: number;
}

interface Props {
  type: GraphType;
  m?: number;
  b?: number;
  a?: number;
  bCoef?: number;
  c?: number;
  targets?: Target[];
  darkMode?: boolean;
  className?: string;
  onHitsChange?: (hits: number) => void;
}

const HIT_TOLERANCE = 0.4;

export default function InteractiveGraph({
  type,
  m = 1,
  b = 0,
  a = 1,
  bCoef = 0,
  c = 0,
  targets = [],
  darkMode = true,
  className = '',
  onHitsChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    let w = canvas.parentElement?.clientWidth || 400;
    if (w < 10) {
      let el: Element | null = canvas.parentElement;
      while (el && (el as HTMLElement).clientWidth < 10) el = el.parentElement;
      w = (el as HTMLElement)?.clientWidth || 400;
    }
    const h = canvas.clientHeight > 10 ? canvas.clientHeight : Math.min(280, Math.max(220, window.innerWidth * 0.4));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const scale = Math.min(w / 14, h / 10);
    const ox = w / 2;
    const oy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = darkMode ? 'rgba(71,85,105,0.4)' : 'rgba(203,213,225,0.8)';
    for (let i = -8; i <= 8; i++) {
      for (let j = -6; j <= 6; j++) {
        ctx.fillRect(ox + i * scale - 1, oy - j * scale - 1, 2, 2);
      }
    }

    ctx.beginPath();
    ctx.strokeStyle = darkMode ? '#475569' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, oy); ctx.lineTo(w, oy);
    ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
    ctx.stroke();

    ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8';
    ctx.font = `${Math.max(9, scale * 0.45)}px Nunito, sans-serif`;
    ctx.save();
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -8; i <= 8; i++) {
      if (i === 0) continue;
      ctx.fillRect(ox + i * scale - 0.5, oy - 3, 1, 6);
      if (i % 2 === 0) ctx.fillText(String(i), ox + i * scale, oy + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let j = -5; j <= 5; j++) {
      if (j === 0) continue;
      ctx.fillRect(ox - 3, oy - j * scale - 0.5, 6, 1);
      if (j % 2 === 0) ctx.fillText(String(j), ox - 6, oy - j * scale);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.strokeStyle = type === 'linear' ? '#38bdf8' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (type === 'linear') {
      const x0 = -ox / scale;
      const x1 = (w - ox) / scale;
      ctx.moveTo(0, oy - (m * x0 + b) * scale);
      ctx.lineTo(w, oy - (m * x1 + b) * scale);
    } else {
      for (let px = 0; px <= w; px++) {
        const mx = (px - ox) / scale;
        const my = a !== 0 ? a * mx * mx + bCoef * mx + c : bCoef * mx + c;
        const py = oy - my * scale;
        if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    if (type === 'linear') {
      const byPx = oy - b * scale;
      const grad = ctx.createRadialGradient(ox, byPx, 2, ox, byPx, 14);
      grad.addColorStop(0, 'rgba(56,189,248,0.4)');
      grad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.beginPath();
      ctx.arc(ox, byPx, 14, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox, byPx, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = darkMode ? '#0f172a' : '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.max(10, scale * 0.5)}px Nunito, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`b=${b}`, ox + 10, byPx);
    }

    if (type === 'parabola' && a !== 0) {
      const vx = -bCoef / (2 * a);
      const vy = a * vx * vx + bCoef * vx + c;
      const pvx = ox + vx * scale;
      const pvy = oy - vy * scale;
      ctx.beginPath();
      ctx.arc(pvx, pvy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.fillStyle = darkMode ? '#f8fafc' : '#1e293b';
      ctx.font = `bold ${Math.max(9, scale * 0.45)}px Nunito, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.save();
      ctx.direction = 'ltr';
      ctx.fillText(`(${vx.toFixed(1)}, ${vy.toFixed(1)})`, pvx + 7, pvy - 2);
      ctx.restore();
    }

    let hits = 0;
    targets.forEach((t) => {
      const px = ox + t.x * scale;
      const py = oy - t.y * scale;
      const predicted = type === 'linear'
        ? m * t.x + b
        : a * t.x * t.x + bCoef * t.x + c;
      const isHit = Math.abs(predicted - t.y) < HIT_TOLERANCE;
      if (isHit) hits++;

      if (isHit) {
        const hg = ctx.createRadialGradient(px, py, 4, px, py, 22);
        hg.addColorStop(0, 'rgba(74,222,128,0.5)');
        hg.addColorStop(1, 'rgba(74,222,128,0)');
        ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fillStyle = hg; ctx.fill();
      }

      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', px, py);
    });

    onHitsChange?.(hits);
  }, [type, m, b, a, bCoef, c, targets, darkMode, onHitsChange]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  useEffect(() => {
    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full block rounded-xl ${className}`}
      style={{ height: 'clamp(220px, 40vw, 320px)' }}
    />
  );
}
