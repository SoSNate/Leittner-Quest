interface Props {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  color?: string;
  onChange: (value: number) => void;
}

const COLOR_MAP: Record<string, { text: string; accent: string; track: string }> = {
  emerald: { text: 'text-emerald-500 dark:text-emerald-400', accent: '#34d399', track: 'rgba(52,211,153,0.25)' },
  sky:     { text: 'text-sky-500 dark:text-sky-400',         accent: '#38bdf8', track: 'rgba(56,189,248,0.25)' },
  amber:   { text: 'text-amber-500 dark:text-amber-400',     accent: '#f59e0b', track: 'rgba(245,158,11,0.25)' },
  pink:    { text: 'text-pink-500 dark:text-pink-400',       accent: '#f472b6', track: 'rgba(244,114,182,0.25)' },
  purple:  { text: 'text-purple-500 dark:text-purple-400',   accent: '#a855f7', track: 'rgba(168,85,247,0.25)' },
};

export default function SliderController({ id, label, min, max, step, value, color = 'emerald', onChange }: Props) {
  const { text, accent } = COLOR_MAP[color] ?? COLOR_MAP.emerald;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label htmlFor={id} className={`text-sm font-semibold ${text}`}>{label}</label>
        <span className={`text-base font-black font-mono tabular-nums ${text}`}>{value}</span>
      </div>
      {/* Custom slim slider with filled track */}
      <div className="relative flex items-center" style={{ height: 44 }}>
        <div className="absolute left-0 right-0 h-1 rounded-full bg-slate-200 dark:bg-slate-700 pointer-events-none overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full appearance-none bg-transparent cursor-pointer relative z-10"
          style={{
            accentColor: accent,
            height: 44,
          }}
        />
      </div>
      {/* Min/max labels */}
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 -mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
