import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseEdge, Handle, MarkerType, Position, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { timelineProjects } from '../../data/projectData.js';
import { timelineMembers, timelineTeams } from '../../data/timelineData.js';
import { analyzeTiming, toTimelineStatus } from '../../utils/timing.js';
import { useTimelineRangeDrag } from '../../hooks/useTimelineRangeDrag.js';
import { getCountryFlagClass } from '../../utils/country.js';
import { calculateTimelineMemberMetrics } from '../../utils/timelinePosition.js';

/**
 * 달력 한 판(6주 x 7일)을 만듭니다.
 *
 * 원래는 2026년 8월 날짜가 문자열로 박혀 있어서 이전/다음 달로 넘길 수 없었습니다.
 * 앞뒤로 남는 칸은 이웃 달 날짜로 채우고 inMonth: false 로 표시합니다.
 */
const buildCalendarWeeks = (year, monthIndex) => {
  const startOffset = new Date(year, monthIndex, 1).getDay(); // 일요일 시작
  const weeks = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(year, monthIndex, 1 - startOffset + weekIndex * 7 + dayIndex);
      week.push({ day: String(date.getDate()), inMonth: date.getMonth() === monthIndex, date });
    }

    weeks.push(week);
  }

  return weeks;
};

const TIMELINE_FOCUS_START_HOUR = 16;
const TIMELINE_DAY_START_HOUR = 0;
const TIMELINE_DAY_END_HOUR = 24;
const TIMELINE_TOTAL_HOURS = TIMELINE_DAY_END_HOUR - TIMELINE_DAY_START_HOUR;
const TIMELINE_INITIAL_VISIBLE_HOURS = 16;
const TIMELINE_MIN_WIDTH = 860;
/**
 * 타임라인 기준일은 "오늘"입니다.
 *
 * 목업 일정은 MOCK_SCHEDULE_DATE 하루치로만 만들어져 있어서, 그 날짜를
 * 오늘로 옮겨 읽습니다. 고정 날짜를 그대로 두면 며칠만 지나도
 * 8월 18일에 "오늘" 배지가 붙는 상태가 됩니다.
 */
const MOCK_SCHEDULE_DATE = '2026-08-18';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const BASE_SCHEDULE_DATE = startOfToday();

const statusLabels = {
  working: '근무 중',
  starting: '근무 시작',
  ending: '근무 종료',
  offline: '자리비움',
};

const clampTimelineHour = (value, min = TIMELINE_DAY_START_HOUR, max = TIMELINE_DAY_END_HOUR) =>
  Math.min(max, Math.max(min, value));

const formatHour = (hour) => {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const hourPart = Math.floor(normalizedHour);
  const minutePart = Math.round((normalizedHour - hourPart) * 60);
  const displayHour = minutePart === 60 ? (hourPart + 1) % 24 : hourPart;
  const displayMinute = minutePart === 60 ? 0 : minutePart;

  return `${String(displayHour).padStart(2, '0')}:${String(displayMinute).padStart(2, '0')}`;
};

const formatVisibleHours = (hours) => {
  const roundedHours = Math.round(hours * 10) / 10;
  return Number.isInteger(roundedHours) ? String(roundedHours) : roundedHours.toFixed(1);
};

const formatScheduleDate = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDateDiffInDays = (date, baseDate) => {
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedBaseDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  return Math.round((normalizedDate.getTime() - normalizedBaseDate.getTime()) / 86400000);
};

const formatRelativeDayLabel = (date, baseDate) => {
  const diffDays = getDateDiffInDays(date, baseDate);

  if (diffDays === 0) return '오늘';
  if (diffDays < 0) return `${Math.abs(diffDays)}일 전`;
  return `${diffDays}일 후`;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
};

const getTickInterval = (visibleHours) => {
  if (visibleHours <= 6) return 1;
  if (visibleHours <= 8) return 2;
  if (visibleHours <= 12) return 3;
  return 4;
};

