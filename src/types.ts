export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  canvasData: string;
}

export interface File {
  id: string;
  name: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  layers: Layer[];
  activeLayerId: string | null;
}

// Add any additional types or interfaces that might be needed across the application

export type SortOrder = 'default' | 'lightness-asc' | 'lightness-desc';

export interface Color {
  id: string;
  value: string;
  name?: string;
}

export interface FileColorState {
  currentColor: string | null;
  palette: Color[];
  sortOrder: SortOrder;
  selectedColorId: string | null;
}

export interface WidgetVisibility {
  tools: boolean;
  colorPalette: boolean;
  colorPicker: boolean;
  layers: boolean;
}