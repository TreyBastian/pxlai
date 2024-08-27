import React, { useState } from 'react';
import { useColor } from '../contexts/ColorContext';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortAsc, ArrowDownAZ, ArrowUpAZ, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DownloadIcon, UploadIcon, FileIcon } from '@radix-ui/react-icons';
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`w-8 h-8 rounded-full focus:outline-none ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            style={{ backgroundColor: value }}
            onClick={handleClick}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Color: {value}</p>
        </TooltipContent>
      </Tooltip>
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <span className="text-[10px]">×</span>
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
    setSelectedColorId  // Add this
  } = useColor();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const DEFAULT_NEW_COLOR = 'rgba(200, 200, 200, 1)'; // Default grayish color with full opacity

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
    setSelectedIndex(sortedPalette.length); // Select the newly added color
    setCurrentColor(newColor);
  };

  const handleSelectColor = (index: number) => {
    if (selectedIndex === index) {
      // Deselect if already selected
      setSelectedIndex(null);
      setCurrentColor(null);
      setSelectedColorId(null);  // Add this
    } else {
      setSelectedIndex(index);
      setCurrentColor(sortedPalette[index].value);
      setSelectedColorId(sortedPalette[index].id);  // Add this
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

  const downloadPalette = (format: 'ase' | 'gpl') => {
    const blob = format === 'ase' ? saveASEPalette() : saveGPLPalette();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = () => {
    switch (sortOrder) {
      case 'default':
        return <SortAsc className="h-4 w-4" />;
      case 'lightness-asc':
        return <ArrowUpAZ className="h-4 w-4" />;
      case 'lightness-desc':
        return <ArrowDownAZ className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 w-full flex justify-between items-center p-2 bg-secondary rounded-md">
        <input
          type="file"
          accept=".gpl,.ase"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="palette-file-input"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => document.getElementById('palette-file-input')?.click()}
              >
                <UploadIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload Palette</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download Palette</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => downloadPalette('ase')}>
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Download ASE</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadPalette('gpl')}>
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Download GPL</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleSortOrder}>
                {getSortIcon()}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Sort Order</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="flex-grow">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedPalette.map(color => color.id)}>
            <div className="flex flex-wrap gap-4 p-4">
              <TooltipProvider>
                {sortedPalette.map((color, index) => (
                  <SortableItem
                    key={color.id}
                    id={color.id}
                    value={color.value}
                    isSelected={index === selectedIndex}
                    onSelect={() => handleSelectColor(index)}
                    onDelete={() => {
                      deletePaletteItem(color.id);
                      if (selectedIndex === index) {
                        setSelectedIndex(null);
                        setCurrentColor(null);
                      } else if (selectedIndex && selectedIndex > index) {
                        setSelectedIndex(selectedIndex - 1);
                      }
                    }}
                  />
                ))}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="w-8 h-8 rounded-full focus:outline-none bg-secondary flex items-center justify-center"
                      onClick={handleAddNewColor}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add New Color</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
}