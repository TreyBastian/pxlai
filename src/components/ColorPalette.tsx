import React, { useState, useCallback } from 'react';
import { useColor } from '../contexts/ColorContext';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  value: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableItem({ id, value, isSelected, onSelect, onDelete }: SortableItemProps) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group w-8 h-8">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`w-full h-full rounded-full focus:outline-none ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              style={{ backgroundColor: value }}
              onClick={onSelect}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Color: {value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <X className="h-2 w-2" />
      </Button>
    </div>
  );
}

interface ColorPaletteProps {
  fileId: string | null;
}

export function ColorPalette({ fileId }: ColorPaletteProps) {
  const { 
    getFileColorState,
    setCurrentColor, 
    addToPalette,
    deletePaletteItem, 
    reorderPalette, 
    loadPalette, 
    saveASEPalette, 
    saveGPLPalette, 
    toggleSortOrder, 
    setSelectedColorId
  } = useColor();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fileColorState = fileId ? getFileColorState(fileId) : null;
  const DEFAULT_NEW_COLOR = 'rgba(200, 200, 200, 1)';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && fileId) {
      const oldIndex = fileColorState?.palette?.findIndex((item) => item.id === active.id);
      const newIndex = fileColorState?.palette?.findIndex((item) => item.id === over.id);
      reorderPalette(fileId, arrayMove(fileColorState?.palette || [], oldIndex, newIndex));
      if (selectedIndex === oldIndex) {
        setSelectedIndex(newIndex);
      } else if (selectedIndex === newIndex) {
        setSelectedIndex(oldIndex);
      }
    }
  }, [fileId, fileColorState, reorderPalette, selectedIndex]);

  const handleAddNewColor = useCallback(() => {
    if (!fileId) return;
    const newColor = fileColorState?.currentColor || DEFAULT_NEW_COLOR;
    addToPalette(fileId, newColor);
    setSelectedIndex(fileColorState?.palette?.length || 0);
    setCurrentColor(fileId, newColor);
  }, [fileId, fileColorState, addToPalette, setCurrentColor]);

  const handleSelectColor = useCallback((index: number) => {
    if (!fileId) return;
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setCurrentColor(fileId, null);
      setSelectedColorId(fileId, null);
    } else {
      setSelectedIndex(index);
      setCurrentColor(fileId, fileColorState?.palette?.[index]?.value || null);
      setSelectedColorId(fileId, fileColorState?.palette?.[index]?.id || null);
    }
  }, [fileId, selectedIndex, setCurrentColor, setSelectedColorId, fileColorState]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileId) return;
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadPalette(fileId, file);
      } catch (error) {
        console.error('Failed to load palette:', error);
      }
    }
  }, [fileId, loadPalette]);

  if (!fileId || !fileColorState) {
    return <div>No file selected</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Color Palette</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[10000]">
            <DropdownMenuItem onSelect={() => toggleSortOrder(fileId)}>Toggle Sort Order</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => saveASEPalette(fileId)}>Save ASE</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => saveGPLPalette(fileId)}>Save GPL</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => document.getElementById('file-upload')?.click()}>
              Load Palette
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          id="file-upload"
          type="file"
          accept=".ase,.gpl"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={fileColorState?.palette?.map(item => item.id) || []}>
          <div className="grid grid-cols-4 gap-4">
            {fileColorState?.palette?.map((color, index) => (
              <SortableItem
                key={color.id}
                id={color.id}
                value={color.value}
                isSelected={selectedIndex === index}
                onSelect={() => handleSelectColor(index)}
                onDelete={() => deletePaletteItem(fileId, color.id)}
              />
            ))}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-full"
                    onClick={handleAddNewColor}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add New Color</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}