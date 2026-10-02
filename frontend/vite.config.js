import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Copia index.html a dist/admin/ para que /admin funcione en cualquier hosting estático
// sin configurar reescrituras.
function adminRoute() {
  let outDir;
  return {
    name: 'admin-route',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await mkdir(resolve(outDir, 'admin'), { recursive: true });
      await copyFile(resolve(outDir, 'index.html'), resolve(outDir, 'admin', 'index.html'));
    },
  };
}

export default defineConfig({
  plugins: [react(), adminRoute()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_API_PROXY || 'http://127.0.0.1:4010',
    },
  },
});
