import profileBanner from '../assets/profile-banner.jpg';
import waguriKaorukoAvatar from '../assets/waguri-kaoruko.jpg';
import { presenceOf } from '../utils/timing.js';

/**
 * 연락처 목록/프로필의 현지 시각은 고정값이 아니라 실제로 흘러가야 합니다.
 * time, message, localTime 을 getter 로 두어 화면이 그려질 때마다 다시 계산합니다.
 */
const withPresence = (contact) => ({
  ...contact,
  get time() {
    return presenceOf(this.countryCode, this.fixedState).clock;
  },
  get message() {
    return `${presenceOf(this.countryCode, this.fixedState).state} - ${this.cityLabel}`;
  },
});

/** 프로필 패널에 표시할 "10:48 AM · KST" 형태의 현지 시각입니다. */
const liveLocalTime = (countryCode) => {
  const { clock12, zoneAbbr } = presenceOf(countryCode);
  return `${clock12} · ${zoneAbbr}`;
};

const legacyContactsSeed = [
  {
    id: 1,
    name: 'John Hartwig',
    avatar: 'JH',
    avatarType: 'initial',
    status: 'online',
    time: '방금 전',
    message: '새로운 메시지 2개가 있습니다.',
    unread: 2,
    language: 'ENG',
    active: true,
    starred: false,
  },
  {
    id: 2,
    name: 'Alexander Jason',
    avatar: '👩🏼',
    avatarType: 'emoji',
    status: 'online',
    time: '3분 전',
    message: '새로운 메시지 2개가 있습니다.',
    unread: 2,
    language: 'KOR',
    starred: false,
  },
  {
    id: 3,
    name: '김멋사',
    avatar: '🦁',
    avatarType: 'emoji',
    status: 'busy',
    time: '1시간 전',
    message: '새로운 메시지 1개가 있습니다.',
    unread: 1,
    language: 'KOR',
    starred: false,
  },
  {
    id: 4,
    name: 'Lionel Messi',
    avatar: '👨🏻‍💼',
    avatarType: 'emoji',
    status: 'online',
    time: '3분 전',
    message: '나: Ronaldo Better.',
    unread: 0,
    language: 'ENG',
    starred: false,
  },
  {
    id: 5,
    name: 'Lionel Messi',
    avatar: '👨🏻‍💼',
    avatarType: 'emoji',
    status: 'online',
    time: '3분 전',
    message: '나: Ronaldo Better.',
    unread: 0,
    language: 'ENG',
    starred: false,
  },
];

export const contactsSeed = [
  withPresence({
    id: 1,
    name: 'Alexander Lily',
    avatar: 'AL',
    avatarType: 'initial',
    status: 'offline',
    unread: 2,
    language: 'ENG',
    active: true,
    starred: false,
    countryCode: 'US',
    cityLabel: '미국 뉴욕',
  }),
  withPresence({
    id: 2,
    name: 'Jaxon David',
    avatar: 'JD',
    avatarType: 'initial',
    status: 'offline',
    unread: 2,
    language: 'ENG',
    starred: false,
    countryCode: 'RU',
    cityLabel: '러시아 모스크바',
  }),
  withPresence({
    id: 3,
    name: '김멋사',
    avatar: '🦁',
    avatarType: 'emoji',
    status: 'busy',
    unread: 1,
    language: 'KOR',
    starred: false,
    countryCode: 'KR',
    cityLabel: '대한민국 서울',
    fixedState: '회의중',
  }),
  withPresence({
    id: 4,
    name: 'Waguri Kaoruko',
    avatar: 'WK',
    avatarImage: waguriKaorukoAvatar,
    avatarType: 'image',
    status: 'online',
    unread: 0,
    language: 'JPN',
    starred: false,
    countryCode: 'JP',
    cityLabel: '일본 도쿄',
  }),
  withPresence({
    id: 5,
    name: 'Jason',
    avatar: 'J',
    avatarType: 'initial',
    status: 'away',
    unread: 0,
    language: 'ENG',
    starred: false,
    countryCode: 'GB',
    cityLabel: '영국 런던',
    fixedState: '자리비움',
  }),
];

