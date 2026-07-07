import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
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
import { defaultPrefs } from '../types';
import type { Repo } from './repo';

// מתאם Supabase: הרשאות נאכפות ב-Row-Level Security בצד השרת
// (ראו supabase/migrations). הלקוח רק קורא וכותב.

type StudentRow = {
  id: string;
  mentor_id: string;
  name: string;
  group_name: string;
  birth_date: string | null;
  intake_notes: string;
  strengths: string[];
  color: string;
  emoji: string;
  cover_quote: string;
};

function studentFromRow(r: StudentRow): Student {
  return {
    id: r.id,
    mentorId: r.mentor_id,
    name: r.name,
    group: r.group_name,
    birthDate: r.birth_date ?? undefined,
    intakeNotes: r.intake_notes,
    strengths: r.strengths ?? [],
    color: r.color ?? '',
    emoji: r.emoji ?? '',
    coverQuote: r.cover_quote ?? '',
  };
}

type MeetingRow = {
  id: string;
  student_id: string;
  mentor_id: string;
  date: string;
  duration_min: number;
  focus: Meeting['focus'];
  topics: string;
  strengths_and_challenges: string;
  actions: string;
  insights: string;
  sharing: string;
  custom_fields: { label: string; value: string }[] | null;
  created_at: string;
};

function meetingFromRow(r: MeetingRow): Meeting {
  return {
    id: r.id,
    studentId: r.student_id,
    mentorId: r.mentor_id,
    date: r.date,
    durationMin: r.duration_min,
    focus: r.focus,
    topics: r.topics,
    strengthsAndChallenges: r.strengths_and_challenges,
    actions: r.actions,
    insights: r.insights,
    sharing: r.sharing,
    customFields: r.custom_fields ?? [],
    createdAt: r.created_at,
  };
}

type GoalRow = {
  id: string;
  student_id: string;
  domain: Goal['domain'];
  title: string;
  description: string;
  status: GoalStatus;
  steps: Goal['steps'] | null;
  created_at: string;
};

