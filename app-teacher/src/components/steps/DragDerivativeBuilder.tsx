import { useState } from 'react';

interface Term {
  coefficient: number;
  exponent: number;
}

interface Props {
  terms: Term[];
  darkMode: boolean;
  onDone: () => void;
}

// Format a coefficient as string, e.g. -5 → "−5", 1 → "1"
function fmtCoef(n: number): string {
  return n < 0 ? `\u2212${Math.abs(n)}` : String(n);
}

// Format a derivative term result, e.g. {coef:6, exp:1} → "6x", {coef:-5, exp:0} → "−5"
function fmtDerivTerm(coef: number, exp: number): string {
  if (exp === 0) return fmtCoef(coef);
  const xPart = exp === 1 ? 'x' : `x\u00B2`; // only handles exp 0,1,2
  if (coef === 1) return xPart;
  if (coef === -1) return `\u2212${xPart}`;
  return `${fmtCoef(coef)}${xPart}`;
}

// Format a term in the original function display
function fmtOriginalTerm(term: Term, isFirst: boolean): { sign: string; body: string } {
  const { coefficient: c, exponent: n } = term;
  const sign = c < 0 ? '\u2212' : isFirst ? '' : '+';
  const abs = Math.abs(c);
  let body = '';
  if (n === 0) body = String(abs);
  else if (n === 1) body = abs === 1 ? 'x' : `${abs}x`;
  else body = abs === 1 ? `x\u00B2` : `${abs}x\u00B2`;
  return { sign: isFirst && c >= 0 ? '' : sign, body };
}

