import React, { useState, useEffect } from 'react';
import { useColor } from '../contexts/ColorContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { hslToRgb, rgbToHsl, rgbToCmyk, cmykToRgb } from '../utils/colorConversions';

// Define ColorSlider component inline
const ColorSlider = ({ label, value, max = 100, onChange }) => (
  <div className="grid gap-2 mb-4">
    <Label>{label}</Label>
    <Slider
      min={0}
      max={max}
      step={1}
      value={[value]}
      onValueChange={([newValue]) => onChange(newValue)}
    />
  </div>
);

type ColorModel = 'hsla' | 'rgba' | 'cmyka';

export function ColorPicker() {
  const { currentColor, setCurrentColor, addToPalette } = useColor();
  const [colorModel, setColorModel] = useState<ColorModel>('hsla');
  const [hsla, setHsla] = useState({ h: 0, s: 100, l: 50, a: 1 });
  const [rgba, setRgba] = useState({ r: 255, g: 0, b: 0, a: 1 });
  const [cmyka, setCmyka] = useState({ c: 0, m: 100, y: 100, k: 0, a: 1 });

  useEffect(() => {
    const rgbaValues = currentColor.match(/\d+(\.\d+)?/g);
    if (rgbaValues && rgbaValues.length === 4) {
      const [r, g, b, a] = rgbaValues.map(Number);
      setRgba({ r, g, b, a });
    }
  }, [currentColor]);

  useEffect(() => {
    switch (colorModel) {
      case 'hsla':
        setRgba(hslToRgb(hsla.h, hsla.s, hsla.l, hsla.a));
        break;
      case 'rgba':
        setHsla(rgbToHsl(rgba.r, rgba.g, rgba.b, rgba.a));
        setCmyka(rgbToCmyk(rgba.r, rgba.g, rgba.b, rgba.a));
        break;
      case 'cmyka':
        const rgbFromCmyk = cmykToRgb(cmyka.c, cmyka.m, cmyka.y, cmyka.k, cmyka.a);
        setRgba(rgbFromCmyk);
        setHsla(rgbToHsl(rgbFromCmyk.r, rgbFromCmyk.g, rgbFromCmyk.b, rgbFromCmyk.a));
        break;
    }
    setCurrentColor(`rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`);
  }, [colorModel, hsla, rgba, cmyka, setCurrentColor]);

  const handleSliderChange = (model: ColorModel, component: string, value: number) => {
    switch (model) {
      case 'hsla':
        setHsla(prev => ({ ...prev, [component]: value }));
        break;
      case 'rgba':
        setRgba(prev => ({ ...prev, [component]: value }));
        break;
      case 'cmyka':
        setCmyka(prev => ({ ...prev, [component]: value }));
        break;
    }
  };

  const colorPreview = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;

  return (
    <div className="flex flex-col h-full">
      <Tabs value={colorModel} onValueChange={(value) => setColorModel(value as ColorModel)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hsla">HSLA</TabsTrigger>
          <TabsTrigger value="rgba">RGBA</TabsTrigger>
          <TabsTrigger value="cmyka">CMYKA</TabsTrigger>
        </TabsList>
        <div className="flex-grow overflow-y-auto p-4">
          <TabsContent value="hsla">
            <ColorSlider label="Hue" value={hsla.h} max={360} onChange={(v) => handleSliderChange('hsla', 'h', v)} />
            <ColorSlider label="Saturation" value={hsla.s} onChange={(v) => handleSliderChange('hsla', 's', v)} />
            <ColorSlider label="Lightness" value={hsla.l} onChange={(v) => handleSliderChange('hsla', 'l', v)} />
            <ColorSlider label="Alpha" value={hsla.a * 100} onChange={(v) => handleSliderChange('hsla', 'a', v / 100)} />
          </TabsContent>
          <TabsContent value="rgba">
            <ColorSlider label="Red" value={rgba.r} max={255} onChange={(v) => handleSliderChange('rgba', 'r', v)} />
            <ColorSlider label="Green" value={rgba.g} max={255} onChange={(v) => handleSliderChange('rgba', 'g', v)} />
            <ColorSlider label="Blue" value={rgba.b} max={255} onChange={(v) => handleSliderChange('rgba', 'b', v)} />
            <ColorSlider label="Alpha" value={rgba.a * 100} onChange={(v) => handleSliderChange('rgba', 'a', v / 100)} />
          </TabsContent>
          <TabsContent value="cmyka">
            <ColorSlider label="Cyan" value={cmyka.c} onChange={(v) => handleSliderChange('cmyka', 'c', v)} />
            <ColorSlider label="Magenta" value={cmyka.m} onChange={(v) => handleSliderChange('cmyka', 'm', v)} />
            <ColorSlider label="Yellow" value={cmyka.y} onChange={(v) => handleSliderChange('cmyka', 'y', v)} />
            <ColorSlider label="Key (Black)" value={cmyka.k} onChange={(v) => handleSliderChange('cmyka', 'k', v)} />
            <ColorSlider label="Alpha" value={cmyka.a * 100} onChange={(v) => handleSliderChange('cmyka', 'a', v / 100)} />
          </TabsContent>
        </div>
      </Tabs>
      <div className="mt-auto p-4 flex items-center space-x-2">
        <div className="w-8 h-8 rounded" style={{ backgroundColor: colorPreview }} />
        <Button onClick={() => addToPalette(colorPreview)}>
          Add to Palette
        </Button>
      </div>
    </div>
  );
}