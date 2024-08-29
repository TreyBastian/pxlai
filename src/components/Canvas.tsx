import React, { useRef, useEffect, useState } from 'react';
import { useColor } from '../contexts/ColorContext';
import { useLayer } from '../contexts/LayerContext';

interface CanvasProps {
  fileId: string;
  width: number;
  height: number;
  zoom: number;
}

export function Canvas({ fileId, width, height, zoom }: CanvasProps) {
  console.log('Canvas rendered with:', { fileId, width, height, zoom });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFileColorState } = useColor();
  const { getLayers } = useLayer();

  const drawLayers = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fileState = getFileColorState(fileId);
    console.log('drawLayers called with fileState:', fileState);

    const layers = getLayers(fileId);
    if (!layers || layers.length === 0) {
      console.log('No layers found for fileId:', fileId);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    layers.forEach(layer => {
      if (layer.isVisible) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = layer.canvasData;
      }
    });
  };

  useEffect(() => {
    console.log('Canvas useEffect running');
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width * (zoom / 100);
    canvas.height = height * (zoom / 100);

    const fileState = getFileColorState(fileId);
    if (!fileState) {
      console.log('No file state found for fileId:', fileId);
      return;
    }

    drawLayers();
  }, [fileId, width, height, zoom, getFileColorState]);

  return <canvas ref={canvasRef} />;
}

export default React.memo(Canvas);
