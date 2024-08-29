import React from 'react';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarCheckboxItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarRadioGroup,
  MenubarRadioItem,
} from "@/components/ui/menubar";
import { File } from '../types';

interface MenuBarProps {
  onCreateNewFile: () => void;
  files: File[];
  activeFileId: string | null;
  onSwitchFile: (fileId: string) => void;
  onSaveFile: (fileId: string) => void;
  onLoadFile: () => void;
  onExportAsPNG: (fileId: string) => void;
  isWindowsLocked: boolean;
  setIsWindowsLocked: (locked: boolean) => void;
  toggleWidget: (widgetId: string) => void;
  widgetVisibility: {
    tools: boolean;
    colorPalette: boolean;
    colorPicker: boolean;
    layers: boolean;
  };
  onLoadPalette: () => void;
  onSaveASEPalette: (fileId: string) => void;
  onSaveGPLPalette: (fileId: string) => void;
}

export function MenuBar({
  onCreateNewFile,
  files,
  activeFileId,
  onSwitchFile,
  onSaveFile,
  onLoadFile,
  onExportAsPNG,
  isWindowsLocked,
  setIsWindowsLocked,
  toggleWidget,
  widgetVisibility,
  onLoadPalette,
  onSaveASEPalette,
  onSaveGPLPalette,
}: MenuBarProps) {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={onCreateNewFile}>New</MenubarItem>
          <MenubarItem onSelect={onLoadFile}>Open</MenubarItem>
          <MenubarItem onSelect={() => activeFileId && onSaveFile(activeFileId)} disabled={!activeFileId}>
            Save
          </MenubarItem>
          <MenubarItem onSelect={() => activeFileId && onExportAsPNG(activeFileId)} disabled={!activeFileId}>
            Export as PNG
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Switch to</MenubarSubTrigger>
            <MenubarSubContent>
              {files.map((file) => (
                <MenubarItem 
                  key={file.id}
                  onSelect={() => onSwitchFile(file.id)}
                >
                  {file.name}
                </MenubarItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem 
            checked={widgetVisibility.tools}
            onCheckedChange={() => toggleWidget('tools')}
          >
            Tools
          </MenubarCheckboxItem>
          <MenubarCheckboxItem 
            checked={widgetVisibility.colorPalette}
            onCheckedChange={() => toggleWidget('colorPalette')}
          >
            Color Palette
          </MenubarCheckboxItem>
          <MenubarCheckboxItem 
            checked={widgetVisibility.colorPicker}
            onCheckedChange={() => toggleWidget('colorPicker')}
          >
            Color Picker
          </MenubarCheckboxItem>
          <MenubarCheckboxItem 
            checked={widgetVisibility.layers}
            onCheckedChange={() => toggleWidget('layers')}
          >
            Layers
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarCheckboxItem
            checked={isWindowsLocked}
            onCheckedChange={setIsWindowsLocked}
          >
            Lock Windows
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Palette</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={onLoadPalette}>Import Palette</MenubarItem>
          <MenubarItem onSelect={() => activeFileId && onSaveASEPalette(activeFileId)} disabled={!activeFileId}>
            Export as ASE
          </MenubarItem>
          <MenubarItem onSelect={() => activeFileId && onSaveGPLPalette(activeFileId)} disabled={!activeFileId}>
            Export as GPL
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}