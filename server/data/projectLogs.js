/**
 * Border 04 (조직) 입력용 원시 작업 로그.
 *
 * 실제 제품에서는 Slack / GitHub / Notion 커넥터가 하루치 기록을 긁어옵니다.
 * 지금은 그 수집 결과를 흉내 낸 목업이고, 이 문자열이 그대로 AI 입력이 됩니다.
 * (커넥터가 붙으면 이 파일만 실제 수집 함수로 교체하면 됩니다)
 */

const AURORA = `[Slack #proj-aurora 09:14 KST] 지원: Aurora 배포 스크립트 리팩터링 브랜치 올렸어요. 리뷰 부탁드립니다
[GitHub 09:20 KST] opened PR #128 "refactor: split aurora deploy script"
[Notion / Aurora 09:40 KST] 지원: 배포 스크립트 리팩터링 진행중 (PR 올림)
[Slack #proj-aurora 10:02 KST] 카오루코: PR #128 봤습니다. 롤백 처리만 보완하면 될 것 같아요
[Slack #proj-aurora 11:30 KST] Jason: 굿모닝~ ☕
[GitHub 13:05 KST] merged PR #128 into main
[Slack #proj-aurora 13:10 KST] 지원: PR #128 머지했습니다
[Notion / Aurora 13:20 KST] 배포 스크립트 리팩터링 완료 ✅
[Slack #proj-aurora 14:00 KST] Alexander: staging 로그 포맷은 JSON으로 통일하기로 했습니다. 다들 동의하신 걸로 알게요
[GitHub 14:30 KST] opened issue #131 "IAM Role 권한 부족으로 production 배포 중단"
[Slack #proj-aurora 15:10 KST] 지원: #131은 인프라팀 답변 기다리는 중이라 오늘은 못 건드릴 것 같아요
[Slack #proj-aurora 15:12 KST] deploy-bot: Deploy to staging succeeded (build #881)
[Notion / Aurora 16:00 KST] TODO: 인증 플로우 QA 시나리오 작성 — 담당 카오루코`;

const ORBIT = `[Slack #proj-orbit 09:30 KST] 카오루코: Orbit 검색 인덱싱 배치 다시 돌렸습니다
[GitHub 09:45 KST] opened PR #77 "fix: reindex batch memory leak"
[Notion / Orbit 10:00 KST] 검색 인덱싱 배치 메모리 누수 수정 작업중
[Slack #proj-orbit 11:20 KST] 지원: PR #77 리뷰했어요. LGTM입니다
[GitHub 11:40 KST] merged PR #77
[Slack #proj-orbit 13:00 KST] Jaxon: 점심 뭐 드셨어요 🍜
[Slack #proj-orbit 14:20 KST] 카오루코: 검색 랭킹 가중치는 일단 기존 값 유지하기로 했습니다. A/B 결과 나오면 다시 논의해요
[Notion / Orbit 15:30 KST] TODO: 검색 응답시간 모니터링 대시보드 추가
[Slack #proj-orbit 16:10 KST] Jason: 인덱싱 서버 디스크가 80% 넘었는데 증설 요청 넣어둘게요`;

const NOVA = `[Slack #proj-nova 10:00 KST] Alexander: Nova 온보딩 플로우 와이어프레임 공유드립니다
[Notion / Nova 10:15 KST] 온보딩 플로우 와이어프레임 v2 업로드
[Slack #proj-nova 11:00 KST] 김멋사: 3단계는 좀 길어 보이는데 2단계로 줄이는 건 어떨까요
[Slack #proj-nova 13:40 KST] Alexander: 온보딩 3단계 → 2단계로 축소하기로 확정했습니다
[GitHub 14:00 KST] opened issue #45 "온보딩 2단계 축소 반영"
[Notion / Nova 15:00 KST] TODO: 축소된 플로우 기준으로 카피 다시 작성`;

const LOGS = {
  'Project Aurora': AURORA,
  Orbit: ORBIT,
  Nova: NOVA,
};

/** 프로젝트 이름으로 그날의 원시 로그를 가져옵니다. 없으면 Aurora 로 대체. */
export function collectProjectLogs(projectName) {
  return LOGS[projectName] ?? AURORA;
}

export const availableProjects = Object.keys(LOGS);
