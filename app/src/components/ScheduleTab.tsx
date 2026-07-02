import { useEffect, useRef, useState } from 'react';
import { getRepo } from '../data/repo';
import type { Schedule, ScheduleEntry } from '../types';
import { DAY_LABELS } from '../types';

// לשונית מערכת השעות: הזנה ידנית, העלאת אקסל או צילום המערכת.
// החונכ.ת מלווה את בניית המערכת (תיווך לימודי) — כאן היא זמינה לה תמיד.

export default function ScheduleTab({ studentId }: { studentId: string }) {
  const [schedule, setSchedule] = useState<Schedule>({ studentId, entries: [] });
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('09:00');
  const [course, setCourse] = useState('');
  const [error, setError] = useState('');
  const excelInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const repo = await getRepo();
      const s = await repo.getSchedule(studentId);
      if (s) setSchedule(s);
      setLoading(false);
    })();
  }, [studentId]);

  async function persist(next: Schedule) {
    setSchedule(next);
    const repo = await getRepo();
    try {
      await repo.saveSchedule(next);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שמירה נכשלה');
    }
  }

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    const entry: ScheduleEntry = {
      id: `se-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      day,
      time,
      course,
    };
    persist({ ...schedule, entries: [...schedule.entries, entry] });
    setCourse('');
  }

  function removeEntry(id: string) {
    persist({ ...schedule, entries: schedule.entries.filter((x) => x.id !== id) });
  }

  async function onExcel(file: File) {
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
        header: 1,
        defval: '',
        raw: false,
      });
      const table = rows
        .filter((r) => r.some((c) => String(c).trim() !== ''))
        .slice(0, 30)
        .map((r) => r.slice(0, 10).map(String));
      if (table.length === 0) throw new Error('הגיליון ריק');
      await persist({
        ...schedule,
        attachment: { type: 'table', name: file.name, table },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'קריאת הקובץ נכשלה');
    }
  }

  async function onImage(file: File) {
    try {
      const dataUrl = await resizeImage(file, 1200);
      await persist({
        ...schedule,
        attachment: { type: 'image', name: file.name, dataUrl },
      });
    } catch {
      setError('טעינת התמונה נכשלה');
    }
  }

  if (loading) return <p>טוען…</p>;

  const byDay = DAY_LABELS.map((label, i) => ({
    label,
    entries: schedule.entries
      .filter((e) => e.day === i)
      .sort((a, b) => a.time.localeCompare(b.time)),
  })).filter((d) => d.entries.length > 0);

  return (
    <div>
      <form onSubmit={addEntry} className="card form">
        <h2>הוספת שיעור</h2>
        <div className="row wrap">
          <label>
            יום
            <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {DAY_LABELS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            שעה
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
          <label className="grow">
            קורס / פעילות
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="למשל: נגרות"
              required
            />
          </label>
        </div>
        <div className="row gap">
          <button type="submit" className="primary">
            הוספה
          </button>
          <button type="button" className="link" onClick={() => excelInput.current?.click()}>
            העלאת קובץ אקסל
          </button>
          <button type="button" className="link" onClick={() => imageInput.current?.click()}>
            העלאת צילום מערכת
          </button>
        </div>
        <input
          ref={excelInput}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onExcel(f);
            e.target.value = '';
          }}
        />
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImage(f);
            e.target.value = '';
          }}
        />
        {error && <p className="error">{error}</p>}
      </form>

      {byDay.length === 0 && !schedule.attachment && (
        <p className="muted">
          עדיין אין מערכת. אפשר להזין שיעורים ידנית, או להעלות קובץ אקסל / צילום של המערכת.
        </p>
      )}

      {byDay.map((d) => (
        <section key={d.label} className="card">
          <h2>יום {d.label}</h2>
          <ul className="schedule-list">
            {d.entries.map((e) => (
              <li key={e.id}>
                <span className="time">{e.time}</span>
                <span className="grow">{e.course}</span>
                <button className="link" onClick={() => removeEntry(e.id)} title="מחיקה">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {schedule.attachment && (
        <section className="card">
          <header className="row">
            <h2>
              {schedule.attachment.type === 'image' ? 'צילום המערכת' : 'קובץ שהועלה'}
              <span className="muted"> · {schedule.attachment.name}</span>
            </h2>
            <button
              className="link"
              onClick={() => persist({ ...schedule, attachment: undefined })}
            >
              הסרה
            </button>
          </header>
          {schedule.attachment.type === 'image' && schedule.attachment.dataUrl && (
            <img
              src={schedule.attachment.dataUrl}
              alt="צילום מערכת השעות"
              className="schedule-img"
            />
          )}
          {schedule.attachment.type === 'table' && schedule.attachment.table && (
            <div className="table-wrap">
              <table className="schedule-table">
                <tbody>
                  {schedule.attachment.table.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}
