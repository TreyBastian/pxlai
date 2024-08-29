import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { WidgetVisibility } from '../types';

interface WidgetContextType {
  widgetVisibility: WidgetVisibility;
  toggleWidget: (widgetId: keyof WidgetVisibility) => void;
  leftPanelWidgets: string[];
  rightPanelWidgets: string[];
  centerPanelWidgets: string[];
  updatePanelWidgets: (panel: 'left' | 'right' | 'center', newWidgets: string[]) => void;
  isWindowsLocked: boolean;
  setIsWindowsLocked: (locked: boolean) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({
    tools: true,
    colorPalette: true,
    colorPicker: true,
    layers: true,
  });

  const [leftPanelWidgets, setLeftPanelWidgets] = useState(['tools', 'colorPalette', 'colorPicker']);
  const [rightPanelWidgets, setRightPanelWidgets] = useState(['layers']);
  const [centerPanelWidgets, setCenterPanelWidgets] = useState(['canvasWidget']);
  const [isWindowsLocked, setIsWindowsLocked] = useState(true);

  const toggleWidget = useCallback((widgetId: keyof WidgetVisibility) => {
    setWidgetVisibility(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  }, []);

  const updatePanelWidgets = useCallback((panel: 'left' | 'right' | 'center', newWidgets: string[]) => {
    switch (panel) {
      case 'left':
        setLeftPanelWidgets(newWidgets);
        break;
      case 'right':
        setRightPanelWidgets(newWidgets);
        break;
      case 'center':
        setCenterPanelWidgets(newWidgets);
        break;
    }
  }, []);

  const contextValue = useMemo(() => ({
    widgetVisibility,
    toggleWidget,
    leftPanelWidgets,
    rightPanelWidgets,
    centerPanelWidgets,
    updatePanelWidgets,
    isWindowsLocked,
    setIsWindowsLocked,
  }), [
    widgetVisibility,
    toggleWidget,
    leftPanelWidgets,
    rightPanelWidgets,
    centerPanelWidgets,
    updatePanelWidgets,
    isWindowsLocked,
    setIsWindowsLocked,
  ]);

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error('useWidget must be used within a WidgetProvider');
  }
  return context;
};