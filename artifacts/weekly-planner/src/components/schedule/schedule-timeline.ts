import type { DayScheduleRange } from "@/lib/schedule";
import {
  PX_PER_HOUR,
  PX_PER_SLOT,
  TIMELINE_EDGE_INSET_PX,
  TIMELINE_HOUR_EDGE_INSET_PX,
  blockHeightPx,
  blockHeightPxHourly,
  minuteToTopPx,
  minuteToTopPxHourly,
  timelineContentHeightPx,
  timelineHourContentHeightPx,
  timelineRailLabels,
  timelineHourTicks,
  timelineTicks,
  type ScheduleTimelineGranularity,
} from "@/lib/schedule";

export function useScheduleTimeline(range: DayScheduleRange, granularity: ScheduleTimelineGranularity) {
  const isHour = granularity === "hour";
  return {
    ticks: isHour ? timelineHourTicks(range) : timelineTicks(range),
    railLabels: timelineRailLabels(range, granularity),
    gridHeightPx: isHour ? timelineHourContentHeightPx(range) : timelineContentHeightPx(range),
    minuteToTop: (minute: number) =>
      isHour ? minuteToTopPxHourly(minute, range) : minuteToTopPx(minute, range),
    blockHeight: (durationMinutes: number) =>
      isHour ? blockHeightPxHourly(durationMinutes) : blockHeightPx(durationMinutes),
    rowHeightPx: isHour ? PX_PER_HOUR : PX_PER_SLOT,
    edgeInsetPx: isHour ? TIMELINE_HOUR_EDGE_INSET_PX : TIMELINE_EDGE_INSET_PX,
    hourLabelsOnly: isHour,
  };
}
