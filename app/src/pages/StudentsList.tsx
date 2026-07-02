import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { Meeting, Mentor, Student } from '../types';

interface Row {
  student: Student;
  lastMeeting: Meeting | null;
}

export default function StudentsList({ mentor }: { mentor: Mentor }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      const students = await repo.listStudents(mentor.id);
      const withMeetings = await Promise.all(
        students.map(async (student) => {
          const meetings = await repo.listMeetings(student.id);
          return { student, lastMeeting: meetings[0] ?? null };
        }),
      );
      setRows(withMeetings);
    })();
  }, [mentor.id]);

  if (!rows) return <p>טוען…</p>;

  return (
    <div>
      <div className="page-head">
        <h1>החניכים והחניכות שלי</h1>
        <Link to="/students/new" className="button primary">
          + הוספת חניכ.ה
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="muted">אין עדיין חניכים. הוסיפו את החניכ.ה הראשון.ה.</p>
      ) : (
        <div className="cards">
          {rows.map(({ student, lastMeeting }) => {
            const days = lastMeeting ? daysSince(lastMeeting.date) : null;
            return (
              <Link key={student.id} to={`/students/${student.id}`} className="card student-card">
                <h2>{student.name}</h2>
                <p className="muted">{student.group}</p>
                <p className={days !== null && days > 10 ? 'warn' : ''}>
                  {lastMeeting
                    ? `מפגש אחרון: לפני ${days} ימים`
                    : 'טרם תועד מפגש'}
                </p>
                {student.strengths.length > 0 && (
                  <div className="tags">
                    {student.strengths.slice(0, 3).map((s) => (
                      <span key={s} className="tag">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}
