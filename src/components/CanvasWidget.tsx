import React, { useState, useEffect } from 'react';
import { BaseWidget } from './BaseWidget';
import { Canvas } from './Canvas';
import { File } from '../types';

interface CanvasWidgetProps {
  file: File;
  isActive: boolean;
  onClose: () => void;
  onPositionChange: (id: string, newPosition: { x: number; y: number }) => void;
  isLocked: boolean;
  onActivate: (id: string) => void;  // Add this prop
  zIndex: number;
}

export function CanvasWidget({ file, isActive, onClose, onPositionChange, isLocked, onActivate, zIndex }: CanvasWidgetProps) {
  const [zoom, setZoom] = useState(100);
  const [size, setSize] = useState({ width: file.width + 42, height: file.height + 60 });  // Changed from 30 to 60

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  useEffect(() => {
    const maxWidth = window.innerWidth * 0.8;  // 80% of window width
    const maxHeight = window.innerHeight * 0.8;  // 80% of window height
    const zoomedWidth = file.width * zoom / 100;
    const zoomedHeight = file.height * zoom / 100;
    const newWidth = Math.min(maxWidth, zoomedWidth + 42);  // Add 42 pixels
    const newHeight = Math.min(maxHeight, zoomedHeight + 60);  // Changed from 30 to 60
    setSize({ width: newWidth, height: newHeight });
  }, [file.width, file.height, zoom]);

  return (
    <BaseWidget
      id={file.id}
      title={`${file.name} - ${zoom}%`}
      onClose={onClose}
      position={file.position}
      onPositionChange={onPositionChange}
      isLocked={isLocked}
      initialSize={size}
      isActive={isActive}
      isDraggableOnContent={false}
      onActivate={() => onActivate(file.id)}
      zIndex={zIndex}
    >
      <div className="w-full h-full flex items-center justify-center overflow-auto">
        <Canvas 
          width={file.width} 
          height={file.height} 
          zoom={zoom}
          onZoomChange={handleZoomChange}
        />
      </div>
    </BaseWidget>
  );
}