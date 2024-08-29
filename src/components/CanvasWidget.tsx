import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Canvas from './Canvas';
import { File } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { BaseWidget } from './BaseWidget';
import { useFile } from '../contexts/FileContext';
import { useWidget } from '../contexts/WidgetContext';

function SortableTab({ file, onClose, isActive }: { file: File; onClose: (fileId: string) => void; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose(file.id);
  };

  return (
    <div ref={setNodeRef} className="flex items-center relative" style={style} {...attributes} {...listeners}>
      <TabsTrigger value={file.id} className="pr-8" data-state={isActive ? "active" : "inactive"}>
        <span>{file.name}</span>
      </TabsTrigger>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 absolute right-1 top-1/2 transform -translate-y-1/2"
        onClick={handleClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function CanvasWidget() {
  const { files, activeFileId, closeFile, activateFile, reorderFiles } = useFile();
  const { isWindowsLocked } = useWidget();
  const [zoom, setZoom] = useState(100);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = files.findIndex((file) => file.id === active.id);
      const newIndex = files.findIndex((file) => file.id === over.id);
      const newOrder = arrayMove(files, oldIndex, newIndex);
      reorderFiles(newOrder);
    }
  }, [files, reorderFiles]);

  const handleClose = useCallback((fileId: string) => {
    closeFile(fileId);
  }, [closeFile]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      setZoom(prevZoom => Math.max(10, Math.min(500, prevZoom - event.deltaY / 2)));
    }
  }, []);

  const tabItems = useMemo(() => files.map(file => file.id), [files]);

  const activeFile = useMemo(() => files.find(file => file.id === activeFileId), [files, activeFileId]);

  return (
    <BaseWidget
      id="canvasWidget"
      title={`Canvas (${Math.round(zoom)}%)`}
      onClose={() => {}}
      isDraggable={!isWindowsLocked}
    >
      <div className="w-full h-full flex flex-col">
        <Tabs value={activeFileId || undefined} onValueChange={activateFile} className="w-full h-full flex flex-col">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tabItems} strategy={horizontalListSortingStrategy}>
              <TabsList className="flex justify-start w-full overflow-x-auto">
                {files.map((file) => (
                  <SortableTab 
                    key={file.id} 
                    file={file} 
                    onClose={handleClose}
                    isActive={file.id === activeFileId}
                  />
                ))}
              </TabsList>
            </SortableContext>
          </DndContext>
          {activeFile && (
            <TabsContent value={activeFile.id} className="flex-grow" onWheel={handleWheel}>
              <Canvas
                key={activeFile.id}
                fileId={activeFile.id}
                width={activeFile.width}
                height={activeFile.height}
                zoom={zoom}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </BaseWidget>
  );
}

export default React.memo(CanvasWidget);