import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { File, Layer, FileColorState } from '../types';
import { getSharedFunctions } from './SharedContextFunctions';

interface FileContextType {
  files: File[];
  activeFileId: string | null;
  createNewFile: (width: number, height: number, name: string, isTransparent: boolean) => void;
  closeFile: (fileId: string) => void;
  activateFile: (fileId: string) => void;
  reorderFiles: (newOrder: File[]) => void;
  saveFile: (fileId: string) => void;
  loadFile: (file: File) => Promise<void>;
  exportAsPNG: (fileId: string) => void;
  getCanvasData: (fileId: string) => string | null;
  updateCanvasData: (fileId: string, data: string) => void;
  onFileChange: (callback: (fileId: string | null) => void) => () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [canvasData, setCanvasData] = useState<Record<string, string>>({});
  const [fileChangeListeners, setFileChangeListeners] = useState<((fileId: string | null) => void)[]>([]);

  const { createInitialLayer, setFileLayers, setFileColorState, getFileColorState } = getSharedFunctions();

  function notifyFileChange(fileId: string | null) {
    fileChangeListeners.forEach(callback => callback(fileId));
  }

  function createNewFile(width: number, height: number, name: string, isTransparent: boolean) {
    const newFileId = uuidv4();
    const initialLayer = createInitialLayer(newFileId, width, height, isTransparent);
    const newFile: File = {
      id: newFileId,
      name,
      width,
      height,
      position: { x: 300, y: 50 },
      layers: [initialLayer],
      activeLayerId: initialLayer.id,
    };
    setFiles(prevFiles => [...prevFiles, newFile]);
    setActiveFileId(newFile.id);
    setCanvasData(prevData => ({
      ...prevData,
      [newFile.id]: initialLayer.canvasData
    }));
    notifyFileChange(newFile.id);
  }

  function closeFile(fileId: string) {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(prevActiveFileId => {
        const remainingFiles = files.filter(f => f.id !== fileId);
        return remainingFiles.length > 0 ? remainingFiles[0].id : null;
      });
    }
    setCanvasData(prevData => {
      const newData = { ...prevData };
      delete newData[fileId];
      return newData;
    });
    const remainingFiles = files.filter(f => f.id !== fileId);
    notifyFileChange(remainingFiles.length > 0 ? remainingFiles[0].id : null);
  }

  function activateFile(fileId: string) {
    setActiveFileId(fileId);
    notifyFileChange(fileId);
  }

  const reorderFiles = useCallback((newOrder: File[]) => {
    setFiles(newOrder);
  }, []);

  const saveFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const colorState = getFileColorState(fileId);
      const fileData = {
        version: "0.3",
        id: fileId,
        name: file.name,
        width: file.width,
        height: file.height,
        layers: file.layers,
        activeLayerId: file.activeLayerId,
        canvasData: canvasData[fileId],
        palette: colorState?.palette || [],
        currentColor: colorState?.currentColor || null,
        sortOrder: colorState?.sortOrder || 'default',
        selectedColorId: colorState?.selectedColorId || null,
      };

      const blob = new Blob([JSON.stringify(fileData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name}.pxlai`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [files, canvasData, getFileColorState]);

  const loadFile = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = JSON.parse(e.target?.result as string);
      if (fileData.version === "0.3") {
        const newFile: File = {
          id: fileData.id,
          name: fileData.name,
          width: fileData.width,
          height: fileData.height,
          position: { x: 300, y: 50 },
          layers: fileData.layers,
          activeLayerId: fileData.activeLayerId,
        };
        
        setFiles(prevFiles => [...prevFiles, newFile]);
        setActiveFileId(newFile.id);
        setCanvasData(prevData => ({
          ...prevData,
          [newFile.id]: fileData.canvasData
        }));
        setFileLayers(newFile.id, fileData.layers);
        setFileColorState(newFile.id, {
          palette: fileData.palette,
          currentColor: fileData.currentColor,
          sortOrder: fileData.sortOrder,
          selectedColorId: fileData.selectedColorId,
        });
        notifyFileChange(newFile.id);
      } else {
        console.error('Unsupported file version');
      }
    };
    reader.readAsText(file);
  }, [setFiles, setActiveFileId, setCanvasData, setFileLayers, setFileColorState, notifyFileChange]);

  const exportAsPNG = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = file.width;
      canvas.height = file.height;

      // Draw checkerboard pattern for transparency
      drawCheckerboard(ctx, canvas.width, canvas.height);

      // Draw layers in reverse order
      [...file.layers].reverse().forEach((layer) => {
        if (layer.isVisible) {
          const layerImg = new Image();
          layerImg.onload = () => {
            ctx.drawImage(layerImg, 0, 0);
            
            // After drawing the last (top) layer, export the image
            if (layer.id === file.layers[0].id) {
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${file.name}.png`;
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
    }
  }, [files]);

  const getCanvasData = useCallback((fileId: string) => {
    return canvasData[fileId] || null;
  }, [canvasData]);

  const updateCanvasData = useCallback((fileId: string, data: string) => {
    setCanvasData(prevData => ({
      ...prevData,
      [fileId]: data
    }));
  }, []);

  const onFileChange = useCallback((callback: (fileId: string | null) => void) => {
    setFileChangeListeners(prev => [...prev, callback]);
    return () => {
      setFileChangeListeners(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const contextValue = useMemo(() => ({
    files,
    activeFileId,
    createNewFile,
    closeFile,
    activateFile,
    reorderFiles,
    saveFile,
    loadFile,
    exportAsPNG,
    getCanvasData,
    updateCanvasData,
    onFileChange,
  }), [
    files,
    activeFileId,
    reorderFiles,
    saveFile,
    loadFile,
    exportAsPNG,
    getCanvasData,
    updateCanvasData,
    onFileChange,
  ]);

  return (
    <FileContext.Provider value={contextValue}>
      {children}
    </FileContext.Provider>
  );
}

export const useFile = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFile must be used within a FileProvider');
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