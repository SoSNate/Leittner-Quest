interface Props {
  value: number;   // 0-100
  label?: string;
  color?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md';
}

export default function MasteryBar({ value, label, color = '#6200EE', showPercent = true, size = 'md' }: Props) {
  const h = size === 'sm' ? 'h-2' : 'h-3';
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
          {showPercent && (
            <span className="text-xs font-bold tabular-nums" style={{ color }}>
              {value}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${h}`}>
        <div
          className={`${h} rounded-full transition-all duration-700`}
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}
