import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Lesson, Step } from '../../types';
import InteractiveGraph from '../graph/InteractiveGraph';
import SliderController from '../ui/SliderController';
import LeitnerEngine from '../leitner/LeitnerEngine';
import SteppingGraph from '../steps/SteppingGraph';
import IdentifyDrill from '../steps/IdentifyDrill';
import RealMath from '../steps/RealMath';
import ImpossibleChallenge from '../steps/ImpossibleChallenge';
import MatchDrill from '../steps/MatchDrill';
import SlopeFormula from '../steps/SlopeFormula';
import LiveEquation from '../ui/LiveEquation';
import PracticeMode from '../practice/PracticeMode';

interface Props {
  lesson: Lesson;
  onBack: () => void;
}

export default function ModulePlayer({ lesson, onBack }: Props) {
  const { progress, setStep, completeModule, sim, setSim, theme, triggerMascot } = useAppStore();
  const savedStep = progress[lesson.moduleId]?.step ?? 0;
  const [currentStep, setCurrentStep] = useState(savedStep);
  const [hits, setHits] = useState(0);
  const isDark = theme === 'dark';
  const TOTAL = lesson.steps.length;
  const step: Step = lesson.steps[currentStep];

  const isEmerald = lesson.color === 'emerald';
  const accent = isEmerald ? '#34d399' : '#f59e0b';

  function goToStep(n: number) {
    const clamped = Math.max(0, Math.min(TOTAL - 1, n));
    setCurrentStep(clamped);
    setStep(lesson.moduleId, clamped);
    setHits(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextStep() { goToStep(currentStep + 1); }
  function prevStep() { goToStep(currentStep - 1); }

  function handleComplete() {
    completeModule(lesson.moduleId);
    onBack();
  }

  const handleHits = useCallback((h: number) => setHits(h), []);

  // Initialize sim values from step defaults when navigating — reset ALL keys first to prevent leaks
  useEffect(() => {
    const defaults: Record<string, number> = { m: 0, b: 0, a: 0, c: 0 };
    if (step.controls) {
      step.controls.forEach(ctrl => { defaults[ctrl.id] = ctrl.defaultValue; });
    }
    setSim(defaults);
    if (step.mascotText) {
      triggerMascot(step.mascotText, 'explain', 8000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const m1Targets = [{ x: 1, y: 3 }, { x: 4, y: -3 }];
  const m2Targets = [{ x: -2, y: -2 }, { x: 0, y: 2 }, { x: 2, y: -2 }];
  const targets = lesson.moduleId === 1 ? m1Targets : m2Targets;

  const pct = Math.round((currentStep / (TOTAL - 1)) * 100);

  return (
    <div className="min-h-screen bg-[#faf5fb] dark:bg-[#0e0e11] text-[#2f2e32] dark:text-slate-100 overflow-x-hidden" dir="rtl" style={{ fontFamily: 'Nunito, Heebo, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0e0e11]/90 backdrop-blur border-b border-[#afacb1]/30 dark:border-slate-700/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#78767b] hover:text-[#2f2e32] dark:hover:text-slate-100 transition-all text-sm font-bold px-3 py-2 rounded-xl hover:bg-[#ebe7ed] dark:hover:bg-slate-800 group"
            style={{ minHeight: 44 }}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 16 16">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>דשבורד</span>
          </button>
          <span className="font-black text-base" style={{ color: accent }}>
            {lesson.icon} {lesson.title}
          </span>
          <span className="text-xs text-[#78767b] dark:text-slate-500 hidden sm:block whitespace-nowrap">
            {currentStep + 1} / {TOTAL}
          </span>
        </div>
        {/* Progress bar */}
        <div className="max-w-5xl mx-auto mt-2">
          <div className="h-1.5 bg-[#ebe7ed] dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${accent},#38bdf8)` }} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-fade-up overflow-x-hidden">
        {/* Step title */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black mb-1 text-[#2f2e32] dark:text-slate-100">{step.title}</h2>
          {step.subtitle && <p className="text-[#5d5b5f] dark:text-slate-400 text-sm">{step.subtitle}</p>}
        </div>

        {/* ─── visual-slider / simulator ─── */}
        {(step.type === 'visual-slider' || step.type === 'simulator') && step.controls && (
          <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 overflow-hidden mb-6">
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 bg-[#f4eff5] dark:bg-slate-900/40 p-3">
                <InteractiveGraph
                  type={lesson.moduleId === 1 ? 'linear' : 'parabola'}
                  m={sim.m} b={sim.b} a={sim.a} bCoef={sim.b} c={sim.c}
                  darkMode={isDark}
                />
                <LiveEquation type={lesson.moduleId === 1 ? 'linear' : 'parabola'} m={sim.m} b={sim.b} a={sim.a} c={sim.c} />
              </div>
              <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 w-full sm:w-72 flex-shrink-0 min-w-0">
                {step.controls.map((ctrl) => (
                  <SliderController
                    key={ctrl.id} id={ctrl.id} label={ctrl.label}
                    min={ctrl.min} max={ctrl.max} step={ctrl.step}
                    value={(sim as unknown as Record<string, number>)[ctrl.id] ?? ctrl.defaultValue}
                    color={ctrl.color}
                    onChange={(val) => setSim({ [ctrl.id]: val })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── target-drill ─── */}
        {step.type === 'target-drill' && step.controls && (
          <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 overflow-hidden mb-6">
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 bg-[#f4eff5] dark:bg-slate-900/40 p-3">
                <InteractiveGraph
                  type={lesson.moduleId === 1 ? 'linear' : 'parabola'}
                  m={sim.m} b={sim.b} a={sim.a} bCoef={sim.b} c={sim.c}
                  targets={targets} darkMode={isDark} onHitsChange={handleHits}
                />
                <LiveEquation type={lesson.moduleId === 1 ? 'linear' : 'parabola'} m={sim.m} b={sim.b} a={sim.a} c={sim.c} />
              </div>
              <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 w-full sm:w-72 flex-shrink-0 min-w-0">
                {step.controls.map((ctrl) => (
                  <SliderController
                    key={ctrl.id} id={ctrl.id} label={ctrl.label}
                    min={ctrl.min} max={ctrl.max} step={ctrl.step}
                    value={(sim as unknown as Record<string, number>)[ctrl.id] ?? ctrl.defaultValue}
                    color={ctrl.color}
                    onChange={(val) => setSim({ [ctrl.id]: val })}
                  />
                ))}
                {hits === targets.length && (
                  <div className="bg-[#d1fa7a]/50 dark:bg-[#496400]/40 border border-[#c3eb6d] dark:border-[#496400] rounded-xl p-3 text-center text-[#455f00] dark:text-[#c3eb6d] font-bold text-sm">
                    🎯 פגעתם בול!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── formula-reveal ─── */}
        {step.type === 'formula-reveal' && (
          <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 p-8 mb-6">
            {(step.formulaVariant === 'linear' || lesson.moduleId === 1) ? (
              <div className="text-center space-y-6">
                <div className="text-2xl sm:text-3xl font-black font-mono py-4 overflow-x-auto" dir="ltr" style={{ color: '#34d399' }}>
                  y = <span style={{ color: '#f59e0b' }}>m</span>x + <span style={{ color: '#38bdf8' }}>b</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-right">
                  <div className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-4">
                    <span className="font-black text-lg" style={{ color: '#f59e0b' }} dir="ltr">m</span>
                    <span className="text-[#5d5b5f] dark:text-slate-400 text-sm mr-2">= שיפוע (קצב השינוי)</span>
                    <p className="text-xs text-[#78767b] dark:text-slate-500 mt-1">כמה ה-y משתנה לכל +1 ב-x</p>
                  </div>
                  <div className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-4">
                    <span className="font-black text-lg" style={{ color: '#38bdf8' }} dir="ltr">b</span>
                    <span className="text-[#5d5b5f] dark:text-slate-400 text-sm mr-2">= חיתוך ציר Y</span>
                    <p className="text-xs text-[#78767b] dark:text-slate-500 mt-1">איפה הקו חוצה את ציר Y</p>
                  </div>
                </div>
              </div>
            ) : step.formulaVariant === 'parabola-full' ? (
              <div className="text-center space-y-6">
                <div className="text-2xl sm:text-3xl font-black font-mono py-4 overflow-x-auto" dir="ltr" style={{ color: '#f59e0b' }}>
                  y = <span style={{ color: '#ef4444' }}>a</span>x² + <span style={{ color: '#a78bfa' }}>b</span>x + <span style={{ color: '#38bdf8' }}>c</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-right">
                  {[
                    { letter: 'a', color: '#f59e0b', desc: 'רוחב + כיוון הפרבולה' },
                    { letter: 'b', color: '#a78bfa', desc: 'הזזה אופקית של הקודקוד' },
                    { letter: 'c', color: '#38bdf8', desc: 'חיתוך ציר Y' },
                  ].map(item => (
                    <div key={item.letter} className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-3 text-center">
                      <span className="font-black text-xl" style={{ color: item.color }} dir="ltr">{item.letter}</span>
                      <p className="text-xs text-[#78767b] dark:text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-[#5d5b5f] dark:text-slate-400 text-sm mb-2">נוסחת הקודקוד (הנקודה הגבוהה/נמוכה ביותר):</p>
                <div className="flex items-center justify-center gap-3 py-3" dir="ltr" style={{ color: '#f59e0b' }}>
                  <span className="text-2xl font-black font-mono">x<sub>v</sub> =</span>
                  <div className="inline-flex flex-col items-center font-black font-mono text-xl leading-none">
                    <span className="pb-1">−b</span>
                    <span className="w-full border-t-2 border-current" />
                    <span className="pt-1">2a</span>
                  </div>
                </div>
                <div className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-4 text-sm text-[#5d5b5f] dark:text-slate-400 text-right">
                  <strong>דוגמה:</strong> עבור <span dir="ltr" className="inline-block font-mono">y = x² − 4x + 3</span>:
                  <div className="flex items-center gap-2 mt-2 justify-end" dir="ltr">
                    <span className="font-mono">x<sub>v</sub> =</span>
                    <div className="inline-flex flex-col items-center font-mono text-sm leading-none" style={{ color: '#f59e0b' }}>
                      <span className="pb-0.5">−(−4)</span>
                      <span className="w-full border-t border-current" />
                      <span className="pt-0.5">2·1</span>
                    </div>
                    <span className="font-mono">=</span>
                    <div className="inline-flex flex-col items-center font-mono text-sm leading-none" style={{ color: '#f59e0b' }}>
                      <span className="pb-0.5">4</span>
                      <span className="w-full border-t border-current" />
                      <span className="pt-0.5">2</span>
                    </div>
                    <span className="font-mono">= 2</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── x2-reminder ─── */}
        {step.type === 'x2-reminder' && (
          <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-[#e0dbe3] dark:border-slate-700/60 p-6 sm:p-8 mb-6 space-y-6">
            {/* Key insight */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-5 text-center">
              <p className="text-xl font-black text-amber-700 dark:text-amber-300 mb-1">
                <span dir="ltr" className="inline-block">x² ≥ 0</span> תמיד!
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">לא משנה מה x — ריבועו תמיד אי-שלילי</p>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center font-mono text-sm border-collapse" dir="ltr">
                <thead>
                  <tr className="bg-[#f4eff5] dark:bg-slate-800/60">
                    <th className="px-2 sm:px-4 py-2 rounded-tl-xl font-black text-[#5d5b5f] dark:text-slate-300">x</th>
                    {[-3,-2,-1,0,1,2,3].map(x => <th key={x} className="px-2 sm:px-4 py-2 font-bold text-sky-600 dark:text-sky-400">{x}</th>)}
                  </tr>
                  <tr className="border-t border-[#e0dbe3] dark:border-slate-700">
                    <td className="px-2 sm:px-4 py-2 font-black text-amber-600 dark:text-amber-400 bg-[#f4eff5] dark:bg-slate-800/60 rounded-bl-xl">x²</td>
                    {[-3,-2,-1,0,1,2,3].map(x => (
                      <td key={x} className={`px-2 sm:px-4 py-2 font-bold ${x*x === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-300'}`}>{x*x}</td>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
            {/* Insight cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-4 text-right">
                <p className="font-black text-[#2f2e32] dark:text-slate-100 text-sm mb-1">📉 x שלילי? אין בעיה!</p>
                <p className="text-xs text-[#78767b] dark:text-slate-500">
                  שלילי × שלילי = חיובי<br/>
                  למשל: <span dir="ltr" className="inline-block font-mono">(−3)² = 9</span>
                </p>
              </div>
              <div className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-4 text-right">
                <p className="font-black text-[#2f2e32] dark:text-slate-100 text-sm mb-1">⬇️ המינימום תמיד ב-<span dir="ltr" className="inline-block">x=0</span></p>
                <p className="text-xs text-[#78767b] dark:text-slate-500">כשאין הזזה — הקודקוד נמצא בראשית הצירים</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── stepping-graph ─── */}
        {step.type === 'stepping-graph' && (
          <SteppingGraph darkMode={isDark} onDone={nextStep} />
        )}

        {/* ─── identify-drill ─── */}
        {step.type === 'identify-drill' && (
          <IdentifyDrill darkMode={isDark} />
        )}

        {/* ─── real-math ─── */}
        {step.type === 'real-math' && (
          <RealMath darkMode={isDark} />
        )}

        {/* ─── impossible-challenge ─── */}
        {step.type === 'impossible-challenge' && (
          <ImpossibleChallenge darkMode={isDark} onDone={nextStep} />
        )}

        {/* ─── slope-formula ─── */}
        {step.type === 'slope-formula' && (
          <SlopeFormula darkMode={isDark} />
        )}

        {/* ─── match-drill ─── */}
        {step.type === 'match-drill' && (
          <MatchDrill type={lesson.moduleId === 1 ? 'linear' : 'parabola'} darkMode={isDark} onDone={nextStep} />
        )}

        {/* ─── leitner-quiz ─── */}
        {step.type === 'leitner-quiz' && step.questions && (
          <LeitnerEngine moduleId={lesson.moduleId} questions={step.questions} onComplete={handleComplete} />
        )}

        {/* ─── practice-mini (embedded visual practice after theory blocks) ─── */}
        {step.type === 'practice-mini' && (
          <PracticeMode moduleId={lesson.moduleId} onBack={nextStep} darkMode={isDark} embedded questionCount={3} />
        )}

        {/* Nav buttons — hidden for self-contained steps that navigate themselves */}
        {step.type !== 'leitner-quiz' && step.type !== 'practice-mini' && (
          <div className="flex justify-between mt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 text-[#78767b] hover:text-[#2f2e32] dark:hover:text-slate-100 font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-30 hover:bg-[#ebe7ed] dark:hover:bg-slate-800 group disabled:hover:bg-transparent"
              style={{ minHeight: 44 }}
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 group-disabled:translate-x-0" fill="none" viewBox="0 0 16 16">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              שלב קודם
            </button>
            {step.type !== 'stepping-graph' && step.type !== 'impossible-challenge' && step.type !== 'match-drill' && (
              <button
                onClick={currentStep === TOTAL - 1 ? handleComplete : nextStep}
                className="flex items-center gap-1.5 font-black px-6 py-3 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md"
                style={{ minHeight: 44, background: '#fde403', color: '#484000' }}
              >
                {currentStep === TOTAL - 1 ? (
                  <>סיים מודול <span>✓</span></>
                ) : (
                  <>
                    שלב הבא
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
