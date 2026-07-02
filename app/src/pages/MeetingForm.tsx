import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { MeetingFocus, MeetingTemplate, Mentor, Student } from '../types';
import { BUILTIN_FIELDS, FOCUS_LABELS } from '../types';

// טופס תיעוד מפגש — לפי פורמט התיעוד שבחוברת (פרק ארגז הכלים),
// מותאם לתבנית האישית של החונכ.ת: שדות מובנים שהוסתרו לא מוצגים,
// ושדות אישיים שהוגדרו ב"עיצוב שלי" מתווספים.

export default function MeetingForm({ mentor }: { mentor: Mentor }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [template, setTemplate] = useState<MeetingTemplate | null>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [durationMin, setDurationMin] = useState(20);
  const [focus, setFocus] = useState<MeetingFocus>('combined');
  const [topics, setTopics] = useState('');
  const [builtins, setBuiltins] = useState<Record<string, string>>({
    strengthsAndChallenges: '',
    actions: '',
    insights: '',
    sharing: '',
  });
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const repo = await getRepo();
      const [s, prefs] = await Promise.all([repo.getStudent(id), repo.getPrefs(mentor.id)]);
      setStudent(s);
      setTemplate(prefs.template);
    })();
  }, [id, mentor.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !template) return;
    setSaving(true);
    const customFields = template.customFields
      .map((f) => ({ label: f.label, value: (custom[f.id] ?? '').trim() }))
      .filter((f) => f.value);
    const repo = await getRepo();
    await repo.addMeeting({
      studentId: student.id,
      mentorId: mentor.id,
      date,
      durationMin,
      focus,
      topics,
      strengthsAndChallenges: builtins.strengthsAndChallenges,
      actions: builtins.actions,
      insights: builtins.insights,
      sharing: builtins.sharing,
      customFields,
    });
    navigate(`/students/${student.id}`);
  }

  if (!student || !template) return <p>טוען…</p>;

  const visibleBuiltins = BUILTIN_FIELDS.filter(
    (f) => !template.hiddenFields.includes(f.id),
  );

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>תיעוד מפגש · {student.name}</h1>
        <Link to={`/students/${student.id}`} className="link">
          חזרה לכרטיס
        </Link>
      </div>
      <p className="muted">
        רק שדה הנושאים נדרש — השאר לפי הצורך. אפשר להתאים את השדות בעמוד{' '}
        <Link to="/settings">העיצוב שלי</Link>.
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

        {visibleBuiltins.map((f) => (
          <label key={f.id}>
            {f.label}
            <textarea
              value={builtins[f.id]}
              onChange={(e) => setBuiltins({ ...builtins, [f.id]: e.target.value })}
              rows={2}
            />
          </label>
        ))}

        {template.customFields.map((f) => (
          <label key={f.id}>
            {f.label}
            <textarea
              value={custom[f.id] ?? ''}
              onChange={(e) => setCustom({ ...custom, [f.id]: e.target.value })}
              rows={2}
            />
          </label>
        ))}

        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'שומר…' : 'שמירת המפגש'}
        </button>
      </form>
    </div>
  );
}
