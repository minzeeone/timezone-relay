import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
    watch: {
      // 서버가 인수인계 브리핑을 저장할 때마다 전체 새로고침이 걸려
      // 모달 상태가 초기화되는 문제를 막습니다.
      ignored: ['**/data/**'],
    },
  },
});
