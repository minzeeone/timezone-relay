# Timezone Relay

![banner.png](src/assets/logo_banner.png)

## 오늘 변경사항 요약

- 대시보드 상단 로고를 텍스트 `APEX`에서 `src/assets/TR_Logo.png` 이미지로 교체했습니다.
- 모바일 화면에서 로고 위치가 오른쪽 프로필/버튼 높이와 맞도록 조정했습니다.
- 대시보드 조직 배지의 폰트 굵기를 낮추고, 원형 아이콘 배경을 검은색 75% 투명도로 변경했습니다.
- 일정 탭의 타임라인을 데이터 기반 렌더링 구조로 정리했습니다.
- 타임라인 블록 데이터에 `schedule.date`를 추가해 선택한 날짜와 연결되도록 했습니다.
- 날짜 이전/다음 버튼을 누르면 선택 날짜가 바뀌고, 오늘 라벨이 `n일 전` 또는 `n일 후`로 표시되도록 했습니다.
- 타임라인 초기 표시 범위를 16시간으로 설정했습니다.
- 타임라인에 마우스를 올리면 포인터 위치의 시간이 상단 시간 라벨 위치에 실시간으로 표시되도록 했습니다.
- 타임라인 가로 스크롤과 드래그 기반 표시 범위 조절을 유지하면서, 하단 스크롤바가 섹션 하단에 붙도록 조정했습니다.
- 타임라인 양 끝에 배경색과 어울리는 그라데이션 fade 레이어를 추가했습니다.
- React Flow 연결선을 노드 위치와 크기 기반으로 계산하도록 개선하고, 우회선은 직각으로 연결되도록 정리했습니다.
- 인수인계서의 인수자/인계자 현지 시간 표시를 `timing.js` 결과 기반으로 연결했습니다.
- 인수인계서의 추진계획 및 우선순위 섹션을 `briefing.tasks` 기반으로 정렬해 표시하도록 변경했습니다.

## 블록 데이터 사용 방법

일정 화면의 팀원/근무 블록은 데이터 파일에서 관리합니다.

주로 수정할 파일:

- `src/data/timelineData.js`: 팀원, 근무 날짜, 근무 시간, 블록 색상, 위치, 인수인계 연결 관계
- `src/data/projectData.js`: 프로젝트 목록과 색상
- `src/utils/timelinePosition.js`: 시간 기반 위치 계산 로직
- `src/types/timeline.ts`: Timeline 데이터 타입 정의
- `src/types/project.ts`: Project 데이터 타입 정의

## 팀원 블록 추가/수정

`src/data/timelineData.js`의 `timelineMembers` 배열을 수정하면 됩니다.

예시:

```js
{
  id: 'alex',
  profile: {
    name: 'Alex',
    team: '미국 개발팀',
    countryCode: 'US',
    avatarLabel: 'AL',
  },
  schedule: {
    date: '2026-08-18',
    startTime: '18:00',
    endTime: '01:00',
    timezone: 'America/Los_Angeles',
  },
  layout: {
    row: 1,
    avatarSide: 'left',
    flagPlacement: 'trailing',
  },
  theme: {
    background: 'rgba(142, 132, 28, 0.92)',
    accent: '#f2d94d',
    text: '#ffffff',
  },
  status: 'starting',
  projectIds: ['aurora'],
}
```

## 주요 필드

- `id`: React Flow node와 handoff edge에서 사용하는 고유 ID
- `profile.name`: 화면에 표시되는 이름
- `profile.team`: 소속 팀
- `profile.countryCode`: `KR`, `US`, `JP`, `GB` 같은 국가 코드
- `profile.avatar`: 이미지 경로
- `profile.avatarLabel`: 이미지가 없을 때 표시할 이니셜
- `schedule.date`: 근무 날짜, `YYYY-MM-DD` 형식
- `schedule.startTime`: 근무 시작 시간
- `schedule.endTime`: 근무 종료 시간
- `schedule.timezone`: 팀원의 타임존
- `layout.row`: 타임라인 세로 줄 위치
- `layout.xOffset`: 계산된 x 좌표 보정
- `layout.yOffset`: 계산된 y 좌표 보정
- `layout.widthOffset`: 계산된 블록 너비 보정
- `layout.avatarSide`: 프로필 위치, `left` 또는 `right`
- `layout.flagPlacement`: 국기 위치, `leading`, `trailing`, `none`
- `theme.background`: 블록 배경색
- `theme.accent`: 프로필 링/강조 색상
- `theme.text`: 텍스트 색상
- `status`: `working`, `starting`, `ending`, `offline`
- `projectIds`: 연결된 프로젝트 ID 목록
- `handoff.targetId`: 인수인계 연결 대상 팀원 ID