type ContactRow = {
  id: string;
  student_id: string;
  date: string;
  party: ContactLogEntry['party'];
  channel: ContactLogEntry['channel'];
  summary: string;
  follow_up: string;
};

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export function createSupabaseRepo(): Repo {
  const client: SupabaseClient = createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  );

  async function mentorFromProfile(userId: string): Promise<Mentor | null> {
    const { data, error } = await client
      .from('profiles')
      .select('id, name, role')
      .eq('id', userId)
      .maybeSingle();
    throwIf(error);
    return data ? { id: data.id, name: data.name, role: data.role } : null;
  }

  return {
    async listDemoMentors() {
      return []; // אין מצב דמו כשמחוברים ל-Supabase
    },

    async signIn(email: string, password?: string) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: password ?? '',
      });
      throwIf(error);
      if (!data.user) throw new Error('ההתחברות נכשלה');
      const mentor = await mentorFromProfile(data.user.id);
      if (!mentor) throw new Error('לא נמצא פרופיל חונכ.ת למשתמש זה');
      return mentor;
    },

    async signOut() {
      await client.auth.signOut();
    },

    async currentMentor() {
      const { data } = await client.auth.getUser();
      if (!data.user) return null;
      return mentorFromProfile(data.user.id);
    },

    async listStudents(mentorId: string) {
      const { data, error } = await client
        .from('students')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('name');
      throwIf(error);
      return (data as StudentRow[]).map(studentFromRow);
    },

    async getStudent(id: string) {
      const { data, error } = await client
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      throwIf(error);
      return data ? studentFromRow(data as StudentRow) : null;
    },

    async addStudent(s: Omit<Student, 'id'>) {
      const { data, error } = await client
        .from('students')
        .insert({
          mentor_id: s.mentorId,
          name: s.name,
          group_name: s.group,
          birth_date: s.birthDate ?? null,
          intake_notes: s.intakeNotes,
          strengths: s.strengths,
          color: s.color,
          emoji: s.emoji,
          cover_quote: s.coverQuote,
        })
        .select()
        .single();
      throwIf(error);
      return studentFromRow(data as StudentRow);
    },

    async updateStudent(s: Student) {
      const { error } = await client
        .from('students')
        .update({
          name: s.name,
          group_name: s.group,
          birth_date: s.birthDate ?? null,
          intake_notes: s.intakeNotes,
          strengths: s.strengths,
          color: s.color,
          emoji: s.emoji,
          cover_quote: s.coverQuote,
        })
        .eq('id', s.id);
      throwIf(error);
    },

    async listMeetings(studentId: string) {
      const { data, error } = await client
        .from('meetings')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      throwIf(error);
      return (data as MeetingRow[]).map(meetingFromRow);
    },

    async addMeeting(m: Omit<Meeting, 'id' | 'createdAt'>) {
      const { data, error } = await client
        .from('meetings')
        .insert({
          student_id: m.studentId,
          mentor_id: m.mentorId,
          date: m.date,
          duration_min: m.durationMin,
          focus: m.focus,
          topics: m.topics,
          strengths_and_challenges: m.strengthsAndChallenges,
          actions: m.actions,
          insights: m.insights,
          sharing: m.sharing,
          custom_fields: m.customFields ?? [],
        })
        .select()
        .single();
      throwIf(error);
      return meetingFromRow(data as MeetingRow);
    },

    async listGoals(studentId: string) {
      const { data, error } = await client
        .from('goals')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      throwIf(error);
      return (data as GoalRow[]).map((r) => ({
        id: r.id,
        studentId: r.student_id,
        domain: r.domain,
        title: r.title,
        description: r.description,
        status: r.status,
        steps: r.steps ?? [],
        createdAt: r.created_at,
      }));
    },

    async addGoal(g: Omit<Goal, 'id' | 'createdAt'>) {
      const { data, error } = await client
        .from('goals')
        .insert({
          student_id: g.studentId,
          domain: g.domain,
          title: g.title,
          description: g.description,
          status: g.status,
          steps: g.steps ?? [],
        })
        .select()
        .single();
      throwIf(error);
      const r = data as GoalRow;
      return {
        id: r.id,
        studentId: r.student_id,
        domain: r.domain,
        title: r.title,
        description: r.description,
        status: r.status,
        steps: r.steps ?? [],
        createdAt: r.created_at,
      };
    },

    async setGoalStatus(id: string, status: GoalStatus) {
      const { error } = await client.from('goals').update({ status }).eq('id', id);
      throwIf(error);
    },

    async listContacts(studentId: string) {
      const { data, error } = await client
        .from('contact_log')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      throwIf(error);
      return (data as ContactRow[]).map((r) => ({
        id: r.id,
        studentId: r.student_id,
        date: r.date,
        party: r.party,
        channel: r.channel,
        summary: r.summary,
        followUp: r.follow_up,
      }));
    },

    async addContact(c: Omit<ContactLogEntry, 'id'>) {
      const { data, error } = await client
        .from('contact_log')
        .insert({
          student_id: c.studentId,
          date: c.date,
          party: c.party,
          channel: c.channel,
          summary: c.summary,
          follow_up: c.followUp,
        })
        .select()
        .single();
      throwIf(error);
      const r = data as ContactRow;
      return {
        id: r.id,
        studentId: r.student_id,
        date: r.date,
        party: r.party,
        channel: r.channel,
        summary: r.summary,
        followUp: r.follow_up,
      };
    },

    async getPrefs(mentorId: string) {
      const { data, error } = await client
        .from('profiles')
        .select('prefs')
        .eq('id', mentorId)
        .maybeSingle();
      throwIf(error);
      const p = (data?.prefs ?? {}) as Partial<MentorPrefs>;
      return { ...defaultPrefs(mentorId), ...p, mentorId };
    },

    async savePrefs(prefs: MentorPrefs) {
      const { mentorId, ...rest } = prefs;
      const { error } = await client
        .from('profiles')
        .update({ prefs: rest })
        .eq('id', mentorId);
      throwIf(error);
    },

    async getSchedule(studentId: string) {
      const { data, error } = await client
        .from('schedules')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
      throwIf(error);
      if (!data) return null;
      return {
        studentId: data.student_id,
        entries: data.entries ?? [],
        attachment: data.attachment ?? undefined,
      } as Schedule;
    },

    async saveSchedule(schedule: Schedule) {
      const { error } = await client.from('schedules').upsert({
        student_id: schedule.studentId,
        entries: schedule.entries,
        attachment: schedule.attachment ?? null,
        updated_at: new Date().toISOString(),
      });
      throwIf(error);
    },

    async listMentors() {
      const { data, error } = await client
        .from('profiles')
        .select('id, name, role')
        .eq('role', 'mentor')
        .order('name');
      throwIf(error);
      return (data ?? []) as Mentor[];
    },

    async sendMessage(senderId: string, body: string, recipientIds: string[]) {
      const { data, error } = await client
        .from('messages')
        .insert({ sender_id: senderId, body })
        .select()
        .single();
      throwIf(error);
      const { error: rErr } = await client
        .from('message_recipients')
        .insert(recipientIds.map((rid) => ({ message_id: data.id, recipient_id: rid })));
      throwIf(rErr);
    },

    async listInbox(mentorId: string) {
      const { data, error } = await client
        .from('message_recipients')
        .select('read_at, messages(id, sender_id, body, created_at, profiles(name))')
        .eq('recipient_id', mentorId)
        .order('created_at', { ascending: false, referencedTable: 'messages' });
      throwIf(error);
      type Row = {
        read_at: string | null;
        messages: {
          id: string;
          sender_id: string;
          body: string;
          created_at: string;
          profiles: { name: string } | null;
        } | null;
      };
      return ((data ?? []) as unknown as Row[])
        .filter((r) => r.messages)
        .map((r) => ({
          message: {
            id: r.messages!.id,
            senderId: r.messages!.sender_id,
            senderName: r.messages!.profiles?.name ?? '',
            body: r.messages!.body,
            createdAt: r.messages!.created_at,
            recipientIds: [mentorId],
          },
          readAt: r.read_at,
        })) as InboxItem[];
    },

    async confirmRead(messageId: string, mentorId: string) {
      const { error } = await client
        .from('message_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('message_id', messageId)
        .eq('recipient_id', mentorId)
        .is('read_at', null);
      throwIf(error);
    },

    async listSent() {
      const { data, error } = await client
        .from('messages')
        .select(
          'id, sender_id, body, created_at, profiles(name), message_recipients(read_at, profiles(id, name, role))',
        )
        .order('created_at', { ascending: false });
      throwIf(error);
      type Row = {
        id: string;
        sender_id: string;
        body: string;
        created_at: string;
        profiles: { name: string } | null;
        message_recipients: {
          read_at: string | null;
          profiles: { id: string; name: string; role: Mentor['role'] } | null;
        }[];
      };
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        message: {
          id: r.id,
          senderId: r.sender_id,
          senderName: r.profiles?.name ?? '',
          body: r.body,
          createdAt: r.created_at,
          recipientIds: r.message_recipients
            .map((x) => x.profiles?.id ?? '')
            .filter(Boolean),
        },
        receipts: r.message_recipients
          .filter((x) => x.profiles)
          .map((x) => ({ mentor: x.profiles as Mentor, readAt: x.read_at })),
      })) as SentMessageView[];
    },

    async coordinatorOverview() {
      const { data, error } = await client.rpc('coordinator_overview');
      throwIf(error);
      type Row = {
        mentor_id: string;
        mentor_name: string;
        student_count: number;
        meetings_last_14: number;
        last_meeting_date: string | null;
        stale_students: number;
      };
      return ((data ?? []) as Row[]).map((r) => ({
        mentor: { id: r.mentor_id, name: r.mentor_name, role: 'mentor' as const },
        studentCount: Number(r.student_count),
        meetingsLast14: Number(r.meetings_last_14),
        lastMeetingDate: r.last_meeting_date,
        staleStudents: Number(r.stale_students),
      })) as MentorActivity[];
    },
    async updateGoal(goal: Goal) {
      const { error } = await client
        .from('goals')
        .update({
          title: goal.title,
          description: goal.description,
          domain: goal.domain,
          status: goal.status,
          steps: goal.steps ?? [],
        })
        .eq('id', goal.id);
      throwIf(error);
    },

    async getDraft(studentId: string, eventId: string) {
      const { data, error } = await client
        .from('workspace_drafts')
        .select('*')
        .eq('student_id', studentId)
        .eq('event_id', eventId)
        .maybeSingle();
      throwIf(error);
      if (!data) return null;
      return {
        studentId: data.student_id,
        eventId: data.event_id,
        content: data.content,
        updatedAt: data.updated_at,
      } as WorkspaceDraft;
    },

    async saveDraft(draft: WorkspaceDraft) {
      const { error } = await client.from('workspace_drafts').upsert({
        student_id: draft.studentId,
        event_id: draft.eventId,
        content: draft.content,
        updated_at: new Date().toISOString(),
      });
      throwIf(error);
    },

    async listStudentsForNoteForm(code: string) {
      const { data, error } = await client.rpc('list_students_for_notes', {
        access_code: code,
      });
      throwIf(error);
      return (data ?? []) as { id: string; name: string }[];
    },

    async sendNote(
      code: string,
      studentId: string,
      teacherName: string,
      color: NoteColor,
      body: string,
    ) {
      const { error } = await client.rpc('submit_note', {
        access_code: code,
        p_student_id: studentId,
        p_teacher_name: teacherName,
        p_color: color,
        p_body: body,
      });
      throwIf(error);
    },

    async listNotesForMentor(mentorId: string) {
      const { data, error } = await client
        .from('notes')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });
      throwIf(error);
      return ((data ?? []) as NoteRow[]).map(noteFromRow);
    },

    async listNotesForStudent(studentId: string) {
      const { data, error } = await client
        .from('notes')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      throwIf(error);
      return ((data ?? []) as NoteRow[]).map(noteFromRow);
    },

    async markNotesRead(mentorId: string) {
      const { error } = await client
        .from('notes')
        .update({ read_at: new Date().toISOString() })
        .eq('mentor_id', mentorId)
        .is('read_at', null);
      throwIf(error);
    },
  };
}

type NoteRow = {
  id: string;
  student_id: string;
  mentor_id: string;
  teacher_name: string;
  color: NoteColor;
  body: string;
  created_at: string;
  read_at: string | null;
};

function noteFromRow(r: NoteRow): Note {
  return {
    id: r.id,
    studentId: r.student_id,
    mentorId: r.mentor_id,
    teacherName: r.teacher_name,
    color: r.color,
    body: r.body,
    createdAt: r.created_at,
    readAt: r.read_at,
  };
}
