# APEX Architecture

이 문서는 현재 프로젝트에 실제로 존재하는 파일과 구현을 기준으로 작성되었습니다.

## 전체 애플리케이션 구조

```text
index.html
  └─ src/main.jsx
      └─ src/App.jsx
          ├─ Dashboard view
          │  └─ src/components/dashboard/HandoffDashboard.jsx
          ├─ Messenger view
          │  ├─ src/components/Avatar.jsx
          │  ├─ src/components/AcronymText.jsx
          │  └─ src/components/ProfilePanel.jsx
          ├─ Handoff modal
          │  └─ src/components/handoff/ShiftEndModal.jsx
          ├─ Mock data
          │  └─ src/data/*
          ├─ Utilities
          │  └─ src/utils/*
          └─ Styles
             ├─ src/styles.css
             ├─ src/styles/*
             └─ src/components/**/**/*.css

Vite dev server
  └─ proxy /api -> http://127.0.0.1:3001

Express server
  └─ server/index.js
      └─ OpenAI Responses API
```

라우터 라이브러리는 사용하지 않습니다. 현재 화면 전환은 `App.jsx`의 React state로 처리합니다.

## 각 디렉터리의 책임

### 루트

- `index.html`: 메인 폰트 (SUIT), Bootstrap Icons CDN, React root를 정의합니다.
- `package.json`: Vite, Express, OpenAI SDK 실행 스크립트와 의존성을 관리합니다.
- `vite.config.js`: React/Tailwind 플러그인과 `/api` 프록시를 설정합니다.
- `server/index.js`: Express API 서버입니다.

### `src/`

- `main.jsx`: React 앱 진입점입니다. `styles.css`를 전역으로 import합니다.
- `App.jsx`: 현재 앱의 가장 큰 조율자입니다. 화면 전환, 채팅 상태, 현지화 API 호출, 인수인계 문서 오버레이, 인수인계 모달 연결을 담당합니다.
- `styles.css`: 전체 CSS import 순서를 관리하는 스타일 진입점입니다.

### `src/components/`

- `Avatar.jsx`: 이니셜, 이미지, 이모지 형태의 아바타 렌더링을 담당합니다.
- `AcronymText.jsx`: 메시지나 문서 텍스트 안의 약어를 안전하게 React element로 분리하고 팝오버 트리거를 붙입니다.
- `ProfilePanel.jsx`: 채팅 상대 프로필 패널을 렌더링합니다.
- `dashboard/HandoffDashboard.jsx`: Dashboard 화면을 렌더링합니다.
- `handoff/ShiftEndModal.jsx`: 퇴근/인수인계 생성/검토/전송 모달 플로우를 렌더링합니다.

### `src/data/`

- `chatMock.js`: 메신저 연락처, 프로필, 초기 메시지, 현지화 glossary, 언어 매핑, 사용자 용어 입력 기본값을 관리합니다.
- `handoffMock.js`: Dashboard용 mock 데이터를 관리합니다.
- `handoffFlowMock.js`: 인수인계 모달에서 사용하는 대상자, 프로젝트, 진행 중 인수인계 mock 데이터를 관리합니다.

### `src/types/`

현재 프로젝트는 주로 JSX 파일로 구현되어 있지만, 주요 데이터 계약은 TypeScript 타입 파일로 정리되어 있습니다.

- `localization.ts`: AI 현지화 결과와 약어 설명 타입을 정의합니다.
- `handoff.ts`: Dashboard와 Handoff 데이터 타입을 정의합니다.

### `src/utils/`

- `acronyms.js`: 약어 문자열 탐색, 정규식 escape, 사용자 약어와 메시지 약어 병합을 담당합니다.
- `messageGrouping.js`: 연속 메시지 시간 표시와 메시지 간격 판단을 담당합니다.

### `src/styles/`

- `tokens.css`: 색상, radius, shadow 등 디자인 토큰과 Tailwind theme 값을 관리합니다.
- `globals.css`: reset, body/html, 앱 기본 레이아웃, form 요소 기본값을 관리합니다.
- `animations.css`: keyframes와 공통 애니메이션을 관리합니다.
- `navigation.css`: 왼쪽 사이드바와 내비게이션 스타일을 관리합니다.
- `responsive.css`: 화면 크기에 따른 responsive 보정 스타일을 관리합니다.
- `utilities.css`: 공통 utility 스타일을 위한 파일입니다.

