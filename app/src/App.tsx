import { useEffect, useRef, useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { useAppStore } from './store/useAppStore';
import GlobalMascot from './components/mascot/GlobalMascot';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.setState({ error: `${error.message}\n${error.stack?.slice(0, 400)}` });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'monospace', padding: 24, background: '#1a0000', color: '#ff6b6b', whiteSpace: 'pre-wrap', fontSize: 13 }}>
          🛑 React render error:{'\n'}{this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}
import ModulePlayer from './components/module/ModulePlayer';
import Module3Player from './components/module/Module3Player';
import Module3Investigation from './components/module/Module3Investigation';
import PracticeMode from './components/practice/PracticeMode';
import TeacherOverview from './insight/pages/TeacherOverview';
import type { Lesson } from './types';
import module1 from './lessons/module-1-linear.json';
import module2 from './lessons/module-2-parabola.json';

const modules: Lesson[] = [module1 as unknown as Lesson, module2 as unknown as Lesson];

const MODULE3_TOTAL_STEPS = 10;
const MODULE4_TOTAL_STEPS = 15;

// ─── Hash Routing Helpers ─────────────────────────────────────────────────────

type ActiveView =
  | { type: 'home' }
  | { type: 'module'; lesson: Lesson }
  | { type: 'practice'; moduleId: number }
  | { type: 'module3-investigation' }
  | { type: 'module3-player' }
  | { type: 'teacher' };

function viewToHash(v: ActiveView): string {
  switch (v.type) {
    case 'home': return '/';
    case 'module': return `/module/${v.lesson.moduleId}`;
    case 'practice': return `/practice/${v.moduleId}`;
    case 'module3-investigation': return '/investigation';
    case 'module3-player': return '/derivatives';
    case 'teacher': return '/teacher';
  }
}

function hashToView(hash: string): ActiveView {
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  const [, seg1, seg2] = path.split('/');
  if (seg1 === 'module') {
    const lesson = modules.find(m => m.moduleId === parseInt(seg2));
    if (lesson) return { type: 'module', lesson };
  }
  if (seg1 === 'practice') {
    const moduleId = parseInt(seg2);
    if (!isNaN(moduleId)) return { type: 'practice', moduleId };
  }
  if (seg1 === 'investigation') return { type: 'module3-investigation' };
  if (seg1 === 'derivatives') return { type: 'module3-player' };
  if (seg1 === 'teacher') return { type: 'teacher' };
  return { type: 'home' };
}

// ─── Module Card ──────────────────────────────────────────────────────────────

interface ModuleCardProps {
  moduleId: number;
  title: string;
  icon: string;
  subtitle: string;
  accent: string;
  accentBg: string;
  textOnAccent: string;
  totalSteps: number;
  currentStep: number;
  completed: boolean;
  onStart: () => void;
  onPractice: () => void;
}

