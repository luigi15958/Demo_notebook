import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type {
  ContactChannel,
  ContactLogEntry,
  ContactParty,
  Goal,
  GoalDomain,
  Meeting,
  Mentor,
  Student,
} from '../types';
import {
  CONTACT_CHANNEL_LABELS,
  CONTACT_PARTY_LABELS,
  FOCUS_LABELS,
  GOAL_DOMAIN_LABELS,
  GOAL_STATUS_LABELS,
} from '../types';
import Avatar from '../components/Avatar';
import ScheduleTab from '../components/ScheduleTab';

type Tab = 'overview' | 'meetings' | 'goals' | 'contacts' | 'schedule';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'סקירה',
  meetings: 'מפגשים',
  goals: 'מטרות',
  contacts: 'יומן קשר',
  schedule: 'מערכת שעות',
};

export default function StudentCard({ mentor }: { mentor: Mentor }) {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contacts, setContacts] = useState<ContactLogEntry[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id) return;
    const repo = await getRepo();
    const s = await repo.getStudent(id);
    setStudent(s);
    if (s) {
      const [m, g, c] = await Promise.all([
        repo.listMeetings(s.id),
        repo.listGoals(s.id),
        repo.listContacts(s.id),
      ]);
      setMeetings(m);
      setGoals(g);
      setContacts(c);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) return <p>טוען…</p>;
  if (!student) return <p>חניכ.ה לא נמצא.ה.</p>;

  return (
    <div>
      <div className="page-head">
        <div className="stu-head">
          <Avatar student={student} size={52} />
          <div>
            <h1>{student.name}</h1>
            <p className="muted">{student.group}</p>
          </div>
        </div>
        <Link to={`/students/${student.id}/meetings/new`} className="button primary">
          + תיעוד מפגש
        </Link>
      </div>

      <div className="tabs">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? 'tab active' : 'tab'}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview student={student} meetings={meetings} goals={goals} />}
      {tab === 'meetings' && <Meetings meetings={meetings} />}
      {tab === 'goals' && <Goals studentId={student.id} goals={goals} onChange={reload} />}
      {tab === 'contacts' && (
        <Contacts studentId={student.id} contacts={contacts} onChange={reload} />
      )}
      {tab === 'schedule' && <ScheduleTab studentId={student.id} />}
      {/* mentor מועבר בהמשך לצורכי שיתוף/הרשאות; כרגע הצפייה מוגבלת ממילא לחניכים של החונכת */}
      <span className="hidden">{mentor.id}</span>
    </div>
  );
}

