import { Link, useParams } from 'react-router-dom';
import { getChapter } from '../content/library';

export default function LibraryChapterPage() {
  const { slug } = useParams<{ slug: string }>();
  const chapter = slug ? getChapter(slug) : undefined;

  if (!chapter) {
    return (
      <p>
        הפרק לא נמצא. <Link to="/library">חזרה לספרייה</Link>
      </p>
    );
  }

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>{chapter.title}</h1>
        <Link to="/library" className="link">
          חזרה לספרייה
        </Link>
      </div>
      <p className="lead">{chapter.intro}</p>
      {chapter.sections.map((s) => (
        <section key={s.heading} className="card">
          <h2>{s.heading}</h2>
          {s.body && <p>{s.body}</p>}
          {s.bullets && (
            <ul>
              {s.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
