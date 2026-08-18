import { useMemo, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const TIMELINE_RANGE_DRAG_SENSITIVITY = 120;
export const MIN_VISIBLE_HOURS = 3;
export const MAX_VISIBLE_HOURS = 24;

export function useTimelineRangeDrag({
  initialVisibleHours = 4,
  focusStartHour = 16,
  dayEndHour = 24,
  minVisibleHours = MIN_VISIBLE_HOURS,
  maxVisibleHours = MAX_VISIBLE_HOURS,
  sensitivity = TIMELINE_RANGE_DRAG_SENSITIVITY,
} = {}) {
  const [visibleHours, setVisibleHours] = useState(initialVisibleHours);
  const [isDraggingRange, setIsDraggingRange] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const dragRef = useRef(null);

  const range = useMemo(() => {
    const normalizedVisibleHours = clamp(visibleHours, minVisibleHours, maxVisibleHours);
    const preferredEndHour = focusStartHour + normalizedVisibleHours;
    const visibleEndHour = Math.min(dayEndHour, preferredEndHour);
    const visibleStartHour = clamp(visibleEndHour - normalizedVisibleHours, 0, dayEndHour - minVisibleHours);

    return {
      visibleStartHour,
      visibleEndHour,
      visibleHours: normalizedVisibleHours,
    };
  }, [dayEndHour, focusStartHour, maxVisibleHours, minVisibleHours, visibleHours]);

  const updateVisibleHoursFromDelta = (deltaX) => {
    const hourDelta = deltaX / sensitivity;
    const nextVisibleHours = clamp(dragRef.current.startVisibleHours + hourDelta, minVisibleHours, maxVisibleHours);
    setVisibleHours(nextVisibleHours);
  };

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest('[data-no-timeline-drag], button, a, input, textarea, select, [role="button"]')) return;

    dragRef.current = {
      x: event.clientX,
      startVisibleHours: visibleHours,
    };

    setIsDraggingRange(true);
    setDragDelta(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;

    const deltaX = event.clientX - dragRef.current.x;
    setDragDelta(deltaX);
    updateVisibleHoursFromDelta(deltaX);
    event.preventDefault();
  };

  const stopDragging = (event) => {
    if (!dragRef.current) return;

    dragRef.current = null;
    setIsDraggingRange(false);
    setDragDelta(0);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return {
    ...range,
    dragDelta,
    isDraggingRange,
    timelineRangeDragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
      onPointerLeave: stopDragging,
    },
  };
}
