/**
 * Border 02 — 언어 (담당: 의중)
 *
 * 회사 용어 가이드라인 적용, 약어 자동 설명,
 * 고유명사는 원문 유지하고 나머지는 자연스러운 현지 표현으로 변환.
 *
 * 붙이는 법: border01-geo.js 주석 참고.
 */

export const meta = {
  id: 'border02',
  name: '언어',
  owner: '의중',
  description: '회사 용어 가이드라인 적용 · 약어 자동 설명 · 고유명사 보존 현지화',
  implemented: false,
};

export async function run(_input) {
  const error = new Error(`${meta.name} 모듈은 아직 구현 전입니다. (담당: ${meta.owner})`);
  error.status = 501;
  throw error;
}
