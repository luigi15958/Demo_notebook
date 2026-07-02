import { Link } from 'react-router-dom';
import { libraryChapters } from '../content/library';

export default function Library() {
  return (
    <div>
      <div className="page-head">
        <h1>ספריית החונכות</h1>
      </div>
      <p className="muted">
        תמצית חוברת החונכות — "מדריך לחונכ.ת", תוצר ועדת חיזוק תחום חונכות. זמינה כאן תמיד,
        גם רגע לפני מפגש.
      </p>
      <div className="cards">
        {libraryChapters.map((c) => (
          <Link key={c.slug} to={`/library/${c.slug}`} className="card">
            <h2>{c.title}</h2>
            <p className="muted clamp">{c.intro}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
