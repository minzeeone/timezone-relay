# 타임존 릴레이 AI

멋쟁이사자처럼 대학 14th 해커톤 · LIKELION 트랙

팀원이 하루 작업을 마치면 AI가 인수인계 브리핑을 자동 생성해, 다음 시간대에 출근하는 팀원에게 전달하는 서비스.

| Border | 주제 | 담당 | 상태 |
| --- | --- | --- | --- |
| 01 | 지리 — 타임존 자동 감지, 상대 국가 시간, 공휴일 반영 | 준서 | 구현 전 |
| 02 | 언어 — 용어 가이드라인, 약어 설명, 고유명사 보존 현지화 | 의중 | 구현 전 |
| 03 | 문화 — 완곡 표현의 실제 의미 재해석 | 민석 | 구현 전 |
| 04 | **조직 — 여러 툴 기록 통합 · 중복 제거 · 결정/작업 분리 · 변경점** | **지원** | **구현 완료** |

---

## 실행

```bash
npm install
cp .env.example .env      # ANTHROPIC_API_KEY 를 채웁니다
npm start                 # http://localhost:3000
```

`npm run dev` 로 실행하면 파일 저장 시 자동 재시작됩니다.

**API 키가 없으면 자동으로 데모 모드로 뜹니다.** 규칙 기반으로 흉내만 내기 때문에
"결제 다 됐어요"와 "merged PR #42"를 같은 사건으로 묶지 못합니다.
발표·제출 시에는 반드시 키를 넣고 live 모드로 돌리세요. 우측 상단 배지로 현재 모드를 확인할 수 있습니다.

키 발급: <https://console.anthropic.com> → API Keys

---

## Border 04 — 조직 (담당: 지원)

### 무엇을 하는가

여러 툴(Slack / GitHub / Notion)에 흩어진 하루치 기록을 붙여넣으면 네 가지를 만들어 냅니다.

1. **중복 제거된 로그** — 같은 사건이 툴마다 다르게 기록된 것을 한 건으로 병합
2. **결정사항** — 이미 확정되어 다음 사람이 전제로 삼아도 되는 것
3. **작업사항** — 진행중 / 할 일 / 막힘
4. **변경점** — 지난 브리핑 이후 새로 생기거나 바뀐 것만

### AI가 핵심인 지점

중복 제거를 문자열 유사도로 하면 아래 세 줄은 **단어가 거의 겹치지 않아 절대 묶이지 않습니다.**

```
[Slack]  지원: 결제 모듈 리팩터링 브랜치 올렸어요
[GitHub] merged PR #42 into main
[Notion] 결제 모듈 리팩터링 완료 ✅
```

"가리키는 사건이 같은가"를 판단하려면 의미 이해가 필요하고, 그게 이 모듈이 LLM을 쓰는 이유입니다.
실제 샘플 로그(13줄) 실행 결과 → **4건으로 병합, 그중 1건은 원문 7줄이 합쳐진 것.**

같은 이유로 "확정된 결정"과 "아직 논의 중"을 가르는 것도 규칙으로는 안 됩니다.
`"다들 동의하신 걸로 알게요"` 가 결정인지 일방 통보인지는 문맥 판단입니다.

`src/borders/border04-demo.js` 는 이 논지를 보여주는 대조군이기도 합니다 —
규칙 기반 구현체가 실제로 무엇을 못 하는지 눈으로 확인할 수 있습니다.

### 변경점이 동작하는 방식

브리핑을 생성할 때마다 `data/briefings.json` 에 직전 결과를 저장하고,
다음 실행 때 그것을 프롬프트에 함께 넣어 "달라진 것만" 뽑게 합니다.

시연할 때는 **같은 프로젝트로 두 번 돌리세요.**

- 1회차: `changes` 는 비어 있고 "첫 브리핑입니다" 표시
- 2회차(다음날 로그): `신규 / 변경 / 취소` 태그로 달라진 것만 표시

`이전 브리핑 초기화` 버튼으로 언제든 1회차 상태로 되돌릴 수 있습니다.

---

## 구조

```
server.js                      Express 서버 + border 라우팅
src/
  llm.js                       Claude 호출 공용 래퍼 (JSON 스키마 강제)
  store.js                     직전 브리핑 저장 (변경점 계산용)
  borders/
    border01-geo.js            준서  ← 여기를 채우면 됩니다
    border02-lang.js           의중  ← 여기를 채우면 됩니다
    border03-culture.js        민석  ← 여기를 채우면 됩니다
    border04-org.js            지원  (완성)
    border04-demo.js           API 키 없을 때의 규칙 기반 대체 구현
public/                        프론트엔드 (빌드 과정 없음)
data/briefings.json            직전 브리핑 (gitignore)
```

## 팀원이 자기 border를 붙이는 법

각자 `src/borders/borderNN-*.js` **파일 하나만** 수정하면 됩니다. 다른 파일은 건드릴 필요 없습니다.

```js
export const meta = { id: 'border01', name: '지리', owner: '준서', implemented: true };

export async function run({ logText, projectId }) {
  const { data } = await callClaude({
    system: '...',                      // 프롬프트
    user: logText,
    schema: { /* 원하는 JSON 스키마 */ }, // 이 모양 그대로 파싱돼서 돌아옵니다
  });
  return data;
}
```

- `callClaude` 는 `output_config.format` 으로 JSON 스키마를 강제하기 때문에
  "JSON으로 답해줘"라고 부탁할 필요가 없고, 코드펜스가 섞여 나오거나 파싱이 깨지지 않습니다.
- 시스템 프롬프트는 자동으로 캐싱돼서 반복 호출 비용이 줄어듭니다.
- 등록은 이미 돼 있습니다. 파일을 채우는 순간 `POST /api/border01/run` 이 살아납니다.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/health` | 현재 모드(live/demo)와 border 목록 |
| `POST` | `/api/:borderId/run` | `{ logText, projectId }` → 브리핑 |
| `GET` | `/api/:borderId/previous?projectId=` | 직전 브리핑 조회 |
| `POST` | `/api/:borderId/reset` | 직전 브리핑 초기화 |

## 사용 모델

`claude-opus-5` · 구조화 출력(JSON Schema) · 프롬프트 캐싱
