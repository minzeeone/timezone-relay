import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseEdge, Handle, MarkerType, Position, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { timelineProjects } from '../../data/projectData.js';
import { timelineMembers, timelineTeams } from '../../data/timelineData.js';
import { useTimelineRangeDrag } from '../../hooks/useTimelineRangeDrag.js';
import { getCountryFlagClass } from '../../utils/country.js';
import { calculateTimelineMemberMetrics } from '../../utils/timelinePosition.js';

const calendarWeeks = [
  ['26', '27', '28', '29', '30', '31', '1'],
  ['2', '3', '4', '5', '6', '7', '8'],
  ['9', '10', '11', '12', '13', '14', '15'],
  ['16', '17', '18', '19', '20', '21', '22'],
  ['23', '24', '25', '26', '27', '28', '29'],
  ['30', '31', '1', '2', '3', '4', '5'],
];

const TIMELINE_FOCUS_START_HOUR = 16;
const TIMELINE_DAY_START_HOUR = 0;
const TIMELINE_DAY_END_HOUR = 24;
const TIMELINE_TOTAL_HOURS = TIMELINE_DAY_END_HOUR - TIMELINE_DAY_START_HOUR;
const TIMELINE_INITIAL_VISIBLE_HOURS = 4;
const TIMELINE_MIN_WIDTH = 860;
const BASE_SCHEDULE_DATE = new Date(2026, 7, 18);

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
  const detail = `${statusLabel} (${member.schedule.startTime} - ${member.schedule.endTime})`;
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

function HandoffEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style }) {
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

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
  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const activeTimelineMembers = useMemo(
    () => timelineMembers.filter((member) => member.schedule.date === selectedDateKey),
    [selectedDateKey]
  );

  const flowNodes = useMemo(() => {
    const incomingTargetIds = new Set(activeTimelineMembers.map((member) => member.handoff?.targetId).filter(Boolean));

    return activeTimelineMembers.map((member) => {
      const metrics = calculateTimelineMemberMetrics(member, {
        timelineStartHour: TIMELINE_DAY_START_HOUR,
        totalHours: TIMELINE_TOTAL_HOURS,
        timelineWidth,
      });

      return {
        id: member.id,
        type: 'shift',
        position: { x: metrics.x, y: metrics.y },
        style: { width: metrics.width, height: 84 },
        data: {
          member,
          width: `${metrics.width}px`,
          hasIncomingHandoff: incomingTargetIds.has(member.id),
          hasOutgoingHandoff: Boolean(member.handoff?.targetId),
        },
      };
    });
  }, [activeTimelineMembers, timelineWidth]);

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
          className: 'schedule-handoff-edge',
          style: { stroke: 'rgba(255, 255, 255, 0.82)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255, 255, 255, 0.82)', width: 14, height: 14 },
        }));
    },
    [activeTimelineMembers]
  );

  const toggleFilter = (filterName) => {
    setCollapsedFilters((current) => ({ ...current, [filterName]: !current[filterName] }));
  };

  const selectedDateLabel = useMemo(() => formatScheduleDate(selectedDate), [selectedDate]);
  const relativeDayLabel = useMemo(() => formatRelativeDayLabel(selectedDate, BASE_SCHEDULE_DATE), [selectedDate]);
  const isSelectedAugust2026 = selectedDate.getFullYear() === 2026 && selectedDate.getMonth() === 7;
  const selectedCalendarDay = isSelectedAugust2026 ? String(selectedDate.getDate()) : '';
  const shiftSelectedDate = (days) => setSelectedDate((currentDate) => addDays(currentDate, days));
  const selectAugustDate = (day, isMuted) => {
    if (isMuted) return;
    setSelectedDate(new Date(2026, 7, Number(day)));
  };

  return (
    <main className="team-schedule" aria-label="팀 일정">
      <aside className="schedule-sidebar">
        <section className="schedule-card schedule-calendar" aria-label="2026년 8월 달력">
          <header>
            <strong>2026년 8월</strong>
            <div>
              <button type="button" aria-label="이전 달">
                <i className="bi bi-chevron-left" />
              </button>
              <button type="button" aria-label="다음 달">
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
              week.map((day, dayIndex) => {
                const isMuted = (weekIndex === 0 && day !== '1') || (weekIndex === 5 && Number(day) < 6);
                const isToday = !isMuted && day === selectedCalendarDay;

                return (
                  <button
                    className={`${isMuted ? 'muted' : ''} ${isToday ? 'today' : ''}`}
                    key={`${weekIndex}-${dayIndex}`}
                    type="button"
                    onClick={() => selectAugustDate(day, isMuted)}
                  >
                    {day}
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