export const contactProfiles = {
  1: {
    email: 'johnhart0392@example.com',
    location: '미국 워싱턴',
    localTime: '10:48 AM · ETC',
    role: 'Product Manager of APEX Company',
    phone: '123-456-789',
    coverImage: profileBanner,
    projects: [
      {
        title: 'Aurora 글로벌 인증 API 개선',
        progress: 72,
        icon: 'bi-shield-check',
        tone: 'yellow',
      },
      {
        title: '분석 대시보드 리뉴얼',
        progress: 48,
        icon: 'bi-bar-chart-line',
        tone: 'coral',
      },
    ],
  },
  2: {
    email: 'alexander.jason@example.com',
    location: '대한민국 서울',
    localTime: '12:48 AM · KST',
    role: 'Localization Designer of APEX Company',
    phone: '010-4567-1209',
    coverImage: profileBanner,
    projects: [
      {
        title: 'DASH 온보딩 문구 현지화',
        progress: 64,
        icon: 'bi-translate',
        tone: 'yellow',
      },
      {
        title: '글로벌 협업 플로우 QA',
        progress: 36,
        icon: 'bi-check2-square',
        tone: 'coral',
      },
    ],
  },
  default: {
    email: 'teammate@example.com',
    location: '원격 협업',
    localTime: '10:48 AM · Local',
    role: 'Global Teammate of APEX Company',
    phone: '123-456-789',
    coverImage: profileBanner,
    projects: [
      {
        title: 'Aurora 릴리즈 협업',
        progress: 58,
        icon: 'bi-kanban',
        tone: 'yellow',
      },
      {
        title: '현지화 품질 리뷰',
        progress: 41,
        icon: 'bi-stars',
        tone: 'coral',
      },
    ],
  },
};

Object.assign(contactProfiles, {
  1: {
    email: 'alexander.lily@example.com',
    location: '미국 뉴욕',
    get localTime() {
      return liveLocalTime('US');
    },
    role: 'Backend Engineer of APEX Company',
    phone: '123-456-2101',
    coverImage: profileBanner,
    projects: [
      {
        title: 'Aurora 인증 API 개선',
        progress: 72,
        icon: 'bi-shield-check',
        tone: 'yellow',
      },
      {
        title: 'Production QA 리뷰',
        progress: 48,
        icon: 'bi-bar-chart-line',
        tone: 'coral',
      },
    ],
  },
  2: {
    email: 'jaxon.david@example.com',
    location: '러시아',
    get localTime() {
      return liveLocalTime('RU');
    },
    role: 'Platform Engineer of APEX Company',
    phone: '123-456-2102',
    coverImage: profileBanner,
    projects: [
      {
        title: 'IAM Role 권한 점검',
        progress: 58,
        icon: 'bi-key',
        tone: 'yellow',
      },
      {
        title: 'DASH 안정화',
        progress: 41,
        icon: 'bi-stars',
        tone: 'coral',
      },
    ],
  },
  3: {
    email: 'kim.meotsa@example.com',
    location: '대한민국 서울',
    get localTime() {
      return liveLocalTime('KR');
    },
    role: 'Frontend Engineer of APEX Company',
    phone: '010-4567-1209',
    coverImage: profileBanner,
    projects: [
      {
        title: 'Aurora 로그인 UI 개편',
        progress: 86,
        icon: 'bi-window-sidebar',
        tone: 'yellow',
      },
      {
        title: '인수인계 브리핑 QA',
        progress: 64,
        icon: 'bi-check2-square',
        tone: 'coral',
      },
    ],
  },
  4: {
    email: 'waguri.kaoruko@example.com',
    location: '일본 도쿄',
    get localTime() {
      return liveLocalTime('JP');
    },
    role: 'Product Manager of APEX Company',
    phone: '123-456-2104',
    coverImage: profileBanner,
    projects: [
      {
        title: 'Aurora 글로벌 인증 API 개선',
        progress: 72,
        icon: 'bi-shield-check',
        tone: 'yellow',
      },
      {
        title: '분석 대시보드 리뷰',
        progress: 48,
        icon: 'bi-bar-chart-line',
        tone: 'coral',
      },
    ],
  },
  5: {
    email: 'jason@example.com',
    location: '영국 런던',
    get localTime() {
      return liveLocalTime('GB');
    },
    role: 'Design Lead of APEX Company',
    phone: '123-456-2105',
    coverImage: profileBanner,
    projects: [
      {
        title: '프로필 UX 리뷰얼',
        progress: 54,
        icon: 'bi-arrow-clockwise',
        tone: 'yellow',
      },
      {
        title: 'Orbit 핸드오프 개선',
        progress: 37,
        icon: 'bi-kanban',
        tone: 'coral',
      },
    ],
  },
});

