"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RotateCw, Trash2, GripVertical, FileText } from "lucide-react";

export interface PageItem {
  id: string;
  pageIndex: number;
  rotation: number; // 0, 90, 180, 270
  fileIndex?: number;
  fileName?: string;
  thumbnailUrl?: string;
}

interface SortableItemProps {
  item: PageItem;
  onRotate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function SortableItem({ item, onRotate, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-center transition-shadow hover:border-[var(--border-hover)]"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-[var(--subtle-foreground)] hover:text-[var(--foreground)] p-1 rounded hover:bg-[var(--surface-hover)]"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
        {onRotate && (
          <button
            onClick={() => onRotate(item.id)}
            className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            title="Rotate 90°"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="rounded p-1 text-rose-400 hover:bg-rose-500/20"
            title="Remove page"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Thumbnail preview image or fallback placeholder */}
      <div className="my-6 flex h-36 w-28 items-center justify-center rounded border border-[var(--border)] bg-black/40 overflow-hidden relative">
        {item.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.thumbnailUrl}
            alt={`Page ${item.pageIndex + 1}`}
            className="h-full w-full object-contain transition-transform duration-200"
            style={{ transform: `rotate(${item.rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center space-y-2 text-[var(--subtle-foreground)]">
            <FileText className="h-8 w-8" />
            <span className="text-[10px] font-mono">Page {item.pageIndex + 1}</span>
          </div>
        )}
      </div>

      {/* Footer label */}
      <div className="w-full flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]">
        <span className="font-mono font-medium text-[var(--foreground)]">
          P. {item.pageIndex + 1}
        </span>
        {item.fileName && (
          <span className="truncate max-w-[70px] text-[10px]" title={item.fileName}>
            {item.fileName}
          </span>
        )}
      </div>
    </div>
  );
}

export function PdfThumbnailGrid({
  items,
  onReorder,
  onRotate,
  onDelete,
}: {
  items: PageItem[];
  onReorder: (newItems: PageItem[]) => void;
  onRotate?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <SortableItem key={item.id} item={item} onRotate={onRotate} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
