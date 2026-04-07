interface StepDot { type: string }

interface Props {
  onBack: () => void;
  title: string;
  accentColor: string;
  stepIdx: number;
  totalSteps: number;
  steps: StepDot[];
}

export default function ModuleHeader({ onBack, title, accentColor, stepIdx, totalSteps, steps }: Props) {
  const pct = Math.round((stepIdx / Math.max(totalSteps - 1, 1)) * 100);

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0e0e11]/90 backdrop-blur border-b border-[#afacb1]/30 dark:border-slate-700/50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} style={{ minHeight: 44 }}
            className="flex items-center gap-1.5 text-[#78767b] hover:text-[#2f2e32] dark:hover:text-slate-100 font-bold px-3 py-2 rounded-xl hover:bg-[#ebe7ed] dark:hover:bg-slate-800 transition-all text-sm group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 16 16">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            דשבורד
          </button>
          <div className="h-5 w-px bg-[#e0dbe3] dark:bg-slate-700" />
          <span className="font-bold text-[#5d5b5f] dark:text-slate-400 text-sm hidden sm:block">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div key={i}
                className={`h-2 rounded-full transition-all duration-300 ${i === stepIdx ? 'w-5' : s.type === 'practice' ? 'w-2 bg-[#fde403]/60' : 'w-2 bg-[#e0dbe3] dark:bg-slate-700'}`}
                style={i === stepIdx ? { background: accentColor } : undefined}
              />
            ))}
          </div>
          <span className="text-xs text-[#78767b] dark:text-slate-500 whitespace-nowrap">{stepIdx + 1}/{totalSteps}</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-2">
        <div className="h-1.5 bg-[#ebe7ed] dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accentColor }} />
        </div>
      </div>
    </header>
  );
}
