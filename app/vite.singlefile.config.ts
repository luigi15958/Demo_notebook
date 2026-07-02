import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// בניית קובץ HTML יחיד ועצמאי (dist-standalone/index.html) —
// נפתח ישירות מהדיסק, למשל להדגמה למליאת הצוות בלי שרת.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-standalone' },
});
