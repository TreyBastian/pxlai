import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Layer } from '../types';

interface Color {
  id: string;
  value: string;
  name?: string;
}

type SortOrder = 'default' | 'lightness-asc' | 'lightness-desc';

interface FileColorState {
  currentColor: string | null;
  palette: Color[];
  sortOrder: SortOrder;
  selectedColorId: string | null;
  layers: Layer[];
  activeLayerId: string | null;
  selectedLayerIds: string[];
}

interface ColorContextType {
  getFileColorState: (fileId: string | null) => FileColorState | null;
  setCurrentColor: (fileId: string, color: string | null) => void;
  addToPalette: (fileId: string, color: string) => void;
  deletePaletteItem: (fileId: string, colorId: string) => void;
  reorderPalette: (fileId: string, newPalette: Color[]) => void;
  loadPalette: (fileId: string, file: File) => Promise<void>;
  saveASEPalette: (fileId: string) => Blob;
  saveGPLPalette: (fileId: string) => Blob;
  toggleSortOrder: (fileId: string) => void;
  updatePaletteColor: (fileId: string, colorId: string, newColor: string) => void;
  setSelectedColorId: (fileId: string, colorId: string | null) => void;
  getCurrentColor: (fileId: string | null) => string | null;
  saveFile: (fileId: string, fileName: string, width: number, height: number) => void;
  loadFile: (file: File) => Promise<{
    id: string;
    name: string;
    width: number;
    height: number;
    layers: Layer[];
    activeLayerId: string | null;
  }>;
  addLayer: (fileId: string, name: string) => void;
  deleteLayer: (fileId: string, layerId: string) => void;
  toggleLayerVisibility: (fileId: string, layerId: string) => void;
  setActiveLayer: (fileId: string, layerId: string) => void;
  reorderLayers: (fileId: string, startIndex: number, endIndex: number) => void;
  initializeFile: (fileId: string, width: number, height: number, isTransparent: boolean) => void;
  updateLayerData: (fileId: string, layerId: string, canvasData: string) => void;
  setSelectedLayerIds: (fileId: string, layerIds: string[]) => void;
  renameLayer: (fileId: string, layerId: string, newName: string) => void;
  exportAsPNG: (fileId: string, fileName: string) => void;
  unloadFile: (fileId: string) => void;
  getCanvasData: (fileId: string) => string | null;
  updateCanvasData: (fileId: string, data: string) => void;
  getSelectedLayers: (fileId: string) => Layer[];
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

const CURRENT_FILE_VERSION = "0.3";

const INITIAL_PALETTE = [
  { id: uuidv4(), value: 'rgba(0, 0, 0, 1)', name: 'Black' },
  { id: uuidv4(), value: 'rgba(255, 255, 255, 1)', name: 'White' },
];

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

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [fileColorStates, setFileColorStates] = useState<Record<string, FileColorState>>({});
  const [canvasData, setCanvasData] = useState<Record<string, string>>({});

  const getFileColorState = useCallback((fileId: string | null) => {
    console.log('getFileColorState called with fileId:', fileId);
    if (!fileId) return null;
    return fileColorStates[fileId] || null;
  }, [fileColorStates]);

