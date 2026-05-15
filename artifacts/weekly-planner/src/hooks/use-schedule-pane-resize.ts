import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampSchedulePaneWidth,
  getSchedulePaneWidth,
  saveSchedulePaneWidth,
  SCHEDULE_PANE_WIDTH_MAX,
  SCHEDULE_PANE_WIDTH_MIN,
} from "@/lib/storage";

export function useSchedulePaneResize() {
  const [width, setWidth] = useState(getSchedulePaneWidth);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const persistWidth = useCallback((next: number) => {
    const clamped = clampSchedulePaneWidth(next);
    setWidth(clamped);
    saveSchedulePaneWidth(clamped);
  }, []);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startWidth: width };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width],
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta = dragRef.current.startX - e.clientX;
    setWidth(clampSchedulePaneWidth(dragRef.current.startWidth + delta));
  }, []);

  const onResizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        persistWidth(width + 16);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        persistWidth(width - 16);
      }
    },
    [persistWidth, width],
  );

  const endResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setWidth((current) => {
      const clamped = clampSchedulePaneWidth(current);
      saveSchedulePaneWidth(clamped);
      return clamped;
    });
  }, []);

  useEffect(() => {
    const onWindowResize = () => {
      setWidth((current) => clampSchedulePaneWidth(current));
    };
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, []);

  return {
    schedulePaneWidth: width,
    persistWidth,
    resizeHandleProps: {
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-valuenow": width,
      "aria-valuemin": SCHEDULE_PANE_WIDTH_MIN,
      "aria-valuemax": SCHEDULE_PANE_WIDTH_MAX,
      tabIndex: 0,
      onPointerDown: onResizePointerDown,
      onPointerMove: onResizePointerMove,
      onPointerUp: endResize,
      onPointerCancel: endResize,
      onKeyDown: onResizeKeyDown,
    },
  };
}
