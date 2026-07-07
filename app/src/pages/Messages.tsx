import { useCallback, useEffect, useState } from 'react';
import { getRepo } from '../data/repo';
import type { InboxItem, Mentor, Note, SentMessageView } from '../types';

export default function Messages({
  mentor,
  onInboxChange,
}: {
  mentor: Mentor;
  onInboxChange: () => void;
}) {
  return mentor.role === 'coordinator' ? (
    <CoordinatorMessages mentor={mentor} />
  ) : (
    <MentorInbox mentor={mentor} onInboxChange={onInboxChange} />
  );
}

/* ===== צד החונכ.ת: תיבת הודעות עם אישור קריאה ===== */

function MentorInbox({
  mentor,
  onInboxChange,
}: {
  mentor: Mentor;
  onInboxChange: () => void;
}) {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [freshNoteIds, setFreshNoteIds] = useState<string[]>([]);

  const reload = useCallback(async () => {
    const repo = await getRepo();
    const [inbox, mentorNotes] = await Promise.all([
      repo.listInbox(mentor.id),
      repo.listNotesForMentor(mentor.id),
    ]);
    setItems(inbox);
    setNotes(mentorNotes);
    // פתקים חדשים מסומנים "חדש" עד היציאה מהעמוד, ונרשמים כנקראו
    const fresh = mentorNotes.filter((n) => !n.readAt).map((n) => n.id);
    if (fresh.length > 0) {
      setFreshNoteIds(fresh);
      await repo.markNotesRead(mentor.id);
      onInboxChange();
    }
  }, [mentor.id, onInboxChange]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm(messageId: string) {
    const repo = await getRepo();
    await repo.confirmRead(messageId, mentor.id);
    await reload();
    onInboxChange();
  }

  if (!items) return <p>טוען…</p>;

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>הודעות מהרכזת</h1>
      </div>
      {items.length === 0 && <p className="muted">אין הודעות עדיין.</p>}
      {items.map(({ message, readAt }) => (
        <article key={message.id} className={readAt ? 'card msg' : 'card msg unread'}>
          <header className="row">
            <strong>{message.senderName}</strong>
            <span className="muted">{formatDateTime(message.createdAt)}</span>
          </header>
          <p className="prewrap">{message.body}</p>
          {readAt ? (
            <p className="read-ok">✓ אושרה קריאה · {formatDateTime(readAt)}</p>
          ) : (
            <button className="primary" onClick={() => confirm(message.id)}>
              מאשר.ת קריאה ✓
            </button>
          )}
        </article>
      ))}

      <h2 className="section-title">פתקים מהצוות 📌</h2>
      {notes.length === 0 && (
        <p className="muted">אין עדיין פתקים. מורי הצוות שולחים דרך "פתק לחונכ.ת" במסך הכניסה.</p>
      )}
      <div className="notes-board">
        {notes.map((n) => (
          <StickyNote key={n.id} note={n} fresh={freshNoteIds.includes(n.id)} />
        ))}
      </div>
    </div>
  );
}

function StickyNote({ note, fresh }: { note: Note; fresh: boolean }) {
  return (
    <article className={`sticky-note ${note.color}`}>
      {fresh && <span className="note-new">חדש</span>}
      <p className="note-body">{note.body}</p>
      <footer>
        <span>{note.teacherName}</span>
        <span className="muted">{formatDateTime(note.createdAt)}</span>
      </footer>
    </article>
  );
}

/* ===== צד הרכזת: שליחה (תפוצה/אישית) + אישורי קריאה ===== */

function CoordinatorMessages({ mentor }: { mentor: Mentor }) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sent, setSent] = useState<SentMessageView[] | null>(null);
  const [body, setBody] = useState('');
  const [toAll, setToAll] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    const repo = await getRepo();
    const [ms, sm] = await Promise.all([repo.listMentors(), repo.listSent()]);
    setMentors(ms);
    setSent(sm);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const recipients = toAll ? mentors.map((m) => m.id) : selected;
    if (recipients.length === 0) return;
    setSending(true);
    const repo = await getRepo();
    await repo.sendMessage(mentor.id, body.trim(), recipients);
    setBody('');
    setSelected([]);
    setToAll(true);
    setSending(false);
    await reload();
  }

  if (!sent) return <p>טוען…</p>;

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>הודעות לחונכים</h1>
      </div>

      <form onSubmit={send} className="card form">
        <h2>הודעה חדשה</h2>
        <label>
          תוכן ההודעה
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} required />
        </label>
        <label className="check-row">
          <input type="checkbox" checked={toAll} onChange={() => setToAll(!toAll)} />
          תפוצה — לכל החונכים האישיים ({mentors.length})
        </label>
        {!toAll && (
          <div className="recipients">
            {mentors.map((m) => (
              <label key={m.id} className="check-row">
                <input
                  type="checkbox"
                  checked={selected.includes(m.id)}
                  onChange={() => toggle(m.id)}
                />
                {m.name}
              </label>
            ))}
          </div>
        )}
        <button
          type="submit"
          className="primary"
          disabled={sending || (!toAll && selected.length === 0)}
        >
          {sending ? 'שולחת…' : 'שליחה'}
        </button>
      </form>

      <h2 className="section-title">הודעות שנשלחו</h2>
      {sent.length === 0 && <p className="muted">טרם נשלחו הודעות.</p>}
      {sent.map(({ message, receipts }) => {
        const readCount = receipts.filter((r) => r.readAt).length;
        return (
          <article key={message.id} className="card msg">
            <header className="row">
              <strong>{message.senderName}</strong>
              <span className="muted">{formatDateTime(message.createdAt)}</span>
            </header>
            <p className="prewrap">{message.body}</p>
            <p className={readCount === receipts.length ? 'read-ok' : 'muted'}>
              אישורי קריאה: {readCount}/{receipts.length}
            </p>
            <ul className="receipts">
              {receipts.map((r) => (
                <li key={r.mentor.id}>
                  <span>{r.mentor.name}</span>
                  {r.readAt ? (
                    <span className="read-ok">✓ {formatDateTime(r.readAt)}</span>
                  ) : (
                    <span className="warn">טרם אושרה</span>
                  )}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
