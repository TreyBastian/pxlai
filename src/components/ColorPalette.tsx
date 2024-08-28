import React, { useState } from 'react';
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

export function ColorPalette() {
  const { 
    currentColor, 
    setCurrentColor, 
    sortedPalette, 
    deletePaletteItem, 
    reorderPalette, 
    loadPalette, 
    saveASEPalette, 
    saveGPLPalette, 
    sortOrder, 
    toggleSortOrder, 
    addToPalette,
    setSelectedColorId
  } = useColor();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sortedPalette.findIndex((item) => item.id === active.id);
      const newIndex = sortedPalette.findIndex((item) => item.id === over.id);
      reorderPalette(arrayMove(sortedPalette, oldIndex, newIndex));
      if (selectedIndex === oldIndex) {
        setSelectedIndex(newIndex);
      } else if (selectedIndex === newIndex) {
        setSelectedIndex(oldIndex);
      }
    }
  };

  const handleAddNewColor = () => {
    const newColor = currentColor || DEFAULT_NEW_COLOR;
    addToPalette(newColor);
    setSelectedIndex(sortedPalette.length);
    setCurrentColor(newColor);
  };

  const handleSelectColor = (index: number) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setCurrentColor(null);
      setSelectedColorId(null);
    } else {
      setSelectedIndex(index);
      setCurrentColor(sortedPalette[index].value);
      setSelectedColorId(sortedPalette[index].id);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadPalette(file);
      } catch (error) {
        console.error('Failed to load palette:', error);
      }
    }
  };

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
            <DropdownMenuItem onSelect={toggleSortOrder}>Toggle Sort Order</DropdownMenuItem>
            <DropdownMenuItem onSelect={saveASEPalette}>Save ASE</DropdownMenuItem>
            <DropdownMenuItem onSelect={saveGPLPalette}>Save GPL</DropdownMenuItem>
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
        <SortableContext items={sortedPalette.map(item => item.id)}>
          <div className="grid grid-cols-4 gap-4">
            {sortedPalette.map((color, index) => (
              <SortableItem
                key={color.id}
                id={color.id}
                value={color.value}
                isSelected={selectedIndex === index}
                onSelect={() => handleSelectColor(index)}
                onDelete={() => deletePaletteItem(color.id)}
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