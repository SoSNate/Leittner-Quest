import { QUESTION_TOPICS, ALL_TOPIC_IDS, topicBoxLevels, heatColor } from '../analytics/engine';
import type { MockStudent } from '../mock/mockStudents';

interface Props {
  students: MockStudent[];
  onStudentClick?: (student: MockStudent) => void;
}

export default function TopicHeatmap({ students, onStudentClick }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full text-xs border-collapse" style={{ fontFamily: 'Nunito, Heebo, sans-serif' }}>
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60">
            <th className="sticky right-0 z-10 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 min-w-[120px]">
              תלמיד
            </th>
            {ALL_TOPIC_IDS.map(id => (
              <th key={id} className="px-2 py-2 text-center font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap min-w-[80px]">
                <div className="text-[10px] leading-tight">{QUESTION_TOPICS[id].hebrewLabel}</div>
                <div className="text-[9px] text-slate-400">{QUESTION_TOPICS[id].module}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, si) => {
            const levels = topicBoxLevels(student.store.leitnerBoxes);
            return (
              <tr
                key={student.id}
                className={`${si % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'} hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors`}
                onClick={() => onStudentClick?.(student)}
              >
                <td className="sticky right-0 z-10 bg-inherit px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                  {student.displayName}
                </td>
                {ALL_TOPIC_IDS.map(id => {
                  const level = levels[id];
                  const { bg, text } = heatColor(level);
                  return (
                    <td key={id} className="px-1 py-2 text-center border-b border-slate-100 dark:border-slate-800">
                      <div
                        className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-transform hover:scale-110"
                        style={{ background: bg, color: text }}
                        title={`${QUESTION_TOPICS[id].hebrewLabel}: קופסה ${level < 0 ? 'לא התחיל' : level}`}
                      >
                        {level < 0 ? '·' : level === 5 ? '⭐' : level}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 flex-wrap">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">מקרא:</span>
        {[
          { label: 'לא התחיל', bg: '#f1f5f9' },
          { label: 'קופסה 0', bg: '#fee2e2' },
          { label: 'קופסה 1-2', bg: '#fef9c3' },
          { label: 'קופסה 3-4', bg: '#dcfce7' },
          { label: '⭐ שליטה מלאה', bg: '#4ade80' },
        ].map(({ label, bg }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: bg }} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
