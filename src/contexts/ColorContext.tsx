import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileColorState, Color, SortOrder } from '../types';
import { setSharedFunctions, getSharedFunctions } from './SharedContextFunctions';

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
  setFileColorState: (fileId: string, colorState: FileColorState) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

const INITIAL_PALETTE = [
  { id: uuidv4(), value: 'rgba(0, 0, 0, 1)', name: 'Black' },
  { id: uuidv4(), value: 'rgba(255, 255, 255, 1)', name: 'White' },
];

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [fileColorStates, setFileColorStates] = useState<Record<string, FileColorState>>({});

  useEffect(() => {
    const { registerFileChangeListener } = getSharedFunctions();
    const unsubscribe = registerFileChangeListener((fileId) => {
      if (fileId && !fileColorStates[fileId]) {
        setFileColorStates(prev => ({
          ...prev,
          [fileId]: {
            currentColor: null,
            palette: INITIAL_PALETTE,
            sortOrder: 'default',
            selectedColorId: null,
          }
        }));
      }
    });

    return unsubscribe;
  }, [fileColorStates]);

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

  const setFileColorState = useCallback((fileId: string, colorState: FileColorState) => {
    setFileColorStates(prev => ({
      ...prev,
      [fileId]: colorState
    }));
  }, []);

  // Set shared functions
  useMemo(() => {
    setSharedFunctions({
      ...getSharedFunctions(),
      setFileColorState,
      getFileColorState,
    });
  }, [setFileColorState, getFileColorState]);

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
    setFileColorState,
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
    setFileColorState,
  ]);

  return (
    <ColorContext.Provider value={contextValue}>
      {children}
    </ColorContext.Provider>
  );
}

export const useColor = () => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider');
  }
  return context;
};