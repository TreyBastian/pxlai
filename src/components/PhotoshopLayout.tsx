import React, { useState } from 'react';
import { MenuBar } from './MenuBar';
import { ColorPicker } from './ColorPicker';
import { ColorPalette } from './ColorPalette';
import { ToolWidget } from './ToolWidget';
import { useTheme } from '../contexts/ThemeContext';
import { BaseWidget } from './BaseWidget';
import { CanvasWidget } from './CanvasWidget';
import { File } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { NewFileDialog } from './NewFileDialog';

interface PhotoshopLayoutProps {}

interface WidgetData {
  id: string;
  component: React.ComponentType<any>;
  isVisible: boolean;
  position: { x: number; y: number };
}

export function PhotoshopLayout({}: PhotoshopLayoutProps) {
  const { theme } = useTheme();
  const [widgets, setWidgets] = useState<WidgetData[]>([
    { id: 'tools', component: ToolWidget, isVisible: true, position: { x: 10, y: 10 } },
    { id: 'colorPalette', component: ColorPalette, isVisible: true, position: { x: 10, y: 420 } },
    { id: 'colorPicker', component: ColorPicker, isVisible: true, position: { x: 10, y: 630 } },
  ]);
  const [isWindowsLocked, setIsWindowsLocked] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === id ? { ...widget, isVisible: !widget.isVisible } : widget
    ));
  };

  const handlePositionChange = (id: string, newPosition: { x: number; y: number }) => {
    setWidgets(widgets.map(widget =>
      widget.id === id ? { ...widget, position: newPosition } : widget
    ));
    setFiles(files.map(file =>
      file.id === id ? { ...file, position: newPosition } : file
    ));
  };

  const widgetVisibility = Object.fromEntries(
    widgets.map(widget => [widget.id, widget.isVisible])
  );

  const handleCreateNewFile = (width: number, height: number, name: string) => {
    const newFile: File = {
      id: uuidv4(),
      name,
      width,
      height,
      position: { x: 300, y: 50 },
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setIsNewFileDialogOpen(false);
  };

  const handleSwitchFile = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const handleCloseFile = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(files.length > 1 ? files[0].id : null);
    }
  };

  const handleActivateFile = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const handleActivateWidget = (id: string) => {
    setActiveWidgetId(id);
  };

  return (
    <div className="h-screen flex flex-col">
      <MenuBar 
        onCreateNewFile={() => setIsNewFileDialogOpen(true)}
        toggleWidget={toggleWidget}
        isWindowsLocked={isWindowsLocked}
        setIsWindowsLocked={setIsWindowsLocked}
        widgetVisibility={widgetVisibility}
        files={files}
        activeFileId={activeFileId}
        onSwitchFile={handleSwitchFile}
      />
      <div className="flex-grow relative">
        {/* Render canvas widgets first */}
        {files.map((file) => (
          <CanvasWidget
            key={file.id}
            file={file}
            isActive={file.id === activeFileId}
            onClose={() => handleCloseFile(file.id)}
            onPositionChange={handlePositionChange}
            isLocked={isWindowsLocked}
            onActivate={handleActivateFile}
            zIndex={files.indexOf(file)}
          />
        ))}
        {/* Render UI widgets on top */}
        {widgets.map(({ id, component: Widget, isVisible, position }) => (
          isVisible && (
            <BaseWidget 
              key={id} 
              id={id} 
              title={id.charAt(0).toUpperCase() + id.slice(1)}
              onClose={() => toggleWidget(id)} 
              position={position}
              onPositionChange={handlePositionChange}
              isLocked={isWindowsLocked}
              initialSize={id === 'colorPicker' ? { width: 600, height: 600 } : undefined}
              isActive={id === activeWidgetId}
              onActivate={() => handleActivateWidget(id)}
              zIndex={1000 + widgets.indexOf({ id, component: Widget, isVisible, position })}
            >
              <Widget />
            </BaseWidget>
          )
        ))}
      </div>
      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onClose={() => setIsNewFileDialogOpen(false)}
        onCreateNewFile={handleCreateNewFile}
      />
    </div>
  );
}