const createTimelineTicks = (visibleStartHour, visibleEndHour, visibleHours) => {
  const interval = getTickInterval(visibleHours);
  const firstTick = Math.ceil(visibleStartHour / interval) * interval;
  const ticks = [];

  for (let hour = firstTick; hour <= visibleEndHour + 0.001; hour += interval) {
    ticks.push(hour);
  }

  if (!ticks.some((tick) => Math.abs(tick - visibleStartHour) < 0.001)) ticks.unshift(visibleStartHour);
  if (!ticks.some((tick) => Math.abs(tick - visibleEndHour) < 0.001)) ticks.push(visibleEndHour);

  return ticks;
};

function MiniFlag({ type }) {
  return <span className={`schedule-flag ${type}`} aria-hidden="true" />;
}

function TimelineAvatar({ side = 'left', src, label, accent }) {
  return (
    <span className={`timeline-avatar ${side}`} style={{ '--avatar-accent': accent }}>
      {src ? <img src={src} alt="" /> : <span>{label}</span>}
    </span>
  );
}

function ShiftNode({ data }) {
  const { member, width, hasIncomingHandoff, hasOutgoingHandoff } = data;
  const avatarSide = member.layout.avatarSide ?? 'left';
  const flagPlacement = member.layout.flagPlacement ?? 'none';
  const flagClass = getCountryFlagClass(member.profile.countryCode);
  const statusLabel = statusLabels[member.status] ?? '근무';
  // Border 01: 현지 시각이 있으면 함께 보여줍니다 (준서님 타임존 계산 결과).
  const localClock = member.timing ? member.timing.localTime.slice(11) : null;
  const detail = localClock
    ? `${statusLabel} · 현지 ${localClock}`
    : `${statusLabel} (${member.schedule.startTime} - ${member.schedule.endTime})`;
  const avatar = {
    side: avatarSide,
    src: member.profile.avatar,
    label: member.profile.avatarLabel ?? member.profile.name.slice(0, 2),
    accent: member.theme.accent,
  };

  return (
    <article
      className={`shift-bar align-${avatarSide}`}
      style={{
        '--shift-width': width,
        '--shift-background': member.theme.background,
        '--shift-accent': member.theme.accent,
        '--shift-text': member.theme.text ?? '#ffffff',
      }}
    >
      <Handle className="timeline-flow-handle" id="left" position={Position.Left} type="target" />
      <Handle className="timeline-flow-handle" id="right" position={Position.Right} type="source" />
      {hasIncomingHandoff && <span className="timeline-connection-dot left" />}
      {avatarSide === 'left' && <TimelineAvatar {...avatar} />}
      <div className="shift-copy">
        <strong>
          {flagPlacement === 'leading' && <MiniFlag type={flagClass} />}
          {member.profile.name}
          {flagPlacement === 'trailing' && <MiniFlag type={flagClass} />}
        </strong>
        <small>{detail}</small>
      </div>
      {avatarSide === 'right' && <TimelineAvatar {...avatar} />}
      {hasOutgoingHandoff && <span className="timeline-connection-dot right" />}
    </article>
  );
}

const EDGE_NODE_GAP = 24;
const EDGE_ROW_CLEARANCE = 52;

const lineTo = (x, y) => `L ${Math.round(x)} ${Math.round(y)}`;

