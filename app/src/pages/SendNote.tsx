import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { NoteColor } from '../types';

// מסך המורים: שליחת פתק ורוד/כתום לחונכ.ת האישי.ת של ילד.ה.
// נגיש ללא התחברות — נדרש רק קוד הצוות הבית-ספרי.

export default function SendNote() {
  const [code, setCode] = useState('');
  const [students, setStudents] = useState<{ id: string; name: string }[] | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [color, setColor] = useState<NoteColor>('pink');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function enter(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const repo = await getRepo();
      const list = await repo.listStudentsForNoteForm(code.trim());
      setStudents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const repo = await getRepo();
      await repo.sendNote(code.trim(), studentId, teacherName.trim(), color, body.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setSending(false);
    }
  }

  function another() {
    setSent(false);
    setStudentId('');
    setBody('');
    setColor('pink');
  }

  return (
    <div className="page center">
      <div className="card login-card">
        <h1>פתק לחונכ.ת 📝</h1>
        <p className="muted">בית הספר הדמוקרטי הוד השרון</p>

        {!students && (
          <>
            <p>
              כמו פעם — פתק ורוד למשהו טוב, פתק כתום למשהו ששווה תשומת לב. הפתק מגיע ישירות
              לחונכ.ת האישי.ת של הילד.ה.
            </p>
            <form onSubmit={enter} className="form">
              <label>
                קוד הצוות
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="primary">
                כניסה
              </button>
            </form>
          </>
        )}

        {students && !sent && (
          <form onSubmit={send} className="form note-form">
            <label>
              שמך (יופיע על הפתק)
              <input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="למשל: רותם (אמנות)"
                required
              />
            </label>
            <label>
              על מי הפתק?
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="" disabled>
                  בחירת חניכ.ה…
                </option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="note-colors">
              <button
                type="button"
                className={color === 'pink' ? 'note-pick pink selected' : 'note-pick pink'}
                onClick={() => setColor('pink')}
              >
                פתק ורוד
                <small>משהו טוב לשתף 💗</small>
              </button>
              <button
                type="button"
                className={color === 'orange' ? 'note-pick orange selected' : 'note-pick orange'}
                onClick={() => setColor('orange')}
              >
                פתק כתום
                <small>משהו ששווה תשומת לב</small>
              </button>
            </div>

            <label>
              מה קרה?
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} required />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary" disabled={sending}>
              {sending ? 'שולח…' : 'שליחת הפתק'}
            </button>
          </form>
        )}

        {sent && (
          <div>
            <p className="sent-ok">{color === 'pink' ? '💗' : '🧡'} הפתק נשלח לחונכ.ת!</p>
            <p className="muted">תודה ששיתפת — זה בדיוק מה שמחזיק את הילדים.</p>
            <button className="primary" onClick={another}>
              שליחת פתק נוסף
            </button>
          </div>
        )}

        <p className="muted" style={{ marginTop: '1rem' }}>
          <Link to="/login">כניסת חונכים ←</Link>
        </p>
      </div>
    </div>
  );
}
