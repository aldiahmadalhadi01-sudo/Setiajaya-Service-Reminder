import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GOOGLE_APP_SCRIPT_URL': JSON.stringify(process.env.GOOGLE_APP_SCRIPT_URL || process.env.VITE_GOOGLE_APP_SCRIPT_URL || ''),
      'process.env.WEB_APP_URL': JSON.stringify(process.env.WEB_APP_URL || process.env.VITE_WEB_APP_URL || ''),
      'process.env.GAS_URL': JSON.stringify(process.env.GAS_URL || process.env.VITE_GAS_URL || ''),
      'process.env.APPS_SCRIPT_URL': JSON.stringify(process.env.APPS_SCRIPT_URL || process.env.VITE_APPS_SCRIPT_URL || ''),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
