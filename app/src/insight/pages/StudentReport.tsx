import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import type { MockStudent } from '../mock/mockStudents';
import {
  masteryScore, struggleIndex, modulesCompleted, timeAgo,
  QUESTION_TOPICS, ALL_TOPIC_IDS, masteredTopics, struggleTopics,
} from '../analytics/engine';
import MasteryBar from '../components/MasteryBar';
import Ltr from '../components/Ltr';

interface Props {
  student: MockStudent;
  darkMode: boolean;
  onBack: () => void;
}

// Simulate historical mastery trend (mock — in real system from DB snapshots)
function mockTrend(finalScore: number) {
  const points = [];
  let v = Math.max(10, finalScore - 45);
  for (let day = -13; day <= 0; day++) {
    v = Math.min(100, v + (Math.random() * 8 - 1));
    points.push({ day: day === 0 ? 'היום' : `${Math.abs(day)}d`, score: Math.round(v) });
  }
  // Ensure last point matches actual score
  points[points.length - 1].score = finalScore;
  return points;
}

export default function StudentReport({ student, darkMode, onBack }: Props) {
  const ms = masteryScore(student.store.leitnerBoxes);
  const si = struggleIndex(student.store.leitnerBoxes);
  const mods = modulesCompleted(student.store.progress);
  const mastered = masteredTopics(student.store.leitnerBoxes);
  const struggling = struggleTopics(student.store.leitnerBoxes);
  const trend = mockTrend(ms);

  const radarData = ALL_TOPIC_IDS.map(id => ({
    topic: QUESTION_TOPICS[id].hebrewLabel,
    level: student.store.leitnerBoxes[id]?.boxLevel ?? 0,
  }));

  return (
    <div
      className="min-h-screen bg-[#f4eff5] dark:bg-[#0e0e11]"
      style={{ fontFamily: 'Rubik, Heebo, sans-serif' }}
      dir="rtl"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#1c1b1f]/90 backdrop-blur border-b border-slate-200 dark:border-slate-700/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm"
            style={{ minHeight: 44 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            חזרה לכיתה
          </button>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <span className="font-black text-slate-800 dark:text-slate-100">{student.displayName} — דוח התקדמות</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mr-auto">{timeAgo(student.lastSyncAt)}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Score Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mastery Score', value: `${ms}%`, icon: '🎯', color: ms >= 70 ? '#16a34a' : ms >= 40 ? '#f59e0b' : '#ef4444', sub: 'ממוצע קופסות' },
            { label: 'Struggle Index', value: `${si}%`, icon: si > 40 ? '⚠️' : '✅', color: si > 40 ? '#f59e0b' : '#16a34a', sub: 'נמוך = טוב' },
            { label: 'מודולים הושלמו', value: `${mods}`, icon: '📚', color: '#6200EE', sub: 'מתוך 4' },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm text-center">
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="font-black text-2xl mb-0.5" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{card.label}</div>
              <div className="text-[10px] text-slate-400">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Mastery bars per topic module */}
        <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">📊 רמת שליטה לפי נושא</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_TOPIC_IDS.map(id => {
              const card = student.store.leitnerBoxes[id];
              const level = card?.boxLevel ?? -1;
              const pct = level < 0 ? 0 : Math.round((level / 5) * 100);
              const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171';
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 w-28 text-right flex-shrink-0 leading-tight">
                    {QUESTION_TOPICS[id].hebrewLabel}
                  </div>
                  <div className="flex-1">
                    <MasteryBar value={pct} color={color} showPercent={false} size="sm" />
                  </div>
                  <div className="text-xs font-bold w-8 text-right flex-shrink-0" style={{ color }}>
                    {level < 0 ? '—' : <Ltr>{level}/5</Ltr>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend + Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trend line */}
          <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm">📈 מגמת שליטה (14 ימים)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'שליטה']}
                  contentStyle={{ fontFamily: 'Rubik, Heebo, sans-serif', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="score" stroke="#6200EE" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm">🕸️ מפת כוכב — כל הנושאים</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <PolarAngleAxis
                  dataKey="topic"
                  tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b', fontFamily: 'Rubik, Heebo, sans-serif' }}
                />
                <Radar dataKey="level" stroke="#6200EE" fill="#6200EE" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mastered.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4">
              <h3 className="font-bold text-emerald-700 dark:text-emerald-300 mb-2 text-sm">🟢 שולט היטב (קופסה 5)</h3>
              <div className="flex flex-wrap gap-1.5">
                {mastered.map(id => (
                  <span key={id} className="text-xs px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-medium">
                    {QUESTION_TOPICS[id]?.hebrewLabel}
                  </span>
                ))}
              </div>
            </div>
          )}
          {struggling.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4">
              <h3 className="font-bold text-red-700 dark:text-red-300 mb-2 text-sm">🔴 נושאים לחיזוק</h3>
              <div className="flex flex-wrap gap-1.5">
                {struggling.map(id => {
                  const card = student.store.leitnerBoxes[id];
                  return (
                    <span key={id} className="text-xs px-2 py-1 rounded-lg bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300 font-medium">
                      {QUESTION_TOPICS[id]?.hebrewLabel}
                      {card && <span className="opacity-60 mr-1">({card.reviewCount} נסיונות)</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Module progress */}
        <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm">📚 התקדמות במודולים</h3>
          <div className="space-y-2">
            {[
              { id: 1, name: 'מודול 1 — ישרים', totalSteps: 8, color: '#38bdf8' },
              { id: 2, name: 'מודול 2 — פרבולות', totalSteps: 8, color: '#f59e0b' },
              { id: 3, name: 'מודול 3 — חקירת פרבולה', totalSteps: 10, color: '#16a34a' },
              { id: 4, name: 'מודול 4 — נגזרות', totalSteps: 15, color: '#6200EE' },
            ].map(mod => {
              const prog = student.store.progress[mod.id];
              const pct = prog ? Math.round((prog.step / mod.totalSteps) * 100) : 0;
              return (
                <div key={mod.id} className="flex items-center gap-3">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 w-40 text-right flex-shrink-0">{mod.name}</div>
                  <div className="flex-1">
                    <MasteryBar value={pct} color={mod.color} showPercent={false} size="sm" />
                  </div>
                  <div className="text-xs flex-shrink-0 flex items-center gap-1">
                    {prog?.completed && <span>✅</span>}
                    <Ltr className="text-slate-500 dark:text-slate-400 text-[11px]">{prog?.step ?? 0}/{mod.totalSteps}</Ltr>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
