import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Layer } from '../types';
import { setSharedFunctions } from './SharedContextFunctions';

interface LayerContextType {
  getLayers: (fileId: string) => Layer[];
  addLayer: (fileId: string, name?: string) => void;
  deleteLayer: (fileId: string, layerId: string) => void;
  reorderLayers: (fileId: string, startIndex: number, endIndex: number) => void;
  setActiveLayer: (fileId: string, layerId: string) => void;
  toggleLayerVisibility: (fileId: string, layerId: string) => void;
  updateLayerData: (fileId: string, layerId: string, canvasData: string) => void;
  setSelectedLayerIds: (fileId: string, layerIds: string[]) => void;
  renameLayer: (fileId: string, layerId: string, newName: string) => void;
  getSelectedLayers: (fileId: string) => Layer[];
  getActiveLayerId: (fileId: string) => string | null;
  createInitialLayer: (fileId: string, width: number, height: number, isTransparent: boolean) => Layer;
  setFileLayers: (fileId: string, layers: Layer[]) => void;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider({ children }: { children: React.ReactNode }) {
  const [fileLayersState, setFileLayersState] = useState<Record<string, Layer[]>>({});
  const [activeLayerIds, setActiveLayerIds] = useState<Record<string, string | null>>({});
  const [selectedLayerIds, setSelectedLayerIdsInternal] = useState<Record<string, string[]>>({});

  const getLayers = useCallback((fileId: string) => {
    return fileLayersState[fileId] || [];
  }, [fileLayersState]);

  const addLayer = useCallback((fileId: string, name: string = `Layer ${Date.now()}`) => {
    const newLayer: Layer = {
      id: uuidv4(),
      name,
      isVisible: true,
      canvasData: createTransparentCanvas(500, 500), // Default size, adjust as needed
    };
    setFileLayersState(prev => ({
      ...prev,
      [fileId]: [newLayer, ...(prev[fileId] || [])],
    }));
    setActiveLayerIds(prev => ({
      ...prev,
      [fileId]: newLayer.id,
    }));
  }, []);

  const deleteLayer = useCallback((fileId: string, layerId: string) => {
    setFileLayersState(prev => ({
      ...prev,
      [fileId]: prev[fileId].filter(layer => layer.id !== layerId),
    }));
    setActiveLayerIds(prev => ({
      ...prev,
      [fileId]: prev[fileId] === layerId ? (prev[fileId][0]?.id || null) : prev[fileId],
    }));
    setSelectedLayerIdsInternal(prev => ({
      ...prev,
      [fileId]: prev[fileId].filter(id => id !== layerId),
    }));
  }, []);

  const reorderLayers = useCallback((fileId: string, startIndex: number, endIndex: number) => {
    setFileLayersState(prev => {
      const newLayers = [...(prev[fileId] || [])];
      const [removed] = newLayers.splice(startIndex, 1);
      newLayers.splice(endIndex, 0, removed);
      return { ...prev, [fileId]: newLayers };
    });
  }, []);

  const setActiveLayer = useCallback((fileId: string, layerId: string) => {
    setActiveLayerIds(prev => ({
      ...prev,
      [fileId]: layerId,
    }));
  }, []);

  const toggleLayerVisibility = useCallback((fileId: string, layerId: string) => {
    setFileLayersState(prev => ({
      ...prev,
      [fileId]: prev[fileId].map(layer =>
        layer.id === layerId ? { ...layer, isVisible: !layer.isVisible } : layer
      ),
    }));
  }, []);

  const updateLayerData = useCallback((fileId: string, layerId: string, canvasData: string) => {
    setFileLayersState(prev => ({
      ...prev,
      [fileId]: prev[fileId].map(layer =>
        layer.id === layerId ? { ...layer, canvasData } : layer
      ),
    }));
  }, []);

  const setSelectedLayerIds = useCallback((fileId: string, layerIds: string[]) => {
    setSelectedLayerIdsInternal(prev => ({
      ...prev,
      [fileId]: layerIds,
    }));
  }, []);

  const renameLayer = useCallback((fileId: string, layerId: string, newName: string) => {
    setFileLayersState(prev => ({
      ...prev,
      [fileId]: prev[fileId].map(layer =>
        layer.id === layerId ? { ...layer, name: newName } : layer
      ),
    }));
  }, []);

  const getSelectedLayers = useCallback((fileId: string) => {
    const layers = fileLayersState[fileId] || [];
    const selected = selectedLayerIds[fileId] || [];
    return layers.filter(layer => selected.includes(layer.id));
  }, [fileLayersState, selectedLayerIds]);

  const getActiveLayerId = useCallback((fileId: string) => {
    return activeLayerIds[fileId] || null;
  }, [activeLayerIds]);

  const createInitialLayer = useCallback((fileId: string, width: number, height: number, isTransparent: boolean) => {
    const initialLayer: Layer = {
      id: uuidv4(),
      name: 'Background',
      isVisible: true,
      canvasData: isTransparent ? createTransparentCanvas(width, height) : createWhiteCanvas(width, height),
    };
    setFileLayersState(prev => ({
      ...prev,
      [fileId]: [initialLayer],
    }));
    setActiveLayerIds(prev => ({
      ...prev,
      [fileId]: initialLayer.id,
    }));
    setSelectedLayerIdsInternal(prev => ({
      ...prev,
      [fileId]: [initialLayer.id],
    }));
    return initialLayer;
  }, []);

  const setFileLayers = useCallback((fileId: string, layers: Layer[]) => {
    setFileLayersState(prev => ({
      ...prev,
      [fileId]: layers
    }));
    setActiveLayerIds(prev => ({
      ...prev,
      [fileId]: layers[0]?.id || null
    }));
    setSelectedLayerIdsInternal(prev => ({
      ...prev,
      [fileId]: [layers[0]?.id || null]
    }));
  }, []);

  // Set shared functions
  useMemo(() => {
    setSharedFunctions({
      createInitialLayer,
      setFileLayers,
      setFileColorState: () => {}, // This will be set by ColorContext
    });
  }, [createInitialLayer, setFileLayers]);

  const contextValue = useMemo(() => ({
    getLayers,
    addLayer,
    deleteLayer,
    reorderLayers,
    setActiveLayer,
    toggleLayerVisibility,
    updateLayerData,
    setSelectedLayerIds,
    renameLayer,
    getSelectedLayers,
    getActiveLayerId,
    createInitialLayer,
    setFileLayers,
  }), [
    getLayers,
    addLayer,
    deleteLayer,
    reorderLayers,
    setActiveLayer,
    toggleLayerVisibility,
    updateLayerData,
    setSelectedLayerIds,
    renameLayer,
    getSelectedLayers,
    getActiveLayerId,
    createInitialLayer,
    setFileLayers,
  ]);

  return (
    <LayerContext.Provider value={contextValue}>
      {children}
    </LayerContext.Provider>
  );
}

export const useLayer = () => {
  const context = useContext(LayerContext);
  if (context === undefined) {
    throw new Error('useLayer must be used within a LayerProvider');
  }
  return context;
};

// Helper functions
const createWhiteCanvas = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
  }
  return canvas.toDataURL();
};

const createTransparentCanvas = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // We don't need to do anything else, as the canvas is transparent by default
  return canvas.toDataURL();
};