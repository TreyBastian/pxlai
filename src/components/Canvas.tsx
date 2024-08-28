import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useColor } from '../contexts/ColorContext';
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

interface CanvasProps {
  fileId: string;
  width: number;
  height: number;
}

export default function Canvas({ fileId, width, height }: CanvasProps) {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasesRef = useRef<{ [layerId: string]: HTMLCanvasElement }>({});
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const { getCurrentColor, getFileColorState, updateLayerData } = useColor();

  const compositeCanvas = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    const ctx = displayCanvas?.getContext('2d');
    const fileState = getFileColorState(fileId);
    if (!ctx || !fileState) return;

    const scaledWidth = width * zoom;
    const scaledHeight = height * zoom;

    displayCanvas.width = width;
    displayCanvas.height = height;
    displayCanvas.style.width = `${scaledWidth}px`;
    displayCanvas.style.height = `${scaledHeight}px`;

    ctx.clearRect(0, 0, width, height);

    // Draw checkerboard pattern
    drawCheckerboard(ctx, width, height);

    // Draw layers in reverse order
    [...fileState.layers].reverse().forEach((layer) => {
      if (layer.isVisible) {
        const offScreenCanvas = offScreenCanvasesRef.current[layer.id];
        if (offScreenCanvas) {
          ctx.drawImage(offScreenCanvas, 0, 0);
        }
      }
    });
  }, [fileId, getFileColorState, zoom, width, height]);

  useEffect(() => {
    const fileState = getFileColorState(fileId);
    if (!fileState) return;

    // Initialize or update off-screen canvases
    fileState.layers.forEach((layer) => {
      if (!offScreenCanvasesRef.current[layer.id]) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        offScreenCanvasesRef.current[layer.id] = canvas;
      }
      const ctx = offScreenCanvasesRef.current[layer.id].getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          compositeCanvas();
        };
        img.src = layer.canvasData;
      }
    });

    compositeCanvas();
  }, [fileId, getFileColorState, compositeCanvas, width, height]);

  const draw = useCallback((x: number, y: number) => {
    const fileState = getFileColorState(fileId);
    if (!fileState?.activeLayerId) return;

    const activeLayer = fileState.layers.find(layer => layer.id === fileState.activeLayerId);
    if (!activeLayer) return;

    const offScreenCanvas = offScreenCanvasesRef.current[activeLayer.id];
    const ctx = offScreenCanvas?.getContext('2d');
    if (!ctx) return;

    const currentColor = getCurrentColor(fileId);
    ctx.fillStyle = currentColor || 'black';
    ctx.fillRect(x, y, 1, 1);

    updateLayerData(fileId, activeLayer.id, offScreenCanvas.toDataURL());
    compositeCanvas();
  }, [fileId, getCurrentColor, getFileColorState, updateLayerData, compositeCanvas]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);
    draw(x, y);
  }, [zoom, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);
    draw(x, y);
  }, [isDrawing, zoom, draw]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleZoomChange = (newZoom: number[]) => {
    setZoom(newZoom[0]);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={displayCanvasRef}
        className="border border-gray-300"
        style={{
          imageRendering: 'pixelated',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="mt-2 flex items-center space-x-2">
        <Button onClick={() => setZoom(prev => Math.max(prev - 1, 1))}>-</Button>
        <Slider
          value={[zoom]}
          min={1}
          max={10}
          step={1}
          onValueChange={handleZoomChange}
          className="w-32"
        />
        <Button onClick={() => setZoom(prev => Math.min(prev + 1, 10))}>+</Button>
        <span className="ml-2">{zoom}x</span>
      </div>
    </div>
  );
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const tileSize = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#e0e0e0';

  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      if ((x / tileSize + y / tileSize) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
}
