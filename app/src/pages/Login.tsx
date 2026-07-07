import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRepo, isSupabaseConfigured } from '../data/repo';
import type { Mentor } from '../types';

export default function Login({ onSignedIn }: { onSignedIn: (m: Mentor) => void }) {
  const [demoMentors, setDemoMentors] = useState<Mentor[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const supabase = isSupabaseConfigured();

  useEffect(() => {
    if (!supabase) {
      getRepo().then((repo) => repo.listDemoMentors().then(setDemoMentors));
    }
  }, [supabase]);

  async function signInDemo(id: string) {
    const repo = await getRepo();
    const mentor = await repo.signIn(id);
    onSignedIn(mentor);
    navigate('/');
  }

  async function signInSupabase(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const repo = await getRepo();
      const mentor = await repo.signIn(email, password);
      onSignedIn(mentor);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    }
  }

  return (
    <div className="page center">
      <div className="card login-card">
        <h1>מחברת החונכות האישית</h1>
        <p className="muted">בית הספר הדמוקרטי הוד השרון</p>

        {supabase ? (
          <form onSubmit={signInSupabase} className="form">
            <label>
              אימייל
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              סיסמה
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary">
              כניסה
            </button>
          </form>
        ) : (
          <>
            <p>
              <strong>מצב הדגמה</strong> — הנתונים נשמרים בדפדפן זה בלבד. בחרו משתמש.ת:
            </p>
            <div className="demo-users">
              {demoMentors.map((m) => (
                <button key={m.id} className="primary" onClick={() => signInDemo(m.id)}>
                  {m.name}
                  <small>{m.role === 'coordinator' ? 'רכזת חונכות' : 'חונכ.ת אישי.ת'}</small>
                </button>
              ))}
            </div>
          </>
        )}
        <p className="note-cta">
          <Link to="/note">📝 מורה? שליחת פתק ורוד/כתום לחונכ.ת</Link>
        </p>
      </div>
    </div>
  );
}