### 컴포넌트별 CSS

- `components/chat/chat.css`: 메신저, 채팅 목록, 채팅창, 입력 영역, 약어 팝오버 관련 스타일을 관리합니다.
- `components/dashboard/dashboard.css`: Dashboard 전용 스타일을 관리합니다.
- `components/handoff/handoff.css`: Shift end modal, 인수인계 문서, 인수인계 브리핑 카드 관련 스타일을 관리합니다.
- `components/project/project.css`: 프로젝트/문서 성격의 UI 스타일을 관리합니다.

## 주요 페이지와 화면

### Dashboard

파일:

- `src/components/dashboard/HandoffDashboard.jsx`
- `src/components/dashboard/dashboard.css`
- `src/data/handoffMock.js`
- `src/data/handoffFlowMock.js`

역할:

- 퇴근까지 남은 시간과 업무 요약 표시
- 완료/막힘/확인 필요/결정 사항 count 표시
- 진행 중인 인수인계 목록 표시
- 지금 확인이 필요한 항목 표시
- 최근 요청사항 표시
- 팀원 목록 표시
- `근무 종료 & 인수인계` 버튼을 통해 Handoff modal을 엽니다.

### Messenger

파일:

- `src/App.jsx`
- `src/components/Avatar.jsx`
- `src/components/AcronymText.jsx`
- `src/components/ProfilePanel.jsx`
- `src/components/chat/chat.css`
- `src/data/chatMock.js`

역할:

- 연락처 목록과 채팅 메시지 표시
- 메시지 입력과 전송
- AI 현지화 버튼 및 preview 흐름
- 현지화된 메시지의 원문 보기
- 약어/전문 용어 팝오버
- 인수인계 브리핑 카드 표시

### Handoff Modal

파일:

- `src/components/handoff/ShiftEndModal.jsx`
- `src/components/handoff/handoff.css`
- `src/data/handoffFlowMock.js`

역할:

- 근무 종료 확인
- 인수인계 대상자 선택
- 프로젝트 선택
- mock 수집 단계 표시
- 추가 전달 내용 입력
- mock 생성 단계와 카운터 표시
- 인수인계서 검토
- 전송 중/전송 완료 상태 표시

현재 이 모달은 실제 AI 인수인계 API를 호출하지 않습니다.

### Handoff Document Overlay

파일:

- `src/App.jsx`
- `src/components/handoff/handoff.css`

역할:

- 메신저의 인수인계 카드 클릭 시 문서 오버레이 표시
- 카드 스택/페이지 넘김 UI
- 한국어/일본어 문서 전환
- 전문 용어 팝오버 표시

문서 페이지 구성 함수와 용어 데이터는 현재 `App.jsx` 안에 있습니다.

## 상태 관리 방식

전역 상태 관리 라이브러리는 없습니다. `useState`, `useMemo`, `useEffect`, `useRef`로 상태를 관리합니다.

주요 상태는 `src/App.jsx`에 있습니다.

- `activeView`: Dashboard와 Messenger 화면 전환
- `contacts`, `selectedId`, `messages`: 메신저 데이터
- `draft`: 현재 입력 중인 메시지
- `localizationResult`, `appliedLocalization`, `localizationLoading`, `localizationError`: AI 현지화 상태
- `userAcronyms`, `termPanelOpen`, `termListOpen`, `editingAcronym`, `termForm`: 사용자 용어 설정 상태
- `shiftEndOpen`, `shiftModalStep`, `selectedHandoffRecipient`, `selectedHandoffProject`: 인수인계 모달 상태
- `activeHandoffDocumentId`, `handoffDocumentPage`, `handoffDocumentLanguage`: 인수인계 문서 오버레이 상태

`ShiftEndModal.jsx` 내부에도 모달 UI 전용 local state가 있습니다.

- 준비 항목 순차 표시
- 생성 단계와 카운터
- 추가 전달 내용 입력
- 검토 문서의 일본어 전환 상태

## API 호출 흐름

현재 클라이언트가 호출하는 실제 API는 `/api/localize`입니다.

```text
사용자 메시지 입력
  -> AI 현지화 버튼 클릭
  -> App.jsx localizeDraft()
  -> fetch('/api/localize')
  -> Vite proxy
  -> server/index.js POST /api/localize
  -> OpenAI Responses API
  -> LocalizationResult JSON
  -> App.jsx 상태 저장
  -> Localization preview 표시
  -> 적용/전송
```

