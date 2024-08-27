import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Color {
  id: string;
  value: string;
  name?: string;
}

type SortOrder = 'default' | 'lightness-asc' | 'lightness-desc';

interface ColorContextType {
  currentColor: string | null;
  setCurrentColor: (color: string | null) => void;
  palette: Color[];
  sortedPalette: Color[];
  addToPalette: (color: string) => void;
  deletePaletteItem: (id: string) => void;
  reorderPalette: (newPalette: Color[]) => void;
  loadPalette: (file: File) => Promise<void>;
  saveASEPalette: () => Blob;
  saveGPLPalette: () => Blob;
  sortOrder: SortOrder;
  toggleSortOrder: () => void;
  updatePaletteColor: (id: string, newColor: string) => void;
  selectedColorId: string | null;
  setSelectedColorId: (id: string | null) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [currentColor, setCurrentColor] = useState<string | null>(null);
  const [palette, setPalette] = useState<Color[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  useEffect(() => {
    if (palette.length > 0 && originalOrder.length === 0) {
      setOriginalOrder(palette.map(color => color.id));
    }
  }, [palette, originalOrder]);

  const addToPalette = useCallback((color: string) => {
    setPalette(prev => {
      const newPalette = [...prev, { id: uuidv4(), value: color }];
      setOriginalOrder(newPalette.map(c => c.id));
      return newPalette;
    });
  }, []);

  const deletePaletteItem = useCallback((id: string) => {
    setPalette(prev => {
      const newPalette = prev.filter(color => color.id !== id);
      setOriginalOrder(newPalette.map(c => c.id));
      return newPalette;
    });
  }, []);

  const reorderPalette = useCallback((newPalette: Color[]) => {
    setPalette(newPalette);
    setOriginalOrder(newPalette.map(c => c.id));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prevOrder => {
      const orders: SortOrder[] = ['default', 'lightness-asc', 'lightness-desc'];
      const currentIndex = orders.indexOf(prevOrder);
      return orders[(currentIndex + 1) % orders.length];
    });
  }, []);

  const getLightness = useCallback((color: string) => {
    const rgb = color.match(/\d+/g);
    if (rgb) {
      const [r, g, b] = rgb.map(Number);
      return (Math.max(r, g, b) + Math.min(r, g, b)) / (2 * 255);
    }
    return 0;
  }, []);

  const sortedPalette = useMemo(() => {
    if (sortOrder === 'default') {
      return [...palette].sort((a, b) => 
        originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id)
      );
    } else {
      return [...palette].sort((a, b) => {
        const lightnessA = getLightness(a.value);
        const lightnessB = getLightness(b.value);
        return sortOrder === 'lightness-asc' 
          ? lightnessA - lightnessB 
          : lightnessB - lightnessA;
      });
    }
  }, [palette, sortOrder, originalOrder, getLightness]);

  const loadPalette = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);

      console.log('File size:', buffer.byteLength, 'bytes');

      // Check file signature
      if (view.getUint32(0, false) === 0x41534546) { // "ASEF" in ASCII
        console.log('ASE file detected');
        console.log('Version:', view.getUint32(4, false));
        console.log('Number of blocks:', view.getUint32(8, false));
        await loadASEPalette(buffer);
      } else {
        console.log('Attempting to load as GPL file');
        await loadGPLPalette(file);
      }
    } catch (error) {
      console.error('Error loading palette:', error);
      // If an error occurs during parsing, we'll keep any colors that were successfully loaded
      if (palette.length === 0) {
        throw error;
      } else {
        console.warn('Partial palette loaded due to parsing error');
      }
    }
  };

  const loadASEPalette = async (buffer: ArrayBuffer) => {
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
      setPalette(newPalette);
    } else {
      throw new Error('No valid colors found in the ASE file');
    }
  };

  const loadGPLPalette = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r\n|\n|\r/);
    const newPalette: Color[] = [];

    if (lines[0] !== 'GIMP Palette') {
      throw new Error('Invalid GPL file format');
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#')) {
        const [r, g, b, a, ...nameParts] = line.split(/\s+/);
        const name = nameParts.join(' ');
        if (r && g && b) {
          newPalette.push({
            id: Date.now().toString() + i,
            value: `rgba(${r}, ${g}, ${b}, ${a || 1})`,
            name: name || `Color ${i}`
          });
        }
      }
    }

    setPalette(newPalette);
  };

  const saveASEPalette = () => {
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

  const saveGPLPalette = () => {
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

  const updatePaletteColor = useCallback((id: string, newColor: string) => {
    setPalette(prevPalette => 
      prevPalette.map(color => 
        color.id === id ? { ...color, value: newColor } : color
      )
    );
  }, []);

  return (
    <ColorContext.Provider value={{
      currentColor,
      setCurrentColor,
      palette,
      sortedPalette,
      addToPalette,
      deletePaletteItem,
      reorderPalette,
      loadPalette,
      saveASEPalette,
      saveGPLPalette,
      sortOrder,
      toggleSortOrder,
      updatePaletteColor,
      selectedColorId,
      setSelectedColorId,
    }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor() {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider');
  }
  return context;
}