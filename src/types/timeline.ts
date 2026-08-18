export type TimelineStatus = 'working' | 'starting' | 'ending' | 'offline';

export type TimelineAvatarSide = 'left' | 'right';

export type TimelineFlagPlacement = 'leading' | 'trailing' | 'none';

export interface TimelineMember {
  id: string;

  profile: {
    name: string;
    team: string;
    countryCode: string;
    avatar?: string;
    avatarLabel?: string;
  };

  schedule: {
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
  };

  layout: {
    row: number;
    xOffset?: number;
    yOffset?: number;
    widthOffset?: number;
    avatarSide?: TimelineAvatarSide;
    flagPlacement?: TimelineFlagPlacement;
  };

  theme: {
    background: string;
    accent: string;
    text?: string;
  };

  status: TimelineStatus;

  projectIds: string[];

  handoff?: {
    targetId: string;
    projectId?: string;
  };
}
