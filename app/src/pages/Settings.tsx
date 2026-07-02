import type { MentorPrefs } from '../types';
import { NOTEBOOK_EMOJIS, PALETTES } from '../theme';

// "המחברת שלי" — כאן החונכ.ת מעצבת את המחברת לעצמה

export default function Settings({
  prefs,
  onChange,
}: {
  prefs: MentorPrefs;
  onChange: (p: MentorPrefs) => void;
}) {
  return (
    <div className="narrow">
      <div className="page-head">
        <h1>המחברת שלי</h1>
      </div>
      <p className="muted">
        המחברת היא שלך — בחרי צבע וסמל שירגישו לך נכון. הבחירה נשמרת ומלווה אותך בכל מסך.
      </p>

      <section className="card">
        <h2>צבע הכריכה</h2>
        <div className="swatches">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              className={prefs.themeId === p.id ? 'swatch selected' : 'swatch'}
              style={{ background: p.accent }}
              title={p.name}
              onClick={() => onChange({ ...prefs, themeId: p.id })}
            >
              {prefs.themeId === p.id ? '✓' : ''}
            </button>
          ))}
        </div>
        <p className="muted">
          {PALETTES.find((p) => p.id === prefs.themeId)?.name}
        </p>
      </section>

      <section className="card">
        <h2>סמל המחברת</h2>
        <div className="swatches">
          {NOTEBOOK_EMOJIS.map((e) => (
            <button
              key={e}
              className={prefs.notebookEmoji === e ? 'emoji-pick selected' : 'emoji-pick'}
              onClick={() => onChange({ ...prefs, notebookEmoji: e })}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>בקרוב</h2>
        <ul className="muted">
          <li>תבנית תיעוד אישית — שדות משלך בטופס המפגש</li>
          <li>שאלות פתיחה שמורות</li>
          <li>סידור אישי של מסך הבית</li>
        </ul>
      </section>
    </div>
  );
}