Vite 개발 서버는 `vite.config.js`에서 `/api` 요청을 `http://127.0.0.1:3001`로 프록시합니다.

## AI 요청 흐름

파일:

- `server/index.js`
- `src/App.jsx`
- `src/data/chatMock.js`
- `src/types/localization.ts`

흐름:

1. `App.jsx`의 `localizeDraft()`가 현재 메시지, source/target language, recipient, glossary를 구성합니다.
2. 클라이언트는 `/api/localize`로 POST 요청을 보냅니다.
3. `server/index.js`는 payload를 검증합니다.
4. `OPENAI_API_KEY`가 없으면 서버가 오류를 반환합니다.
5. OpenAI Responses API를 호출합니다.
6. JSON schema로 `LocalizationResult` 구조를 요구합니다.
7. 서버가 응답을 검증하고 클라이언트에 반환합니다.
8. 클라이언트는 preview를 표시하고, 사용자가 적용하면 입력창에 현지화 문장을 반영합니다.

현재 AI 요청은 메시지 현지화에만 사용됩니다. 인수인계 생성은 아직 실제 AI API와 연결되어 있지 않습니다.

## Handoff 데이터 흐름

Dashboard와 Handoff modal은 mock data 기반입니다.

```text
src/data/handoffMock.js
  -> HandoffDashboard.jsx
  -> Dashboard 표시

src/data/handoffFlowMock.js
  -> HandoffDashboard.jsx
  -> ShiftEndModal.jsx
  -> 대상자/프로젝트/진행 중 인수인계 표시

ShiftEndModal.jsx
  -> 사용자가 대상자, 프로젝트, 추가 요청 선택/입력
  -> App.jsx deliverHandoffToMessenger()
  -> messages state에 handoff-card 메시지 추가
  -> Messenger에서 인수인계 브리핑 카드 표시
  -> 카드 클릭
  -> App.jsx Handoff Document Overlay 표시
```

현재 인수인계 데이터는 저장되지 않습니다. 새로고침하면 React state로 추가된 메시지는 사라집니다.

## 주요 TypeScript 타입

### `src/types/localization.ts`

- `LocalizationChangeType`
- `LocalizationChange`
- `LocalizationResult`
- `AcronymExplanation`

이 타입들은 AI 현지화 응답과 약어 설명 UI의 데이터 구조를 설명합니다.

### `src/types/handoff.ts`

- `TeamWorkStatus`
- `DashboardMode`
- `TeamTimezone`
- `HandoffSummary`
- `AttentionItem`
- `ActiveHandoff`
- `Decision`
- `ShiftEndingSummary`
- `HandoffDashboardData`

이 타입들은 Dashboard와 Handoff mock data의 구조를 설명합니다.

## Mock Data 위치

질문: Mock data는 어디에 있는가?

- 메신저 연락처/초기 메시지/프로필: `src/data/chatMock.js`
- Dashboard 데이터: `src/data/handoffMock.js`
- 인수인계 대상자/프로젝트/진행 중 목록: `src/data/handoffFlowMock.js`
- 인수인계 문서 페이지 일부와 문서 용어 데이터: 현재 `src/App.jsx`
- 인수인계 모달 생성/검토 단계 데이터: 현재 `src/components/handoff/ShiftEndModal.jsx`

## 공통 스타일 위치

질문: 공통 스타일은 어디에서 관리하는가?

- 스타일 import 순서: `src/styles.css`
- 디자인 토큰: `src/styles/tokens.css`
- 전역 reset/body/form 기본값: `src/styles/globals.css`
- 공통 애니메이션: `src/styles/animations.css`
- 사이드바: `src/styles/navigation.css`
- responsive 보정: `src/styles/responsive.css`

기능별 스타일은 각 컴포넌트 폴더의 CSS 파일에서 관리합니다.

## 자주 수정하는 위치

### 인수인계 UI를 수정하려면 어디를 봐야 하는가?

- Dashboard 카드/목록/팀원 영역: `src/components/dashboard/HandoffDashboard.jsx`
- Dashboard 스타일: `src/components/dashboard/dashboard.css`
- 퇴근/인수인계 모달: `src/components/handoff/ShiftEndModal.jsx`
- 모달과 문서 스타일: `src/components/handoff/handoff.css`
- 인수인계 문서 오버레이와 메신저 카드 연결: `src/App.jsx`

