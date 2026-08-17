export type TeamWorkStatus = 'working' | 'offline' | 'handoff-pending';

export type DashboardMode = 'morning' | 'shift-ending';

export interface TeamTimezone {
  id: string;
  flag: string;
  city: string;
  time: string;
  status: TeamWorkStatus;
  statusLabel: string;
  detail?: string;
}

export interface HandoffSummary {
  id: string;
  projectId: string;
  projectName: string;
  fromTeam: string;
  toTeam: string;
  summary: string;
  completedCount: number;
  blockerCount: number;
  actionCount: number;
  decisionCount: number;
  createdAt: string;
}

export interface AttentionItem {
  id: string;
  type: 'blocker' | 'action';
  projectName: string;
  title: string;
  description: string;
  impact?: string;
  requiredAction?: string;
  assignee?: string;
  source?: string;
  waiting?: string;
  createdAt: string;
}

export interface ActiveHandoff {
  id: string;
  projectName: string;
  fromTeam: string;
  via: string;
  toTeam: string;
  completedCount: number;
  blockerCount: number;
  nextCount: number;
  statusLabel: string;
  status: 'needs-review' | 'clear';
}

export interface Decision {
  id: string;
  projectName: string;
  decision: string;
  participants: string;
  createdAt: string;
}

export interface ShiftEndingSummary {
  minutesLeft: number;
  completedCount: number;
  blockerCount: number;
  inProgressCount: number;
}

export interface HandoffDashboardData {
  mode: DashboardMode;
  userName: string;
  attentionCount: number;
  teamTimezones: TeamTimezone[];
  morningBrief: HandoffSummary;
  attentionItems: AttentionItem[];
  activeHandoffs: ActiveHandoff[];
  recentDecisions: Decision[];
  shiftEnding: ShiftEndingSummary;
}
