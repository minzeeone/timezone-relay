import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * "지난 브리핑 대비 변경점" 을 계산하려면 직전 브리핑을 어딘가 들고 있어야 합니다.
 * 해커톤 데모용이라 DB 대신 프로젝트별 JSON 파일 하나로 처리합니다.
 * (나중에 DB 로 바꿀 때 이 파일의 3개 함수만 갈아끼우면 됩니다)
 */

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const FILE = path.join(DATA_DIR, 'briefings.json');

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeAll(all) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), 'utf8');
}

function key(borderId, projectId) {
  return `${borderId}::${projectId}`;
}

/** 해당 프로젝트의 직전 브리핑을 반환. 없으면 null. */
export async function getLastBriefing(borderId, projectId) {
  const all = await readAll();
  return all[key(borderId, projectId)] ?? null;
}

/** 이번 브리핑을 "직전 브리핑" 으로 저장. */
export async function saveBriefing(borderId, projectId, briefing) {
  const all = await readAll();
  all[key(borderId, projectId)] = { ...briefing, savedAt: new Date().toISOString() };
  await writeAll(all);
}

/** 데모 중 처음부터 다시 하고 싶을 때 (변경점 초기화). */
export async function clearBriefing(borderId, projectId) {
  const all = await readAll();
  delete all[key(borderId, projectId)];
  await writeAll(all);
}
