import type {
  ContactLogEntry,
  Goal,
  Meeting,
  Mentor,
  Message,
  Schedule,
  Student,
} from '../types';

// נתוני דוגמה למצב דמו — דמויות בדויות בלבד

export const seedMentors: Mentor[] = [
  { id: 'm-gili', name: 'גילי מזרחי', role: 'mentor' },
  { id: 'm-dana', name: 'דנה ברק', role: 'mentor' },
  { id: 'm-noa', name: 'נעה וילנר', role: 'coordinator' },
];

export const seedStudents: Student[] = [
  {
    id: 's-1',
    mentorId: 'm-gili',
    name: 'איתי כהן',
    group: 'חטיבת ביניים',
    birthDate: '2013-03-14',
    intakeNotes:
      'עבר מחונכת קודמת (דנה). אוהב כדורסל ומשחקי אסטרטגיה. ההורים ציינו קושי בהתמדה בקורסים. היועצת המליצה על חיזוק תחושת מסוגלות.',
    strengths: ['יצירתיות', 'הומור', 'חשיבה אסטרטגית'],
    color: '#3a6ea5',
    emoji: '🏀',
    coverQuote: 'העיקר שיהיה מעניין',
  },
  {
    id: 's-2',
    mentorId: 'm-gili',
    name: 'תמר לוי',
    group: 'חטיבת ביניים',
    birthDate: '2012-11-02',
    intakeNotes:
      'שנה ראשונה בבית הספר. מגיעה מבית ספר רגיל, עדיין לומדת את עקרון הבחירה. אוהבת ציור ובעלי חיים.',
    strengths: ['רגישות חברתית', 'כישרון אמנותי'],
    color: '#b0566e',
    emoji: '🎨',
    coverQuote: '',
  },
  {
    id: 's-3',
    mentorId: 'm-gili',
    name: 'יונתן פרידמן',
    group: 'חטיבה צעירה',
    birthDate: '2015-07-21',
    intakeNotes: 'שנה שנייה אצלי. השנה ביקש להעמיק בתכנות. קשר טוב עם ההורים.',
    strengths: ['סקרנות', 'התמדה בתחומי עניין'],
    color: '#3e7d68',
    emoji: '🚀',
    coverQuote: 'יום אחד אבנה חללית',
  },
  {
    id: 's-4',
    mentorId: 'm-dana',
    name: 'נועם שפירא',
    group: 'חטיבה בוגרת',
    birthDate: '2010-09-08',
    intakeNotes: 'שנה שלישית אצלי. מוביל בפרלמנט.',
    strengths: ['מנהיגות', 'רהיטות'],
    color: '#a5761f',
    emoji: '🎭',
    coverQuote: '',
  },
];