function ModuleCard({ moduleId, title, icon, subtitle, accent, accentBg, textOnAccent, totalSteps, currentStep, completed, onStart, onPractice }: ModuleCardProps) {
  const pct = totalSteps > 1 ? Math.round((currentStep / (totalSteps - 1)) * 100) : 0;
  return (
    <div className="text-right bg-white dark:bg-[#1c1b1f] rounded-2xl p-4 sm:p-6 border border-[#e0dbe3] dark:border-slate-700/60 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: accentBg, color: accent }}>
          מודול {moduleId}
        </span>
        {completed && <span className="text-emerald-500">✅</span>}
      </div>
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-xl font-bold mb-1 text-[#2f2e32] dark:text-slate-100">{title}</h2>
      <p className="text-sm text-[#5d5b5f] dark:text-slate-400 mb-4">{subtitle}</p>
      <div className="h-1.5 bg-[#ebe7ed] dark:bg-slate-700 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${accent},#38bdf8)` }} />
      </div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-[#78767b] dark:text-slate-500">{currentStep} / {totalSteps} שלבים</span>
      </div>
      <div className="flex gap-2 mt-auto">
        <button
          onClick={onStart}
          className="flex-1 font-black text-sm py-2.5 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: accent, color: textOnAccent, minHeight: 44 }}
        >
          {currentStep > 0 ? 'המשך ←' : 'התחל ←'}
        </button>
        <button
          onClick={onPractice}
          title="מגרש תרגול"
          className="px-3 py-2.5 rounded-xl border-2 border-[#e0dbe3] dark:border-slate-600 text-[#78767b] dark:text-slate-400 hover:border-current hover:text-[#2f2e32] dark:hover:text-slate-100 transition-all font-bold text-sm"
          style={{ minHeight: 44 }}
        >🏋️</button>
      </div>
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme, progress, resetProgress } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [view, setView] = useState<ActiveView>(() => hashToView(window.location.hash));
  const isHashNav = useRef(false);

  const isSubView = view.type !== 'home';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Sync URL hash when view changes (skip when triggered by hashchange)
  useEffect(() => {
    if (isHashNav.current) { isHashNav.current = false; return; }
    window.location.hash = viewToHash(view);
  }, [view]);

  // Browser back/forward support
  useEffect(() => {
    function onHashChange() {
      isHashNav.current = true;
      setView(hashToView(window.location.hash));
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <ErrorBoundary>
    <>
      <GlobalMascot />
      {view.type === 'module' && <ModulePlayer lesson={view.lesson} onBack={() => setView({ type: 'home' })} />}
      {view.type === 'practice' && <PracticeMode moduleId={view.moduleId} darkMode={theme === 'dark'} onBack={() => setView({ type: 'home' })} />}
      {view.type === 'module3-investigation' && <Module3Investigation onBack={() => setView({ type: 'home' })} />}
      {view.type === 'module3-player' && <Module3Player onBack={() => setView({ type: 'home' })} />}
      {view.type === 'teacher' && <TeacherOverview onBack={() => setView({ type: 'home' })} darkMode={theme === 'dark'} />}
      {!isSubView && (
    <div className="min-h-screen bg-[#faf5fb] dark:bg-[#0e0e11] text-[#2f2e32] dark:text-slate-100 overflow-x-hidden" dir="rtl" style={{ fontFamily: 'Nunito, Heebo, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0e0e11]/90 backdrop-blur border-b border-[#afacb1]/30 dark:border-slate-700/50 px-5 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fde403] flex items-center justify-center text-lg font-black text-[#484000]">L</div>
            <span className="font-black text-lg text-[#675c00] dark:text-[#fde403]">Leittner-Quest</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView({ type: 'teacher' })}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors flex items-center gap-1.5"
              style={{ minHeight: 36 }}
              title="לוח מורה — Leittner Insight"
            >
              <span>🏫</span>
              <span className="hidden sm:inline">לוח מורה</span>
            </button>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 font-bold hidden sm:block">בטוח?</span>
                <button
                  onClick={() => { resetProgress(); setConfirmReset(false); }}
                  className="text-xs font-black px-3 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  style={{ minHeight: 36 }}
                >כן, אפס</button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-[#ebe7ed] dark:bg-slate-700 text-[#5d5b5f] dark:text-slate-300 hover:bg-[#e0dbe3] transition-colors"
                  style={{ minHeight: 36 }}
                >ביטול</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-[#ebe7ed] dark:bg-slate-800 text-[#78767b] hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                style={{ minHeight: 44 }}
                title="אפס התקדמות"
              >🔄 איפוס</button>
            )}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-[#ebe7ed] dark:bg-slate-800 flex items-center justify-center text-xl transition-colors hover:bg-[#e0dbe3] dark:hover:bg-slate-700"
              style={{ minHeight: 44, minWidth: 44 }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-12 overflow-x-hidden">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-[#d1fa7a]/60 dark:bg-[#496400]/40 text-[#455f00] dark:text-[#c3eb6d] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6">
            מסלול למידה אדפטיבי · שיטת לייטנר
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 leading-tight">
            <span style={{ background: 'linear-gradient(135deg,#675c00,#6a1cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>לפצח מתמטיקה</span>
            <br/>
            <span className="text-[#2f2e32] dark:text-slate-200">בשלבים קטנים</span>
          </h1>
          <p className="text-base text-[#5d5b5f] dark:text-slate-400 max-w-md mx-auto">כל מושג נלמד תחילה בעיניים — אחר כך עם נוסחה.</p>
          {import.meta.env.DEV && (
            <div className="mt-3 inline-block bg-[#fde403]/30 dark:bg-[#484000]/60 text-[#675c00] dark:text-[#fde403] text-xs font-bold px-3 py-1 rounded-full">
              🔓 מצב פיתוח — כל המודולים פתוחים
            </div>
          )}
        </div>

        {/* Module Cards — Bento Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
          {modules.map((mod) => {
            const prog = progress[mod.moduleId];
            const isEmerald = mod.color === 'emerald';
            const accent = isEmerald ? '#34d399' : '#f59e0b';
            return (
              <ModuleCard
                key={mod.moduleId}
                moduleId={mod.moduleId}
                title={mod.title}
                icon={mod.icon}
                subtitle={`${mod.steps.length} שלבים · שיטת לייטנר`}
                accent={accent}
                accentBg={isEmerald ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)'}
                textOnAccent={isEmerald ? '#014431' : '#402500'}
                totalSteps={mod.steps.length}
                currentStep={prog?.step ?? 0}
                completed={prog?.completed ?? false}
                onStart={() => setView({ type: 'module', lesson: mod })}
                onPractice={() => setView({ type: 'practice', moduleId: mod.moduleId })}
              />
            );
          })}

          <ModuleCard
            moduleId={3}
            title="חקירת הפרבולה"
            icon="🔬"
            subtitle={`${MODULE3_TOTAL_STEPS} שלבים · שורשים, קיצון, תחומים`}
            accent="#16a34a"
            accentBg="rgba(22,163,74,0.12)"
            textOnAccent="#fff"
            totalSteps={MODULE3_TOTAL_STEPS}
            currentStep={progress[3]?.step ?? 0}
            completed={progress[3]?.completed ?? false}
            onStart={() => setView({ type: 'module3-investigation' })}
            onPractice={() => setView({ type: 'practice', moduleId: 3 })}
          />

          <ModuleCard
            moduleId={4}
            title="נגזרות"
            icon="📐"
            subtitle={`${MODULE4_TOTAL_STEPS} שלבים · ויזואלי עם זום`}
            accent="#6200EE"
            accentBg="rgba(98,0,238,0.12)"
            textOnAccent="#fff"
            totalSteps={MODULE4_TOTAL_STEPS}
            currentStep={progress[4]?.step ?? 0}
            completed={progress[4]?.completed ?? false}
            onStart={() => setView({ type: 'module3-player' })}
            onPractice={() => setView({ type: 'practice', moduleId: 4 })}
          />
        </div>

        {/* How Leitner works */}
        <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl p-7 border border-[#e0dbe3] dark:border-slate-700/60">
          <h3 className="text-lg font-bold mb-6 text-center">איך שיטת לייטנר עובדת?</h3>
          <div className="grid md:grid-cols-3 gap-5 text-center">
            {[
              { icon: '👁️', title: 'ויזואלי קודם', desc: 'רואים את הגרף ומרגישים את הרעיון — לפני הנוסחה', color: '#34d399' },
              { icon: '🎯', title: 'תרגול פעיל', desc: 'שאלות שחוזרות על שגיאות — לא שינון פסיבי', color: '#38bdf8' },
              { icon: '📦', title: 'קופסאות לייטנר', desc: 'הצלחה → קופסה 1. טעות → חוזר לתור', color: '#a78bfa' },
            ].map((item) => (
              <div key={item.title} className="bg-[#f4eff5] dark:bg-slate-800/50 rounded-xl p-4">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-bold mb-1 text-sm" style={{ color: item.color }}>{item.title}</div>
                <div className="text-xs text-[#5d5b5f] dark:text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Share with teacher footer */}
      <ShareWithTeacher darkMode={theme === 'dark'} />
    </div>
      )}
    </>
    </ErrorBoundary>
  );
}

// ─── Share With Teacher Banner ────────────────────────────────────────────────

function ShareWithTeacher({ darkMode }: { darkMode: boolean }) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleShare() {
    setSharing(true);
    try {
      // Import dynamically to keep App.tsx lean
      const { syncToInsight } = await import('./insight/mock/shortCodeService');
      const lqStore = localStorage.getItem('lq-store') ?? '{}';
      const code = await syncToInsight(lqStore);
      setShareCode(code);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className={`border-t border-slate-200 dark:border-slate-700/50 px-5 py-4 ${darkMode ? 'bg-[#0e0e11]' : 'bg-[#faf5fb]'}`}>
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Leittner-Quest · שיטת לייטנר למתמטיקה
        </p>
        {shareCode ? (
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl px-4 py-2">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              ✅ קוד שיתוף:
            </span>
            <span dir="ltr" className="font-mono font-black text-purple-700 dark:text-purple-200 tracking-widest text-sm">
              {shareCode}
            </span>
            <button
              onClick={() => copyCode(shareCode)}
              className="text-xs font-bold px-2 py-1 rounded-lg bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-600 transition-colors"
              title="העתק קוד"
            >
              {copied ? '✓' : '📋'}
            </button>
            <span className="text-xs text-slate-400">← תן למורה</span>
          </div>
        ) : (
          <button
            onClick={handleShare}
            disabled={sharing}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors disabled:opacity-50"
            style={{ minHeight: 36 }}
          >
            {sharing ? '...מסנכרן' : '🏫 שתף התקדמות עם מורה'}
          </button>
        )}
      </div>
    </div>
  );
}
