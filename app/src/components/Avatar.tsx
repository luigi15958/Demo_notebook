import type { Student } from '../types';

export default function Avatar({ student, size = 44 }: { student: Student; size?: number }) {
  const initials = student.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  const bg = student.color || 'var(--accent)';
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * (student.emoji ? 0.5 : 0.38),
        background: student.emoji ? `${bg}22` : bg,
        color: student.emoji ? 'inherit' : '#fff',
        border: `2px solid ${bg}`,
      }}
    >
      {student.emoji || initials}
    </span>
  );
}
