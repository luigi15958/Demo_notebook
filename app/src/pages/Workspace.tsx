import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { ContactLogEntry, Goal, Meeting, Note, Student } from '../types';
import {
  CONTACT_PARTY_LABELS,
  GOAL_DOMAIN_LABELS,
  GOAL_STATUS_LABELS,
} from '../types';
import { getWorkspace } from '../content/workspaces';
import { getChapter } from '../content/library';

// מרחב הכנה: אירוע × מה שתיעדת × ידע מהספרייה × עורך תוצר.
// המבנה הזה יהיה גם ההקשר לטיוטה חכמה (AI) בסביבת Supabase.

export default function Workspace() {
  const { id, eventId } = useParams<{ id: string; eventId: string }>();
  const ws = eventId ? getWorkspace(eventId) : undefined;

  const [student, setStudent] = useState<Student | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contacts, setContacts] = useState<ContactLogEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!id || !ws) return;
    (async () => {
      const repo = await getRepo();
      const s = await repo.getStudent(id);
      setStudent(s);
      if (s) {
        const [m, g, c, n, draft] = await Promise.all([
          repo.listMeetings(s.id),
          repo.listGoals(s.id),
          repo.listContacts(s.id),
          repo.listNotesForStudent(s.id),
          repo.getDraft(s.id, ws.id),
        ]);
        setMeetings(m);
        setGoals(g);
        setContacts(c);
        setNotes(n);
        setContent(draft?.content ?? ws.template.replace(/___/g, s.name));
        loaded.current = true;
      }
      setLoading(false);
    })();
  }, [id, ws]);

  // שמירה אוטומטית עם השהיה קצרה
  function onEdit(value: string) {
    setContent(value);
    if (!student || !ws || !loaded.current) return;
    setSaveState('saving');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const repo = await getRepo();
      await repo.saveDraft({
        studentId: student.id,
        eventId: ws.id,
        content: value,
        updatedAt: new Date().toISOString(),
      });
      setSaveState('saved');
    }, 700);
  }

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // דפדפנים ישנים — מתעלמים בשקט
    }
  }

  if (!ws) return <p>מרחב הכנה לא נמצא.</p>;
  if (loading) return <p>טוען…</p>;
  if (!student) return <p>חניכ.ה לא נמצא.ה.</p>;

  return (
    <div className="narrow">
      <div className="page-head">
        <div>
          <p className="hero-date">
            {ws.emoji} {ws.title}
          </p>
          <h1>{student.name}</h1>
          <p className="muted">{ws.description}</p>
        </div>
        <Link to={`/students/${student.id}`} className="link">
          חזרה לכרטיס
        </Link>
      </div>

      <details className="ws-section" open>
        <summary>📓 מה תיעדת השנה</summary>
        <div className="ws-body">
          {ws.gather.includes('intake') && student.intakeNotes && (
            <div className="ws-block">
              <h3>תיק היכרות</h3>
              <p className="prewrap">{student.intakeNotes}</p>
            </div>
          )}
          {ws.gather.includes('strengths') && student.strengths.length > 0 && (
            <div className="ws-block">
              <h3>חוזקות</h3>
              <div className="tags">
                {student.strengths.map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {ws.gather.includes('goals') && goals.length > 0 && (
            <div className="ws-block">
              <h3>מטרות</h3>
              <ul>
                {goals.map((g) => {
                  const steps = g.steps ?? [];
                  const done = steps.filter((s) => s.done).length;
                  return (
                    <li key={g.id}>
                      <span className="tag">{GOAL_DOMAIN_LABELS[g.domain]}</span> {g.title} —{' '}
                      {GOAL_STATUS_LABELS[g.status]}
                      {steps.length > 0 && ` (${done}/${steps.length} צעדים)`}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {ws.gather.includes('meetings') && meetings.length > 0 && (
            <div className="ws-block">
              <h3>מהמפגשים האחרונים</h3>
              {meetings.slice(0, 4).map((m) => (
                <p key={m.id} className="ws-meeting">
                  <strong>{new Date(m.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}:</strong>{' '}
                  {m.topics}
                  {m.insights && <em> · תובנה: {m.insights}</em>}
                </p>
              ))}
            </div>
          )}
          {ws.gather.includes('notes') && notes.length > 0 && (
            <div className="ws-block">
              <h3>פתקים מהצוות</h3>
              {notes.slice(0, 4).map((n) => (
                <p key={n.id} className={`ws-note ws-note-${n.color}`}>
                  <strong>{n.teacherName}:</strong> {n.body}
                </p>
              ))}
            </div>
          )}
          {ws.gather.includes('contacts') && contacts.length > 0 && (
            <div className="ws-block">
              <h3>יומן קשר</h3>
              {contacts.slice(0, 3).map((c) => (
                <p key={c.id}>
                  <strong>{CONTACT_PARTY_LABELS[c.party]}:</strong> {c.summary}
                </p>
              ))}
            </div>
          )}
        </div>
      </details>

      <details className="ws-section">
        <summary>📚 מהספרייה — להיזכר לפני</summary>
        <div className="ws-body">
          {ws.libraryRefs.map((ref) => {
            const chapter = getChapter(ref.chapterSlug);
            if (!chapter) return null;
            const sections = chapter.sections.filter((s) => ref.headings.includes(s.heading));
            return (
              <div key={ref.chapterSlug} className="ws-block">
                <h3>
                  <Link to={`/library/${chapter.slug}`}>{chapter.title}</Link>
                </h3>
                {sections.map((s) => (
                  <div key={s.heading}>
                    <strong>{s.heading}</strong>
                    {s.body && <p>{s.body}</p>}
                    {s.bullets && (
                      <ul>
                        {s.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </details>

      <section className="card ws-output">
        <header className="row">
          <h2>✍️ התוצר שלי</h2>
          <span className="muted">
            {saveState === 'saving' ? 'שומר…' : saveState === 'saved' ? 'נשמר ✓' : ''}
          </span>
        </header>
        <textarea
          className="ws-editor"
          value={content}
          onChange={(e) => onEdit(e.target.value)}
          rows={12}
        />
        <button className="primary" onClick={copyContent}>
          {copied ? 'הועתק ✓' : 'העתקת התוצר'}
        </button>
      </section>

      <p className="muted privacy-note">
        בהמשך, בסביבת בית הספר המחוברת, יתווסף כאן כפתור "✨ טיוטה חכמה" שמנסח התחלה על סמך
        התיעוד והספרייה — והחונכ.ת תמיד עורכת ומאשרת.
      </p>
    </div>
  );
}