function Overview({
  student,
  meetings,
  goals,
}: {
  student: Student;
  meetings: Meeting[];
  goals: Goal[];
}) {
  const last = meetings[0];
  const activeGoals = goals.filter((g) => g.status === 'active');
  return (
    <div className="cards">
      <section className="card">
        <h2>לקראת המפגש הבא</h2>
        {last ? (
          <>
            <p className="muted">
              מפגש אחרון: {formatDate(last.date)} · {FOCUS_LABELS[last.focus]}
            </p>
            {last.actions && (
              <p>
                <strong>דרכי פעולה שסוכמו:</strong> {last.actions}
              </p>
            )}
            {last.insights && (
              <p>
                <strong>תובנות:</strong> {last.insights}
              </p>
            )}
          </>
        ) : (
          <p className="muted">טרם תועד מפגש. מוזמנ.ת לתעד את המפגש הראשון.</p>
        )}
        {activeGoals.length > 0 && (
          <>
            <h3>מטרות פתוחות</h3>
            <ul>
              {activeGoals.map((g) => (
                <li key={g.id}>
                  <span className="tag">{GOAL_DOMAIN_LABELS[g.domain]}</span> {g.title}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2>חוזקות</h2>
        {student.strengths.length > 0 ? (
          <div className="tags">
            {student.strengths.map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">טרם הוזנו חוזקות.</p>
        )}
      </section>

      <section className="card">
        <h2>תיק היכרות</h2>
        <p className="prewrap">{student.intakeNotes || 'טרם הוזן מידע היכרות.'}</p>
        {student.birthDate && (
          <p className="muted">תאריך לידה: {formatDate(student.birthDate)}</p>
        )}
      </section>
    </div>
  );
}

function Meetings({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) return <p className="muted">אין עדיין מפגשים מתועדים.</p>;
  return (
    <div className="timeline">
      {meetings.map((m) => (
        <article key={m.id} className="card">
          <header className="row">
            <strong>{formatDate(m.date)}</strong>
            <span className="muted">
              {m.durationMin} דק׳ · {FOCUS_LABELS[m.focus]}
            </span>
          </header>
          <Field label="נושאים מרכזיים" value={m.topics} />
          <Field label="חוזקות ואתגרים" value={m.strengthsAndChallenges} />
          <Field label="דרכי פעולה" value={m.actions} />
          <Field label="תובנות" value={m.insights} />
          <Field label="שיתוף הורים/גורמים" value={m.sharing} />
        </article>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <p className="prewrap">
      <strong>{label}:</strong> {value}
    </p>
  );
}

function Goals({
  studentId,
  goals,
  onChange,
}: {
  studentId: string;
  goals: Goal[];
  onChange: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<GoalDomain>('personal');

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const repo = await getRepo();
    await repo.addGoal({ studentId, domain, title, description, status: 'active' });
    setTitle('');
    setDescription('');
    onChange();
  }

  async function setStatus(id: string, status: Goal['status']) {
    const repo = await getRepo();
    await repo.setGoalStatus(id, status);
    onChange();
  }

  return (
    <div>
      <form onSubmit={addGoal} className="card form">
        <h2>מטרה חדשה</h2>
        <div className="row wrap">
          <label>
            תחום
            <select value={domain} onChange={(e) => setDomain(e.target.value as GoalDomain)}>
              {(Object.keys(GOAL_DOMAIN_LABELS) as GoalDomain[]).map((d) => (
                <option key={d} value={d}>
                  {GOAL_DOMAIN_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="grow">
            כותרת
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
        </div>
        <label>
          תיאור (מה תיחשב הצלחה?)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <button type="submit" className="primary">
          הוספת מטרה
        </button>
      </form>

      {goals.length === 0 ? (
        <p className="muted">אין עדיין מטרות. מומלץ להגדירן יחד עם החניכ.ה בתחילת השנה.</p>
      ) : (
        goals.map((g) => (
          <article key={g.id} className="card">
            <header className="row">
              <span>
                <span className="tag">{GOAL_DOMAIN_LABELS[g.domain]}</span>{' '}
                <strong>{g.title}</strong>
              </span>
              <span className={`status status-${g.status}`}>{GOAL_STATUS_LABELS[g.status]}</span>
            </header>
            {g.description && <p className="prewrap">{g.description}</p>}
            <div className="row gap">
              {g.status !== 'done' && (
                <button className="link" onClick={() => setStatus(g.id, 'done')}>
                  סימון כהושגה
                </button>
              )}
              {g.status === 'active' ? (
                <button className="link" onClick={() => setStatus(g.id, 'paused')}>
                  השהיה
                </button>
              ) : (
                <button className="link" onClick={() => setStatus(g.id, 'active')}>
                  החזרה לתהליך
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function Contacts({
  studentId,
  contacts,
  onChange,
}: {
  studentId: string;
  contacts: ContactLogEntry[];
  onChange: () => void;
}) {
  const [party, setParty] = useState<ContactParty>('parent');
  const [channel, setChannel] = useState<ContactChannel>('phone');
  const [summary, setSummary] = useState('');
  const [followUp, setFollowUp] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const repo = await getRepo();
    await repo.addContact({
      studentId,
      date: new Date().toISOString().slice(0, 10),
      party,
      channel,
      summary,
      followUp,
    });
    setSummary('');
    setFollowUp('');
    onChange();
  }

  return (
    <div>
      <form onSubmit={add} className="card form">
        <h2>תיעוד קשר חדש</h2>
        <div className="row wrap">
          <label>
            עם מי
            <select value={party} onChange={(e) => setParty(e.target.value as ContactParty)}>
              {(Object.keys(CONTACT_PARTY_LABELS) as ContactParty[]).map((p) => (
                <option key={p} value={p}>
                  {CONTACT_PARTY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label>
            ערוץ
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ContactChannel)}
            >
              {(Object.keys(CONTACT_CHANNEL_LABELS) as ContactChannel[]).map((c) => (
                <option key={c} value={c}>
                  {CONTACT_CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          תקציר
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} required />
        </label>
        <label>
          המשך טיפול (אופציונלי)
          <input value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        </label>
        <button type="submit" className="primary">
          שמירה
        </button>
      </form>

      {contacts.length === 0 ? (
        <p className="muted">אין עדיין תיעוד קשר עם הורים או צוות.</p>
      ) : (
        contacts.map((c) => (
          <article key={c.id} className="card">
            <header className="row">
              <strong>
                {CONTACT_PARTY_LABELS[c.party]} · {CONTACT_CHANNEL_LABELS[c.channel]}
              </strong>
              <span className="muted">{formatDate(c.date)}</span>
            </header>
            <p className="prewrap">{c.summary}</p>
            {c.followUp && (
              <p className="warn">
                <strong>המשך טיפול:</strong> {c.followUp}
              </p>
            )}
          </article>
        ))
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
