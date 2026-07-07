import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { AssignSettings, AssignmentRow, Mentor } from '../types';

// "בחירת חניכים": החונכ.ת רואה את מאגר השיבוץ של החטיבה שלה בלבד,
// ובוחרת את ילדי החונכות שלה. נעילה ותקרה נאכפות בשכבת הנתונים.

export default function PickStudents({ mentor }: { mentor: Mentor }) {
  const [pool, setPool] = useState<AssignmentRow[] | null>(null);
  const [settings, setSettings] = useState<AssignSettings>({ locked: false, cap: 15 });
  const [myCount, setMyCount] = useState(0);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState<string[]>([]);

  const reload = useCallback(async () => {
    const repo = await getRepo();
    const [p, s, mine] = await Promise.all([
      repo.listUnassigned(mentor.division ?? ''),
      repo.getAssignSettings(),
      repo.listStudents(mentor.id),
    ]);
    setPool(p);
    setSettings(s);
    setMyCount(mine.length);
  }, [mentor.id, mentor.division]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function claim(studentId: string) {
    setError('');
    try {
      const repo = await getRepo();
      await repo.claimStudent(studentId, mentor.id);
      setClaimed((prev) => [...prev, studentId]);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'הבחירה נכשלה');
    }
  }

  if (!pool) return <p>טוען…</p>;

  const grades = [...new Set(pool.map((s) => s.grade))];

  return (
    <div className="narrow">
      <div className="page-head">
        <div>
          <h1>בחירת חניכים</h1>
          <p className="muted">
            מאגר השיבוץ · {mentor.division} · אצלך: {myCount}/{settings.cap}
          </p>
        </div>
        <Link to="/" className="link">
          חזרה
        </Link>
      </div>

      {settings.locked && (
        <p className="card warn">🔒 השיבוץ נעול כרגע — לשינויים פנו לרכזת החונכות.</p>
      )}
      {error && <p className="error">{error}</p>}
      {claimed.length > 0 && (
        <p className="read-ok">✓ נוספו {claimed.length} חניכים למחברת שלך</p>
      )}

      {pool.length === 0 ? (
        <p className="muted">אין כרגע ילדים ממתינים לשיבוץ בחטיבה שלך 🎉</p>
      ) : (
        grades.map((grade) => (
          <section key={grade} className="card">
            <h2>שכבה {grade}</h2>
            <ul className="widget-list">
              {pool
                .filter((s) => s.grade === grade)
                .map((s) => (
                  <li key={s.id}>
                    <span>{s.name}</span>
                    <button
                      className="primary"
                      disabled={settings.locked || myCount >= settings.cap}
                      onClick={() => claim(s.id)}
                    >
                      + לחונכות שלי
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
