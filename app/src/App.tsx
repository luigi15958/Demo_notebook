import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { getRepo } from './data/repo';
import type { Mentor, MentorPrefs } from './types';
import { applyTheme } from './theme';
import Login from './pages/Login';
import StudentsList from './pages/StudentsList';
import StudentCard from './pages/StudentCard';
import MeetingForm from './pages/MeetingForm';
import StudentForm from './pages/StudentForm';
import Library from './pages/Library';
import LibraryChapterPage from './pages/LibraryChapterPage';
import Settings from './pages/Settings';

export default function App() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [prefs, setPrefs] = useState<MentorPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadPrefs = useCallback(async (m: Mentor) => {
    const repo = await getRepo();
    const p = await repo.getPrefs(m.id);
    setPrefs(p);
    applyTheme(p.themeId);
  }, []);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      const m = await repo.currentMentor();
      setMentor(m);
      if (m) await loadPrefs(m);
      setLoading(false);
    })();
  }, [loadPrefs]);

  async function handleSignedIn(m: Mentor) {
    setMentor(m);
    await loadPrefs(m);
  }

  async function handleSignOut() {
    const repo = await getRepo();
    await repo.signOut();
    setMentor(null);
    setPrefs(null);
    applyTheme('botanical');
    navigate('/login');
  }

  async function handlePrefsChange(p: MentorPrefs) {
    const repo = await getRepo();
    await repo.savePrefs(p);
    setPrefs(p);
    applyTheme(p.themeId);
  }

  if (loading) return <div className="page center">טוען…</div>;

  if (!mentor) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSignedIn={handleSignedIn} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          {prefs?.notebookEmoji ?? '📔'} המחברת שלי
        </Link>
        <nav>
          <Link to="/">החניכים שלי</Link>
          <Link to="/library">ספרייה</Link>
          <Link to="/settings">העיצוב שלי</Link>
        </nav>
        <div className="user">
          <span>{mentor.name}</span>
          <button className="link" onClick={handleSignOut}>
            יציאה
          </button>
        </div>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<StudentsList mentor={mentor} />} />
          <Route path="/students/new" element={<StudentForm mentor={mentor} />} />
          <Route path="/students/:id" element={<StudentCard mentor={mentor} />} />
          <Route path="/students/:id/meetings/new" element={<MeetingForm mentor={mentor} />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:slug" element={<LibraryChapterPage />} />
          <Route
            path="/settings"
            element={
              prefs ? <Settings prefs={prefs} onChange={handlePrefsChange} /> : <p>טוען…</p>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        בית הספר הדמוקרטי הוד השרון · כלי פנימי לצוות · המידע רגיש — שמרו על סודיות
      </footer>
    </div>
  );
}
