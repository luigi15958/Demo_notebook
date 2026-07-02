import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { Mentor } from '../types';

export default function StudentForm({ mentor }: { mentor: Mentor }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');
  const [strengthsText, setStrengthsText] = useState('');

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
        <button type="submit" className="primary">
          שמירה
        </button>
      </form>
    </div>
  );
}
