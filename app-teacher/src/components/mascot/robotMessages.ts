// ─── Leittner-Talk message pools ─────────────────────────────────────────────
// Each key maps to 3-4 variants. A random one is picked per session so it
// always feels "fresh" and generative — like an AI tutor speaking in real time.

export type RobotMood = 'idle' | 'explain' | 'cheer' | 'hint' | 'challenge' | 'correct' | 'wrong';

export interface RobotMessage {
  text: string;
  mood: RobotMood;
}

// Helper: pick a random item, seeded by stepIdx so it's stable per step visit
// but different across revisits when stepIdx changes
function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─── Per-step message pools ────────────────────────────────────────────────────

const POOLS: Record<string, RobotMessage[]> = {

  // ── Step 0 — zoom intro ──────────────────────────────────────────────────────
  'step-0': [
    { text: 'בואו נעשה ניסוי! 🔍 משכו את סליידר הזום לסוף — ותראו משהו מדהים קורה לפרבולה.', mood: 'explain' },
    { text: 'דמיינו שאתם נמלה מטיילת על הפרבולה. מנקודת המבט שלכם — הקו נראה ישר לגמרי!', mood: 'explain' },
    { text: 'זהו אחד הרגעים "וואו" של חשבון. הגדילו את הזום — ותראו מה קורה לפרבולה העקומה שלנו.', mood: 'explain' },
    { text: 'כל עקומה, מקרוב מספיק, נראית כמו קו ישר. זה הסוד של הנגזרת — בואו נגלה אותו יחד!', mood: 'explain' },
  ],

  // ── Step 2 — tangent ─────────────────────────────────────────────────────────
  'step-2': [
    { text: 'הקו האדום הזה הוא "נשיקת" הפרבולה — הוא נוגע בה ברגע אחד בדיוק ואז ממשיך לדרכו. 💋', mood: 'explain' },
    { text: 'הזיזו את הנמלה לאט לאט. שמתם לב איך הקו האדום מסתובב? בקודקוד — הוא שטוח לגמרי!', mood: 'explain' },
    { text: 'המשיק הוא "חבר" הפרבולה לרגע קצר — שניהם הולכים באותו כיוון, ואז נפרדים.', mood: 'explain' },
    { text: 'שיפוע המשיק = כמה מהר הפרבולה עולה (או יורדת) בנקודה הזו. הזיזו וראו!', mood: 'explain' },
  ],

  // ── Step 4 — slope trail ─────────────────────────────────────────────────────
  'step-4': [
    { text: 'כל נקודה צהובה היא "צילום" של השיפוע. הזיזו לאט מ-3- עד 3+ ותראו ציור מתגלה! 🎨', mood: 'explain' },
    { text: 'אנחנו בונים פונקציה חדשה! כל פעם שמזיזים, נוספת נקודה. איזה צורה היא מציירת?', mood: 'explain' },
    { text: 'תעדו את השיפוע בכל נקודה — ותראו שמשהו מסתתר שם. רמז: זה לא מקרי שהנקודות מסתדרות... 🕵️', mood: 'explain' },
  ],

  // ── Step 6 — derivative revealed ─────────────────────────────────────────────
  'step-6': [
    { text: 'בום! 💥 הנקודות הצהובות הן קו ישר — זו הנגזרת! f\'(x) = 2x. שיפוע בכל נקודה, בנוסחה אחת.', mood: 'cheer' },
    { text: 'הנגזרת היא "הצל" של הפרבולה — היא עוקבת אחריה ומספרת כמה מהר היא משתנה בכל נקודה.', mood: 'explain' },
    { text: 'מרגע זה אפשר לחשב שיפוע בכל נקודה בלי לצייר שום דבר — רק להציב ב-f\'(x)!', mood: 'cheer' },
  ],

  // ── Step 7 — power rule ───────────────────────────────────────────────────────
  'step-7': [
    { text: 'כלל החזקה הוא כמו קסם: תורידו את החזקה לפני ה-x, ותפחיתו 1 ממנה. זהו! ✨', mood: 'explain' },
    { text: 'x³ → 3x². x⁵ → 5x⁴. תרגישו את הקצב? הורידו, הפחיתו. זה כל הסיפור!', mood: 'explain' },
    { text: 'המתמטיקאים אוהבים קיצורים — וכלל החזקה הוא הקיצור הכי שימושי שתפגשו היום. 🎯', mood: 'explain' },
  ],

  // ── Step 9 — C disappears ─────────────────────────────────────────────────────
  'step-9': [
    { text: 'הקבוע נעלם! 🫥 למה? כי הוא רק מזיז את הגרף למעלה/למטה — לא משנה את הצורה שלו.', mood: 'explain' },
    { text: 'שתי פרבולות, אותו "שיפוע" בכל נקודה. ה-+3 לא מוסיף מהירות — רק גובה. שימו לב בגרף!', mood: 'explain' },
    { text: 'נגזרת של קבוע = 0. זכרו את זה — זה יציל אתכם בהרבה תרגילים! 💾', mood: 'explain' },
  ],

  // ── Step 10 — derivative reveals parabola ────────────────────────────────────
  'step-10': [
    { text: 'כשהנגזרת = 0, הפרבולה עוצרת לרגע! זה בדיוק הקודקוד — הנקודה הנמוכה ביותר.', mood: 'explain' },
    { text: 'f\'(x) = 2x. כש-x שלילי — יורדים. כש-x חיובי — עולים. הנגזרת "מנווטת" עבורנו. 🧭', mood: 'explain' },
    { text: 'הנגזרת היא כמו GPS לפרבולה — היא תמיד יודעת אם הפרבולה עולה, יורדת או עומדת.', mood: 'explain' },
  ],

  // ── Step 11 — general parabola ───────────────────────────────────────────────
  'step-11': [
    { text: 'שנו את a ב — שימו לב לנגזרת! ככל שa גדול יותר, הנגזרת "תלולה" יותר. 🏔️', mood: 'explain' },
    { text: 'y = ax² + bx + c → y\' = 2ax + b. שתי אותיות נשארות, אחת נעלמת. נחשו מי? 🤔', mood: 'explain' },
    { text: 'הנוסחה הכללית! משנים a ו-b ורואים את הנגזרת מסתגלת בזמן אמת. הגרף לא משקר!', mood: 'explain' },
  ],

  // ── Practice feedback: CORRECT ───────────────────────────────────────────────
  'correct': [
    { text: 'כן! בדיוק! 🎉 ראיתי שהייתם בטוחים — צדקתם!', mood: 'correct' },
    { text: 'מושלם! 🌟 הבנתם את הרעיון. ממשיכים קדימה!', mood: 'correct' },
    { text: '100%! לא הפתעתם אותי — ידעתי שתצליחו. 💪', mood: 'correct' },
    { text: 'גאה בכם! זה לא קל ועניתם נכון. קדימה לאתגר הבא!', mood: 'correct' },
  ],

  // ── Practice feedback: WRONG ─────────────────────────────────────────────────
  'wrong': [
    { text: 'כמעט! 🤏 שימו לב — אולי התבלבלתם בין שיפוע לגובה? נסו שוב.', mood: 'wrong' },
    { text: 'לא נורא, זה מבלבל בהתחלה. רמז: תחשבו מה הנגזרת מחשבת — שיפוע, לא ערך!', mood: 'hint' },
    { text: 'טעות היא חלק מהלמידה! 🌱 חזרו לקרוא את ההסבר — הפעם שימו לב למינוסים.', mood: 'hint' },
    { text: 'אופס! אל תתייאשו — הטעות הזו היא בדיוק מה שמחזק את הזיכרון שלכם.', mood: 'wrong' },
  ],

  // ── Drag step hint ────────────────────────────────────────────────────────────
  'drag': [
    { text: 'לחצו על החזקה (מספר ליד ה-x) ואז אישרו. אתם בעצם עושים כלל חזקה ידנית!', mood: 'explain' },
    { text: 'זכרו: החזקה יורדת ומכפילה את המקדם. תלחצו ותראו את הקסם קורה! ✨', mood: 'explain' },
    { text: 'תרגישו את כלל החזקה בידיים! כל לחיצה היא גזירה של איבר אחד.', mood: 'explain' },
  ],

  // ── Leitner drill ─────────────────────────────────────────────────────────────
  'drill': [
    { text: 'עכשיו תורכם נטו! 💪 בלי רמזים — אני סומך עליכם. הראו לי מה זכרתם!', mood: 'challenge' },
    { text: 'זה החלק החשוב — תרגול בלי רשת. כל תשובה נכונה מחזקת את הזיכרון לטווח ארוך!', mood: 'challenge' },
    { text: 'קופסאות לייטנר! כל תשובה נכונה דוחה את החזרה. תנו להן לנוע קדימה! 📦', mood: 'challenge' },
  ],

  // ── Generic welcome ───────────────────────────────────────────────────────────
  'welcome': [
    { text: 'היי! אני כאן לעזור. 🤖 יש שאלות? תמשיכו — אני עוקב אחריכם!', mood: 'idle' },
    { text: 'בואו נגלה יחד את הסוד של הנגזרת! אני מבטיח — זה יותר מגניב ממה שחשבתם.', mood: 'idle' },
    { text: 'מוכנים? אני מוכן! כל שלב מבנה על הקודם — לאט לאט הכל יסתדר. 🎯', mood: 'idle' },
  ],
};

/**
 * Get a robot message for a given context, picking a random variant
 * based on a seed (so it's stable per step, but varies across steps).
 */
export function getRobotMessage(key: string, seed: number = Math.floor(Math.random() * 100)): RobotMessage {
  const pool = POOLS[key] ?? POOLS['welcome'];
  return pickRandom(pool, seed);
}

/**
 * Get a random correct feedback message
 */
export function getCorrectMessage(seed: number): RobotMessage {
  return pickRandom(POOLS['correct'], seed);
}

/**
 * Get a random wrong feedback message
 */
export function getWrongMessage(seed: number): RobotMessage {
  return pickRandom(POOLS['wrong'], seed);
}

export { POOLS };
