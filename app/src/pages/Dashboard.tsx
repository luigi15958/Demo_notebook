import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { Mentor, MentorActivity, SentMessageView } from '../types';

// דשבורד הרכזת: תמונת מצב מערכתית ממטא-נתונים בלבד —
// כמות ותדירות, לעולם לא תוכן המפגשים (עקרון "המחברת של החונכת").

export default function Dashboard({ mentor }: { mentor: Mentor }) {
  const [activity, setActivity] = useState<MentorActivity[] | null>(null);
  const [lastMessage, setLastMessage] = useState<SentMessageView | null>(null);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      const [act, sent] = await Promise.all([repo.coordinatorOverview(), repo.listSent()]);
      setActivity(act);
      setLastMessage(sent[0] ?? null);
    })();
  }, []);

  if (!activity) return <p>טוען…</p>;

  const totalStudents = activity.reduce((sum, a) => sum + a.studentCount, 0);
  const totalStale = activity.reduce((sum, a) => sum + a.staleStudents, 0);
  const activeMentors = activity.filter((a) => a.meetingsLast14 > 0).length;
  const readStats = lastMessage
    ? `${lastMessage.receipts.filter((r) => r.readAt).length}/${lastMessage.receipts.length}`
    : '—';

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
        <h1 className="hero-title">שלום, {mentor.name.split(' ')[0]}</h1>
        <p className="muted">לוח רכזת החונכות · מטא־נתונים בלבד, תוכן המפגשים נשאר אצל החונכים</p>
      </div>

      <div className="tiles">
        <div className="tile">
          <strong>{activity.length}</strong>
          <span>חונכים אישיים</span>
        </div>
        <div className="tile">
          <strong>{totalStudents}</strong>
          <span>חניכים.ות</span>
        </div>
        <div className="tile">
          <strong>
            {activeMentors}/{activity.length}
          </strong>
          <span>חונכים פעילים בשבועיים</span>
        </div>
        <div className={totalStale > 0 ? 'tile tile-warn' : 'tile'}>
          <strong>{totalStale}</strong>
          <span>חניכים ללא מפגש 10+ ימים</span>
        </div>
        <Link to="/messages" className="tile tile-link">
          <strong>{readStats}</strong>
          <span>אישורי קריאה להודעה האחרונה</span>
        </Link>
      </div>

      <div className="row" style={{ margin: '0.4rem 0 0.8rem' }}>
        <h2 className="section-title">קיום חונכויות סדיר</h2>
        <span className="row gap">
          <Link to="/assign" className="button">
            לוח שיבוץ 🎒
          </Link>
          <Link to="/messages" className="button primary">
            + הודעה לחונכים
          </Link>
        </span>
      </div>

      {activity.map((a) => (
        <article key={a.mentor.id} className="card mentor-row">
          <header className="row">
            <strong>{a.mentor.name}</strong>
            <span className="muted">{a.studentCount} חניכים.ות</span>
          </header>
          <div className="mentor-stats">
            <span>
              מפגשים בשבועיים: <strong>{a.meetingsLast14}</strong>
            </span>
            <span>
              מפגש אחרון:{' '}
              <strong>
                {a.lastMeetingDate
                  ? new Date(a.lastMeetingDate).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'טרם תועד'}
              </strong>
            </span>
            <span className={a.staleStudents > 0 ? 'warn' : 'read-ok'}>
              {a.staleStudents > 0
                ? `${a.staleStudents} חניכים.ות ללא מפגש עדכני`
                : '✓ כל החניכים במעקב סדיר'}
            </span>
          </div>
        </article>
      ))}

      <p className="muted privacy-note">
        הלוח מציג קצב ותדירות בלבד. תוכן המפגשים, המטרות ויומן הקשר נשארים במחברת האישית של
        כל חונכ.ת, ונחשפים רק בשיתוף מפורש.
      </p>
    </div>
  );
}
