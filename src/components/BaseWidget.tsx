import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Maximize2, X } from 'lucide-react';

interface BaseWidgetProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  id: string;
  position: { x: number; y: number };
  onPositionChange: (id: string, newPosition: { x: number; y: number }) => void;
  isLocked: boolean;
  initialSize?: { width: number; height: number };
  isActive?: boolean;
  isDraggableOnContent?: boolean;
  onActivate?: () => void;  // Add this prop
  zIndex: number;
}

export function BaseWidget({ 
  id, 
  title, 
  children, 
  onClose, 
  position,
  onPositionChange,
  isLocked,
  initialSize,
  isActive = true,
  isDraggableOnContent = true,
  onActivate,  // Add this prop
  zIndex
}: BaseWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize] = useState(initialSize || { width: 200, height: 200 });
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSize) {
      setSize(initialSize);
    } else if (contentRef.current) {
      const { width, height } = contentRef.current.getBoundingClientRect();
      setSize({ width, height: height + 32 }); // Add 32px for the header
    }
  }, [initialSize]);

  return (
    <Rnd
      position={position}
      size={isMaximized ? { width: '100%', height: '100%' } : size}
      onDragStop={(e, d) => onPositionChange(id, { x: d.x, y: d.y })}
      onDragStart={onActivate}
      onResize={(e, direction, ref, delta, position) => {
        const newSize = {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
        };
        setSize(newSize);
        onActivate();
      }}
      disableDragging={isLocked}
      enableResizing={!isLocked}
      bounds="parent"
      className={`${isMaximized ? 'fixed inset-0 z-50' : ''}`}
      minWidth={200}
      minHeight={100}
      style={{ zIndex: isActive ? zIndex + 1 : zIndex }}
      dragHandleClassName={isDraggableOnContent ? undefined : "drag-handle"}
    >
      <Card className={`w-full h-full flex flex-col overflow-hidden ${isActive ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader 
          ref={headerRef} 
          className={`flex-shrink-0 flex flex-row items-center justify-between py-1 px-2 ${isLocked ? '' : 'cursor-move'} drag-handle`}
          onClick={onActivate}  // Add this line
        >
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setIsMinimized(!isMinimized)}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setIsMaximized(!isMaximized)}>
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent 
          ref={contentRef}
          className={`flex-grow overflow-auto p-2 ${isMinimized ? 'hidden' : ''}`}
        >
          {children}
        </CardContent>
      </Card>
    </Rnd>
  );
}