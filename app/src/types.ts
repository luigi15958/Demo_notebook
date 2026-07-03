// טיפוסי הדומיין של מחברת החונכות — נגזרים מפורמט התיעוד שבחוברת החונכות

export type Role = 'mentor' | 'coordinator';

export interface Mentor {
  id: string;
  name: string;
  role: Role;
}

export interface Student {
  id: string;
  mentorId: string;
  name: string;
  group: string; // חטיבה / קבוצה
  birthDate?: string; // ISO date
  intakeNotes: string; // תיק היכרות: מידע מיועצת, חונך קודם, הורים
  strengths: string[]; // פרופיל חוזקות
  color: string; // צבע אישי לכרטיס הילד.ה (hex)
  emoji: string; // אימוג'י אישי, נבחר יחד עם הילד.ה
  coverQuote: string; // "הכריכה" — משפט אישי שהילד.ה בחר.ה
}

// שדה מותאם אישית בטופס תיעוד המפגש
export interface CustomFieldDef {
  id: string;
  label: string;
}

// תבנית התיעוד של החונכ.ת: אילו שדות מובנים מוסתרים ואילו שדות משלה נוספו
export interface MeetingTemplate {
  hiddenFields: string[]; // מזהי שדות מובנים שהוסתרו
  customFields: CustomFieldDef[];
}

// שדות מובנים שאפשר להסתיר (נושאים, תאריך ומשך — תמיד מוצגים)
export const BUILTIN_FIELDS: { id: string; label: string }[] = [
  { id: 'strengthsAndChallenges', label: 'נקודות חוזק ואתגרים שעלו' },
  { id: 'actions', label: 'דרכי פעולה שגובשו' },
  { id: 'insights', label: 'תובנות או רעיונות בעקבות השיחה' },
  { id: 'sharing', label: 'שיתוף הורים או גורמים נוספים' },
];

export type HomeWidgetId = 'gaps' | 'birthdays';

export interface HomeWidgetPref {
  id: HomeWidgetId;
  enabled: boolean;
}

export const HOME_WIDGET_LABELS: Record<HomeWidgetId, string> = {
  gaps: 'לא נפגשנו מזמן',
  birthdays: 'ימי הולדת קרובים',
};

// העדפות אישיות של החונכ.ת — "הכריכה של המחברת שלי"
export interface MentorPrefs {
  mentorId: string;
  themeId: string; // ערכת צבע, ראו theme.ts
  notebookEmoji: string; // סמל המחברת בכותרת
  template: MeetingTemplate;
  homeWidgets: HomeWidgetPref[]; // מה מופיע במסך הבית ובאיזה סדר
}

export function defaultPrefs(mentorId: string): MentorPrefs {
  return {
    mentorId,
    themeId: 'botanical',
    notebookEmoji: '📔',
    template: { hiddenFields: [], customFields: [] },
    homeWidgets: [
      { id: 'gaps', enabled: true },
      { id: 'birthdays', enabled: true },
    ],
  };
}

// מערכת שעות של חניכ.ה
export interface ScheduleEntry {
  id: string;
  day: number; // 0=ראשון … 5=שישי
  time: string; // "10:30"
  course: string;
}

export interface ScheduleAttachment {
  type: 'image' | 'table';
  name: string; // שם הקובץ שהועלה
  dataUrl?: string; // לתמונה
  table?: string[][]; // לגיליון אקסל שפוענח
}

export interface Schedule {
  studentId: string;
  entries: ScheduleEntry[];
  attachment?: ScheduleAttachment;
}

export const DAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

// ===== הודעות רכזת ↔ חונכים =====

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  recipientIds: string[]; // תפוצה = כל החונכים; אישית = נמען אחד
}

export interface InboxItem {
  message: Message;
  readAt: string | null; // אישור קריאה
}

export interface SentMessageView {
  message: Message;
  receipts: { mentor: Mentor; readAt: string | null }[];
}

// ===== דשבורד רכזת — מטא-נתונים בלבד, ללא תוכן מפגשים =====

export interface MentorActivity {
  mentor: Mentor;
  studentCount: number;
  meetingsLast14: number;
  lastMeetingDate: string | null;
  staleStudents: number; // חניכים ללא מפגש 10+ ימים
}

// מוקד המפגש לפי עקרון האיזון being-doing מהחוברת
export type MeetingFocus = 'being' | 'doing' | 'combined';

export interface Meeting {
  id: string;
  studentId: string;
  mentorId: string;
  date: string; // ISO date
  durationMin: number;
  focus: MeetingFocus;
  topics: string; // נושאים מרכזיים שעלו בשיחה
  strengthsAndChallenges: string; // נקודות חוזק ואתגרים שעלו
  actions: string; // דרכי פעולה שגובשו
  insights: string; // תובנות או רעיונות בעקבות השיחה
  sharing: string; // שיתוף הורים או גורמים נוספים (במידת הצורך)
  customFields?: { label: string; value: string }[]; // שדות מהתבנית האישית של החונכ.ת
  createdAt: string;
}

export type GoalDomain = 'academic' | 'social' | 'personal' | 'emotional';
export type GoalStatus = 'active' | 'done' | 'paused';

export interface Goal {
  id: string;
  studentId: string;
  domain: GoalDomain;
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: string;
}

export type ContactParty = 'parent' | 'teacher' | 'counselor' | 'coordinator' | 'other';
export type ContactChannel = 'talk' | 'phone' | 'message' | 'email' | 'meeting';

export interface ContactLogEntry {
  id: string;
  studentId: string;
  date: string; // ISO date
  party: ContactParty;
  channel: ContactChannel;
  summary: string;
  followUp: string; // המשך טיפול, אם נדרש
}

export const GOAL_DOMAIN_LABELS: Record<GoalDomain, string> = {
  academic: 'לימודי',
  social: 'חברתי',
  personal: 'אישי',
  emotional: 'רגשי',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'בתהליך',
  done: 'הושגה',
  paused: 'בהמתנה',
};

export const FOCUS_LABELS: Record<MeetingFocus, string> = {
  being: 'הוויה (רגשי־חברתי)',
  doing: 'עשייה (מטרות ולימודים)',
  combined: 'משולב',
};

export const CONTACT_PARTY_LABELS: Record<ContactParty, string> = {
  parent: 'הורה',
  teacher: 'מורה מקצועי.ת',
  counselor: 'יועצת',
  coordinator: 'רכזת חונכות',
  other: 'אחר',
};

export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  talk: 'שיחה פנים אל פנים',
  phone: 'שיחת טלפון',
  message: 'הודעה (וואטסאפ/סמס)',
  email: 'מייל',
  meeting: 'פגישה',
};
