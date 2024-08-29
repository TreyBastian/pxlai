import { Layer, FileColorState } from '../types';

export interface SharedFunctions {
  createInitialLayer: (fileId: string, width: number, height: number, isTransparent: boolean) => Layer;
  setFileLayers: (fileId: string, layers: Layer[]) => void;
  setFileColorState: (fileId: string, colorState: FileColorState) => void;
  getFileColorState: (fileId: string | null) => FileColorState | null;
  registerFileChangeListener: (callback: (fileId: string | null) => void) => () => void;
}

let sharedFunctions: SharedFunctions = {
  createInitialLayer: () => ({} as Layer),
  setFileLayers: () => {},
  setFileColorState: () => {},
  getFileColorState: () => null,
  registerFileChangeListener: () => () => {},
};

export const setSharedFunctions = (functions: Partial<SharedFunctions>) => {
  sharedFunctions = { ...sharedFunctions, ...functions };
};

export const getSharedFunctions = () => sharedFunctions;