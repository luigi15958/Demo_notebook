// מרחבי הכנה: אירוע × תיעוד × ספרייה × תוצר.
// כל מרחב מגדיר אילו חלקי תיעוד לאסוף, אילו סעיפי ספרייה להציג,
// ותבנית פתיחה לתוצר. המבנה הזה הוא גם ההקשר שישמש בעתיד
// טיוטה חכמה מבוססת AI (בסביבת Supabase בלבד).

export type GatherKey =
  | 'strengths'
  | 'goals'
  | 'meetings'
  | 'contacts'
  | 'notes'
  | 'intake';

export interface LibraryRef {
  chapterSlug: string; // מתוך content/library.ts
  headings: string[]; // סעיפים ספציfiיים להצגה
}

export interface WorkspaceDef {
  id: string;
  title: string;
  emoji: string;
  description: string;
  gather: GatherKey[];
  libraryRefs: LibraryRef[];
  template: string; // שלד פתיחה לתוצר
}

export const WORKSPACES: WorkspaceDef[] = [
  {
    id: 'triangle',
    title: 'פגישת תיאום ציפיות',
    emoji: '🤝',
    description: 'הכנה לפגישה המשולשת הורה–חונך–ילד בתחילת השנה',
    gather: ['intake', 'strengths', 'goals', 'contacts'],
    libraryRefs: [
      { chapterSlug: 'triangle', headings: ['מול ההורים', 'מול הילד.ה'] },
      { chapterSlug: 'year', headings: ['שלבי השנה'] },
    ],
    template:
      'נקודות מפתח לפגישה עם ההורים של ___:\n\n• מה חשוב לי להגיד על הילד.ה (חוזקות קודם!):\n\n• המטרות שנגבש יחד:\n\n• מה חשוב לי לשמוע מההורים:\n\n• תיאום ציפיות לשנה:\n',
  },
  {
    id: 'pedagogical',
    title: 'ישיבה פדגוגית',
    emoji: '🧑‍🏫',
    description: 'תמצית על הילד.ה להצגה בישיבת הצוות',
    gather: ['strengths', 'goals', 'meetings', 'notes'],
    libraryRefs: [
      { chapterSlug: 'boundaries', headings: ['החונכ.ת היא', 'החונכ.ת איננה'] },
      { chapterSlug: 'foundations', headings: ['תפקיד החונכ.ת'] },
    ],
    template:
      'נקודות לישיבה הפדגוגית על ___:\n\n• תמונת מצב בקצרה:\n\n• חוזקות שראינו השנה:\n\n• מה מעסיק אותנו:\n\n• מה אבקש מהצוות:\n',
  },
  {
    id: 'evaluation-prep',
    title: 'הכנה למפגש הערכה',
    emoji: '🌱',
    description: 'הכנה למפגש ההערכה הדיאלוגי עם הילד.ה (אמצע/סוף שנה)',
    gather: ['goals', 'meetings', 'strengths'],
    libraryRefs: [
      { chapterSlug: 'year', headings: ['אירועים מרכזיים'] },
      { chapterSlug: 'preparation', headings: ['האיזון Being–Doing', 'סט וסטינג'] },
    ],
    template:
      'הכנה למפגש הערכה עם ___:\n\n• הצלחות ונקודות צמיחה לשקף:\n\n• מטרות — איפה אנחנו ביחס אליהן:\n\n• שאלות פתוחות שאשאל:\n\n• על מה נסכים יחד להמשך:\n',
  },
  {
    id: 'evaluation-write',
    title: 'כתיבת הערכה אישית',
    emoji: '✍️',
    description: 'טיוטת ההערכה הכתובה על סמך כל השנה',
    gather: ['strengths', 'goals', 'meetings', 'notes', 'contacts'],
    libraryRefs: [
      { chapterSlug: 'year', headings: ['אירועים מרכזיים'] },
      { chapterSlug: 'toolbox', headings: ['עקרונות לפעילות'] },
    ],
    template:
      'הערכה אישית — ___:\n\nנקודות חוזק:\n\nצמיחה והתקדמות השנה:\n\nנקודות לחיזוק ודרכים לשינוי:\n\nמבט קדימה:\n',
  },
];

export function getWorkspace(id: string): WorkspaceDef | undefined {
  return WORKSPACES.find((w) => w.id === id);
}
