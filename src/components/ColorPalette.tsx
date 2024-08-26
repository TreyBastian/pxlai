import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { useColor } from '../contexts/ColorContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconMenuBar } from './IconMenuBar';
import { Button } from "@/components/ui/button";

interface SortableItemProps {
  id: string;
  value: string;
  onDelete: () => void;
  onSelect: () => void;
}

function SortableItem({ id, value, onDelete, onSelect }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-8 h-8 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ backgroundColor: value }}
            onClick={onSelect}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{value}</p>
        </TooltipContent>
      </Tooltip>
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function ColorPalette() {
  const { currentColor, setCurrentColor, palette, deletePaletteItem, reorderPalette } = useColor();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = palette.findIndex((item) => item.id === active.id);
      const newIndex = palette.findIndex((item) => item.id === over.id);
      const newPalette = arrayMove(palette, oldIndex, newIndex);
      reorderPalette(newPalette);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 w-full">
        <IconMenuBar />
      </div>
      <ScrollArea className="flex-grow">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={palette.map(color => color.id)}>
            <div className="flex flex-wrap gap-4 p-4">
              <TooltipProvider>
                {palette.map((color) => (
                  <SortableItem
                    key={color.id}
                    id={color.id}
                    value={color.value}
                    onDelete={() => deletePaletteItem(color.id)}
                    onSelect={() => setCurrentColor(color.value)}
                  />
                ))}
              </TooltipProvider>
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
}