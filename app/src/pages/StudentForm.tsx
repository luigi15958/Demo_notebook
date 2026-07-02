import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { Mentor } from '../types';
import { STUDENT_COLORS, STUDENT_EMOJIS } from '../theme';

export default function StudentForm({ mentor }: { mentor: Mentor }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');
  const [strengthsText, setStrengthsText] = useState('');
  const [color, setColor] = useState(STUDENT_COLORS[0]);
  const [emoji, setEmoji] = useState('');
  const [coverQuote, setCoverQuote] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const repo = await getRepo();
    const student = await repo.addStudent({
      mentorId: mentor.id,
      name,
      group,
      birthDate: birthDate || undefined,
      intakeNotes,
      strengths: strengthsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      color,
      emoji,
      coverQuote: coverQuote.trim(),
    });
    navigate(`/students/${student.id}`);
  }

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>הוספת חניכ.ה</h1>
        <Link to="/" className="link">
          חזרה
        </Link>
      </div>
      <form onSubmit={save} className="card form">
        <label>
          שם מלא
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <div className="row wrap">
          <label className="grow">
            חטיבה / קבוצה
            <input value={group} onChange={(e) => setGroup(e.target.value)} required />
          </label>
          <label>
            תאריך לידה
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </label>
        </div>
        <label>
          תיק היכרות — מידע מיועצת, חונך.ת קודם.ת, הורים, תיק אישי
          <textarea
            value={intakeNotes}
            onChange={(e) => setIntakeNotes(e.target.value)}
            rows={4}
          />
        </label>
        <label>
          חוזקות (מופרדות בפסיק)
          <input
            value={strengthsText}
            onChange={(e) => setStrengthsText(e.target.value)}
            placeholder="למשל: יצירתיות, הומור, סקרנות"
          />
        </label>

        <label>צבע אישי</label>
        <div className="swatches">
          {STUDENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={color === c ? 'swatch selected' : 'swatch'}
              style={{ background: c }}
              onClick={() => setColor(c)}
            >
              {color === c ? '✓' : ''}
            </button>
          ))}
        </div>

        <label>אימוג'י אישי — כדאי לבחור יחד עם הילד.ה</label>
        <div className="swatches">
          <button
            type="button"
            className={emoji === '' ? 'emoji-pick selected' : 'emoji-pick'}
            onClick={() => setEmoji('')}
            title="בלי אימוג'י"
          >
            —
          </button>
          {STUDENT_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={emoji === e ? 'emoji-pick selected' : 'emoji-pick'}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <label>
          המשפט של הילד.ה — "כריכה" אישית לכרטיס (אפשר גם לבחור יחד במפגש הראשון)
          <input
            value={coverQuote}
            onChange={(e) => setCoverQuote(e.target.value)}
            placeholder='למשל: "העיקר שיהיה מעניין"'
          />
        </label>

        <button type="submit" className="primary">
          שמירה
        </button>
      </form>
    </div>
  );
}