const buildOrthogonalHandoffPath = ({ sourceX, sourceY, targetX, targetY, sourceNode, targetNode }) => {
  const sourceRight = sourceNode ? sourceNode.x + sourceNode.width : sourceX;
  const targetLeft = targetNode ? targetNode.x : targetX;
  const sourceTop = sourceNode ? sourceNode.y : sourceY - 42;
  const sourceBottom = sourceNode ? sourceNode.y + sourceNode.height : sourceY + 42;
  const targetTop = targetNode ? targetNode.y : targetY - 42;
  const targetBottom = targetNode ? targetNode.y + targetNode.height : targetY + 42;
  const sourceExitX = Math.max(sourceX + EDGE_NODE_GAP, sourceRight + EDGE_NODE_GAP);
  const targetEntryX = Math.min(targetX - EDGE_NODE_GAP, targetLeft - EDGE_NODE_GAP);
  const hasHorizontalRoom = sourceExitX < targetEntryX;

  if (hasHorizontalRoom) {
    return [
      `M ${Math.round(sourceX)} ${Math.round(sourceY)}`,
      lineTo(sourceExitX, sourceY),
      lineTo(sourceExitX, targetY),
      lineTo(targetEntryX, targetY),
      lineTo(targetX, targetY),
    ].join(' ');
  }

  const routeAbove = sourceY > targetY;
  const laneY = routeAbove
    ? Math.min(sourceTop, targetTop) - EDGE_ROW_CLEARANCE
    : Math.max(sourceBottom, targetBottom) + EDGE_ROW_CLEARANCE;

  return [
    `M ${Math.round(sourceX)} ${Math.round(sourceY)}`,
    lineTo(sourceExitX, sourceY),
    lineTo(sourceExitX, laneY),
    lineTo(targetEntryX, laneY),
    lineTo(targetEntryX, targetY),
    lineTo(targetX, targetY),
  ].join(' ');
};

function HandoffEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, data }) {
  const path = buildOrthogonalHandoffPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceNode: data?.sourceNode,
    targetNode: data?.targetNode,
  });

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
}

const nodeTypes = {
  shift: ShiftNode,
};

const edgeTypes = {
  handoff: HandoffEdge,
};

