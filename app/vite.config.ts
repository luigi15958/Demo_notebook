import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // נתיבים יחסיים: הבנייה עובדת גם כשפותחים את dist/index.html ישירות מהדיסק
  base: './',
});