export const initialMessages = [
  {
    id: 1,
    sender: 'them',
    text: ['의중님', '시간 되실 때', '의견 주시면 감사하겠습니다.'],
    time: '오후 10:41',
    createdAt: new Date('2026-08-12T22:41:00').getTime(),
    translated: true,
  },
  {
    id: 2,
    sender: 'me',
    text: ['Yes, I will send it tomorrow morning.'],
    time: '오후 10:42',
    createdAt: new Date('2026-08-12T22:42:00').getTime(),
    translated: true,
  },
  {
    id: 3,
    type: 'date',
    text: '2026년 8월 12일',
  },
  {
    id: 4,
    sender: 'them',
    text: ['의중님', '안녕하세요'],
    createdAt: new Date('2026-08-12T22:43:00').getTime(),
    translated: true,
  },
  {
    id: 5,
    sender: 'them',
    text: ['CI/CD 파이프라인을 확인했는데, IAM 역할에 필요한 권한이 빠져 있는 것 같습니다.'],
    time: '오후 10:45',
    createdAt: new Date('2026-08-12T22:45:00').getTime(),
    acronyms: [
      {
        acronym: 'CI/CD',
        fullForm: 'Continuous Integration / Continuous Delivery',
        explanation: '코드 빌드, 테스트, 배포 과정을 자동화하는 개발 프로세스입니다.',
        action: 'explain',
        reason: '배포 시스템을 직접 다루지 않는 협업자에게 맥락 설명이 필요할 수 있습니다.',
      },
      {
        acronym: 'IAM',
        fullForm: 'Identity and Access Management',
        explanation: '사용자나 서비스가 특정 리소스에 접근할 수 있는 권한을 관리하는 체계입니다.',
        action: 'explain',
        reason: '비개발 직군에게는 권한 문제의 원인을 이해하기 어려울 수 있어 설명합니다.',
      },
    ],
  },
  {
    id: 6,
    sender: 'them',
    text: ['JWT가 만료되어 API에서 401 응답이 반환되고 있습니다.'],
    time: '오후 10:46',
    createdAt: new Date('2026-08-12T22:46:00').getTime(),
    acronyms: [
      {
        acronym: 'API',
        fullForm: 'Application Programming Interface',
        explanation: '소프트웨어 시스템끼리 요청과 응답을 주고받기 위한 연결 방식입니다.',
        action: 'explain',
        reason: '자주 쓰이는 약어지만 제품 맥락에서는 어떤 연결 지점인지 설명이 도움이 됩니다.',
      },
      {
        acronym: 'JWT',
        fullForm: 'JSON Web Token',
        explanation: '시스템 사이에서 사용자 인증이나 권한 확인에 사용하는 토큰 형식입니다.',
        action: 'explain',
        reason: '인증 관련 용어는 비개발 협업자에게 낯설 수 있어 풀어서 설명합니다.',
      },
    ],
  },
  {
    id: 7,
    sender: 'them',
    text: ['다음 릴리즈 전에 SLA를 검토해야 합니다.'],
    time: '오후 10:47',
    createdAt: new Date('2026-08-12T22:47:00').getTime(),
    acronyms: [
      {
        acronym: 'SLA',
        fullForm: 'Service Level Agreement',
        explanation: '서비스 품질, 가용성, 응답 시간 같은 기대 수준을 정리한 합의입니다.',
        action: 'explain',
        reason: '릴리즈 전에 제품과 비즈니스 기대치를 맞추기 위해 설명이 필요합니다.',
      },
    ],
  },
];

export const localizationGlossary = [
  {
    term: 'Aurora',
    type: 'project',
    rule: 'preserve',
  },
  {
    term: 'DASH',
    type: 'product',
    rule: 'preserve',
  },
  {
    term: 'IAM',
    type: 'acronym',
    rule: 'preserve',
  },
  {
    term: 'CI/CD',
    type: 'acronym',
    rule: 'preserve',
  },
  {
    term: '배포',
    type: 'engineering',
    translation: 'deployment',
  },
];

export const languageMap = {
  ENG: 'en',
  KOR: 'ko',
  JPN: 'ja',
};

export const emptyTermForm = {
  acronym: '',
  fullForm: '',
  explanation: '',
  action: 'explain',
  reason: '',
};
