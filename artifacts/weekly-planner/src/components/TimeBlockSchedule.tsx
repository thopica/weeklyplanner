import { useCallback, useEffect, useRef, useState } from "react";
import { TimeBlock } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  type DayScheduleRange,
  SLOT_MINUTES,
  PX_PER_SLOT,
  blockHeightPx,
  clampBlockDuration,
  clampBlockStart,
  formatBlockRange,
  formatScheduleTime,
  hasTimeConflict,
  maxExclusiveEndForStart,
  minuteToTopPx,
  snapToGrid,
  timelineTicks,
  validExclusiveEndsFromStart,
} from "@/lib/schedule";
import { ScheduleTimeRail } from "@/components/schedule/ScheduleTimeRail";
import { ScheduleSlotGrid } from "@/components/schedule/ScheduleSlotGrid";

interface TimeBlockScheduleProps {
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
  range: DayScheduleRange;
}

type ResizeState = {
  blockId: string;
  edge: "top" | "bottom";
  originClientY: number;
  origStart: number;
  origDur: number;
};

interface BlockOverlayProps {
  block: TimeBlock;
  range: DayScheduleRange;
  onOpenEdit: (id: string) => void;
  onResizeStart: (e: React.MouseEvent, block: TimeBlock, edge: "top" | "bottom") => void;
  isResizing: boolean;
}

function BlockOverlay({
  block,
  range,
  onOpenEdit,
  onResizeStart,
  isResizing,
}: BlockOverlayProps) {
  const top = minuteToTopPx(block.startMinute, range);
  const h = Math.max(blockHeightPx(block.durationMinutes), 24);

  return (
    <div
      className="absolute left-0 right-0 z-10 flex flex-col overflow-hidden rounded-md border border-primary bg-surface-accent shadow-sm ring-1 ring-border"
      style={{ top, height: h }}
      data-testid={`time-block-${block.startMinute}`}
    >
      <div
        className="shrink-0 cursor-ns-resize bg-muted py-0.5 hover:bg-accent"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(e, block, "top");
        }}
        aria-hidden
      />
      <button
        type="button"
        disabled={isResizing}
        className="type-caption min-h-0 flex-1 px-2 text-left font-semibold text-foreground transition-colors hover:bg-accent disabled:pointer-events-none"
        onClick={() => onOpenEdit(block.id)}
      >
        <span className="line-clamp-2">
          {block.label.trim() ? block.label : "New block"}
        </span>
      </button>
      <div
        className="shrink-0 cursor-ns-resize bg-muted py-0.5 hover:bg-accent"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(e, block, "bottom");
        }}
        aria-hidden
      />
    </div>
  );
}

