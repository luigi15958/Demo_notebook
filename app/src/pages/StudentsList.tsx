import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { Meeting, Mentor, Student } from '../types';
import Avatar from '../components/Avatar';

interface Row {
  student: Student;
  lastMeeting: Meeting | null;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
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

  const firstName = mentor.name.split(' ')[0];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>
            {greeting()}, {firstName}
          </h1>
          <p className="muted">
            {rows.length > 0
              ? `${rows.length} חניכים וחניכות במחברת שלך`
              : 'המחברת שלך מחכה לחניכ.ה הראשון.ה'}
          </p>
        </div>
        <Link to="/students/new" className="button primary">
          + הוספת חניכ.ה
        </Link>
      </div>

      {rows.length > 0 && (
        <div className="cards">
          {rows.map(({ student, lastMeeting }) => {
            const days = lastMeeting ? daysSince(lastMeeting.date) : null;
            return (
              <Link
                key={student.id}
                to={`/students/${student.id}`}
                className="card student-card"
                style={{ borderInlineStartColor: student.color || 'var(--accent)' }}
              >
                <div className="stu-head">
                  <Avatar student={student} />
                  <div>
                    <h2>{student.name}</h2>
                    <p className="muted">{student.group}</p>
                  </div>
                </div>
                <p className={days !== null && days > 10 ? 'warn' : ''}>
                  {lastMeeting ? `מפגש אחרון: לפני ${days} ימים` : 'טרם תועד מפגש'}
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
