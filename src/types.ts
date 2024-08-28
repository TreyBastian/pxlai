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