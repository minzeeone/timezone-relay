import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

import { hasApiKey } from './src/llm.js';
import { clearBriefing, getLastBriefing } from './src/store.js';

import * as border01 from './src/borders/border01-geo.js';
import * as border02 from './src/borders/border02-lang.js';
import * as border03 from './src/borders/border03-culture.js';
import * as border04 from './src/borders/border04-org.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 팀원이 모듈을 완성하면 여기 등록된 채로 자동으로 /api/<id>/run 이 살아납니다.
const BORDERS = [border01, border02, border03, border04];
const REGISTRY = new Map(BORDERS.map((module) => [module.meta.id, module]));

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mode: hasApiKey() ? 'live' : 'demo',
    borders: BORDERS.map((module) => module.meta),
  });
});

/** 각 border 실행 — POST /api/border04/run  { logText, projectId } */
app.post('/api/:borderId/run', async (req, res) => {
  const module = REGISTRY.get(req.params.borderId);
  if (!module) {
    return res.status(404).json({ error: `알 수 없는 border: ${req.params.borderId}` });
  }
  try {
    const result = await module.run(req.body ?? {});
    res.json(result);
  } catch (error) {
    console.error(`[${req.params.borderId}]`, error);
    res.status(error.status ?? 500).json({ error: error.message ?? '알 수 없는 오류' });
  }
});

/** 직전 브리핑 조회 (변경점이 무엇과 비교되는지 확인용) */
app.get('/api/:borderId/previous', async (req, res) => {
  const projectId = req.query.projectId ?? 'default';
  res.json({ previous: await getLastBriefing(req.params.borderId, projectId) });
});

/** 직전 브리핑 초기화 — 데모를 처음부터 다시 돌릴 때 */
app.post('/api/:borderId/reset', async (req, res) => {
  const projectId = req.body?.projectId ?? 'default';
  await clearBriefing(req.params.borderId, projectId);
  res.json({ ok: true, projectId });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  const mode = hasApiKey() ? 'live (Claude API 연결됨)' : 'demo (ANTHROPIC_API_KEY 없음 — 규칙 기반 흉내)';
  console.log(`\n  타임존 릴레이 AI  →  http://localhost:${PORT}`);
  console.log(`  모드: ${mode}\n`);
});
