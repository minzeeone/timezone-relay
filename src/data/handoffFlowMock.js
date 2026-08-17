import waguriKaorukoAvatar from '../assets/waguri-kaoruko.jpg';

export const activeHandoffs = [
  { title: '분석 알고리즘 개발', team: 'MX 개발팀', status: '진행중', icon: 'bi-bar-chart-fill' },
  { title: '프로필 UX 리뷰얼', team: 'US 지사', status: '검토중', icon: 'bi-arrow-clockwise' },
];

export const handoffRecipients = [
  { name: 'Alexander Lily', meta: '근무종료 - 05:32 미국 뉴욕', avatar: '👨🏻‍💼', status: 'offline' },
  { name: 'Jaxon David', meta: '근무종료 - 08:32 러시아', avatar: 'JD', status: 'offline' },
  { name: '김멋사', meta: '회의중 - 05:32 대한민국 서울', avatar: '🦁', status: 'busy' },
  { name: '와구리 카오루코', meta: '근무중 - 17:32 일본 도쿄', avatar: '🧑🏻‍💻', avatarImage: waguriKaorukoAvatar, status: 'online' },
  { name: 'Jason', meta: '자리비움 - 09:32 영국 런던', avatar: 'J', status: 'away' },
];

export const handoffProjects = ['Project Aurora', 'Orbit', 'Nova', 'Orbit'];
