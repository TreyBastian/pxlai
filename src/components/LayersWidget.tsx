import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLayer } from '../contexts/LayerContext';
import { Layer } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Plus, Trash, GripVertical } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayersWidgetProps {
  fileId: string | null;
}

export function LayersWidget({ fileId }: LayersWidgetProps) {
  const { 
    getLayers,
    addLayer, 
    deleteLayer, 
    toggleLayerVisibility, 
    setActiveLayer, 
    reorderLayers,
    setSelectedLayerIds,
    getSelectedLayers,
    renameLayer,
    getActiveLayerId
  } = useLayer();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const layers = fileId ? getLayers(fileId) : [];
  const selectedLayerIds = fileId ? getSelectedLayers(fileId).map(layer => layer.id) : [];
  const activeLayerId = fileId ? getActiveLayerId(fileId) : null;

  useEffect(() => {
    if (editingLayerId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingLayerId]);

  const handleAddLayer = () => {
    if (fileId) {
      addLayer(fileId);
    }
  };

  const handleRemoveLayer = (layerId: string) => {
    if (fileId) {
      deleteLayer(fileId, layerId);
    }
  };

  const handleToggleVisibility = (layerId: string) => {
    if (fileId) {
      toggleLayerVisibility(fileId, layerId);
    }
  };

  const handleLayerClick = useCallback((layerId: string) => {
    if (fileId) {
      setActiveLayer(fileId, layerId);
    }
  }, [fileId, setActiveLayer]);

  const handleLayerNameClick = useCallback((layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  }, []);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, layerId: string) => {
    if (e.key === 'Enter' && fileId) {
      renameLayer(fileId, layerId, editingName);
      setEditingLayerId(null);
    } else if (e.key === 'Escape') {
      setEditingLayerId(null);
    }
  }, [fileId, renameLayer, editingName]);

  const handleNameBlur = useCallback(() => {
    if (editingLayerId && fileId) {
      renameLayer(fileId, editingLayerId, editingName);
      setEditingLayerId(null);
    }
  }, [fileId, editingLayerId, editingName, renameLayer]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fileId) {
      reorderLayers(fileId, sourceIndex, targetIndex);
    }
  };

  if (!fileId) {
    return <div className="p-4">No file selected</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Layers</h2>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-2">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`flex items-center p-2 border rounded cursor-pointer transition-colors
                ${layer.id === activeLayerId ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
                ${selectedLayerIds.includes(layer.id) ? 'ring-2 ring-primary' : ''}
              `}
              onClick={(e) => handleLayerClick(layer.id)}
            >
              <div
                className="cursor-move mr-2"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <GripVertical size={16} />
              </div>
              <span className="mr-auto">
                {editingLayerId === layer.id ? (
                  <Input
                    ref={inputRef}
                    value={editingName}
                    onChange={handleNameChange}
                    onKeyDown={(e) => handleNameKeyDown(e, layer.id)}
                    onBlur={handleNameBlur}
                    className="w-full h-8 px-2 py-1 text-sm"
                  />
                ) : (
                  <span onClick={() => handleLayerNameClick(layer)}>
                    {layer.name}
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility(layer.id);
                }}
              >
                {layer.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLayer(layer.id);
                }}
              >
                <Trash size={16} />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button className="mt-4 w-full" onClick={handleAddLayer}>
        <Plus size={16} className="mr-2" /> Add Layer
      </Button>
    </div>
  );
}