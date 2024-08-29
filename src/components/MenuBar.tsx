import React, { useRef } from 'react';
import { useFile } from '../contexts/FileContext';
import { useWidget } from '../contexts/WidgetContext';
import { useColor } from '../contexts/ColorContext';
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
} from "@/components/ui/menubar";

interface MenuBarProps {
  onCreateNewFile: () => void;
}

export function MenuBar({ onCreateNewFile }: MenuBarProps) {
  const { files, activeFileId, saveFile, exportAsPNG, activateFile, loadFile } = useFile();
  const { widgetVisibility, toggleWidget, isWindowsLocked, setIsWindowsLocked } = useWidget();
  const { loadPalette, saveASEPalette, saveGPLPalette } = useColor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadFile(file);
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  };

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={onCreateNewFile}>New</MenubarItem>
          <MenubarItem onSelect={() => fileInputRef.current?.click()}>Open</MenubarItem>
          <MenubarItem onSelect={() => activeFileId && saveFile(activeFileId)} disabled={!activeFileId}>
            Save
          </MenubarItem>
          <MenubarItem onSelect={() => activeFileId && exportAsPNG(activeFileId)} disabled={!activeFileId}>
            Export as PNG
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Switch to</MenubarSubTrigger>
            <MenubarSubContent>
              {files.map((file) => (
                <MenubarItem 
                  key={file.id}
                  onSelect={() => activateFile(file.id)}
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
          {Object.entries(widgetVisibility).map(([widgetId, isVisible]) => (
            <MenubarCheckboxItem 
              key={widgetId}
              checked={isVisible}
              onCheckedChange={() => toggleWidget(widgetId as keyof typeof widgetVisibility)}
            >
              {widgetId}
            </MenubarCheckboxItem>
          ))}
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
          <MenubarItem onSelect={() => activeFileId && loadPalette(activeFileId)} disabled={!activeFileId}>
            Import Palette
          </MenubarItem>
          <MenubarItem onSelect={() => activeFileId && saveASEPalette(activeFileId)} disabled={!activeFileId}>
            Export as ASE
          </MenubarItem>
          <MenubarItem onSelect={() => activeFileId && saveGPLPalette(activeFileId)} disabled={!activeFileId}>
            Export as GPL
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pxlai"
        style={{ display: 'none' }}
        onChange={handleLoadFile}
      />
    </Menubar>
  );
}