  const setCurrentColor = useCallback((fileId: string, color: string | null) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        currentColor: color
      }
    }));
  }, []);

  const addToPalette = useCallback((fileId: string, color: string) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        palette: [...prev[fileId].palette, { id: uuidv4(), value: color }]
      }
    }));
  }, []);

  const deletePaletteItem = useCallback((fileId: string, colorId: string) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        palette: prev[fileId].palette.filter(color => color.id !== colorId)
      }
    }));
  }, []);

  const reorderPalette = useCallback((fileId: string, newPalette: Color[]) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        palette: newPalette
      }
    }));
  }, []);

  const toggleSortOrder = useCallback((fileId: string) => {
    setFileColorStates(prev => {
      const currentOrder = prev[fileId].sortOrder;
      const orders: SortOrder[] = ['default', 'lightness-asc', 'lightness-desc'];
      const currentIndex = orders.indexOf(currentOrder);
      const newOrder = orders[(currentIndex + 1) % orders.length];
      return {
        ...prev,
        [fileId]: {
          ...prev[fileId],
          sortOrder: newOrder
        }
      };
    });
  }, []);

  const updatePaletteColor = useCallback((fileId: string, colorId: string, newColor: string) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        palette: prev[fileId].palette.map(color => 
          color.id === colorId ? { ...color, value: newColor } : color
        )
      }
    }));
  }, []);

  const setSelectedColorId = useCallback((fileId: string, colorId: string | null) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        selectedColorId: colorId
      }
    }));
  }, []);

  const loadPalette = useCallback(async (fileId: string, file: File) => {
    const buffer = await file.arrayBuffer();
    const extension = file.name.split('.').pop()?.toLowerCase();

    let newPalette: Color[] = [];

    if (extension === 'ase') {
      newPalette = await loadASEPalette(buffer);
    } else if (extension === 'gpl') {
      newPalette = await loadGPLPalette(buffer);
    } else {
      throw new Error('Unsupported file format');
    }

    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        palette: [...prev[fileId].palette, ...newPalette]
      }
    }));
  }, []);

  const saveASEPalette = useCallback((fileId: string) => {
    const fileState = fileColorStates[fileId];
    if (!fileState) return new Blob();

    // Implement ASE palette saving logic here
    // This is a placeholder implementation
    const aseData = fileState.palette.map(color => {
      return `${color.name || 'Untitled'}\n${color.value}\n`;
    }).join('\n');

    return new Blob([aseData], { type: 'application/octet-stream' });
  }, [fileColorStates]);

  const saveGPLPalette = useCallback((fileId: string) => {
    const fileState = fileColorStates[fileId];
    if (!fileState) return new Blob();

    // Implement GPL palette saving logic here
    // This is a placeholder implementation
    const gplData = fileState.palette.map(color => {
      const [r, g, b] = color.value.match(/\d+/g)!.map(Number);
      return `${r} ${g} ${b} ${color.name || 'Untitled'}`;
    }).join('\n');

    const header = 'GIMP Palette\nName: Custom Palette\nColumns: 16\n#\n';
    return new Blob([header + gplData], { type: 'text/plain' });
  }, [fileColorStates]);

  const loadASEPalette = async (buffer: ArrayBuffer): Promise<Color[]> => {
    // Implement ASE palette loading logic here
    // This is a placeholder implementation
    const text = new TextDecoder().decode(buffer);
    return text.split('\n').filter(line => line.trim()).map(line => ({
      id: uuidv4(),
      name: line.split('\n')[0],
      value: line.split('\n')[1] || 'rgba(0,0,0,1)'
    }));
  };

  const loadGPLPalette = async (buffer: ArrayBuffer): Promise<Color[]> => {
    // Implement GPL palette loading logic here
    // This is a placeholder implementation
    const text = new TextDecoder().decode(buffer);
    return text.split('\n')
      .filter(line => !line.startsWith('#') && line.trim())
      .map(line => {
        const [r, g, b, ...nameParts] = line.split(' ');
        return {
          id: uuidv4(),
          name: nameParts.join(' ') || 'Untitled',
          value: `rgba(${r},${g},${b},1)`
        };
      });
  };

  const getCurrentColor = useCallback((fileId: string | null) => {
    console.log('getCurrentColor called with fileId:', fileId);
    if (!fileId) return null;
    return fileColorStates[fileId]?.currentColor || null;
  }, [fileColorStates]);

  const saveFile = useCallback((fileId: string, fileName: string, width: number, height: number) => {
    const fileState = fileColorStates[fileId];
    if (!fileState) return;

    const fileData = {
      version: CURRENT_FILE_VERSION,
      id: fileId,
      name: fileName,
      width,
      height,
      colorState: fileState,
    };

    const blob = new Blob([JSON.stringify(fileData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.pxlai`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [fileColorStates]);

  const loadFile = useCallback(async (file: File) => {
    const text = await file.text();
    const fileData = JSON.parse(text);

    let layers, activeLayerId, palette, sortOrder, selectedColorId, currentColor;

    switch (fileData.version) {
      case "0.1":
        layers = [{ id: uuidv4(), name: 'Background', isVisible: true, canvasData: fileData.canvasData }];
        activeLayerId = layers[0].id;
        palette = INITIAL_PALETTE;
        sortOrder = 'default';
        selectedColorId = INITIAL_PALETTE[0].id;
        currentColor = 'rgba(0, 0, 0, 1)';
        break;
      case "0.2":
      case "0.3":
        // Use fileData directly instead of fileData.colorState
        layers = fileData.layers || [{ id: uuidv4(), name: 'Background', isVisible: true, canvasData: fileData.canvasData }];
        activeLayerId = fileData.activeLayerId || layers[0].id;
        palette = fileData.palette || INITIAL_PALETTE;
        sortOrder = fileData.sortOrder || 'default';
        selectedColorId = fileData.selectedColorId || palette[0].id;
        currentColor = fileData.currentColor || 'rgba(0, 0, 0, 1)';
        break;
      default:
        throw new Error(`Unsupported file version: ${fileData.version}`);
    }

    setFileColorStates(prev => ({
      ...prev,
      [fileData.id]: {
        currentColor,
        palette,
        sortOrder,
        selectedColorId,
        layers,
        activeLayerId,
        selectedLayerIds: fileData.selectedLayerIds || [activeLayerId],
      }
    }));

    return {
      id: fileData.id,
      name: fileData.name,
      width: fileData.width,
      height: fileData.height,
      layers: layers,
      activeLayerId: activeLayerId,
    };
  }, []);

  const addLayer = useCallback((fileId: string, name: string = `Layer ${Date.now()}`) => {
    setFileColorStates(prev => {
      const file = prev[fileId];
      if (!file) return prev;
      const newLayer: Layer = {
        id: uuidv4(),
        name,
        isVisible: true,
        canvasData: createTransparentCanvas(file.layers[0].width, file.layers[0].height),
      };
      return {
        ...prev,
        [fileId]: {
          ...file,
          layers: [newLayer, ...file.layers],
          activeLayerId: newLayer.id,
        },
      };
    });
  }, []);

  const deleteLayer = useCallback((fileId: string, layerId: string) => {
    setFileColorStates(prev => {
      const file = prev[fileId];
      if (!file) return prev;
      const newLayers = file.layers.filter(layer => layer.id !== layerId);
      const newActiveLayerId = file.activeLayerId === layerId
        ? newLayers[0]?.id || null
        : file.activeLayerId;
      return {
        ...prev,
        [fileId]: {
          ...file,
          layers: newLayers,
          activeLayerId: newActiveLayerId,
          selectedLayerIds: file.selectedLayerIds.filter(id => id !== layerId),
        },
      };
    });
  }, []);

  const reorderLayers = useCallback((fileId: string, startIndex: number, endIndex: number) => {
    setFileColorStates(prev => {
      const file = prev[fileId];
      if (!file) return prev;
      const result = Array.from(file.layers);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return {
        ...prev,
        [fileId]: {
          ...file,
          layers: result,
        },
      };
    });
  }, []);

  const setActiveLayer = useCallback((fileId: string, layerId: string) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        activeLayerId: layerId,
      },
    }));
  }, []);

  const toggleLayerVisibility = useCallback((fileId: string, layerId: string) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        layers: prev[fileId].layers.map(layer =>
          layer.id === layerId ? { ...layer, isVisible: !layer.isVisible } : layer
        ),
      },
    }));
  }, []);

  const updateLayerData = useCallback((fileId: string, layerId: string, canvasData: string) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        layers: prev[fileId].layers.map(layer =>
          layer.id === layerId ? { ...layer, canvasData } : layer
        ),
      },
    }));
  }, []);

  const setSelectedLayerIds = useCallback((fileId: string, layerIds: string[]) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        selectedLayerIds: layerIds,
      },
    }));
  }, []);

  const renameLayer = useCallback((fileId: string, layerId: string, newName: string) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        layers: prev[fileId].layers.map(layer =>
          layer.id === layerId ? { ...layer, name: newName } : layer
        ),
      },
    }));
  }, []);

  const exportAsPNG = useCallback((fileId: string, fileName: string) => {
    const fileState = fileColorStates[fileId];
    if (!fileState) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Assuming the first layer's dimensions are the canvas dimensions
    const firstLayer = fileState.layers[0];
    if (!firstLayer) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw checkerboard pattern for transparency
      drawCheckerboard(ctx, canvas.width, canvas.height);

      // Draw layers in reverse order
      [...fileState.layers].reverse().forEach((layer) => {
        if (layer.isVisible) {
          const layerImg = new Image();
          layerImg.onload = () => {
            ctx.drawImage(layerImg, 0, 0);
            
            // After drawing the last (top) layer, export the image
            if (layer.id === fileState.layers[0].id) {
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${fileName}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }, 'image/png');
            }
          };
          layerImg.src = layer.canvasData;
        }
      });
    };
    img.src = firstLayer.canvasData;
  }, [fileColorStates]);

  const unloadFile = useCallback((fileId: string) => {
    setFileColorStates(prev => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  }, []);

  const getCanvasData = (fileId: string) => {
    return canvasData[fileId] || null;
  };

  const updateCanvasData = (fileId: string, data: string) => {
    setCanvasData(prev => ({ ...prev, [fileId]: data }));
  };

  const initializeFile = useCallback((fileId: string, width: number, height: number, isTransparent: boolean) => {
    const initialLayer: Layer = {
      id: uuidv4(),
      name: 'Background',
      isVisible: true,
      canvasData: isTransparent ? createTransparentCanvas(width, height) : createWhiteCanvas(width, height),
    };
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: {
        currentColor: 'rgba(0, 0, 0, 1)',
        palette: INITIAL_PALETTE,
        sortOrder: 'default',
        selectedColorId: INITIAL_PALETTE[0].id,
        layers: [initialLayer],
        activeLayerId: initialLayer.id,
        selectedLayerIds: [initialLayer.id],
      },
    }));
  }, []);

  const getSelectedLayers = useCallback((fileId: string) => {
    const fileState = fileColorStates[fileId];
    if (!fileState) return [];
    return fileState.selectedLayerIds.map(id => fileState.layers.find(layer => layer.id === id)).filter(Boolean) as Layer[];
  }, [fileColorStates]);

  const contextValue = useMemo(() => ({
    getFileColorState,
    setCurrentColor,
    addToPalette,
    deletePaletteItem,
    reorderPalette,
    loadPalette,
    saveASEPalette,
    saveGPLPalette,
    toggleSortOrder,
    updatePaletteColor,
    setSelectedColorId,
    getCurrentColor,
    addLayer,
    deleteLayer,
    reorderLayers,
    setActiveLayer,
    toggleLayerVisibility,
    updateLayerData,
    setSelectedLayerIds,
    renameLayer,
    saveFile,
    loadFile,
    initializeFile,
    exportAsPNG,
    unloadFile,
    updateCanvasData,
    getCanvasData,
    getSelectedLayers,
  }), [
    getFileColorState,
    setCurrentColor,
    addToPalette,
    deletePaletteItem,
    reorderPalette,
    loadPalette,
    saveASEPalette,
    saveGPLPalette,
    toggleSortOrder,
    updatePaletteColor,
    setSelectedColorId,
    getCurrentColor,
    addLayer,
    deleteLayer,
    reorderLayers,
    setActiveLayer,
    toggleLayerVisibility,
    updateLayerData,
    setSelectedLayerIds,
    renameLayer,
    saveFile,
    loadFile,
    initializeFile,
    exportAsPNG,
    unloadFile,
    updateCanvasData,
    getCanvasData,
    getSelectedLayers,
  ]);

  return (
    <ColorContext.Provider value={contextValue}>
      {children}
    </ColorContext.Provider>
  );
}

// Helper function to draw checkerboard pattern
function drawCheckerboard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const tileSize = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#e0e0e0';

  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      if ((x / tileSize + y / tileSize) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
}

export const useColor = () => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider');
  }
  return context;
};