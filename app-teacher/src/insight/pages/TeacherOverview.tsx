import { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { getAllMockStudents, fetchStudentByCode } from '../mock/shortCodeService';
import type { MockStudent } from '../mock/mockStudents';
import { masteryScore, struggleIndex, modulesCompleted, timeAgo, QUESTION_TOPICS, ALL_TOPIC_IDS, topicBoxLevels } from '../analytics/engine';
import MasteryBar from '../components/MasteryBar';
import TopicHeatmap from '../components/TopicHeatmap';
import StudentReport from './StudentReport';
import Ltr from '../components/Ltr';

interface Props {
  onBack: () => void;
  darkMode: boolean;
}

export default function TeacherOverview({ onBack, darkMode }: Props) {
  const [students, setStudents] = useState<MockStudent[]>(getAllMockStudents());
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MockStudent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'add'>('overview');

  async function handleAddStudent() {
    if (!codeInput.trim()) return;
    setLoading(true);
    setCodeError('');
    const student = await fetchStudentByCode(codeInput.trim());
    setLoading(false);
    if (!student) {
      setCodeError('קוד לא נמצא. בדוק שהתלמיד שיתף את ההתקדמות שלו.');
      return;
    }
    if (students.find(s => s.id === student.id)) {
      setCodeError('תלמיד זה כבר נמצא ברשימה.');
      return;
    }
    setStudents(prev => [...prev, student]);
    setCodeInput('');
    setActiveTab('overview');
  }

  // If a student is selected, show their full report
  if (selectedStudent) {
    return (
      <StudentReport
        student={selectedStudent}
        darkMode={darkMode}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  // Summary stats
  const avgMastery = students.length
    ? Math.round(students.reduce((s, st) => s + masteryScore(st.store.leitnerBoxes), 0) / students.length)
    : 0;
  const highStruggle = students.filter(s => struggleIndex(s.store.leitnerBoxes) > 40);

  // Bar chart data: avg box level per topic across all students
  const topicBarData = ALL_TOPIC_IDS.map(id => {
    const levels = students.map(s => s.store.leitnerBoxes[id]?.boxLevel ?? 0);
    const avg = levels.reduce((a, b) => a + b, 0) / Math.max(levels.length, 1);
    return {
      topic: QUESTION_TOPICS[id].hebrewLabel,
      avg: parseFloat(avg.toFixed(1)),
      fill: avg >= 4 ? '#4ade80' : avg >= 2.5 ? '#fbbf24' : '#f87171',
    };
  });

  // Radar data per student
  const radarData = ALL_TOPIC_IDS.slice(0, 8).map(id => ({
    topic: QUESTION_TOPICS[id].hebrewLabel,
    avg: students.length
      ? students.reduce((s, st) => s + (st.store.leitnerBoxes[id]?.boxLevel ?? 0), 0) / students.length
      : 0,
  }));

  return (
    <div
      className="min-h-screen bg-[#f4eff5] dark:bg-[#0e0e11]"
      style={{ fontFamily: 'Rubik, Heebo, sans-serif' }}
      dir="rtl"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#1c1b1f]/90 backdrop-blur border-b border-slate-200 dark:border-slate-700/50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm"
              style={{ minHeight: 44 }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              חזרה
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="font-black text-slate-800 dark:text-slate-100 text-base">🏫 Leittner Insight — לוח מורה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
              {students.length} תלמידים
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'ממוצע שליטה', value: `${avgMastery}%`, icon: '🎯', color: '#6200EE', sub: 'כל הנושאים' },
            { label: 'תלמידים פעילים', value: `${students.filter(s => { const d = new Date(s.lastSyncAt); return Date.now() - d.getTime() < 7 * 86400000; }).length}/${students.length}`, icon: '✅', color: '#16a34a', sub: '7 ימים אחרונים' },
            { label: 'זקוקים לעזרה', value: String(highStruggle.length), icon: '⚠️', color: '#f59e0b', sub: 'Struggle Index > 40%' },
            { label: 'מודולים הושלמו', value: String(students.reduce((s, st) => s + modulesCompleted(st.store.progress), 0)), icon: '📚', color: '#38bdf8', sub: 'סה"כ כל התלמידים' },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{card.icon}</span>
                <span className="text-xs text-slate-400">{card.sub}</span>
              </div>
              <div className="font-black text-2xl mb-0.5" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {[
            { key: 'overview', label: '📊 סקירה כללית' },
            { key: 'heatmap', label: '🗺️ מפת נושאים' },
            { key: 'add', label: '➕ הוסף תלמיד' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              style={{ minHeight: 38 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bar chart — avg per topic */}
              <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm">📈 רמת שליטה ממוצעת לפי נושא</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topicBarData} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                    <XAxis
                      dataKey="topic"
                      tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b', fontFamily: 'Rubik, Heebo, sans-serif' }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                    <Tooltip
                      formatter={(v) => [`קופסה ${v}`, 'ממוצע']}
                      contentStyle={{ fontFamily: 'Rubik, Heebo, sans-serif', fontSize: 12 }}
                    />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                      {topicBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar chart — ישרים נושאים */}
              <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm">🕸️ מפת כוכב — מודול ישרים</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <PolarAngleAxis
                      dataKey="topic"
                      tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b', fontFamily: 'Rubik, Heebo, sans-serif' }}
                    />
                    <Radar dataKey="avg" stroke="#6200EE" fill="#6200EE" fillOpacity={0.25} strokeWidth={2} dot />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Students list */}
            <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">👥 רשימת תלמידים</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {students.map(student => {
                  const ms = masteryScore(student.store.leitnerBoxes);
                  const si = struggleIndex(student.store.leitnerBoxes);
                  const levels = topicBoxLevels(student.store.leitnerBoxes);
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-right"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                        style={{ background: ms >= 70 ? '#4ade80' : ms >= 40 ? '#fbbf24' : '#f87171' }}>
                        {student.displayName[0]}
                      </div>

                      {/* Name + sync */}
                      <div className="flex-1 min-w-0 text-right">
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.displayName}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(student.lastSyncAt)}</div>
                      </div>

                      {/* Mastery bar */}
                      <div className="w-32 hidden sm:block">
                        <MasteryBar value={ms} color="#6200EE" size="sm" />
                      </div>

                      {/* Struggle badge */}
                      {si > 40 && (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex-shrink-0">
                          ⚠️ {si}%
                        </span>
                      )}

                      {/* Mini heatmap row (dots) */}
                      <div className="flex gap-0.5 flex-shrink-0 hidden md:flex">
                        {ALL_TOPIC_IDS.map(id => {
                          const { bg } = { bg: levels[id] < 0 ? '#e2e8f0' : levels[id] === 5 ? '#4ade80' : levels[id] >= 3 ? '#86efac' : levels[id] >= 2 ? '#fef08a' : '#fca5a5' };
                          return <div key={id} className="w-2.5 h-2.5 rounded-sm" style={{ background: bg }} title={QUESTION_TOPICS[id].hebrewLabel} />;
                        })}
                      </div>

                      <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 16 16">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Struggle alert */}
            {highStruggle.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">⚠️</span>
                  <div>
                    <div className="font-bold text-amber-800 dark:text-amber-300 mb-1">
                      {highStruggle.length} תלמידים זקוקים לתשומת לב
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-400">
                      {highStruggle.map(s => s.displayName).join('، ')} — תקועים בנושאים מרכזיים למרות תרגולים חוזרים.
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      💡 המלצה: עבודה אישית על שורשים ודיסקרימיננטה
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Heatmap */}
        {activeTab === 'heatmap' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">לחצו על תלמיד לדוח מפורט. ⭐ = שליטה מלאה (קופסה 5).</p>
            <TopicHeatmap students={students} onStudentClick={setSelectedStudent} />
          </div>
        )}

        {/* Tab: Add Student */}
        {activeTab === 'add' && (
          <div className="max-w-md">
            <div className="bg-white dark:bg-[#1c1b1f] rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">הוסף תלמיד לכיתה</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  בקש מהתלמיד ללחוץ "שתף עם מורה" ב-Leittner-Quest ולהעביר לך את הקוד בן 6 הספרות.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">קוד תלמיד</label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleAddStudent()}
                  placeholder="X7B-9P2"
                  dir="ltr"
                  maxLength={7}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold text-lg text-center tracking-widest focus:outline-none focus:border-purple-500 transition-colors"
                />
                {codeError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{codeError}</p>
                )}
              </div>

              <button
                onClick={handleAddStudent}
                disabled={loading || !codeInput.trim()}
                className="w-full font-black py-3 rounded-xl transition-all disabled:opacity-40"
                style={{ minHeight: 44, background: '#6200EE', color: '#fff' }}
              >
                {loading ? '...מחפש תלמיד' : '➕ הוסף לכיתה'}
              </button>

              <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
                לדמו — נסה קוד: <Ltr className="text-purple-600 dark:text-purple-400">X7B-9P2</Ltr>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
