interface Props {
  type: 'linear' | 'parabola';
  m: number;
  b: number;
  a: number;
  c: number;
  accent?: string;
}

function fmt(n: number): string {
  // Clean number: remove trailing .0
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function sign(n: number, first = false): string {
  if (first) return fmt(n);
  return n >= 0 ? ` + ${fmt(n)}` : ` - ${fmt(Math.abs(n))}`;
}

export default function LiveEquation({ type, m, b, a, c, accent }: Props) {
  const color = accent || (type === 'linear' ? '#34d399' : '#f59e0b');

  let parts: React.ReactNode;

  if (type === 'linear') {
    // y = mx + b
    parts = (
      <span dir="ltr" className="inline-flex items-baseline gap-0.5 font-mono font-black text-base sm:text-xl flex-wrap justify-center">
        <span className="text-slate-400 dark:text-slate-500">y =</span>
        {m !== 0 && (
          <>
            <span style={{ color }}>{fmt(m)}</span>
            <span className="text-slate-300 dark:text-slate-400">x</span>
          </>
        )}
        {b !== 0 && (
          <span style={{ color: '#38bdf8' }}>
            {m !== 0 ? (b > 0 ? ' + ' : ' − ') : ''}{fmt(Math.abs(b))}
          </span>
        )}
        {m === 0 && b === 0 && <span style={{ color }}>0</span>}
      </span>
    );
  } else {
    // y = ax² + bx + c
    parts = (
      <span dir="ltr" className="inline-flex items-baseline gap-0.5 font-mono font-black text-sm sm:text-lg flex-wrap justify-center">
        <span className="text-slate-400 dark:text-slate-500">y =</span>
        {a !== 0 && (
          <>
            <span style={{ color }}>{a === 1 ? '' : a === -1 ? '−' : fmt(a)}</span>
            <span style={{ color }}>x²</span>
          </>
        )}
        {b !== 0 && (
          <>
            <span className="text-slate-300 dark:text-slate-400">{sign(b, a === 0)}</span>
            <span className="text-slate-300 dark:text-slate-400">x</span>
          </>
        )}
        {c !== 0 && (
          <span style={{ color: '#38bdf8' }}>{sign(c, a === 0 && b === 0)}</span>
        )}
        {a === 0 && b === 0 && c === 0 && <span style={{ color }}>0</span>}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-[#0f172a]/60 dark:bg-[#0f172a]/80 rounded-xl px-3 py-2 mt-1 mx-2 mb-2 overflow-x-auto">
      {parts}
    </div>
  );
}
