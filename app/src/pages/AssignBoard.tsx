import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepo } from '../data/repo';
import type { AssignSettings, AssignmentRow, Mentor } from '../types';

// לוח השיבוץ של הרכזת: ייבוא תלמידים, מצב שיבוץ חי, שיוך ידני ונעילה.
// מטא-נתונים בלבד — שם, חטיבה, שכבה ושיוך.

export default function AssignBoard() {
  const [board, setBoard] = useState<AssignmentRow[] | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [settings, setSettings] = useState<AssignSettings>({ locked: false, cap: 15 });
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const repo = await getRepo();
    const [b, ms, s] = await Promise.all([
      repo.listAssignmentBoard(),
      repo.listMentors(),
      repo.getAssignSettings(),
    ]);
    setBoard(b);
    setMentors(ms);
    setSettings(s);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function parseRows(
    lines: string[][],
  ): { name: string; division: string; grade: string; birthDate?: string }[] {
    return lines
      .map((cols) => ({
        name: (cols[0] ?? '').trim(),
        division: (cols[1] ?? '').trim(),
        grade: (cols[2] ?? '').trim(),
        birthDate: (cols[3] ?? '').trim() || undefined,
      }))
      .filter((r) => r.name && r.division);
  }

  async function importPasted(e: React.FormEvent) {
    e.preventDefault();
    const rows = parseRows(
      importText
        .split('\n')
        .map((line) => line.split(',').map((c) => c.trim()))
        .filter((cols) => cols.length >= 2),
    );
    await doImport(rows);
    setImportText('');
  }

  async function importFile(file: File) {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      const lines = XLSX.utils.sheet_to_json<string[]>(ws, {
        header: 1,
        defval: '',
        raw: false,
      });
      await doImport(parseRows(lines.map((l) => l.map(String))));
    } catch {
      setImportMsg('קריאת הקובץ נכשלה');
    }
  }

  async function doImport(
    rows: { name: string; division: string; grade: string; birthDate?: string }[],
  ) {
    if (rows.length === 0) {
      setImportMsg("לא נמצאו שורות תקינות (פורמט: שם, חטיבה, שכבה[, תאריך לידה])");
      return;
    }
    const repo = await getRepo();
    const added = await repo.importStudents(rows);
    setImportMsg(`נוספו ${added} ילדים למאגר השיבוץ ✓`);
    await reload();
  }

  async function assign(studentId: string, mentorId: string | null) {
    const repo = await getRepo();
    await repo.coordinatorAssign(studentId, mentorId);
    await reload();
  }

  async function toggleLock() {
    const repo = await getRepo();
    await repo.setAssignSettings({ ...settings, locked: !settings.locked });
    await reload();
  }

  async function changeCap(cap: number) {
    if (!cap || cap < 1) return;
    const repo = await getRepo();
    await repo.setAssignSettings({ ...settings, cap });
    await reload();
  }

  if (!board) return <p>טוען…</p>;

  const unassigned = board.filter((s) => !s.mentorId);
  const mentorName = (id: string | null) => mentors.find((m) => m.id === id)?.name ?? '—';
  const loadOf = (id: string) => board.filter((s) => s.mentorId === id).length;
  const divisions = [...new Set(board.map((s) => s.division))];

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>לוח שיבוץ</h1>
        <Link to="/" className="link">
          חזרה ללוח
        </Link>
      </div>

      <section className="card">
        <header className="row">
          <h2>{settings.locked ? '🔒 השיבוץ נעול' : '🔓 השיבוץ פתוח'}</h2>
          <button className="primary" onClick={toggleLock}>
            {settings.locked ? 'פתיחת השיבוץ' : 'נעילת השיבוץ'}
          </button>
        </header>
        <p className="muted">
          כשהשיבוץ נעול, חונכים לא יכולים לבחור חניכים — שינויים רק דרכך.
        </p>
        <label className="check-row">
          תקרת חניכים לחונכ.ת:
          <input
            type="number"
            min={1}
            max={30}
            value={settings.cap}
            onChange={(e) => changeCap(Number(e.target.value))}
            className="cap-input"
          />
        </label>
      </section>

      <section className="card form">
        <h2>ייבוא תלמידים למאגר</h2>
        <p className="muted">שורה לכל ילד.ה: שם, חטיבה, שכבה, תאריך לידה (אופציונלי)</p>
        <form onSubmit={importPasted}>
          <label>
            הדבקה מאקסל / CSV
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={3}
              placeholder={"דניאל לב, חטיבת ביניים, ז'"}
            />
          </label>
          <div className="row gap">
            <button type="submit" className="primary">
              ייבוא
            </button>
            <button type="button" className="link" onClick={() => fileInput.current?.click()}>
              או העלאת קובץ אקסל/CSV
            </button>
          </div>
        </form>
        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = '';
          }}
        />
        {importMsg && <p className="read-ok">{importMsg}</p>}
      </section>

      <section className="card">
        <h2>עומס חונכים</h2>
        <ul className="widget-list">
          {mentors.map((m) => (
            <li key={m.id}>
              <span>
                {m.name} <span className="muted">· {m.division}</span>
              </span>
              <span className={loadOf(m.id) >= settings.cap ? 'warn' : 'muted'}>
                {loadOf(m.id)}/{settings.cap}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="section-title">ממתינים לשיבוץ ({unassigned.length})</h2>
      {unassigned.length === 0 && <p className="read-ok">✓ כל הילדים משויכים</p>}
      {divisions.map((division) => {
        const inDivision = unassigned.filter((s) => s.division === division);
        if (inDivision.length === 0) return null;
        return (
          <section key={division} className="card">
            <h2>{division}</h2>
            <ul className="widget-list">
              {inDivision.map((s) => (
                <li key={s.id}>
                  <span>
                    {s.name} <span className="muted">· {s.grade}</span>
                  </span>
                  <select
                    value=""
                    onChange={(e) => e.target.value && assign(s.id, e.target.value)}
                    className="assign-select"
                  >
                    <option value="">שיוך לחונכ.ת…</option>
                    {mentors
                      .filter((m) => m.division === division)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({loadOf(m.id)}/{settings.cap})
                        </option>
                      ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <h2 className="section-title">משויכים</h2>
      {divisions.map((division) => {
        const assigned = board.filter((s) => s.mentorId && s.division === division);
        if (assigned.length === 0) return null;
        return (
          <section key={division} className="card">
            <h2>{division}</h2>
            <ul className="widget-list">
              {assigned.map((s) => (
                <li key={s.id}>
                  <span>
                    {s.name}{' '}
                    <span className="muted">
                      · {s.grade} · אצל {mentorName(s.mentorId)}
                    </span>
                  </span>
                  <button className="link" onClick={() => assign(s.id, null)}>
                    החזרה למאגר
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
