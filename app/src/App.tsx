import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { getRepo } from './data/repo';
import type { Mentor } from './types';
import Login from './pages/Login';
import StudentsList from './pages/StudentsList';
import StudentCard from './pages/StudentCard';
import MeetingForm from './pages/MeetingForm';
import StudentForm from './pages/StudentForm';
import Library from './pages/Library';
import LibraryChapterPage from './pages/LibraryChapterPage';

export interface Session {
  mentor: Mentor;
  refresh: () => void;
}

export default function App() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getRepo()
      .then((repo) => repo.currentMentor())
      .then(setMentor)
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    const repo = await getRepo();
    await repo.signOut();
    setMentor(null);
    navigate('/login');
  }

  if (loading) return <div className="page center">טוען…</div>;

  if (!mentor) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSignedIn={setMentor} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          מחברת החונכות האישית
        </Link>
        <nav>
          <Link to="/">החניכים שלי</Link>
          <Link to="/library">ספריית החונכות</Link>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        בית הספר הדמוקרטי הוד השרון · כלי פנימי לצוות · המידע רגיש — שמרו על סודיות
      </footer>
    </div>
  );
}