export default function DragDerivativeBuilder({ terms, darkMode, onDone }: Props) {
  // derivativeParts[i] = null if not yet computed, or the derivative term object
  const [done, setDone] = useState<(boolean)[]>(() => terms.map(() => false));
  // Which term index is currently "active" (showing the calculation card)
  const [active, setActive] = useState<number | null>(null);

  const allDone = done.every(Boolean);

  // Compute derivative term for index i
  function derivOfTerm(i: number): { coef: number; exp: number } {
    const { coefficient: c, exponent: n } = terms[i];
    return { coef: c * n, exp: n - 1 };
  }

  function handleActivate(i: number) {
    if (done[i]) return;
    setActive(active === i ? null : i);
  }

  function handleConfirm(i: number) {
    const next = done.map((v, idx) => (idx === i ? true : v));
    setDone(next);
    setActive(null);
  }

  // Build derivative display string
  function buildDerivative(): string {
    const parts: string[] = [];
    terms.forEach((_, i) => {
      if (!done[i]) return;
      const { coef, exp } = derivOfTerm(i);
      if (coef === 0) return; // constant disappears
      parts.push(fmtDerivTerm(coef, exp));
    });
    if (parts.length === 0) return '0';
    // Join with proper +/- spacing
    return parts.reduce((acc, p, idx) => {
      if (idx === 0) return p;
      const startsWithMinus = p.startsWith('\u2212');
      return startsWithMinus ? `${acc} ${p}` : `${acc} + ${p}`;
    }, '');
  }

  const surface = darkMode ? '#1c1b1f' : '#fff';
  const border = darkMode ? '#334155' : '#e0dbe3';
  const textMain = darkMode ? '#e2e8f0' : '#2f2e32';
  const textMuted = darkMode ? '#94a3b8' : '#5d5b5f';
  const accent = '#6200EE';
  const accentLight = darkMode ? 'rgba(167,139,250,0.15)' : 'rgba(98,0,238,0.08)';

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: surface, borderColor: border, fontFamily: 'Rubik, Heebo, sans-serif' }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: border, background: accentLight }}>
        <span className="text-base" role="img">🔧</span>
        <span className="text-sm font-black" style={{ color: accent }}>בנה את הנגזרת — לחץ על המעריך</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Original function */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: textMuted }}>הפונקציה המקורית:</p>
          <div className="flex items-center flex-wrap gap-1 text-lg font-black" dir="ltr" style={{ color: textMain }}>
            <span>y =</span>
            {terms.map((term, i) => {
              const { sign, body } = fmtOriginalTerm(term, i === 0);
              const isDoneHere = done[i];
              const isActive = active === i;
              // Split body into parts: base (coef + var) and exponent superscript
              const hasExp = term.exponent >= 2;
              const base = hasExp ? body.replace('\u00B2', '') : body;

              return (
                <span key={i} className="flex items-center gap-0.5">
                  {sign && <span className="mx-1 text-base font-normal" style={{ color: textMuted }}>{sign}</span>}
                  <span
                    className={`relative inline-flex items-start rounded-lg px-2 py-1 cursor-pointer select-none transition-all duration-200 ${isDoneHere ? 'opacity-40 cursor-default' : isActive ? 'ring-2 ring-offset-1' : 'hover:opacity-80'}`}
                    style={{
                      background: isDoneHere ? 'transparent' : isActive ? accentLight : darkMode ? '#252535' : '#f4eff5',
                      ...(isActive ? { ringColor: accent } : {}),
                      border: `2px solid ${isDoneHere ? 'transparent' : isActive ? accent : darkMode ? '#3f3f5c' : '#e0dbe3'}`,
                    }}
                    onClick={() => !isDoneHere && handleActivate(i)}
                    title={isDoneHere ? '' : 'לחץ לגזור איבר זה'}
                  >
                    <span>{base}</span>
                    {hasExp && (
                      <sup
                        className="text-xs font-black px-1 py-0.5 rounded-md ml-0.5 -mt-1"
                        style={{
                          background: isDoneHere ? 'transparent' : isActive ? accent : '#6200EE',
                          color: isDoneHere ? textMuted : '#fff',
                        }}
                      >
                        {term.exponent}
                      </sup>
                    )}
                    {term.exponent === 1 && !isDoneHere && (
                      <sup className="text-xs font-black px-1 py-0.5 rounded-md ml-0.5 -mt-1" style={{ background: isActive ? accent : '#6200EE', color: '#fff' }}>
                        1
                      </sup>
                    )}
                    {term.exponent === 0 && !isDoneHere && (
                      <sup className="text-xs font-black px-1 py-0.5 rounded-md ml-0.5 -mt-1" style={{ background: isActive ? accent : '#94a3b8', color: '#fff' }}>
                        0
                      </sup>
                    )}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Active calculation card */}
        {active !== null && !done[active] && (() => {
          const term = terms[active];
          const { coef, exp } = derivOfTerm(active);
          const disappears = coef === 0;
          return (
            <div className="rounded-xl p-4 border-2 animate-fade-up" style={{ background: darkMode ? '#16162a' : '#f0ebff', borderColor: accent }}>
              <p className="text-xs font-bold mb-3" style={{ color: accent }}>כלל החזקה — מוריד מעריך ומכפיל:</p>
              <div className="flex items-center gap-3 flex-wrap text-base font-black" dir="ltr" style={{ color: textMain }}>
                <span className="px-3 py-1 rounded-lg text-white" style={{ background: accent }}>{term.exponent}</span>
                <span style={{ color: textMuted }}>×</span>
                <span className="px-3 py-1 rounded-lg" style={{ background: darkMode ? '#252535' : '#e0dbe3' }}>{fmtCoef(term.coefficient)}</span>
                <span style={{ color: textMuted }}>=</span>
                <span className="px-3 py-1 rounded-lg font-black text-white" style={{ background: disappears ? '#94a3b8' : '#059669' }}>
                  {disappears ? '0' : fmtCoef(coef)}
                </span>
                <span style={{ color: textMuted }}>→</span>
                <span className="font-black" style={{ color: disappears ? '#94a3b8' : '#059669' }}>
                  {disappears ? 'נעלם (קבוע)' : exp === 0 ? fmtCoef(coef) : exp === 1 ? `${fmtCoef(coef)}x` : `${fmtCoef(coef)}x²`}
                </span>
              </div>
              {disappears && (
                <p className="text-xs mt-2" style={{ color: textMuted }}>המעריך הוא 0 → כל קבוע נגזר ל-0. הוא נעלם מהנגזרת!</p>
              )}
              <button
                onClick={() => handleConfirm(active)}
                className="mt-3 px-4 py-2 rounded-xl text-white text-sm font-black transition-all hover:opacity-90"
                style={{ background: accent, minHeight: 40 }}
              >
                ✓ אשר וצרף לנגזרת
              </button>
            </div>
          );
        })()}

        {/* Derivative being built */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: textMuted }}>הנגזרת (נבנית עכשיו):</p>
          <div className="flex items-center gap-2 flex-wrap min-h-[3rem] rounded-xl px-4 py-2 border-2" style={{ borderColor: allDone ? '#059669' : border, background: darkMode ? '#0d1a0f' : '#f0fdf4' }} dir="ltr">
            <span className="font-black" style={{ color: textMain }}>y' =</span>
            {terms.map((_, i) => {
              if (!done[i]) return null;
              const { coef, exp } = derivOfTerm(i);
              if (coef === 0) return null;
              return (
                <span key={i} className="px-2 py-0.5 rounded-lg font-black text-white animate-fade-up" style={{ background: '#059669' }}>
                  {fmtDerivTerm(coef, exp)}
                </span>
              );
            })}
            {!done.some(Boolean) && (
              <span className="text-sm" style={{ color: textMuted }}>לחץ על מעריך למעלה כדי להתחיל...</span>
            )}
          </div>
        </div>

        {/* Instructions */}
        {!allDone && (
          <p className="text-xs text-center" style={{ color: textMuted }}>
            לחץ על כל <strong>מעריך מוצג</strong> בפונקציה כדי לגזור את האיבר
          </p>
        )}

        {/* Done state */}
        {allDone && (
          <div className="animate-fade-up">
            <div className="rounded-xl px-4 py-3 text-sm font-semibold mb-3 text-center border" style={{ background: darkMode ? '#0d1a0f' : '#f0fdf4', borderColor: '#059669', color: '#059669' }}>
              🎉 מצוין! בנית את הנגזרת: <span dir="ltr" className="font-black font-mono ml-1">{buildDerivative()}</span>
            </div>
            <button
              onClick={onDone}
              className="w-full py-3 rounded-xl font-black text-white transition-all hover:opacity-90"
              style={{ background: accent, minHeight: 44 }}
            >
              המשך ←
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
