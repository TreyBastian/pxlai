import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useColor } from '../contexts/ColorContext';

interface CanvasProps {
  fileId: string;
  width: number;
  height: number;
  zoom: number;
}

const Canvas: React.FC<CanvasProps> = ({ fileId, width, height, zoom }) => {
  console.log('Canvas rendered with:', { fileId, width, height, zoom });
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const { getFileColorState, updateLayerData, getCurrentColor } = useColor();

  const drawLayers = useCallback((ctx: CanvasRenderingContext2D, fileState: any) => {
    console.log('drawLayers called with fileState:', fileState);
    ctx.clearRect(0, 0, width, height);
    fileState.layers.forEach(layer => {
      if (layer.isVisible) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = layer.canvasData;
      }
    });
  }, [width, height]);

  const renderBuffer = useCallback((displayCtx: CanvasRenderingContext2D, bufferCtx: CanvasRenderingContext2D, fileState: any) => {
    drawLayers(bufferCtx, fileState);
    displayCtx.clearRect(0, 0, width, height);
    displayCtx.drawImage(bufferCanvasRef.current!, 0, 0);
  }, [drawLayers, width, height]);

  useEffect(() => {
    console.log('Canvas useEffect running');
    const displayCanvas = displayCanvasRef.current;
    const bufferCanvas = bufferCanvasRef.current;
    if (!displayCanvas || !bufferCanvas) return;

    const displayCtx = displayCanvas.getContext('2d');
    const bufferCtx = bufferCanvas.getContext('2d');
    if (!displayCtx || !bufferCtx) return;

    displayCanvas.width = bufferCanvas.width = width;
    displayCanvas.height = bufferCanvas.height = height;

    setCanvasSize({
      width: Math.round(width * (zoom / 100)),
      height: Math.round(height * (zoom / 100))
    });

    const fileState = getFileColorState(fileId);
    if (!fileState) {
      console.error('No file state found for fileId:', fileId);
      return;
    }

    renderBuffer(displayCtx, bufferCtx, fileState);

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const startDrawing = (e: MouseEvent) => {
      isDrawing = true;
      [lastX, lastY] = getMousePos(displayCanvas, e);
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;
      const [x, y] = getMousePos(displayCanvas, e);

      const activeLayer = fileState.layers.find(layer => layer.id === fileState.activeLayerId);
      if (!activeLayer) return;

      bufferCtx.beginPath();
      bufferCtx.moveTo(lastX, lastY);
      bufferCtx.lineTo(x, y);
      bufferCtx.strokeStyle = getCurrentColor(fileId) || 'black';
      bufferCtx.lineWidth = 2;
      bufferCtx.lineCap = 'round';
      bufferCtx.stroke();

      displayCtx.clearRect(0, 0, width, height);
      displayCtx.drawImage(bufferCanvas, 0, 0);

      [lastX, lastY] = [x, y];
    };

    const stopDrawing = () => {
      if (isDrawing) {
        isDrawing = false;
        const activeLayer = fileState.layers.find(layer => layer.id === fileState.activeLayerId);
        if (activeLayer) {
          updateLayerData(fileId, activeLayer.id, bufferCanvas.toDataURL());
        }
      }
    };

    displayCanvas.addEventListener('mousedown', startDrawing);
    displayCanvas.addEventListener('mousemove', draw);
    displayCanvas.addEventListener('mouseup', stopDrawing);
    displayCanvas.addEventListener('mouseout', stopDrawing);

    return () => {
      displayCanvas.removeEventListener('mousedown', startDrawing);
      displayCanvas.removeEventListener('mousemove', draw);
      displayCanvas.removeEventListener('mouseup', stopDrawing);
      displayCanvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [fileId, width, height, zoom, getFileColorState, updateLayerData, getCurrentColor, renderBuffer]);

  const getMousePos = useCallback((canvas: HTMLCanvasElement, evt: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [
      (evt.clientX - rect.left) * scaleX,
      (evt.clientY - rect.top) * scaleY
    ];
  }, []);

  return (
    <div className="relative w-full h-full" style={{ overflow: 'auto' }}>
      <div style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}>
        <canvas
          ref={displayCanvasRef}
          width={width}
          height={height}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
        <canvas
          ref={bufferCanvasRef}
          width={width}
          height={height}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default React.memo(Canvas);
