import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
    canvasData: string;
  }>;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

const CURRENT_FILE_VERSION = "0.1";

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [fileColorStates, setFileColorStates] = useState<Record<string, FileColorState>>({});

  const getFileColorState = useCallback((fileId: string | null) => {
    if (!fileId) return null;
    if (!fileColorStates[fileId]) {
      // Initialize state for new file
      setFileColorStates(prev => ({
        ...prev,
        [fileId]: {
          currentColor: null,
          palette: [],
          sortOrder: 'default',
          selectedColorId: null
        }
      }));
    }
    return fileColorStates[fileId];
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

  const loadPalette = async (fileId: string, file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'ase') {
      const buffer = await file.arrayBuffer();
      await loadASEPalette(fileId, buffer);
    } else if (extension === 'gpl') {
      await loadGPLPalette(fileId, file);
    } else {
      throw new Error('Unsupported file format');
    }
  };

  const loadASEPalette = async (fileId: string, buffer: ArrayBuffer) => {
    const view = new DataView(buffer);
    const newPalette: Color[] = [];
    let offset = 0;

    // File header
    const signature = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (signature !== 'ASEF') {
      throw new Error('Invalid ASE file signature');
    }
    offset += 4;

    const version = view.getUint32(offset, false);
    offset += 4;
    const blocks = view.getUint32(offset, false);
    offset += 4;

    console.log(`ASE version: ${version}, blocks: ${blocks}`);

    while (offset < buffer.byteLength) {
      const blockType = view.getUint16(offset, false);
      offset += 2;
      const blockLength = view.getUint32(offset, false);
      offset += 4;

      if (blockType === 0x0001) { // Color entry
        const nameLength = view.getUint16(offset, false);
        offset += 2;

        const name = new TextDecoder('utf-16be').decode(new Uint8Array(buffer, offset, nameLength * 2)).replace(/\0/g, '');
        offset += nameLength * 2;

        const colorModel = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );
        offset += 4;

        if (colorModel === 'RGB ') {
          const r = view.getFloat32(offset, false);
          offset += 4;
          const g = view.getFloat32(offset, false);
          offset += 4;
          const b = view.getFloat32(offset, false);
          offset += 4;
          // Assume alpha of 1 if not provided
          const a = blockLength === 40 ? view.getFloat32(offset, false) : 1;
          offset += blockLength === 40 ? 4 : 0;

          newPalette.push({
            id: Date.now().toString() + newPalette.length,
            value: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
            name: name || `Color ${newPalette.length + 1}`
          });

          console.log(`Added color: ${name}, rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
        } else if (colorModel === 'CMYK') {
          const c = view.getFloat32(offset, false);
          offset += 4;
          const m = view.getFloat32(offset, false);
          offset += 4;
          const y = view.getFloat32(offset, false);
          offset += 4;
          const k = view.getFloat32(offset, false);
          offset += 4;

          // Convert CMYK to RGB (simplified conversion)
          const r = 255 * (1 - c) * (1 - k);
          const g = 255 * (1 - m) * (1 - k);
          const b = 255 * (1 - y) * (1 - k);

          newPalette.push({
            id: Date.now().toString() + newPalette.length,
            value: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`,
            name: name || `Color ${newPalette.length + 1}`
          });

          console.log(`Added color: ${name}, cmyk(${c}, ${m}, ${y}, ${k}) converted to rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`);
        } else {
          console.log(`Skipping unsupported color model: ${colorModel}`);
        }

        const colorType = view.getUint16(offset, false);
        offset += 2;
        console.log(`Color type: ${colorType === 0 ? 'Global' : 'Spot'}`);
      } else if (blockType === 0xc001) { // Group start
        const nameLength = view.getUint16(offset, false);
        offset += 2;
        const groupName = new TextDecoder('utf-16be').decode(new Uint8Array(buffer, offset, nameLength * 2)).replace(/\0/g, '');
        offset += nameLength * 2;
        console.log(`Group start: ${groupName}`);
      } else if (blockType === 0xc002) { // Group end
        console.log('Group end');
      } else if (blockType === 0x0000) { // EOF
        console.log('End of file');
        break;
      } else {
        console.log(`Unknown block type: ${blockType.toString(16)}, skipping`);
        offset += blockLength - 6;
      }
    }

    console.log(`Total colors loaded: ${newPalette.length}`);

    if (newPalette.length > 0) {
      setFileColorStates(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          palette: newPalette
        }
      }));
    } else {
      throw new Error('No valid colors found in the ASE file');
    }
  };

  const loadGPLPalette = async (fileId: string, file: File) => {
    const text = await file.text();
    const lines = text.split(/\r\n|\n|\r/);
    const newPalette: Color[] = [];

    if (lines[0].trim() !== 'GIMP Palette') {
      throw new Error('Invalid GPL file format');
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          const [r, g, b] = parts.slice(0, 3).map(Number);
          const name = parts.slice(3).join(' ') || `Color ${newPalette.length + 1}`;
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            newPalette.push({
              id: uuidv4(),
              value: `rgba(${r}, ${g}, ${b}, 1)`,
              name: name
            });
          }
        }
      }
    }

    if (newPalette.length > 0) {
      setFileColorStates(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          palette: newPalette
        }
      }));
    } else {
      throw new Error('No valid colors found in the GPL file');
    }
  };

  const saveASEPalette = (fileId: string) => {
    const palette = fileColorStates[fileId]?.palette || [];
    const buffer = new ArrayBuffer(12 + palette.length * 40); // Approximate size
    const view = new DataView(buffer);
    let offset = 0;

    // Write file signature
    view.setUint32(offset, 0x41534546, false); // "ASEF"
    offset += 4;

    // Write version
    view.setUint32(offset, 1, false);
    offset += 4;

    // Write number of blocks
    view.setUint32(offset, palette.length, false);
    offset += 4;

    palette.forEach((color) => {
      // Write block type (color entry)
      view.setUint16(offset, 0x0001, false);
      offset += 2;

      // Write block length (approximate)
      view.setUint32(offset, 40, false);
      offset += 4;

      // Write color name length
      const nameLength = color.name ? color.name.length : 0;
      view.setUint16(offset, nameLength, false);
      offset += 2;

      // Write color name
      if (color.name) {
        const encoder = new TextEncoder();
        const nameBytes = encoder.encode(color.name);
        for (let i = 0; i < nameBytes.length; i++) {
          view.setUint8(offset + i, nameBytes[i]);
        }
      }
      offset += nameLength * 2;

      // Write color model
      view.setUint32(offset, 0x52474220, false); // "RGB "
      offset += 4;

      // Parse RGB values
      const rgbMatch = color.value.match(/\d+/g);
      if (rgbMatch) {
        const [r, g, b, a] = rgbMatch.map(Number);
        view.setFloat32(offset, r / 255, false);
        offset += 4;
        view.setFloat32(offset, g / 255, false);
        offset += 4;
        view.setFloat32(offset, b / 255, false);
        offset += 4;
        view.setFloat32(offset, a, false);
        offset += 4;
      }

      // Write color type (global)
      view.setUint16(offset, 0, false);
      offset += 2;
    });

    return new Blob([buffer], { type: 'application/octet-stream' });
  };

  const saveGPLPalette = (fileId: string) => {
    const palette = fileColorStates[fileId]?.palette || [];
    let content = 'GIMP Palette\n';
    content += '# Generated by Your App Name\n';
    content += `# Palette Name: Custom Palette\n`;
    content += `# Colors: ${palette.length}\n`;

    palette.forEach((color) => {
      const rgbMatch = color.value.match(/\d+/g);
      if (rgbMatch) {
        const [r, g, b, a] = rgbMatch.map(Number);
        content += `${r.toString().padStart(3)} ${g.toString().padStart(3)} ${b.toString().padStart(3)} ${a.toFixed(2)}    ${color.name || ''}\n`;
      }
    });

    return new Blob([content], { type: 'text/plain' });
  };

  const getCurrentColor = useCallback((fileId: string | null) => {
    if (!fileId) return null;
    return fileColorStates[fileId]?.currentColor || null;
  }, [fileColorStates]);

  const saveFile = useCallback((fileId: string, fileName: string, width: number, height: number) => {
    const fileState = fileColorStates[fileId];
    if (!fileState) return;

    const canvas = document.querySelector(`canvas[data-file-id="${fileId}"]`) as HTMLCanvasElement;
    if (!canvas) return;

    const fileData = {
      version: CURRENT_FILE_VERSION,
      id: fileId,
      name: fileName,
      width: width,
      height: height,
      currentColor: fileState.currentColor,
      palette: fileState.palette,
      sortOrder: fileState.sortOrder,
      selectedColorId: fileState.selectedColorId,
      canvasData: canvas.toDataURL(),
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

    if (!fileData.version) {
      console.warn("Loading file with no version number. Assuming version 0.1");
      fileData.version = "0.1";
    }

    // Here you can add version-specific loading logic if needed
    switch (fileData.version) {
      case "0.1":
        // Current version, load as is
        break;
      // Add cases for future versions here
      default:
        console.warn(`Unknown file version: ${fileData.version}. Attempting to load anyway.`);
    }

    setFileColorStates(prev => ({
      ...prev,
      [fileData.id]: {
        currentColor: fileData.currentColor,
        palette: fileData.palette,
        sortOrder: fileData.sortOrder,
        selectedColorId: fileData.selectedColorId,
      }
    }));

    // Return the loaded data so it can be used to create a new file in PhotoshopLayout
    return {
      version: fileData.version,
      id: fileData.id,
      name: fileData.name,
      width: fileData.width,
      height: fileData.height,
      canvasData: fileData.canvasData,
    };
  }, []);

  return (
    <ColorContext.Provider value={{
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
      saveFile,
      loadFile,
    }}>
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