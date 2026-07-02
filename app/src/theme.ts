// ערכות צבע — "כריכת המחברת" של כל חונכ.ת

export interface Palette {
  id: string;
  name: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  bg: string;
}

export const PALETTES: Palette[] = [
  { id: 'botanical', name: 'ירוק בוטני', accent: '#3e7d68', accentDark: '#2c5c4c', accentSoft: '#e2efe9', bg: '#f4f8f5' },
  { id: 'terracotta', name: 'טרקוטה חמה', accent: '#c26d4b', accentDark: '#9e5236', accentSoft: '#f6e3d9', bg: '#faf6ef' },
  { id: 'lilac', name: 'סגול לילך', accent: '#7b5ea7', accentDark: '#5f4585', accentSoft: '#efe9f8', bg: '#fbfaff' },
  { id: 'sea', name: 'כחול ים', accent: '#3a6ea5', accentDark: '#2b5480', accentSoft: '#e3edf7', bg: '#f5f9fc' },
  { id: 'rose', name: 'ורוד עתיק', accent: '#b0566e', accentDark: '#8e4058', accentSoft: '#f8e5ea', bg: '#fdf7f8' },
  { id: 'honey', name: 'דבש', accent: '#a5761f', accentDark: '#815b14', accentSoft: '#f7ecd6', bg: '#fbf8f0' },
];

export const STUDENT_COLORS = [
  '#3e7d68', '#c26d4b', '#7b5ea7', '#3a6ea5', '#b0566e', '#a5761f', '#4c8577', '#8a6642',
];

export const STUDENT_EMOJIS = [
  '🌱', '🦊', '🐬', '🎨', '⚽', '🎸', '🚀', '🦉', '🐢', '🌈', '🛠️', '📚', '🎭', '🧩', '🏀', '🐱',
];

export const NOTEBOOK_EMOJIS = ['📔', '🌿', '🌻', '🕊️', '🧭', '🌊', '🔥', '⭐'];

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function applyTheme(paletteId: string): void {
  const p = getPalette(paletteId);
  const root = document.documentElement.style;
  root.setProperty('--accent', p.accent);
  root.setProperty('--accent-dark', p.accentDark);
  root.setProperty('--accent-soft', p.accentSoft);
  root.setProperty('--bg', p.bg);
}