export function TeamSchedule() {
  const [collapsedFilters, setCollapsedFilters] = useState({ teams: false, projects: false });
  const [selectedDate, setSelectedDate] = useState(() => new Date(BASE_SCHEDULE_DATE));
  // 달력에 지금 펼쳐 보이는 달 (선택한 날짜와 따로 움직입니다)
  const [viewMonth, setViewMonth] = useState(
    () => new Date(BASE_SCHEDULE_DATE.getFullYear(), BASE_SCHEDULE_DATE.getMonth(), 1),
  );
  // 현재 시각. 1분마다 갱신해서 팀원 상태(근무중/퇴근/공휴일)가 실제로 흐르게 합니다.
  const [nowTick, setNowTick] = useState(() => new Date());
  const timelineRef = useRef(null);
  const hasSetInitialTimelineScrollRef = useRef(false);
  const visibleScrollCenterHourRef = useRef(TIMELINE_FOCUS_START_HOUR + TIMELINE_INITIAL_VISIBLE_HOURS / 2);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(TIMELINE_MIN_WIDTH);
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [hoveredTimelineTime, setHoveredTimelineTime] = useState(null);
  const { visibleHours, isDraggingRange, timelineRangeDragProps } = useTimelineRangeDrag({
    initialVisibleHours: TIMELINE_INITIAL_VISIBLE_HOURS,
    focusStartHour: TIMELINE_FOCUS_START_HOUR,
    dayEndHour: TIMELINE_DAY_END_HOUR,
  });

  useEffect(() => {
    if (!timelineRef.current) return undefined;

    const updateTimelineWidth = () => {
      setTimelineViewportWidth(Math.max(TIMELINE_MIN_WIDTH, timelineRef.current?.clientWidth ?? TIMELINE_MIN_WIDTH));
    };

    updateTimelineWidth();
    const resizeObserver = new ResizeObserver(updateTimelineWidth);
    resizeObserver.observe(timelineRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const timelineWidth = useMemo(
    () => Math.max(TIMELINE_MIN_WIDTH, timelineViewportWidth * (TIMELINE_TOTAL_HOURS / visibleHours)),
    [timelineViewportWidth, visibleHours]
  );

  const maxDisplayedStartHour = Math.max(TIMELINE_DAY_START_HOUR, TIMELINE_DAY_END_HOUR - visibleHours);
  const displayedStartHour = clampTimelineHour(
    (timelineScrollLeft / timelineWidth) * TIMELINE_TOTAL_HOURS,
    TIMELINE_DAY_START_HOUR,
    maxDisplayedStartHour
  );
  const displayedEndHour = clampTimelineHour(displayedStartHour + visibleHours);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    if (isDraggingRange && hasSetInitialTimelineScrollRef.current) return;

    const targetCenterHour = hasSetInitialTimelineScrollRef.current
      ? visibleScrollCenterHourRef.current
      : TIMELINE_FOCUS_START_HOUR + visibleHours / 2;
    const targetStartHour = clampTimelineHour(
      targetCenterHour - visibleHours / 2,
      TIMELINE_DAY_START_HOUR,
      Math.max(TIMELINE_DAY_START_HOUR, TIMELINE_DAY_END_HOUR - visibleHours)
    );
    const nextScrollLeft = (targetStartHour / TIMELINE_TOTAL_HOURS) * timelineWidth;
    const maxScrollLeft = Math.max(0, timeline.scrollWidth - timeline.clientWidth);

    timeline.scrollLeft = Math.min(maxScrollLeft, nextScrollLeft);
    setTimelineScrollLeft(timeline.scrollLeft);
    hasSetInitialTimelineScrollRef.current = true;
  }, [timelineWidth, visibleHours, isDraggingRange]);

  const handleTimelineScroll = (event) => {
    const nextScrollLeft = event.currentTarget.scrollLeft;
    const nextStartHour = clampTimelineHour(
      (nextScrollLeft / timelineWidth) * TIMELINE_TOTAL_HOURS,
      TIMELINE_DAY_START_HOUR,
      Math.max(TIMELINE_DAY_START_HOUR, TIMELINE_DAY_END_HOUR - visibleHours)
    );

    setTimelineScrollLeft(nextScrollLeft);
    visibleScrollCenterHourRef.current = clampTimelineHour(
      nextStartHour + visibleHours / 2,
      visibleHours / 2,
      TIMELINE_DAY_END_HOUR - visibleHours / 2
    );
  };

  const updateHoveredTimelineTime = (event) => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const timelineRect = timeline.getBoundingClientRect();
    const x = Math.min(timelineWidth, Math.max(0, event.clientX - timelineRect.left + timeline.scrollLeft));
    const hour = TIMELINE_DAY_START_HOUR + (x / timelineWidth) * TIMELINE_TOTAL_HOURS;

    setHoveredTimelineTime({ x, hour });
  };

  const handleTimelinePointerDown = (event) => {
    timelineRangeDragProps.onPointerDown?.(event);
    updateHoveredTimelineTime(event);
  };

  const handleTimelinePointerMove = (event) => {
    timelineRangeDragProps.onPointerMove?.(event);
    updateHoveredTimelineTime(event);
  };

  const handleTimelinePointerEnd = (event) => {
    timelineRangeDragProps.onPointerUp?.(event);
  };

  const handleTimelinePointerLeave = (event) => {
    timelineRangeDragProps.onPointerLeave?.(event);
    setHoveredTimelineTime(null);
  };

  const timelineTicks = useMemo(
    () => createTimelineTicks(TIMELINE_DAY_START_HOUR, TIMELINE_DAY_END_HOUR, visibleHours),
    [visibleHours]
  );
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  // Border 01(지리) — 준서님 타임존 계산으로 각 멤버의 현재 상태를 실시간 판정합니다.
  // 하드코딩된 status 대신 현지 시각·공휴일·업무시간을 보고 결정합니다.
  const activeTimelineMembers = useMemo(
    () =>
      timelineMembers
        // 목업 하루치를 오늘 날짜로 옮겨 매칭합니다.
        .filter((member) => {
          const scheduleKey =
            member.schedule.date === MOCK_SCHEDULE_DATE
              ? formatDateKey(BASE_SCHEDULE_DATE)
              : member.schedule.date;
          return scheduleKey === selectedDateKey;
        })
        .map((member) => {
          const timing = analyzeTiming(member.profile.countryCode, nowTick);
          return { ...member, status: toTimelineStatus(timing), timing };
        }),
    [selectedDateKey, nowTick]
  );

  const timelineNodeRects = useMemo(() => {
    const rects = new Map();

    activeTimelineMembers.forEach((member) => {
      const metrics = calculateTimelineMemberMetrics(member, {
        timelineStartHour: TIMELINE_DAY_START_HOUR,
        totalHours: TIMELINE_TOTAL_HOURS,
        timelineWidth,
      });

      rects.set(member.id, {
        x: metrics.x,
        y: metrics.y,
        width: metrics.width,
        height: 84,
      });
    });

    return rects;
  }, [activeTimelineMembers, timelineWidth]);

  const flowNodes = useMemo(() => {
    const incomingTargetIds = new Set(activeTimelineMembers.map((member) => member.handoff?.targetId).filter(Boolean));

    return activeTimelineMembers.map((member) => {
      const rect = timelineNodeRects.get(member.id);

      return {
        id: member.id,
        type: 'shift',
        position: { x: rect.x, y: rect.y },
        style: { width: rect.width, height: rect.height },
        data: {
          member,
          width: `${rect.width}px`,
          hasIncomingHandoff: incomingTargetIds.has(member.id),
          hasOutgoingHandoff: Boolean(member.handoff?.targetId),
        },
      };
    });
  }, [activeTimelineMembers, timelineNodeRects]);

  const flowEdges = useMemo(
    () => {
      const activeMemberIds = new Set(activeTimelineMembers.map((member) => member.id));

      return activeTimelineMembers
        .filter((member) => member.handoff?.targetId)
        .filter((member) => activeMemberIds.has(member.handoff.targetId))
        .map((member) => ({
          id: `${member.id}-${member.handoff.targetId}`,
          source: member.id,
          sourceHandle: 'right',
          target: member.handoff.targetId,
          targetHandle: 'left',
          type: 'handoff',
          data: {
            sourceNode: timelineNodeRects.get(member.id),
            targetNode: timelineNodeRects.get(member.handoff.targetId),
          },
          className: 'schedule-handoff-edge',
          style: { stroke: 'rgba(255, 255, 255, 0.82)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255, 255, 255, 0.82)', width: 14, height: 14 },
        }));
    },
    [activeTimelineMembers, timelineNodeRects]
  );

  const toggleFilter = (filterName) => {
    setCollapsedFilters((current) => ({ ...current, [filterName]: !current[filterName] }));
  };

  const selectedDateLabel = useMemo(() => formatScheduleDate(selectedDate), [selectedDate]);
  const relativeDayLabel = useMemo(() => formatRelativeDayLabel(selectedDate, BASE_SCHEDULE_DATE), [selectedDate]);
  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  );
  const calendarLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;
  const shiftViewMonth = (delta) =>
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const shiftSelectedDate = (days) => setSelectedDate((currentDate) => addDays(currentDate, days));
  const selectCalendarDate = (cell) => {
    if (!cell.inMonth) return;
    setSelectedDate(new Date(cell.date));
  };

  return (
    <main className="team-schedule" aria-label="팀 일정">
      <aside className="schedule-sidebar">
        <section className="schedule-card schedule-calendar" aria-label={`${calendarLabel} 달력`}>
          <header>
            <strong>{calendarLabel}</strong>
            <div>
              <button type="button" aria-label="이전 달" onClick={() => shiftViewMonth(-1)} data-no-timeline-drag>
                <i className="bi bi-chevron-left" />
              </button>
              <button type="button" aria-label="다음 달" onClick={() => shiftViewMonth(1)} data-no-timeline-drag>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </header>
          <div className="calendar-weekdays" aria-hidden="true">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarWeeks.flatMap((week, weekIndex) =>
              week.map((cell, dayIndex) => {
                const isSelected = cell.inMonth && formatDateKey(cell.date) === selectedDateKey;

                return (
                  <button
                    className={`${cell.inMonth ? '' : 'muted'} ${isSelected ? 'today' : ''}`}
                    key={`${weekIndex}-${dayIndex}`}
                    type="button"
                    onClick={() => selectCalendarDate(cell)}
                  >
                    {cell.day}
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className={`schedule-card schedule-filter ${collapsedFilters.teams ? 'is-collapsed' : ''}`} aria-label="팀 필터">
          <header>
            <strong>팀</strong>
            <button type="button" aria-label="팀 필터 접기" aria-expanded={!collapsedFilters.teams} onClick={() => toggleFilter('teams')} data-no-timeline-drag>
              <i className="bi bi-chevron-down" />
            </button>
          </header>
          <div className="schedule-filter-list">
            {timelineTeams.map((team) => (
              <button key={team.id} type="button">
                <MiniFlag type={getCountryFlagClass(team.countryCode)} />
                <span>{team.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={`schedule-card schedule-filter schedule-projects ${collapsedFilters.projects ? 'is-collapsed' : ''}`} aria-label="프로젝트 필터">
          <header>
            <strong>프로젝트</strong>
            <button
              type="button"
              aria-label="프로젝트 필터 접기"
              aria-expanded={!collapsedFilters.projects}
              onClick={() => toggleFilter('projects')}
              data-no-timeline-drag
            >
              <i className="bi bi-chevron-down" />
            </button>
          </header>
          <div className="schedule-filter-list">
            {timelineProjects.map((project) => (
              <button key={project.id} type="button">
                <span className="project-dot" style={{ '--dot-color': project.color }} />
                <span>{project.name}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="schedule-main">
        <header className="schedule-day-head">
          <h2>{selectedDateLabel}</h2>
          <button className="today-pill" type="button" onClick={() => setSelectedDate(new Date(BASE_SCHEDULE_DATE))} data-no-timeline-drag>
            {relativeDayLabel}
          </button>
          <button type="button" aria-label="이전 날짜" onClick={() => shiftSelectedDate(-1)} data-no-timeline-drag>
            <i className="bi bi-chevron-left" />
          </button>
          <button type="button" aria-label="다음 날짜" onClick={() => shiftSelectedDate(1)} data-no-timeline-drag>
            <i className="bi bi-chevron-right" />
          </button>
        </header>

        <div className="timeline-range-indicator" aria-hidden="true">
          {formatHour(displayedStartHour)} &gt; {formatHour(displayedEndHour)}
          <span>{formatVisibleHours(visibleHours)}시간</span>
        </div>

        <div
          ref={timelineRef}
          className={`schedule-timeline ${isDraggingRange ? 'is-dragging' : ''}`}
          onScroll={handleTimelineScroll}
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerEnd}
          onPointerCancel={handleTimelinePointerEnd}
          onPointerLeave={handleTimelinePointerLeave}
        >
          <div className="timeline-scale-plane" style={{ '--timeline-width': `${timelineWidth}px` }}>
            {timelineTicks.map((hour, index) => (
              <div
                className={`time-marker ${index === 0 ? 'is-first' : ''} ${index === timelineTicks.length - 1 ? 'is-last' : ''}`}
                style={{ '--x': `${((hour - TIMELINE_DAY_START_HOUR) / TIMELINE_TOTAL_HOURS) * 100}%` }}
                key={hour}
              >
                <strong>{formatHour(hour)}</strong>
                <span />
              </div>
            ))}

            {hoveredTimelineTime && (
              <div className="time-hover-marker" style={{ '--x': `${hoveredTimelineTime.x}px` }}>
                <strong>{formatHour(hoveredTimelineTime.hour)}</strong>
                <span />
              </div>
            )}

            {activeTimelineMembers.length === 0 && (
              <div className="timeline-empty-state">
                <i className="bi bi-calendar2-week" />
                <span>이 날짜에 등록된 근무 블록이 없습니다.</span>
              </div>
            )}

            <ReactFlow
              className="timeline-flow"
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              nodesFocusable={false}
              edgesFocusable={false}
              elementsSelectable={false}
              panOnDrag={false}
              panOnScroll={false}
              zoomOnDoubleClick={false}
              zoomOnPinch={false}
              zoomOnScroll={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
              viewport={{ x: 0, y: 0, zoom: 1 }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
