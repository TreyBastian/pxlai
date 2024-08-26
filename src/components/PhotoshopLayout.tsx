import React, { useState } from 'react';
import { MenuBar } from './MenuBar';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { Canvas } from './Canvas';
import { ColorPicker } from './ColorPicker';
import { ColorPalette } from './ColorPalette';
import { ToolWidget } from './ToolWidget';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const widgets = [
  { id: 'tools', component: ToolWidget },
  { id: 'colorPalette', component: ColorPalette },
  { id: 'colorPicker', component: ColorPicker },
];

function SortableWidget({ id, component: Component, isDragDisabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    height: '100%',
    cursor: isDragDisabled ? 'default' : 'grab',
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...(isDragDisabled ? {} : listeners)} 
      className="h-full overflow-auto"
    >
      <CardContent className="p-2 h-full">
        <Component />
      </CardContent>
    </Card>
  );
}

export function PhotoshopLayout() {
  const [widgetOrder, setWidgetOrder] = useState(widgets);
  const [isDragDisabled, setIsDragDisabled] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <MenuBar />
      <div className="flex items-center space-x-2 p-2 bg-gray-100">
        <Switch
          id="drag-mode"
          checked={!isDragDisabled}
          onCheckedChange={(checked) => setIsDragDisabled(!checked)}
        />
        <Label htmlFor="drag-mode">Enable Drag and Drop</Label>
      </div>
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            disabled={isDragDisabled}
          >
            <SortableContext items={widgetOrder.map(w => w.id)}>
              <ResizablePanelGroup direction="vertical">
                {widgetOrder.map((widget, index) => (
                  <React.Fragment key={widget.id}>
                    {index > 0 && <ResizableHandle />}
                    <ResizablePanel defaultSize={100 / widgetOrder.length} minSize={10}>
                      <SortableWidget
                        id={widget.id}
                        component={widget.component}
                        isDragDisabled={isDragDisabled}
                      />
                    </ResizablePanel>
                  </React.Fragment>
                ))}
              </ResizablePanelGroup>
            </SortableContext>
          </DndContext>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80}>
          <Canvas />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}