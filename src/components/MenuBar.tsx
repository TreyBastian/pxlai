import React from 'react';
import {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  Menubar,
} from '@/components/ui/menubar';
import { useTheme } from '../contexts/ThemeContext';

interface MenuBarProps {
  isDragDisabled: boolean;
  setIsDragDisabled: (value: boolean) => void;
}

export function MenuBar({ isDragDisabled, setIsDragDisabled }: MenuBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New</MenubarItem>
          <MenubarItem>Open</MenubarItem>
          <MenubarItem>Save</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Undo</MenubarItem>
          <MenubarItem>Redo</MenubarItem>
          <MenubarItem>Cut</MenubarItem>
          <MenubarItem>Copy</MenubarItem>
          <MenubarItem>Paste</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Window</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            checked={!isDragDisabled}
            onCheckedChange={(checked) => setIsDragDisabled(!checked)}
          >
            Enable Drag and Drop
          </MenubarCheckboxItem>
          <MenubarRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            <MenubarRadioItem value="light">Light</MenubarRadioItem>
            <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
            <MenubarRadioItem value="system">System</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>About</MenubarItem>
          <MenubarItem>Documentation</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}