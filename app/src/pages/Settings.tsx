import { useState } from 'react';
import type { MentorPrefs } from '../types';
import { BUILTIN_FIELDS, HOME_WIDGET_LABELS } from '../types';
import { NOTEBOOK_EMOJIS, PALETTES } from '../theme';

// "העיצוב שלי" — כאן החונכ.ת מעצבת את המחברת לעצמה:
// צבע וסמל, תבנית התיעוד האישית, ומה מופיע במסך הבית.

export default function Settings({
  prefs,
  onChange,
}: {
  prefs: MentorPrefs;
  onChange: (p: MentorPrefs) => void;
}) {
  const [newFieldLabel, setNewFieldLabel] = useState('');

  function toggleBuiltin(fieldId: string) {
    const hidden = prefs.template.hiddenFields.includes(fieldId)
      ? prefs.template.hiddenFields.filter((f) => f !== fieldId)
      : [...prefs.template.hiddenFields, fieldId];
    onChange({ ...prefs, template: { ...prefs.template, hiddenFields: hidden } });
  }

  function addCustomField(e: React.FormEvent) {
    e.preventDefault();
    const label = newFieldLabel.trim();
    if (!label) return;
    onChange({
      ...prefs,
      template: {
        ...prefs.template,
        customFields: [
          ...prefs.template.customFields,
          { id: `cf-${Date.now()}`, label },
        ],
      },
    });
    setNewFieldLabel('');
  }

  function removeCustomField(id: string) {
    onChange({
      ...prefs,
      template: {
        ...prefs.template,
        customFields: prefs.template.customFields.filter((f) => f.id !== id),
      },
    });
  }

  function toggleWidget(id: string) {
    onChange({
      ...prefs,
      homeWidgets: prefs.homeWidgets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w,
      ),
    });
  }

  function moveWidget(index: number, dir: -1 | 1) {
    const next = [...prefs.homeWidgets];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange({ ...prefs, homeWidgets: next });
  }

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>העיצוב שלי</h1>
      </div>
      <p className="muted">
        המחברת היא שלך — צבע, סמל, תבנית תיעוד ומסך בית שמרגישים לך נכון. הכול נשמר ומלווה
        אותך בכל מסך.
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
        <p className="muted">{PALETTES.find((p) => p.id === prefs.themeId)?.name}</p>
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
        <h2>תבנית התיעוד שלי</h2>
        <p className="muted">
          בחרי אילו שדות יופיעו בטופס תיעוד המפגש. תאריך, משך, מוקד ונושאים מופיעים תמיד.
        </p>
        {BUILTIN_FIELDS.map((f) => (
          <label key={f.id} className="check-row">
            <input
              type="checkbox"
              checked={!prefs.template.hiddenFields.includes(f.id)}
              onChange={() => toggleBuiltin(f.id)}
            />
            {f.label}
          </label>
        ))}

        <h3>שדות משלי</h3>
        {prefs.template.customFields.length === 0 && (
          <p className="muted">אפשר להוסיף שדות אישיים, למשל: "איך אני הרגשתי במפגש?"</p>
        )}
        {prefs.template.customFields.map((f) => (
          <div key={f.id} className="row custom-field-row">
            <span>{f.label}</span>
            <button className="link" onClick={() => removeCustomField(f.id)}>
              הסרה
            </button>
          </div>
        ))}
        <form onSubmit={addCustomField} className="row wrap form">
          <label className="grow">
            שדה חדש
            <input
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder='למשל: "מה לקחתי איתי מהמפגש?"'
            />
          </label>
          <button type="submit" className="primary">
            הוספה
          </button>
        </form>
      </section>

      <section className="card">
        <h2>מסך הבית שלי</h2>
        <p className="muted">מה יופיע מעל רשימת החניכים, ובאיזה סדר.</p>
        {prefs.homeWidgets.map((w, i) => (
          <div key={w.id} className="row custom-field-row">
            <label className="check-row">
              <input type="checkbox" checked={w.enabled} onChange={() => toggleWidget(w.id)} />
              {HOME_WIDGET_LABELS[w.id]}
            </label>
            <span>
              <button className="link" onClick={() => moveWidget(i, -1)} disabled={i === 0}>
                ▲
              </button>
              <button
                className="link"
                onClick={() => moveWidget(i, 1)}
                disabled={i === prefs.homeWidgets.length - 1}
              >
                ▼
              </button>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
