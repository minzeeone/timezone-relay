/**
 * Border 03 — 문화 (담당: 민석) · 핵심 기능
 *
 * 완곡한 표현을 실제 의미로 재해석.
 *   예) "조금 어려울 것 같아요" → "실제로 막혔을 가능성 높음, 확인 필요"
 * 국가별 직설형/완곡형 스타일 반영, 비즈니스 관용구 해석.
 *
 * 붙이는 법: border01-geo.js 주석 참고.
 */

export const meta = {
  id: 'border03',
  name: '문화',
  owner: '민석',
  description: '완곡 표현의 실제 의미 재해석 · 국가별 직설/완곡 스타일 · 비즈니스 관용구',
  implemented: false,
};

export async function run(_input) {
  const error = new Error(`${meta.name} 모듈은 아직 구현 전입니다. (담당: ${meta.owner})`);
  error.status = 501;
  throw error;
}
