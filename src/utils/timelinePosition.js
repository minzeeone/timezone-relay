export const TIMELINE_ROW_TOP = 112;
export const TIMELINE_ROW_HEIGHT = 150;
export const TIMELINE_MIN_BLOCK_WIDTH = 180;

export function parseTimelineTimeToHour(time) {
  const [hour = 0, minute = 0] = String(time).split(':').map(Number);

  return hour + minute / 60;
}

export function resolveTimelineHours(startTime, endTime) {
  const startHour = parseTimelineTimeToHour(startTime);
  let endHour = parseTimelineTimeToHour(endTime);

  if (endHour <= startHour) {
    endHour += 24;
  }

  return { startHour, endHour };
}

export function calculateTimelineMemberMetrics(member, options) {
  const { timelineStartHour, totalHours, timelineWidth } = options;
  const { startHour, endHour } = resolveTimelineHours(member.schedule.startTime, member.schedule.endTime);
  const xOffset = member.layout.xOffset ?? 0;
  const yOffset = member.layout.yOffset ?? 0;
  const widthOffset = member.layout.widthOffset ?? 0;
  const startRatio = (startHour - timelineStartHour) / totalHours;
  const endRatio = (endHour - timelineStartHour) / totalHours;
  const x = startRatio * timelineWidth + xOffset;
  const width = Math.max(TIMELINE_MIN_BLOCK_WIDTH, (endRatio - startRatio) * timelineWidth + widthOffset);
  const y = TIMELINE_ROW_TOP + member.layout.row * TIMELINE_ROW_HEIGHT + yOffset;

  return {
    x,
    y,
    width,
    startHour,
    endHour,
  };
}