### AI 인수인계 로직을 수정하려면 어디를 봐야 하는가?

현재 실제 AI 인수인계 로직은 구현되어 있지 않습니다.

현재 mock 흐름을 수정하려면:

- 생성 단계 UI와 mock 카운터: `src/components/handoff/ShiftEndModal.jsx`
- 생성 후 메신저로 전달되는 mock 메시지: `src/App.jsx`의 `deliverHandoffToMessenger`
- 인수인계 대상자/프로젝트 mock: `src/data/handoffFlowMock.js`

실제 AI 인수인계 API를 추가하려면:

- 서버 route 추가: `server/index.js`
- 클라이언트 호출 위치: `ShiftEndModal.jsx` 또는 `App.jsx`
- 응답 타입 추가: `src/types/handoff.ts`
- mock 대체 데이터 위치: `src/data/handoffMock.js` 또는 별도 API 응답 mapping 함수

### 새로운 API를 추가하려면 어디에 작성하는가?

현재 Express 서버는 `server/index.js` 하나입니다.

새 API 추가 기본 위치:

- 서버 route: `server/index.js`
- 클라이언트 fetch 호출: 해당 화면 컴포넌트 또는 `App.jsx`
- 개발 프록시: 같은 `/api` prefix를 사용하면 `vite.config.js` 수정 없이 동작합니다.

API key가 필요한 외부 서비스 호출은 클라이언트가 아니라 반드시 `server/index.js` 쪽에서 처리합니다.

### Mock data는 어디에 있는가?

- `src/data/chatMock.js`
- `src/data/handoffMock.js`
- `src/data/handoffFlowMock.js`

단, 일부 인수인계 문서 page data와 검토 단계 data는 아직 `App.jsx`, `ShiftEndModal.jsx` 내부에 남아 있습니다.

### 공통 스타일은 어디에서 관리하는가?

- `src/styles/tokens.css`
- `src/styles/globals.css`
- `src/styles/animations.css`
- `src/styles/navigation.css`
- `src/styles/responsive.css`
- `src/styles.css`

## 새로운 기능 추가 가이드

### 메신저 기능 추가

1. 데이터가 mock이면 `src/data/chatMock.js`에 추가합니다.
2. 화면 상태가 필요하면 `src/App.jsx`에 state를 추가합니다.
3. 메시지 렌더링 변경은 `src/App.jsx`의 Messenger 영역과 `src/components/chat/chat.css`를 확인합니다.
4. 약어/용어 처리 변경은 `src/components/AcronymText.jsx`와 `src/utils/acronyms.js`를 확인합니다.

### Dashboard 기능 추가

1. 데이터 구조가 필요하면 `src/types/handoff.ts`에 타입을 추가합니다.
2. mock data는 `src/data/handoffMock.js` 또는 `src/data/handoffFlowMock.js`에 추가합니다.
3. UI는 `src/components/dashboard/HandoffDashboard.jsx`에서 수정합니다.
4. 스타일은 `src/components/dashboard/dashboard.css`에서 수정합니다.

### Handoff modal 단계 추가

1. `src/App.jsx`의 `shiftModalStep` 흐름을 확인합니다.
2. `src/components/handoff/ShiftEndModal.jsx`에서 새 step 렌더링을 추가합니다.
3. 버튼 전환은 `onNext`, `onBack`, `onHandoff`, `onConfirm` 흐름을 확인합니다.
4. 스타일은 `src/components/handoff/handoff.css`에서 추가합니다.

### 서버 API 추가

1. `server/index.js`에 route를 추가합니다.
2. 필요한 환경변수를 `.env`에 추가하고 README를 업데이트합니다.
3. 클라이언트에서는 `/api/...` 형태로 호출합니다.
4. API key나 secret은 클라이언트에 노출하지 않습니다.

## 현재 구현되지 않은 것

다음 기능은 현재 코드에 실제 구현되어 있지 않습니다.

- 실제 AI 인수인계 생성 API
- 데이터베이스 저장
- 사용자 인증
- 실시간 채팅
- 외부 협업 도구 연동
- 실제 문서 파일 export
- 실제 알림 시스템

문서나 UI에서 해당 흐름처럼 보이는 부분이 있더라도, 현재는 mock data와 React state 기반의 프로토타입입니다.

