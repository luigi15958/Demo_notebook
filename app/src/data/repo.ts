import type {
  AssignSettings,
  AssignmentRow,
  ContactLogEntry,
  Goal,
  GoalStatus,
  InboxItem,
  Meeting,
  Mentor,
  MentorActivity,
  MentorPrefs,
  Note,
  NoteColor,
  Schedule,
  SentMessageView,
  Student,
  WorkspaceDraft,
} from '../types';

// שכבת גישה לנתונים מוחלפת: מצב דמו (localStorage) או Supabase.
// כל ה-UI עובד מול הממשק הזה בלבד.
export interface Repo {
  // הזדהות
  listDemoMentors(): Promise<Mentor[]>; // במצב דמו בלבד
  signIn(idOrEmail: string, password?: string): Promise<Mentor>;
  signOut(): Promise<void>;
  currentMentor(): Promise<Mentor | null>;

  // חניכים
  listStudents(mentorId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | null>;
  addStudent(s: Omit<Student, 'id'>): Promise<Student>;
  updateStudent(s: Student): Promise<void>;

  // מפגשים
  listMeetings(studentId: string): Promise<Meeting[]>;
  addMeeting(m: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting>;

  // מטרות
  listGoals(studentId: string): Promise<Goal[]>;
  addGoal(g: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal>;
  setGoalStatus(id: string, status: GoalStatus): Promise<void>;

  // יומן קשר
  listContacts(studentId: string): Promise<ContactLogEntry[]>;
  addContact(c: Omit<ContactLogEntry, 'id'>): Promise<ContactLogEntry>;

  // העדפות אישיות של החונכ.ת
  getPrefs(mentorId: string): Promise<MentorPrefs>;
  savePrefs(prefs: MentorPrefs): Promise<void>;

  // מערכת שעות
  getSchedule(studentId: string): Promise<Schedule | null>;
  saveSchedule(schedule: Schedule): Promise<void>;

  // הודעות רכזת ↔ חונכים
  listMentors(): Promise<Mentor[]>; // חונכים אישיים בלבד (לרכזת)
  sendMessage(senderId: string, body: string, recipientIds: string[]): Promise<void>;
  listInbox(mentorId: string): Promise<InboxItem[]>;
  confirmRead(messageId: string, mentorId: string): Promise<void>;
  listSent(): Promise<SentMessageView[]>; // לרכזות — כולל אישורי קריאה

  // דשבורד רכזת — מטא-נתונים בלבד
  coordinatorOverview(): Promise<MentorActivity[]>;

  // מטרות — עדכון מלא (צעדים, סטטוס, תוכן)
  updateGoal(goal: Goal): Promise<void>;

  // מרחבי הכנה — תוצר לכל ילד.ה × אירוע
  getDraft(studentId: string, eventId: string): Promise<WorkspaceDraft | null>;
  saveDraft(draft: WorkspaceDraft): Promise<void>;

  // פתקים ורודים/כתומים — שליחה ציבורית (עם קוד צוות), קריאה לחונכ.ת בלבד
  listStudentsForNoteForm(code: string): Promise<{ id: string; name: string }[]>;
  sendNote(
    code: string,
    studentId: string,
    teacherName: string,
    color: NoteColor,
    body: string,
  ): Promise<void>;
  listNotesForMentor(mentorId: string): Promise<Note[]>;
  listNotesForStudent(studentId: string): Promise<Note[]>;
  markNotesRead(mentorId: string): Promise<void>;

  // שיבוץ חונכויות (שלב א' של מסמך האבטחה)
  getAssignSettings(): Promise<AssignSettings>;
  setAssignSettings(settings: AssignSettings): Promise<void>; // רכזת בלבד
  listUnassigned(division: string): Promise<AssignmentRow[]>; // מאגר לפי חטיבה
  claimStudent(studentId: string, mentorId: string): Promise<void>; // בחירה ע"י חונכ.ת
  listAssignmentBoard(): Promise<AssignmentRow[]>; // רכזת — מטא-נתונים בלבד
  coordinatorAssign(studentId: string, mentorId: string | null): Promise<void>;
  importStudents(
    rows: { name: string; division: string; grade: string; birthDate?: string }[],
  ): Promise<number>; // רכזת — ייבוא למאגר, מחזיר כמה נוספו
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

let repoPromise: Promise<Repo> | null = null;

export function getRepo(): Promise<Repo> {
  if (!repoPromise) {
    repoPromise = isSupabaseConfigured()
      ? import('./supabaseRepo').then((m) => m.createSupabaseRepo())
      : import('./localRepo').then((m) => m.createLocalRepo());
  }
  return repoPromise;
}
