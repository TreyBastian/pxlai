import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useColor } from '../contexts/ColorContext';

interface CanvasProps {
  width: number;
  height: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function Canvas({ width, height, zoom, onZoomChange }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentColor } = useColor();
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
      }
    }
  }, [width, height]);

  const draw = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = currentColor || 'black';
      ctx.fillRect(x, y, 1, 1);
    }
  }, [currentColor]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -25 : 25;
    const newZoom = Math.max(zoom + delta, 25); // Remove upper limit
    onZoomChange(newZoom);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    const x = Math.floor(offsetX / (zoom / 100));
    const y = Math.floor(offsetY / (zoom / 100));
    draw(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const x = Math.floor(offsetX / (zoom / 100));
    const y = Math.floor(offsetY / (zoom / 100));
    draw(x, y);
  };

  const scaledWidth = width * zoom / 100;
  const scaledHeight = height * zoom / 100;

  return (
    <div 
      onWheel={handleWheel}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          imageRendering: 'pixelated',
        }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}
