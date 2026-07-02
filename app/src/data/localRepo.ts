import type {
  ContactLogEntry,
  Goal,
  GoalStatus,
  Meeting,
  Mentor,
  Student,
} from '../types';
import type { Repo } from './repo';
import { seedContacts, seedGoals, seedMeetings, seedMentors, seedStudents } from './seed';

// מצב דמו: כל הנתונים נשמרים ב-localStorage של הדפדפן, ללא שרת.

const KEY = 'mentoring-notebook-v1';
const SESSION_KEY = 'mentoring-notebook-session';

interface Db {
  mentors: Mentor[];
  students: Student[];
  meetings: Meeting[];
  goals: Goal[];
  contacts: ContactLogEntry[];
}

function load(): Db {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Db;
    } catch {
      // נתונים פגומים — מתחילים מנתוני הדוגמה
    }
  }
  const db: Db = {
    mentors: seedMentors,
    students: seedStudents,
    meetings: seedMeetings,
    goals: seedGoals,
    contacts: seedContacts,
  };
  save(db);
  return db;
}

function save(db: Db): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalRepo(): Repo {
  return {
    async listDemoMentors() {
      return load().mentors;
    },

    async signIn(idOrEmail: string) {
      const mentor = load().mentors.find((m) => m.id === idOrEmail);
      if (!mentor) throw new Error('משתמש לא נמצא');
      sessionStorage.setItem(SESSION_KEY, mentor.id);
      return mentor;
    },

    async signOut() {
      sessionStorage.removeItem(SESSION_KEY);
    },

    async currentMentor() {
      const id = sessionStorage.getItem(SESSION_KEY);
      if (!id) return null;
      return load().mentors.find((m) => m.id === id) ?? null;
    },

    async listStudents(mentorId: string) {
      return load()
        .students.filter((s) => s.mentorId === mentorId)
        .sort((a, b) => a.name.localeCompare(b.name, 'he'));
    },

    async getStudent(id: string) {
      return load().students.find((s) => s.id === id) ?? null;
    },

    async addStudent(s: Omit<Student, 'id'>) {
      const db = load();
      const student: Student = { ...s, id: newId('s') };
      db.students.push(student);
      save(db);
      return student;
    },

    async updateStudent(s: Student) {
      const db = load();
      const i = db.students.findIndex((x) => x.id === s.id);
      if (i >= 0) {
        db.students[i] = s;
        save(db);
      }
    },

    async listMeetings(studentId: string) {
      return load()
        .meetings.filter((m) => m.studentId === studentId)
        .sort((a, b) => b.date.localeCompare(a.date));
    },

    async addMeeting(m: Omit<Meeting, 'id' | 'createdAt'>) {
      const db = load();
      const meeting: Meeting = {
        ...m,
        id: newId('mt'),
        createdAt: new Date().toISOString(),
      };
      db.meetings.push(meeting);
      save(db);
      return meeting;
    },

    async listGoals(studentId: string) {
      return load()
        .goals.filter((g) => g.studentId === studentId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async addGoal(g: Omit<Goal, 'id' | 'createdAt'>) {
      const db = load();
      const goal: Goal = { ...g, id: newId('g'), createdAt: new Date().toISOString() };
      db.goals.push(goal);
      save(db);
      return goal;
    },

    async setGoalStatus(id: string, status: GoalStatus) {
      const db = load();
      const goal = db.goals.find((g) => g.id === id);
      if (goal) {
        goal.status = status;
        save(db);
      }
    },

    async listContacts(studentId: string) {
      return load()
        .contacts.filter((c) => c.studentId === studentId)
        .sort((a, b) => b.date.localeCompare(a.date));
    },

    async addContact(c: Omit<ContactLogEntry, 'id'>) {
      const db = load();
      const entry: ContactLogEntry = { ...c, id: newId('c') };
      db.contacts.push(entry);
      save(db);
      return entry;
    },
  };
}