const today = new Date();
function daysAgo(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const seedMeetings: Meeting[] = [
  {
    id: 'mt-1',
    studentId: 's-1',
    mentorId: 'm-gili',
    date: daysAgo(14),
    durationMin: 20,
    focus: 'combined',
    topics: 'בניית מערכת השעות; התלבטות בין קורס נגרות לתיאטרון.',
    strengthsAndChallenges: 'יודע לנמק בחירות. קושי לוותר על אחת האופציות.',
    actions: 'החלטנו שינסה שבועיים נגרות ואז נבחן יחד.',
    insights: 'כשיש לו מסגרת ניסיון מוגדרת — קל לו יותר לבחור.',
    sharing: '',
    createdAt: daysAgo(14),
  },
  {
    id: 'mt-2',
    studentId: 's-1',
    mentorId: 'm-gili',
    date: daysAgo(7),
    durationMin: 25,
    focus: 'being',
    topics: 'ריב עם חבר בהפסקה. ביקש לדבר על זה בפתיחת המפגש.',
    strengthsAndChallenges: 'הצליח לתאר את הרגש בלי להאשים. עדיין קשה לו לפנות לחבר ראשון.',
    actions: 'תרגלנו בסימולציה איך לפתוח שיחה. אם לא יסתדר עד יום ה׳ — נשקול גישור.',
    insights: 'המרחב הבטוח עובד — הגיע ישר אליי עם הקושי.',
    sharing: 'עדכנתי טלפונית את אמא בהסכמתו.',
    createdAt: daysAgo(7),
  },
  {
    id: 'mt-3',
    studentId: 's-2',
    mentorId: 'm-gili',
    date: daysAgo(6),
    durationMin: 20,
    focus: 'being',
    topics: 'היכרות: משפחה, החתולה שלה, איך היא מרגישה בבית הספר החדש.',
    strengthsAndChallenges: 'פתוחה ומשתפת. מרגישה קצת אבודה בחופש של המערכת.',
    actions: 'נבנה יחד מערכת שבועית במפגש הבא; תביא רשימת דברים שמעניינים אותה.',
    insights: 'צריכה עוגנים קבועים בשבוע כדי להרגיש ביטחון.',
    sharing: '',
    createdAt: daysAgo(6),
  },
  {
    id: 'mt-4',
    studentId: 's-4',
    mentorId: 'm-dana',
    date: daysAgo(20),
    durationMin: 20,
    focus: 'doing',
    topics: 'הכנה להצגת הצעה בפרלמנט.',
    strengthsAndChallenges: '',
    actions: '',
    insights: '',
    sharing: '',
    createdAt: daysAgo(20),
  },
];

export const seedGoals: Goal[] = [
  {
    id: 'g-1',
    studentId: 's-1',
    domain: 'academic',
    title: 'התמדה בקורס נבחר לאורך סמסטר',
    description: 'לבחור קורס אחד ולהתמיד בו סמסטר שלם, עם עיבוד חוויית הלמידה במפגשים.',
    status: 'active',
    createdAt: daysAgo(30),
  },
  {
    id: 'g-2',
    studentId: 's-1',
    domain: 'social',
    title: 'פתרון קונפליקטים בכוחות עצמו',
    description: 'לתרגל פנייה ישירה ומכבדת לחבר אחרי ריב, לפני בקשת עזרה ממבוגר.',
    status: 'active',
    createdAt: daysAgo(30),
  },
  {
    id: 'g-3',
    studentId: 's-2',
    domain: 'personal',
    title: 'בניית שגרה שבועית אישית',
    description: 'לבנות מערכת שעות עם עוגנים קבועים שמרגישה שלה, ולעמוד בה שבועיים ברצף.',
    status: 'active',
    createdAt: daysAgo(5),
  },
];

export const seedContacts: ContactLogEntry[] = [
  {
    id: 'c-1',
    studentId: 's-1',
    date: daysAgo(7),
    party: 'parent',
    channel: 'phone',
    summary: 'עדכון על הריב עם החבר ועל הדרך שסיכמנו. אמא שיתפה שגם בבית היה שבוע רגיש.',
    followUp: 'לעדכן אחרי יום ה׳ אם התקיימה שיחת הפיוס.',
  },
  {
    id: 'c-2',
    studentId: 's-2',
    date: daysAgo(10),
    party: 'counselor',
    channel: 'talk',
    summary: 'שיחת היכרות על תמר לקראת תחילת החונכות. המלצה: לתת לה עוגנים קבועים.',
    followUp: '',
  },
];

export const seedSchedules: Schedule[] = [
  {
    studentId: 's-1',
    entries: [
      { id: 'se-1', day: 0, time: '09:00', course: 'חונכות אישית' },
      { id: 'se-2', day: 0, time: '10:30', course: 'נגרות' },
      { id: 'se-3', day: 1, time: '09:00', course: 'מתמטיקה' },
      { id: 'se-4', day: 2, time: '11:00', course: 'כדורסל' },
      { id: 'se-5', day: 3, time: '09:00', course: 'מתמטיקה' },
      { id: 'se-6', day: 4, time: '10:00', course: 'פרלמנט' },
    ],
  },
];

// הודעות מהרכזת + אישורי קריאה
export const seedMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'm-noa',
    senderName: 'נעה וילנר',
    body: 'תזכורת: בשבועיים הקרובים מתקיימים מפגשי ההערכה של אמצע השנה. נא לתאם עם החניכים ולתעד במחברת. מוזמנים.ות לפנות אליי בכל שאלה 💚',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    recipientIds: ['m-gili', 'm-dana'],
  },
];

export const seedReceipts: { messageId: string; mentorId: string; readAt: string | null }[] = [
  { messageId: 'msg-1', mentorId: 'm-gili', readAt: null },
  { messageId: 'msg-1', mentorId: 'm-dana', readAt: new Date(Date.now() - 86400000).toISOString() },
];
