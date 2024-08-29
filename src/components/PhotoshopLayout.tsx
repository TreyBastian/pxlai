import React, { useState, useCallback, useMemo } from 'react';
import { MenuBar } from './MenuBar';
import { ColorPicker } from './ColorPicker';
import { ColorPalette } from './ColorPalette';
import { ToolWidget } from './ToolWidget';
import { useTheme } from '../contexts/ThemeContext';
import { CanvasWidget } from './CanvasWidget';
import { File } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useColor } from '../contexts/ColorContext';
import { LayersWidget } from './LayersWidget';
import { NewFileDialog } from './NewFileDialog';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { BaseWidget } from './BaseWidget';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface PhotoshopLayoutProps {}

export default function PhotoshopLayout({}: PhotoshopLayoutProps) {
  const { theme } = useTheme();
  const { saveFile, loadFile, initializeFile, exportAsPNG, unloadFile, loadPalette, saveASEPalette, saveGPLPalette } = useColor();
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isWindowsLocked, setIsWindowsLocked] = useState(true);
  const [leftPanelWidgets, setLeftPanelWidgets] = useState(['tools', 'colorPalette', 'colorPicker']);
  const [rightPanelWidgets, setRightPanelWidgets] = useState(['layers']);

  const [widgetVisibility, setWidgetVisibility] = useState({
    tools: true,
    colorPalette: true,
    colorPicker: true,
    layers: true,
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleWidget = (id: string) => {
    setWidgetVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const { setNodeRef: setLeftPanelRef } = useDroppable({ id: 'leftPanel' });
  const { setNodeRef: setRightPanelRef } = useDroppable({ id: 'rightPanel' });
  const { setNodeRef: setCenterPanelRef } = useDroppable({ id: 'centerPanel' });

  const [centerPanelWidgets, setCenterPanelWidgets] = useState<string[]>(['canvasWidget']);

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

      setLeftPanelWidgets(newLeftPanelWidgets);
      setRightPanelWidgets(newRightPanelWidgets);
      setCenterPanelWidgets(newCenterPanelWidgets);
    }
  };

  const handleCreateNewFile = (width: number, height: number, name: string, isTransparent: boolean) => {
    const newFile: File = {
      id: uuidv4(),
      name,
      width,
      height,
      position: { x: 300, y: 50 },
      layers: [],
      activeLayerId: null,
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    initializeFile(newFile.id, width, height, isTransparent);
    setIsNewFileDialogOpen(false);
  };

  const handleClose = useCallback((fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(prevActiveFileId => {
        const remainingFiles = files.filter(f => f.id !== fileId);
        return remainingFiles.length > 0 ? remainingFiles[0].id : null;
      });
    }
    unloadFile(fileId);
  }, [activeFileId, files, unloadFile]);

  const handleActivate = useCallback((fileId: string) => {
    setActiveFileId(fileId);
  }, []);

  const handleReorder = useCallback((newOrder: File[]) => {
    setFiles(newOrder);
  }, []);

  const handleSaveFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      saveFile(fileId, file.name, file.width, file.height);
    }
  };

  const handleLoadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const loadedData = await loadFile(file);
        const newFile: File = {
          id: loadedData.id,
          name: loadedData.name,
          width: loadedData.width,
          height: loadedData.height,
          position: { x: 300, y: 50 },
          layers: loadedData.layers,
          activeLayerId: loadedData.activeLayerId,
        };
        setFiles(prevFiles => [...prevFiles, newFile]);
        setActiveFileId(newFile.id);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  };

  const handleExportAsPNG = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      exportAsPNG(fileId, file.name);
    }
  };

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

  const handleSaveASEPalette = useCallback((fileId: string) => {
    const blob = saveASEPalette(fileId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `palette.ase`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [saveASEPalette]);

  const handleSaveGPLPalette = useCallback((fileId: string) => {
    const blob = saveGPLPalette(fileId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `palette.gpl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [saveGPLPalette]);

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
            onClose={handleClose}
            onActivate={handleActivate}
            onReorder={handleReorder}
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
        files={files}
        activeFileId={activeFileId}
        onSwitchFile={handleActivate}
        onSaveFile={handleSaveFile}
        onLoadFile={() => fileInputRef.current?.click()}
        onExportAsPNG={handleExportAsPNG}
        isWindowsLocked={isWindowsLocked}
        setIsWindowsLocked={setIsWindowsLocked}
        toggleWidget={toggleWidget}
        widgetVisibility={widgetVisibility}
        onLoadPalette={handleLoadPalette}
        onSaveASEPalette={handleSaveASEPalette}
        onSaveGPLPalette={handleSaveGPLPalette}
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