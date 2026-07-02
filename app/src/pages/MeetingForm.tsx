import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { MeetingFocus, Mentor, Student } from '../types';
import { FOCUS_LABELS } from '../types';

// טופס תיעוד מפגש — לפי פורמט התיעוד שבחוברת (פרק ארגז הכלים):
// תאריך ומשך, נושאים, חוזקות ואתגרים, דרכי פעולה, תובנות, שיתוף.

export default function MeetingForm({ mentor }: { mentor: Mentor }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [durationMin, setDurationMin] = useState(20);
  const [focus, setFocus] = useState<MeetingFocus>('combined');
  const [topics, setTopics] = useState('');
  const [strengthsAndChallenges, setStrengthsAndChallenges] = useState('');
  const [actions, setActions] = useState('');
  const [insights, setInsights] = useState('');
  const [sharing, setSharing] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      getRepo().then((repo) => repo.getStudent(id).then(setStudent));
    }
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setSaving(true);
    const repo = await getRepo();
    await repo.addMeeting({
      studentId: student.id,
      mentorId: mentor.id,
      date,
      durationMin,
      focus,
      topics,
      strengthsAndChallenges,
      actions,
      insights,
      sharing,
    });
    navigate(`/students/${student.id}`);
  }

  if (!student) return <p>טוען…</p>;

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>תיעוד מפגש · {student.name}</h1>
        <Link to={`/students/${student.id}`} className="link">
          חזרה לכרטיס
        </Link>
      </div>
      <p className="muted">
        רק שדה הנושאים נדרש — השאר לפי הצורך. התיעוד נועד לשרת את הקשר, לא להכביד עליו.
      </p>

      <form onSubmit={save} className="card form">
        <div className="row wrap">
          <label>
            תאריך
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            משך (דקות)
            <input
              type="number"
              min={5}
              max={120}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </label>
          <label>
            מוקד המפגש
            <select value={focus} onChange={(e) => setFocus(e.target.value as MeetingFocus)}>
              {(Object.keys(FOCUS_LABELS) as MeetingFocus[]).map((f) => (
                <option key={f} value={f}>
                  {FOCUS_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          נושאים מרכזיים שעלו בשיחה
          <textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={3} required />
        </label>
        <label>
          נקודות חוזק ואתגרים שעלו
          <textarea
            value={strengthsAndChallenges}
            onChange={(e) => setStrengthsAndChallenges(e.target.value)}
            rows={2}
          />
        </label>
        <label>
          דרכי פעולה שגובשו
          <textarea value={actions} onChange={(e) => setActions(e.target.value)} rows={2} />
        </label>
        <label>
          תובנות או רעיונות בעקבות השיחה
          <textarea value={insights} onChange={(e) => setInsights(e.target.value)} rows={2} />
        </label>
        <label>
          שיתוף הורים או גורמים נוספים (במידת הצורך)
          <textarea value={sharing} onChange={(e) => setSharing(e.target.value)} rows={2} />
        </label>

        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'שומר…' : 'שמירת המפגש'}
        </button>
      </form>
    </div>
  );
}
