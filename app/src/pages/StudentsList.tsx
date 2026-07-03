import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { HomeWidgetPref, Meeting, Mentor, Student } from '../types';
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

// כמה ימים עד יום ההולדת הקרוב (0=היום), או null אם לא בטווח
function daysToBirthday(birthDate: string | undefined, within: number): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  const next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    next.setFullYear(now.getFullYear() + 1);
  }
  const days = Math.round((next.getTime() - now.getTime()) / 86400000);
  return days <= within ? Math.max(0, days) : null;
}

export default function StudentsList({ mentor }: { mentor: Mentor }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [widgets, setWidgets] = useState<HomeWidgetPref[]>([]);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      const [students, prefs] = await Promise.all([
        repo.listStudents(mentor.id),
        repo.getPrefs(mentor.id),
      ]);
      setWidgets(prefs.homeWidgets);
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

  const gaps = rows.filter(
    ({ lastMeeting }) => !lastMeeting || daysSince(lastMeeting.date) > 10,
  );
  const birthdays = rows
    .map(({ student }) => ({ student, days: daysToBirthday(student.birthDate, 14) }))
    .filter((x): x is { student: Student; days: number } => x.days !== null)
    .sort((a, b) => a.days - b.days);

  return (
    <div>
      <div className="hero">
        <p className="hero-date">
          {new Date().toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <h1 className="hero-title">
          {greeting()}, {firstName}
        </h1>
        <p className="muted">
          {rows.length > 0
            ? `${rows.length} חניכים וחניכות במחברת שלך`
            : 'המחברת שלך מחכה לחניכ.ה הראשון.ה'}
        </p>
        <Link to="/students/new" className="button primary hero-cta">
          + הוספת חניכ.ה
        </Link>
      </div>

      {widgets
        .filter((w) => w.enabled)
        .map((w) => {
          if (w.id === 'gaps' && gaps.length > 0) {
            return (
              <section key={w.id} className="card widget">
                <h2>לא נפגשנו מזמן</h2>
                <ul className="widget-list">
                  {gaps.map(({ student, lastMeeting }) => (
                    <li key={student.id}>
                      <Link to={`/students/${student.id}`}>
                        {student.emoji} {student.name}
                      </Link>
                      <span className="muted">
                        {lastMeeting
                          ? `לפני ${daysSince(lastMeeting.date)} ימים`
                          : 'טרם תועד מפגש'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          if (w.id === 'birthdays' && birthdays.length > 0) {
            return (
              <section key={w.id} className="card widget">
                <h2>ימי הולדת קרובים 🎂</h2>
                <ul className="widget-list">
                  {birthdays.map(({ student, days }) => (
                    <li key={student.id}>
                      <Link to={`/students/${student.id}`}>
                        {student.emoji} {student.name}
                      </Link>
                      <span className="muted">
                        {days === 0 ? 'היום!' : days === 1 ? 'מחר' : `בעוד ${days} ימים`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          return null;
        })}

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
