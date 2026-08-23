const SNAP_STEP_MINUTES = 15;

export function snapMinutes(totalMinutes: number, step = SNAP_STEP_MINUTES): number {
  return Math.round(totalMinutes / step) * step;
}

export function pixelsToMinutes(deltaY: number, hourHeight: number): number {
  return (deltaY / hourHeight) * 60;
}

export function minutesFromGridOffset(
  offsetY: number,
  hourHeight: number,
  hourStart: number,
  hourEnd: number,
): number {
  const raw = hourStart * 60 + pixelsToMinutes(offsetY, hourHeight);
  const snapped = snapMinutes(raw);
  return Math.max(hourStart * 60, Math.min(hourEnd * 60, snapped));
}

export function applyDayAndMinuteDelta(
  start: Date,
  end: Date | null,
  dayDelta: number,
  minuteDelta: number,
): { startAt: Date; endAt: Date | null } {
  const newStart = new Date(start);
  newStart.setDate(newStart.getDate() + dayDelta);
  newStart.setMinutes(newStart.getMinutes() + minuteDelta);

  if (!end) {
    return { startAt: newStart, endAt: null };
  }

  const duration = end.getTime() - start.getTime();
  return {
    startAt: newStart,
    endAt: new Date(newStart.getTime() + duration),
  };
}
