import React from 'react';
import { useColor } from '../contexts/ColorContext';
import { Button } from '@/components/ui/button';
import {
  DownloadIcon,
  UploadIcon,
  FileIcon,
} from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function IconMenuBar() {
  const { loadPalette, saveASEPalette, saveGPLPalette } = useColor();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadPalette(file);
      } catch (error) {
        console.error('Failed to load palette:', error);
      }
    }
  };

  const downloadPalette = (format: 'ase' | 'gpl') => {
    const blob = format === 'ase' ? saveASEPalette() : saveGPLPalette();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2 p-2 bg-gray-100 rounded-md">
      <input
        type="file"
        accept=".gpl,.ase"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="palette-file-input"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => document.getElementById('palette-file-input')?.click()}
      >
        <UploadIcon className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <DownloadIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => downloadPalette('ase')}>
            <FileIcon className="mr-2 h-4 w-4" />
            <span>Download ASE</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadPalette('gpl')}>
            <FileIcon className="mr-2 h-4 w-4" />
            <span>Download GPL</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
