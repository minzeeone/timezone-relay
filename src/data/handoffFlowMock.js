import waguriKaorukoAvatar from '../assets/waguri-kaoruko.jpg';
import { analyzeTiming } from '../utils/timing.js';

export const activeHandoffs = [
  { title: '분석 알고리즘 개발', team: 'MX 개발팀', status: '진행중', icon: 'bi-bar-chart-fill' },
  { title: '프로필 UX 리뷰얼', team: 'US 지사', status: '검토중', icon: 'bi-arrow-clockwise' },
];

/**
 * 팀원 카드에 표시할 "상태 - 현지시각 도시" 문구를 만듭니다.
 *
 * 회의중 / 자리비움 은 캘린더에서 오는 정보라 타임존으로는 알 수 없어서 그대로 두고,
 * 근무중 / 근무종료 만 Border 01(지리)의 실시간 계산으로 판정합니다.
 */
function buildRecipientMeta({ countryCode, cityLabel, fixedState }) {
  const timing = analyzeTiming(countryCode);
  const state = fixedState ?? (timing.isWorkHours ? '근무중' : '근무종료');
  const localClock = timing.localTime.slice(11); // 'YYYY-MM-DD HH:mm' → 'HH:mm'
  return `${state} - ${localClock} ${cityLabel}`;
}

/**
 * meta 를 getter 로 둔 이유:
 * 화면이 다시 그려질 때마다 현재 시각으로 계산되어야 타임존이 실제로 흘러갑니다.
 * (고정 문자열이면 "타임존 릴레이"인데 시계가 멈춰 있게 됩니다)
 */
export const handoffRecipients = [
  {
    name: 'Alexander Lily',
    countryCode: 'US',
    cityLabel: '미국 뉴욕',
    avatar: '👨🏻‍💼',
    status: 'offline',
    get meta() {
      return buildRecipientMeta(this);
    },
  },
  {
    name: 'Jaxon David',
    countryCode: 'RU',
    cityLabel: '러시아 모스크바',
    avatar: 'JD',
    status: 'offline',
    get meta() {
      return buildRecipientMeta(this);
    },
  },
  {
    name: '김멋사',
    countryCode: 'KR',
    cityLabel: '대한민국 서울',
    avatar: '🦁',
    status: 'busy',
    fixedState: '회의중',
    get meta() {
      return buildRecipientMeta(this);
    },
  },
  {
    name: '와구리 카오루코',
    countryCode: 'JP',
    cityLabel: '일본 도쿄',
    avatar: '🧑🏻‍💻',
    avatarImage: waguriKaorukoAvatar,
    status: 'online',
    get meta() {
      return buildRecipientMeta(this);
    },
  },
  {
    name: 'Jason',
    countryCode: 'GB',
    cityLabel: '영국 런던',
    avatar: 'J',
    status: 'away',
    fixedState: '자리비움',
    get meta() {
      return buildRecipientMeta(this);
    },
  },
];

// 백엔드(server/data/projectLogs.js)가 로그를 가지고 있는 프로젝트만 넣습니다.
export const handoffProjects = ['Project Aurora', 'Orbit', 'Nova'];
