import { fileURLToPath } from 'node:url';
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
      //
      // 루트의 data/ 하나만 정확히 가리켜야 합니다.
      // '**/data/**' 로 두면 src/data/ 까지 감시에서 빠져서
      // timelineData.js, handoffFlowMock.js 를 고쳐도 화면이 갱신되지 않습니다.
      ignored: [fileURLToPath(new URL('./data/**', import.meta.url))],
    },
  },
});
