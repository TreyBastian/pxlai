import React, { useState, useRef } from 'react';
import { MenuBar } from './MenuBar';
import { ColorPicker } from './ColorPicker';
import { ColorPalette } from './ColorPalette';
import { ToolWidget } from './ToolWidget';
import { useTheme } from '../contexts/ThemeContext';
import { BaseWidget } from './BaseWidget';
import { CanvasWidget } from './CanvasWidget';
import { File } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useColor } from '../contexts/ColorContext';
import { LayersWidget } from './LayersWidget';
import Canvas from './Canvas';
import { NewFileDialog } from './NewFileDialog';

interface PhotoshopLayoutProps {}

interface WidgetData {
  id: string;
  component: React.ComponentType<any>;
  isVisible: boolean;
  position: { x: number; y: number };
}

export default function PhotoshopLayout({}: PhotoshopLayoutProps) {
  const { theme } = useTheme();
  const { saveFile, loadFile, initializeFile } = useColor();
  const [widgets, setWidgets] = useState<WidgetData[]>([
    { id: 'tools', component: ToolWidget, isVisible: true, position: { x: 10, y: 10 } },
    { id: 'colorPalette', component: ColorPalette, isVisible: true, position: { x: 10, y: 420 } },
    { id: 'colorPicker', component: ColorPicker, isVisible: true, position: { x: 10, y: 630 } },
    { id: 'layers', component: LayersWidget, isVisible: true, position: { x: 220, y: 10 } },
  ]);
  const [isWindowsLocked, setIsWindowsLocked] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreateNewFile = (width: number, height: number, name: string, isTransparent: boolean) => {
    console.log(`Creating new file: width=${width}, height=${height}, name=${name}, isTransparent=${isTransparent}`);
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
        console.log(`Loaded file version: ${loadedData.version}`);
        
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

        // Load the canvas data
        setTimeout(() => {
          const canvas = document.querySelector(`canvas[data-file-id="${newFile.id}"]`) as HTMLCanvasElement;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
              ctx?.drawImage(img, 0, 0);
            };
            img.src = loadedData.canvasData;
          }
        }, 0);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click target is the background div itself
    if (e.target === e.currentTarget) {
      setActiveFileId(null);
      setActiveWidgetId(null);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <MenuBar 
        onCreateNewFile={handleCreateNewFile}
        toggleWidget={toggleWidget}
        isWindowsLocked={isWindowsLocked}
        setIsWindowsLocked={setIsWindowsLocked}
        widgetVisibility={widgetVisibility}
        files={files}
        activeFileId={activeFileId}
        onSwitchFile={handleSwitchFile}
        onSaveFile={handleSaveFile}
        onLoadFile={() => fileInputRef.current?.click()}
      />
      <div 
        className="flex-grow relative"
        onClick={handleBackgroundClick} // Add this line
      >
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
              {id === 'colorPalette' || id === 'colorPicker' || id === 'layers' ? (
                <Widget fileId={activeFileId || null} />
              ) : (
                <Widget />
              )}
            </BaseWidget>
          )
        ))}
      </div>
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