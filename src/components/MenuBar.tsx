import React, { useState } from 'react';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  Menubar,
} from '@/components/ui/menubar';
import { useTheme } from '../contexts/ThemeContext';
import { NewFileDialog } from './NewFileDialog';
import { File } from '../types';

interface MenuBarProps {
  onCreateNewFile: (width: number, height: number, name: string, isTransparent: boolean) => void;
  toggleWidget: (id: string) => void;
  isWindowsLocked: boolean;
  setIsWindowsLocked: (value: boolean) => void;
  widgetVisibility: Record<string, boolean>;
  files: File[];
  activeFileId: string | null;
  onSwitchFile: (fileId: string) => void;
  onSaveFile: (fileId: string) => void;
  onLoadFile: () => void;
}

export function MenuBar({ 
  onCreateNewFile, 
  toggleWidget, 
  isWindowsLocked, 
  setIsWindowsLocked, 
  widgetVisibility,
  files,
  activeFileId,
  onSwitchFile,
  onSaveFile,
  onLoadFile
}: MenuBarProps) {
  const { theme, setTheme } = useTheme();
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);

  const handleCreateNewFile = (width: number, height: number, name: string, isTransparent: boolean) => {
    onCreateNewFile(width, height, name, isTransparent);
    setIsNewFileDialogOpen(false);
  };

  // Custom styles for MenubarContent and MenubarSubContent
  const dropdownStyles = {
    zIndex: 100000, // Very high z-index to ensure it's above other elements
    position: 'relative' as const, // TypeScript requires this type assertion
  };

  return (
    <>
      <Menubar className="relative z-50"> {/* Ensure the Menubar itself has a high z-index */}
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent style={dropdownStyles}>
            <MenubarItem onSelect={() => setIsNewFileDialogOpen(true)}>New</MenubarItem>
            <MenubarItem onSelect={onLoadFile}>Open</MenubarItem>
            <MenubarItem onSelect={() => activeFileId && onSaveFile(activeFileId)} disabled={!activeFileId}>Save</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Switch to</MenubarSubTrigger>
              <MenubarSubContent style={dropdownStyles}>
                {files.map((file) => (
                  <MenubarItem 
                    key={file.id} 
                    onSelect={() => onSwitchFile(file.id)}
                    disabled={file.id === activeFileId}
                  >
                    {file.name}
                  </MenubarItem>
                ))}
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent style={dropdownStyles}>
            <MenubarItem>Undo</MenubarItem>
            <MenubarItem>Redo</MenubarItem>
            <MenubarItem>Cut</MenubarItem>
            <MenubarItem>Copy</MenubarItem>
            <MenubarItem>Paste</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent style={dropdownStyles}>
            <MenubarCheckboxItem 
              checked={widgetVisibility['tools']}
              onCheckedChange={() => toggleWidget('tools')}
            >
              Tools
            </MenubarCheckboxItem>
            <MenubarCheckboxItem 
              checked={widgetVisibility['colorPalette']}
              onCheckedChange={() => toggleWidget('colorPalette')}
            >
              Color Palette
            </MenubarCheckboxItem>
            <MenubarCheckboxItem 
              checked={widgetVisibility['colorPicker']}
              onCheckedChange={() => toggleWidget('colorPicker')}
            >
              Color Picker
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              checked={isWindowsLocked}
              onCheckedChange={setIsWindowsLocked}
            >
              Lock Windows
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Appearance</MenubarSubTrigger>
              <MenubarSubContent style={dropdownStyles}>
                <MenubarRadioGroup value={theme} onValueChange={(value) => setTheme(value as any)}>
                  <MenubarRadioItem value="light">Light</MenubarRadioItem>
                  <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                  <MenubarRadioItem value="system">System</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent style={dropdownStyles}>
            <MenubarItem>About</MenubarItem>
            <MenubarItem>Documentation</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onClose={() => setIsNewFileDialogOpen(false)}
        onCreateNewFile={handleCreateNewFile}
      />
    </>
  );
}