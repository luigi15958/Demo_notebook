import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
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
import Messages from './pages/Messages';
import Dashboard from './pages/Dashboard';

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m3 8 9 6 9-6" />
    </svg>
  );
}

function IconBrush() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="8.5" cy="9.5" r="0.6" fill="currentColor" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
      <circle cx="15.5" cy="9.5" r="0.6" fill="currentColor" />
      <path d="M12 12a3 3 0 0 0 3 3h3a3.5 3.5 0 0 1-3.5 3.5" />
    </svg>
  );
}

export default function App() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [prefs, setPrefs] = useState<MentorPrefs | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUnread = useCallback(async (m: Mentor | null) => {
    if (!m || m.role !== 'mentor') {
      setUnread(0);
      return;
    }
    const repo = await getRepo();
    const inbox = await repo.listInbox(m.id);
    setUnread(inbox.filter((i) => !i.readAt).length);
  }, []);

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
      await refreshUnread(m);
      setLoading(false);
    })();
  }, [loadPrefs, refreshUnread]);

  async function handleSignedIn(m: Mentor) {
    setMentor(m);
    await loadPrefs(m);
    await refreshUnread(m);
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
      <header className="cover">
        <Link to="/" className="brand">
          <span className="brand-emoji">{prefs?.notebookEmoji ?? '📔'}</span>
          המחברת שלי
        </Link>
        <div className="user">
          <span>{mentor.name}</span>
          <button className="signout" onClick={handleSignOut}>
            יציאה
          </button>
        </div>
      </header>

      <main className="page">
        <Routes>
          <Route
            path="/"
            element={
              mentor.role === 'coordinator' ? (
                <Dashboard mentor={mentor} />
              ) : (
                <StudentsList mentor={mentor} />
              )
            }
          />
          <Route
            path="/messages"
            element={<Messages mentor={mentor} onInboxChange={() => refreshUnread(mentor)} />}
          />
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
        <p className="footer">
          בית הספר הדמוקרטי הוד השרון · כלי פנימי לצוות · המידע רגיש — שמרו על סודיות
        </p>
      </main>

      <nav className="bottombar">
        <NavLink to="/" end>
          <IconHome />
          <span>{mentor.role === 'coordinator' ? 'לוח' : 'בית'}</span>
        </NavLink>
        <NavLink to="/messages" className="badge-holder">
          <IconMail />
          {unread > 0 && <span className="badge">{unread}</span>}
          <span>הודעות</span>
        </NavLink>
        <NavLink to="/library">
          <IconBook />
          <span>ספרייה</span>
        </NavLink>
        <NavLink to="/settings">
          <IconBrush />
          <span>עיצוב</span>
        </NavLink>
      </nav>
    </div>
  );
}