## 인수인계 선 연결

React Flow edge는 `handoff.targetId`를 기준으로 자동 생성됩니다.

예시:

```js
{
  id: 'kim',
  handoff: {
    targetId: 'alex',
    projectId: 'aurora',
  },
}
```

위처럼 설정하면 `kim -> alex` 연결선이 자동으로 만들어집니다.

## 시간과 위치 계산

블록은 현재 선택된 날짜와 `schedule.date`가 일치할 때만 표시됩니다.

## 날짜 데이터 연결

각 블록에는 반드시 `schedule.date`가 들어갑니다.

```js
schedule: {
  date: '2026-08-18',
  startTime: '18:00',
  endTime: '01:00',
  timezone: 'America/Los_Angeles',
}
```

일정 화면의 이전/다음 날짜 버튼이나 달력 날짜를 누르면 선택 날짜가 바뀌고, 선택 날짜와 `schedule.date`가 같은 블록만 타임라인에 표시됩니다.

예:

- 선택 날짜가 `2026-08-18`이면 `schedule.date: '2026-08-18'`인 블록만 표시
- 선택 날짜가 `2026-08-19`이면 `schedule.date: '2026-08-19'`인 블록만 표시
- 해당 날짜의 블록이 없으면 빈 상태 메시지를 표시

블록의 x 위치와 width는 `startTime`, `endTime`을 기준으로 계산됩니다.

- `09:00 -> 18:00`: 같은 날 근무
- `18:00 -> 01:00`: 다음 날 종료로 처리

`18:00 -> 01:00`처럼 종료 시간이 시작 시간보다 작거나 같으면 내부적으로 `01:00`을 `25:00`처럼 계산해서 overnight schedule을 처리합니다.

세로 위치는 다음 방식으로 계산합니다.

```js
y = TIMELINE_ROW_TOP + row * TIMELINE_ROW_HEIGHT + yOffset
```

따라서 팀원을 아래 줄로 내리고 싶으면 JSX를 수정하지 말고 `layout.row`만 바꾸면 됩니다.

## 프로젝트 데이터

프로젝트는 `src/data/projectData.js`에서 관리합니다.

```js
{
  id: 'aurora',
  name: 'Aurora Project',
  color: '#5ea8ff',
}
```

팀원 블록에서는 `projectIds: ['aurora']`처럼 ID만 참조합니다.

## 오늘 변경점

- 일정 화면의 근무 블록 데이터를 `src/data/timelineData.js`로 분리했습니다.
- 블록 데이터에 `schedule.date`를 추가해 날짜별 타임라인 렌더링이 가능하게 했습니다.
- 프로젝트 필터 데이터를 `src/data/projectData.js`로 분리했습니다.
- `TimelineMember`, `Project` TypeScript 타입을 추가했습니다.
- 시간 기반 위치 계산 유틸 `src/utils/timelinePosition.js`를 추가했습니다.
- 국가 코드 변환 유틸 `src/utils/country.js`를 추가했습니다.
- 기존 `TeamSchedule.jsx`의 사람 이름, 시간, 이미지, 색상, row, handoff edge 하드코딩을 제거했습니다.
- React Flow node를 `timelineMembers.map(...)`으로 자동 생성하도록 변경했습니다.
- React Flow edge를 `handoff.targetId` 기준으로 자동 생성하도록 변경했습니다.
- 블록 색상과 프로필 accent 색상을 CSS 고정값이 아니라 데이터의 `theme` 값으로 적용하도록 변경했습니다.
- 기존 타임존릴레이 타임라인 UI 디자인은 유지했습니다.

## 빌드 확인

마지막 확인:

```bash
npm run build
```

결과:

```text
✓ built
```
