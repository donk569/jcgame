import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  server: {
    port: 5173,
    // 本地开发只监听回环地址；需要局域网/沙箱访问时用 npm run dev:lan
    host: '127.0.0.1',
    allowedHosts: true,
    watch: {
      ignored: ['**/shots/**', '**/.tools/**', '**/public/art/raw/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
