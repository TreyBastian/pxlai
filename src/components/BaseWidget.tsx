import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, X, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BaseWidgetProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  id: string;
  isActive?: boolean;
  isDraggable: boolean;
}

export function BaseWidget({ 
  id, 
  title, 
  children, 
  onClose,
  isActive = true,
  isDraggable
}: BaseWidgetProps) {
  const [isMinimized, setIsMinimized] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <Card className={`w-full h-full flex flex-col ${isActive ? 'ring-2 ring-primary' : ''} ${isDragging ? 'ring-2 ring-accent' : ''} border-none rounded-none shadow-none`}>
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between py-1 px-2">
          <div className="flex items-center">
            {isDraggable && (
              <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setIsMinimized(!isMinimized)}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent 
          className={`flex-grow overflow-auto p-2 ${isMinimized ? 'hidden' : ''}`}
        >
          {children}
        </CardContent>
      </Card>
    </div>
  );
}