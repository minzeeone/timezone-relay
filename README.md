# [Timezone-relay] border 2 - language

> [!WARNING]
> ### $\color{#DD6565}{\textsf{프론트엔드 구조 변경 주의}}$
>
> 본 브랜치는 **React + Vite** 기반으로 구현되어 있어  
> 기존 **Vanilla HTML / CSS / JavaScript** 프로젝트와 구조가 다릅니다.
>
> 병합 시 다음 항목에 영향을 줄 수 있습니다.
>
> - 🔴 `index.html` — 기존 HTML 구조와 충돌 가능
> - 🟠 `package.json` — React / Vite 의존성 및 실행 환경 추가
> - 🟡 `CSS` — 기존 전역 스타일과 충돌 가능
> - 🟣 `JavaScript` — 기존 DOM 기반 로직과 React 구조의 차이
> - 🔵 `Build` — 기존 실행 방식에서 Vite 기반 빌드 방식으로 변경될 수 있음
>
> $\color{#DD6565}{\textsf{\textbf{PR을 Merge하기 전에 프론트엔드 구조를 반드시 확인해주세요.}}}$

-----------------------------------

현재 구현은 크게 두 가지 흐름으로 구성되어 있습니다.

- 글로벌 협업 메신저: 팀원과 대화하고, 메시지를 AI 현지화한 뒤 전송할 수 있습니다.
- AI 업무 인수인계 UI: 퇴근 전 인수인계 대상자와 프로젝트를 선택하고, mock 데이터를 기반으로 인수인계 브리핑을 생성/검토/전달하는 화면 흐름을 제공합니다.

실제 OpenAI API가 연결된 기능은 메시지 현지화(`/api/localize`)입니다. 인수인계 생성 자체는 아직 실제 AI API나 데이터베이스에 연결되어 있지 않고, 프론트엔드 mock UI로 동작합니다.

## 핵심 기능

- 메신저 대화 목록과 채팅 화면
- 서버 측 OpenAI Responses API 기반 메시지 현지화
- 현지화 결과 미리보기, 적용, 원문 보기
- 약어/전문 용어 설명 팝오버
- 사용자가 직접 추가하는 용어 설명
- 팀원 프로필 패널
- Handoff Dashboard
- 퇴근 및 인수인계 생성 모달 플로우
- 인수인계 문서 미리보기, 페이지 넘김, 한국어/일본어 전환
- 생성된 인수인계 브리핑을 메신저 카드 형태로 전달하는 mock 흐름

## 기술 스택

- React
- Vite
- Tailwind CSS v4 Vite plugin
- CSS
- Bootstrap Icons
- SUIT 웹폰트
- Express
- dotenv
- OpenAI SDK

## 설치 방법

```bash
npm install
```

## 실행 방법

프론트엔드와 백엔드 서버를 각각 실행해야 합니다.

터미널 1:

```bash
npm run server
```

터미널 2:

```bash
npm run dev
```

Vite 개발 서버 주소로 접속합니다. 일반적으로 `http://localhost:5173`에서 실행됩니다.

프로덕션 빌드 확인:

```bash
npm run build
```

빌드 결과 미리보기:

```bash
npm run preview
```

## 환경변수 설정

루트 디렉터리에 `.env` 파일을 둡니다.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_LOCALIZATION_MODEL=gpt-5-nano
OPENAI_HANDOFF_MODEL=gpt-5.4
PORT=3001
```

- `OPENAI_API_KEY`: Border 02(언어) 현지화 API에서 사용합니다.
- `OPENAI_LOCALIZATION_MODEL`: 현지화 API에서 사용할 모델입니다. 설정하지 않으면 `gpt-5-nano`를 사용합니다.
- `OPENAI_HANDOFF_MODEL`: Border 04(조직) 인수인계 브리핑 생성에 쓸 모델입니다. 설정하지 않으면 `gpt-5.4` 를 사용합니다. (변경점 감지 정확도 때문에 상위 모델을 씁니다)
- Border 04 는 `OPENAI_API_KEY` 가 없으면 규칙 기반 데모 모드로 동작합니다 (서버가 죽지는 않습니다).
- `PORT`: Express 서버 포트입니다. 설정하지 않으면 `3001`을 사용합니다.

API key는 클라이언트 코드나 `VITE_` 환경변수에 넣지 않습니다. 현재 클라이언트는 `/api/localize`만 호출하고, OpenAI API는 `server/index.js`에서만 호출합니다.

`.gitignore`에는 `.env`, `.env.*`, `node_modules/`, `dist/`가 제외되어 있습니다.

## 주요 폴더 구조

```text
.
├─ index.html
├─ package.json
├─ vite.config.js
├─ server/
│  └─ index.js
└─ src/
   ├─ App.jsx
   ├─ main.jsx
   ├─ styles.css
   ├─ assets/
   │  ├─ profile-banner.jpg
   │  └─ waguri-kaoruko.jpg
   ├─ components/
   │  ├─ AcronymText.jsx
   │  ├─ Avatar.jsx
   │  ├─ ProfilePanel.jsx
   │  ├─ chat/
   │  │  └─ chat.css
   │  ├─ dashboard/
   │  │  ├─ HandoffDashboard.jsx
   │  │  └─ dashboard.css
   │  ├─ handoff/
   │  │  ├─ ShiftEndModal.jsx
   │  │  └─ handoff.css
   │  └─ project/
   │     └─ project.css
   ├─ data/
   │  ├─ chatMock.js
   │  ├─ handoffFlowMock.js
   │  └─ handoffMock.js
   ├─ styles/
   │  ├─ animations.css
   │  ├─ globals.css
   │  ├─ navigation.css
   │  ├─ responsive.css
   │  ├─ tokens.css
   │  └─ utilities.css
   ├─ types/
   │  ├─ handoff.ts
   │  └─ localization.ts
   └─ utils/
      ├─ acronyms.js
      └─ messageGrouping.js
```

`src/server/` 디렉터리는 현재 비어 있습니다. 실제 API 서버는 루트의 `server/index.js`에 있습니다.

## Git 작업 방법

Git을 사용하는 경우 다음 흐름을 권장합니다.

```bash
git status
git checkout -b feature/작업-이름
npm run build
git add README.md ARCHITECTURE.md
git commit -m "docs: add onboarding documentation"
```

작업 전후로 확인할 것:

- `.env`는 커밋하지 않습니다.
- `node_modules/`와 `dist/`는 커밋하지 않습니다.
- 기능 수정 시 `npm run build`로 Vite 빌드 오류를 확인합니다.
- UI 작업 시 Dashboard, Messenger, Handoff modal 흐름을 함께 확인합니다.

## 현재 개발 상태

구현되어 있는 것:

- React + Vite 기반 단일 페이지 UI
- Express 기반 최소 백엔드
- `/api/localize` 메시지 현지화 API
- OpenAI Responses API 기반 구조화 JSON 응답 처리
- Dashboard, Messenger, Handoff modal, Handoff document UI
- mock data 기반 팀원/메시지/인수인계 데이터
- CSS 파일 역할별 분리

아직 구현되지 않은 것:

- 실제 AI 인수인계 생성 API
- 데이터베이스 저장
- 로그인/회원가입
- WebSocket 실시간 통신
- Slack, Jira, GitHub, Notion 등 외부 서비스 연동
- 실제 timezone API
- 인수인계 문서 파일 내보내기 실제 구현