export function TimeBlockSchedule({ blocks, onChange, range }: TimeBlockScheduleProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<TimeBlock | null>(null);
  const openSnapshotRef = useRef<TimeBlock | null>(null);
  const [resize, setResize] = useState<ResizeState | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const rangeRef = useRef(range);
  rangeRef.current = range;

  useEffect(() => {
    if (!editingId) {
      setEditingDraft(null);
      openSnapshotRef.current = null;
      return;
    }
    const block = blocksRef.current.find((x) => x.id === editingId);
    if (block) {
      const copy = { ...block };
      openSnapshotRef.current = copy;
      setEditingDraft(copy);
    }
  }, [editingId]);

  const displayBlocks =
    editingDraft && editingId
      ? blocks.map((b) => (b.id === editingId ? editingDraft : b))
      : blocks;

  const sorted = [...displayBlocks].sort((a, b) => a.startMinute - b.startMinute);
  const ticks = timelineTicks(range);

  const applyBlocks = useCallback(
    (next: TimeBlock[]) => {
      onChange(next);
    },
    [onChange],
  );

  const handleSlotDoubleClick = (slotStart: number) => {
    const b = blocksRef.current;
    if (hasTimeConflict(slotStart, SLOT_MINUTES, b)) {
      toast({
        title: "Time not available",
        description: "That slot overlaps another block.",
        variant: "destructive",
      });
      return;
    }
    const id = crypto.randomUUID();
    applyBlocks([
      ...b,
      {
        id,
        startMinute: slotStart,
        durationMinutes: SLOT_MINUTES,
        label: "",
      },
    ]);
    setEditingId(id);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    block: TimeBlock,
    edge: "top" | "bottom",
  ) => {
    setResize({
      blockId: block.id,
      edge,
      originClientY: e.clientY,
      origStart: block.startMinute,
      origDur: block.durationMinutes,
    });
  };

  useEffect(() => {
    if (!resize) return;

    const onMove = (e: MouseEvent) => {
      const bList = blocksRef.current;
      const block = bList.find((x) => x.id === resize.blockId);
      if (!block) return;

      const deltaY = e.clientY - resize.originClientY;
      const deltaMin = Math.round(deltaY / PX_PER_SLOT) * SLOT_MINUTES;

      if (resize.edge === "bottom") {
        const start = resize.origStart;
        const r = rangeRef.current;
        const maxExclusive = maxExclusiveEndForStart(
          start,
          bList,
          resize.blockId,
          r,
        );
        const maxDur = maxExclusive - start;
        const newDur = Math.min(
          Math.max(SLOT_MINUTES, snapToGrid(resize.origDur + deltaMin)),
          maxDur,
        );
        applyBlocks(
          bList.map((x) =>
            x.id === resize.blockId ? { ...x, durationMinutes: newDur } : x,
          ),
        );
      } else {
        const origEnd = resize.origStart + resize.origDur;
        const r = rangeRef.current;
        let newStart = snapToGrid(resize.origStart + deltaMin);
        newStart = Math.min(
          Math.max(r.startMin, newStart),
          origEnd - SLOT_MINUTES,
        );
        const newDur = origEnd - newStart;
        if (
          newDur < SLOT_MINUTES ||
          hasTimeConflict(newStart, newDur, bList, resize.blockId)
        ) {
          return;
        }
        applyBlocks(
          bList.map((x) =>
            x.id === resize.blockId
              ? { ...x, startMinute: newStart, durationMinutes: newDur }
              : x,
          ),
        );
      }
    };

    const onUp = () => {
      setResize(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resize, applyBlocks]);

  const editing = editingDraft;

  const patchDraft = (patch: Partial<TimeBlock>) => {
    setEditingDraft((d) => (d ? { ...d, ...patch } : null));
  };

  const closeDialog = () => {
    setEditingId(null);
  };

  const cancelEditing = () => {
    if (!editingId) return;
    const snap = openSnapshotRef.current;
    if (!snap) {
      closeDialog();
      return;
    }
    const wasNew = !snap.label.trim();
    if (wasNew) {
      applyBlocks(blocks.filter((x) => x.id !== editingId));
    } else {
      applyBlocks(blocks.map((x) => (x.id === editingId ? snap : x)));
    }
    closeDialog();
  };

  const saveEditing = () => {
    if (!editingDraft) return;
    if (
      hasTimeConflict(
        editingDraft.startMinute,
        editingDraft.durationMinutes,
        blocks,
        editingDraft.id,
      )
    ) {
      toast({
        title: "Conflict",
        description: "This block overlaps another event.",
        variant: "destructive",
      });
      return;
    }
    applyBlocks(
      blocks.map((x) => (x.id === editingDraft.id ? editingDraft : x)),
    );
    closeDialog();
  };

  const removeEditing = () => {
    if (!editingId) return;
    applyBlocks(blocks.filter((x) => x.id !== editingId));
    closeDialog();
  };

  const endOptions =
    editing &&
    validExclusiveEndsFromStart(
      editing.startMinute,
      displayBlocks,
      range,
      editing.id,
    );
  const endExclusive = editing
    ? editing.startMinute + editing.durationMinutes
    : 0;

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="time-block-schedule"
    >
      <div className="planner-scroll min-h-0 flex-1 overflow-y-auto" data-planner-scroll="">
        <div className="flex px-3 py-3 sm:px-4 sm:py-4">
          <ScheduleTimeRail range={range} />
          <ScheduleSlotGrid
            range={range}
            interactive
            onSlotDoubleClick={(m) => {
              if (resize) return;
              handleSlotDoubleClick(m);
            }}
          >
            {sorted.map((block) => (
              <BlockOverlay
                key={block.id}
                block={block}
                range={range}
                onOpenEdit={setEditingId}
                onResizeStart={handleResizeStart}
                isResizing={!!resize}
              />
            ))}
          </ScheduleSlotGrid>
        </div>
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) cancelEditing();
        }}
      >
        <DialogContent className="max-w-md gap-0 border-border p-6 shadow-tinted sm:rounded-xl">
          {editing && (
            <>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="type-section-title">
                  Time block
                </DialogTitle>
                <DialogDescription className="type-ui">
                  {formatBlockRange(editing)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="block-name">Name</Label>
                  <Input
                    id="block-name"
                    value={editing.label}
                    onChange={(e) => patchDraft({ label: e.target.value })}
                    placeholder="What is this time for?"
                    autoFocus
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Start</Label>
                  <Select
                    value={String(editing.startMinute)}
                    onValueChange={(v) => {
                      const sm = clampBlockStart(Number(v), range);
                      const prevEnd = editing.startMinute + editing.durationMinutes;
                      const ends = validExclusiveEndsFromStart(
                        sm,
                        displayBlocks,
                        range,
                        editing.id,
                      );
                      if (ends.length === 0) {
                        toast({
                          title: "Invalid start",
                          description: "No free time from that start in your calendar hours.",
                          variant: "destructive",
                        });
                        return;
                      }
                      let end = prevEnd;
                      if (!ends.includes(end)) {
                        end = ends.filter((e) => e <= prevEnd).at(-1) ?? ends[0];
                      }
                      const dur = end - sm;
                      patchDraft({
                        startMinute: sm,
                        durationMinutes: clampBlockDuration(sm, dur, range),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {ticks.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {formatScheduleTime(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>End</Label>
                  <Select
                    value={String(endExclusive)}
                    onValueChange={(v) => {
                      const end = Number(v);
                      const dur = end - editing.startMinute;
                      if (
                        hasTimeConflict(
                          editing.startMinute,
                          dur,
                          displayBlocks,
                          editing.id,
                        )
                      ) {
                        toast({
                          title: "Conflict",
                          description: "That end time overlaps another block.",
                          variant: "destructive",
                        });
                        return;
                      }
                      patchDraft({
                        durationMinutes: clampBlockDuration(
                          editing.startMinute,
                          dur,
                          range,
                        ),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {(endOptions ?? []).map((end) => (
                        <SelectItem key={end} value={String(end)}>
                          {formatScheduleTime(end)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={removeEditing}
                >
                  Delete
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={saveEditing}
                    data-testid="button-save-time-block"
                  >
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
