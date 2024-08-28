import React from 'react';
import { BaseWidget } from './BaseWidget';
import Canvas from './Canvas'; // Change this line to import the default export
import { File } from '../types';

interface CanvasWidgetProps {
  file: File;
  isActive: boolean;
  onClose: () => void;
  onPositionChange: (id: string, newPosition: { x: number; y: number }) => void;
  isLocked: boolean;
  onActivate: (id: string) => void;
  zIndex: number;
}

export function CanvasWidget({
  file,
  isActive,
  onClose,
  onPositionChange,
  isLocked,
  onActivate,
  zIndex,
}: CanvasWidgetProps) {
  return (
    <BaseWidget
      id={file.id}
      title={file.name}
      onClose={onClose}
      position={file.position}
      onPositionChange={onPositionChange}
      isLocked={isLocked}
      isActive={isActive}
      onActivate={() => onActivate(file.id)}
      zIndex={zIndex}
    >
      <div className="p-2">
        <Canvas
          fileId={file.id}
          width={file.width}
          height={file.height}
        />
      </div>
    </BaseWidget>
  );
}