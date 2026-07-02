import type {
  ContactLogEntry,
  Goal,
  GoalStatus,
  Meeting,
  Mentor,
  MentorPrefs,
  Schedule,
  Student,
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
