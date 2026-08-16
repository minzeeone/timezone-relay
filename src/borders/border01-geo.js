/**
 * Border 01 — 지리 (담당: 준서)
 *
 * 타임존 자동 감지, 상대 국가 시간 표시(KST/UTC), 공휴일·휴업일 반영.
 *
 * 붙이는 법: 아래 run() 안에서 결과 객체를 반환하기만 하면 됩니다.
 * LLM 이 필요하면 `import { callClaude } from '../llm.js'` 로 공용 래퍼를 쓰세요.
 * (JSON 스키마를 넘기면 파싱된 객체가 그대로 돌아옵니다 — border04-org.js 참고)
 */

export const meta = {
  id: 'border01',
  name: '지리',
  owner: '준서',
  description: '타임존 자동 감지 · 상대 국가 시간 표시 · 공휴일/휴업일 반영',
  implemented: false,
};

export async function run(_input) {
  const error = new Error(`${meta.name} 모듈은 아직 구현 전입니다. (담당: ${meta.owner})`);
  error.status = 501;
  throw error;
}
