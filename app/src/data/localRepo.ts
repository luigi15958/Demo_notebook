import type {
  ContactLogEntry,
  Goal,
  GoalStatus,
  Meeting,
  Mentor,
  MentorPrefs,
  Message,
  Schedule,
  Student,
} from '../types';
import { defaultPrefs } from '../types';
import type { Repo } from './repo';
import {
  seedContacts,
  seedGoals,
  seedMeetings,
  seedMentors,
  seedMessages,
  seedReceipts,
  seedSchedules,
  seedStudents,
} from './seed';

// מצב דמו: כל הנתונים נשמרים ב-localStorage של הדפדפן, ללא שרת.

// v2: נוספו הודעות, חונכת נוספת ודשבורד — מאתחל את נתוני הדוגמה
const KEY = 'mentoring-notebook-v2';
const SESSION_KEY = 'mentoring-notebook-session';

interface Receipt {
  messageId: string;
  mentorId: string;
  readAt: string | null;
}

interface Db {
  mentors: Mentor[];
  students: Student[];
  meetings: Meeting[];
  goals: Goal[];
  contacts: ContactLogEntry[];
  prefs: MentorPrefs[];
  schedules: Schedule[];
  messages: Message[];
  receipts: Receipt[];
}

function load(): Db {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const db = JSON.parse(raw) as Db;
      // שדרוג נתונים מגרסאות קודמות של הדמו
      db.prefs ??= [];
      db.schedules ??= seedSchedules;
      db.messages ??= seedMessages;
      db.receipts ??= seedReceipts;
      db.students = db.students.map((s) => ({
        ...s,
        color: s.color ?? '',
        emoji: s.emoji ?? '',
        coverQuote: s.coverQuote ?? '',
      }));
      return db;
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
    prefs: [],
    schedules: seedSchedules,
    messages: seedMessages,
    receipts: seedReceipts,
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

    async getPrefs(mentorId: string) {
      const found = load().prefs.find((p) => p.mentorId === mentorId);
      return { ...defaultPrefs(mentorId), ...found };
    },

    async savePrefs(prefs: MentorPrefs) {
      const db = load();
      const i = db.prefs.findIndex((p) => p.mentorId === prefs.mentorId);
      if (i >= 0) db.prefs[i] = prefs;
      else db.prefs.push(prefs);
      save(db);
    },

    async getSchedule(studentId: string) {
      return load().schedules.find((s) => s.studentId === studentId) ?? null;
    },

    async saveSchedule(schedule: Schedule) {
      const db = load();
      const i = db.schedules.findIndex((s) => s.studentId === schedule.studentId);
      if (i >= 0) db.schedules[i] = schedule;
      else db.schedules.push(schedule);
      save(db);
    },

    async listMentors() {
      return load().mentors.filter((m) => m.role === 'mentor');
    },

    async sendMessage(senderId: string, body: string, recipientIds: string[]) {
      const db = load();
      const sender = db.mentors.find((m) => m.id === senderId);
      const message: Message = {
        id: newId('msg'),
        senderId,
        senderName: sender?.name ?? '',
        body,
        createdAt: new Date().toISOString(),
        recipientIds,
      };
      db.messages.push(message);
      for (const rid of recipientIds) {
        db.receipts.push({ messageId: message.id, mentorId: rid, readAt: null });
      }
      save(db);
    },

    async listInbox(mentorId: string) {
      const db = load();
      return db.messages
        .filter((m) => m.recipientIds.includes(mentorId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((message) => ({
          message,
          readAt:
            db.receipts.find((r) => r.messageId === message.id && r.mentorId === mentorId)
              ?.readAt ?? null,
        }));
    },

    async confirmRead(messageId: string, mentorId: string) {
      const db = load();
      const r = db.receipts.find(
        (x) => x.messageId === messageId && x.mentorId === mentorId,
      );
      if (r && !r.readAt) {
        r.readAt = new Date().toISOString();
        save(db);
      }
    },

    async listSent() {
      const db = load();
      return db.messages
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((message) => ({
          message,
          receipts: message.recipientIds.map((rid) => ({
            mentor: db.mentors.find((m) => m.id === rid)!,
            readAt:
              db.receipts.find((r) => r.messageId === message.id && r.mentorId === rid)
                ?.readAt ?? null,
          })),
        }));
    },

    async coordinatorOverview() {
      const db = load();
      const now = Date.now();
      const days = (iso: string) => (now - new Date(iso).getTime()) / 86400000;
      return db.mentors
        .filter((m) => m.role === 'mentor')
        .map((mentor) => {
          const students = db.students.filter((s) => s.mentorId === mentor.id);
          const meetings = db.meetings.filter((m) => m.mentorId === mentor.id);
          const staleStudents = students.filter((s) => {
            const sm = db.meetings.filter((m) => m.studentId === s.id);
            return sm.length === 0 || Math.min(...sm.map((m) => days(m.date))) > 10;
          }).length;
          return {
            mentor,
            studentCount: students.length,
            meetingsLast14: meetings.filter((m) => days(m.date) <= 14).length,
            lastMeetingDate: meetings.length
              ? meetings.map((m) => m.date).sort()[meetings.length - 1]
              : null,
            staleStudents,
          };
        });
    },
  };
}
