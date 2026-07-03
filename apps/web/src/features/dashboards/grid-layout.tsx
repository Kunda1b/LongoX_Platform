"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const COLS = 12;
const ROW_HEIGHT = 80;
const GAP = 16;

export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface GridLayoutProps {
  items: GridItem[];
  onLayoutChange: (items: GridItem[]) => void;
  children: (item: GridItem) => ReactNode;
  className?: string;
  isEditing?: boolean;
}

export function GridLayout({ items, onLayoutChange, children, className, isEditing = true }: GridLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (!isEditing) return;
    e.preventDefault();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging(id);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [items, isEditing]);

  const handleResizeStart = useCallback((e: React.MouseEvent, id: string) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setResizing(id);
    setResizeStart({ x: e.clientX, y: e.clientY, w: item.w, h: item.h });
  }, [items, isEditing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    if (dragging) {
      const colWidth = (rect.width - GAP * (COLS - 1)) / COLS;
      const newX = Math.max(0, Math.round((relX - dragOffset.x) / (colWidth + GAP)));
      const newY = Math.max(0, Math.round((relY - dragOffset.y) / (ROW_HEIGHT + GAP)));
      onLayoutChange(
        items.map((item) =>
          item.id === dragging ? { ...item, x: Math.min(newX, COLS - item.w), y: newY } : item,
        ),
      );
    }

    if (resizing) {
      const colWidth = (rect.width - GAP * (COLS - 1)) / COLS;
      const dx = Math.round((e.clientX - resizeStart.x) / (colWidth + GAP));
      const dy = Math.round((e.clientY - resizeStart.y) / (ROW_HEIGHT + GAP));
      const newW = Math.max(2, Math.min(resizeStart.w + dx, COLS));
      const newH = Math.max(1, resizeStart.h + dy);
      onLayoutChange(
        items.map((item) =>
          item.id === resizing ? { ...item, w: newW, h: newH } : item,
        ),
      );
    }
  }, [dragging, resizing, dragOffset, resizeStart, items, onLayoutChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const colWidth = containerRef.current
    ? (containerRef.current.getBoundingClientRect().width - GAP * (COLS - 1)) / COLS
    : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ minHeight: 400 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "absolute",
            isEditing && "cursor-move",
            dragging === item.id && "z-50 opacity-80",
          )}
          style={{
            left: item.x * (colWidth + GAP),
            top: item.y * (ROW_HEIGHT + GAP),
            width: item.w * colWidth + (item.w - 1) * GAP,
            height: item.h * ROW_HEIGHT + (item.h - 1) * GAP,
            transition: dragging === item.id || resizing === item.id ? "none" : "all 200ms",
          }}
          onMouseDown={(e) => handleMouseDown(e, item.id)}
        >
          {children(item)}
          {isEditing && (
            <div
              className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize"
              style={{
                background: "linear-gradient(135deg, transparent 50%, hsl(var(--muted-foreground)) 50%)",
              }}
              onMouseDown={(e) => handleResizeStart(e, item.id)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
