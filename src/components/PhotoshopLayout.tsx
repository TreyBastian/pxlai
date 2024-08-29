import React, { useState, useCallback, useMemo, useRef } from 'react';
import { MenuBar } from './MenuBar';
import { ColorPicker } from './ColorPicker';
import { ColorPalette } from './ColorPalette';
import { ToolWidget } from './ToolWidget';
import { useTheme } from '../contexts/ThemeContext';
import { CanvasWidget } from './CanvasWidget';
import { useColor } from '../contexts/ColorContext';
import { useFile } from '../contexts/FileContext';
import { useLayer } from '../contexts/LayerContext';
import { useWidget } from '../contexts/WidgetContext';
import { LayersWidget } from './LayersWidget';
import { NewFileDialog } from './NewFileDialog';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { BaseWidget } from './BaseWidget';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

export default function PhotoshopLayout() {
  const { theme } = useTheme();
  const { loadPalette, saveASEPalette, saveGPLPalette } = useColor();
  const { files, activeFileId, createNewFile, closeFile, activateFile, reorderFiles, saveFile, loadFile, exportAsPNG } = useFile();
  const { addLayer } = useLayer();
  const { widgetVisibility, toggleWidget, leftPanelWidgets, rightPanelWidgets, centerPanelWidgets, updatePanelWidgets, isWindowsLocked, setIsWindowsLocked } = useWidget();

  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [activeId, setActiveId] = useState<string | null>(null);

  const { setNodeRef: setLeftPanelRef } = useDroppable({ id: 'leftPanel' });
  const { setNodeRef: setRightPanelRef } = useDroppable({ id: 'rightPanel' });
  const { setNodeRef: setCenterPanelRef } = useDroppable({ id: 'centerPanel' });

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;

      let activePanel, overPanel;

      if (leftPanelWidgets.includes(activeId)) activePanel = 'left';
      else if (rightPanelWidgets.includes(activeId)) activePanel = 'right';
      else if (centerPanelWidgets.includes(activeId)) activePanel = 'center';

      if (overId === 'leftPanel') overPanel = 'left';
      else if (overId === 'rightPanel') overPanel = 'right';
      else if (overId === 'centerPanel') overPanel = 'center';
      else {
        if (leftPanelWidgets.includes(overId)) overPanel = 'left';
        else if (rightPanelWidgets.includes(overId)) overPanel = 'right';
        else if (centerPanelWidgets.includes(overId)) overPanel = 'center';
      }

      const getUpdatedPanels = () => {
        let newLeftPanelWidgets = [...leftPanelWidgets];
        let newRightPanelWidgets = [...rightPanelWidgets];
        let newCenterPanelWidgets = [...centerPanelWidgets];

        // Remove the active widget from its original panel
        if (activePanel === 'left') newLeftPanelWidgets = newLeftPanelWidgets.filter(id => id !== activeId);
        else if (activePanel === 'right') newRightPanelWidgets = newRightPanelWidgets.filter(id => id !== activeId);
        else if (activePanel === 'center') newCenterPanelWidgets = newCenterPanelWidgets.filter(id => id !== activeId);

        // Add the active widget to its new panel
        if (overPanel === 'left') newLeftPanelWidgets.push(activeId);
        else if (overPanel === 'right') newRightPanelWidgets.push(activeId);
        else if (overPanel === 'center') newCenterPanelWidgets.push(activeId);

        return { newLeftPanelWidgets, newRightPanelWidgets, newCenterPanelWidgets };
      };

      const { newLeftPanelWidgets, newRightPanelWidgets, newCenterPanelWidgets } = getUpdatedPanels();

      updatePanelWidgets('left', newLeftPanelWidgets);
      updatePanelWidgets('right', newRightPanelWidgets);
      updatePanelWidgets('center', newCenterPanelWidgets);
    }
  };

  const handleCreateNewFile = useCallback((width: number, height: number, name: string, isTransparent: boolean) => {
    createNewFile(width, height, name, isTransparent);
    setIsNewFileDialogOpen(false);
  }, [createNewFile]);

  const handleLoadFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadFile(file);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  }, [loadFile]);

  const handleLoadPalette = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ase,.gpl';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && activeFileId) {
        await loadPalette(activeFileId, file);
      }
    };
    input.click();
  }, [activeFileId, loadPalette]);

  const renderWidgets = (panelWidgets: string[], panelId: string) => (
    <SortableContext items={panelWidgets} strategy={verticalListSortingStrategy}>
      <ResizablePanelGroup direction="vertical">
        {panelWidgets.map((widgetId, index) => (
          <React.Fragment key={widgetId}>
            {index > 0 && <ResizableHandle />}
            <ResizablePanel>
              {renderWidget(widgetId)}
            </ResizablePanel>
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    </SortableContext>
  );

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'tools':
        return (
          <BaseWidget
            id={widgetId}
            title="Tools"
            onClose={() => toggleWidget(widgetId)}
            isDraggable={!isWindowsLocked}
          >
            <ToolWidget />
          </BaseWidget>
        );
      case 'colorPalette':
        return (
          <BaseWidget
            id={widgetId}
            title="Color Palette"
            onClose={() => toggleWidget(widgetId)}
            isDraggable={!isWindowsLocked}
          >
            <ColorPalette fileId={activeFileId || null} />
          </BaseWidget>
        );
      case 'colorPicker':
        return (
          <BaseWidget
            id={widgetId}
            title="Color Picker"
            onClose={() => toggleWidget(widgetId)}
            isDraggable={!isWindowsLocked}
          >
            <ColorPicker fileId={activeFileId || null} />
          </BaseWidget>
        );
      case 'layers':
        return (
          <BaseWidget
            id={widgetId}
            title="Layers"
            onClose={() => toggleWidget(widgetId)}
            isDraggable={!isWindowsLocked}
          >
            <LayersWidget fileId={activeFileId || null} />
          </BaseWidget>
        );
      case 'canvasWidget':
        return (
          <CanvasWidget
            files={files}
            activeFileId={activeFileId}
            onClose={closeFile}
            onActivate={activateFile}
            onReorder={reorderFiles}
            isDraggable={!isWindowsLocked}
          />
        );
      default:
        return null;
    }
  };

  const memoizedFiles = useMemo(() => files, [files]);
  const memoizedActiveFileId = useMemo(() => activeFileId, [activeFileId]);

  return (
    <div className="h-screen flex flex-col">
      <MenuBar 
        onCreateNewFile={() => setIsNewFileDialogOpen(true)}
      />
      <DndContext 
        onDragStart={onDragStart}
        onDragEnd={onDragEnd} 
        collisionDetection={closestCenter}
      >
        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div ref={setLeftPanelRef} className="h-full">
              {renderWidgets(leftPanelWidgets, 'leftPanel')}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={60}>
            <div ref={setCenterPanelRef} className="h-full">
              {renderWidgets(centerPanelWidgets, 'centerPanel')}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div ref={setRightPanelRef} className="h-full">
              {renderWidgets(rightPanelWidgets, 'rightPanel')}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <DragOverlay>
          {activeId ? renderWidget(activeId) : null}
        </DragOverlay>
      </DndContext>

      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onClose={() => setIsNewFileDialogOpen(false)}
        onCreateNewFile={handleCreateNewFile}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pxlai"
        style={{ display: 'none' }}
        onChange={handleLoadFile}
      />
    </div>
  );
}