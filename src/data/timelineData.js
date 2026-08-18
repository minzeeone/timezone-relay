import waguriKaorukoAvatar from '../assets/waguri-kaoruko.jpg';

export const timelineTeams = [
  {
    id: 'jp-product',
    label: '일본 제품팀',
    countryCode: 'JP',
  },
  {
    id: 'us-dev',
    label: '미국 개발팀',
    countryCode: 'US',
  },
  {
    id: 'gb-platform',
    label: '영국 플랫폼팀',
    countryCode: 'GB',
  },
];

export const timelineMembers = [
  {
    id: 'kim',
    profile: {
      name: '김의중',
      team: '개발팀',
      countryCode: 'KR',
      avatarLabel: '김',
    },
    schedule: {
      startTime: '08:30',
      endTime: '17:30',
      timezone: 'Asia/Seoul',
    },
    layout: {
      row: 0,
      avatarSide: 'right',
      flagPlacement: 'none',
    },
    theme: {
      background: 'rgba(46, 113, 102, 0.92)',
      accent: '#49f0c5',
      text: '#ffffff',
    },
    status: 'ending',
    projectIds: ['aurora'],
    handoff: {
      targetId: 'waguri',
      projectId: 'aurora',
    },
  },
  {
    id: 'alex',
    profile: {
      name: 'Alex',
      team: '미국 개발팀',
      countryCode: 'US',
      avatarLabel: 'AL',
    },
    schedule: {
      startTime: '19:00',
      endTime: '03:00',
      timezone: 'America/Los_Angeles',
    },
    layout: {
      row: 2,
      avatarSide: 'left',
      flagPlacement: 'trailing',
    },
    theme: {
      background: 'rgba(60, 84, 172, 0.92)',
      accent: '#75a7ff',
      text: '#ffffff',
    },
    status: 'starting',
    projectIds: ['aurora'],
  },
  {
    id: 'waguri',
    profile: {
      name: 'Waguri Kaoruko',
      team: '일본 제품팀',
      countryCode: 'JP',
      avatar: waguriKaorukoAvatar,
    },
    schedule: {
      startTime: '10:00',
      endTime: '19:00',
      timezone: 'Asia/Tokyo',
    },
    layout: {
      row: 1,
      avatarSide: 'right',
      flagPlacement: 'leading',
    },
    theme: {
      background: 'rgba(174, 22, 184, 0.92)',
      accent: '#c42bdd',
      text: '#ffffff',
    },
    status: 'ending',
    projectIds: ['orbit'],
    handoff: {
      targetId: 'alex',
      projectId: 'orbit',
    },
  },
  {
    id: 'olivia',
    profile: {
      name: 'Olivia',
      team: '영국 플랫폼팀',
      countryCode: 'GB',
      avatarLabel: 'OL',
    },
    schedule: {
      startTime: '14:00',
      endTime: '22:00',
      timezone: 'Europe/London',
    },
    layout: {
      row: 3,
      avatarSide: 'left',
      flagPlacement: 'trailing',
      yOffset: -8,
    },
    theme: {
      background: 'rgba(114, 65, 156, 0.92)',
      accent: '#c894ff',
      text: '#ffffff',
    },
    status: 'working',
    projectIds: ['nova'],
  },
];
