import React, { useState, useEffect, useCallback } from 'react';
import { useColor } from '../contexts/ColorContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { hslToRgb, rgbToHsl, rgbToCmyk, cmykToRgb } from '../utils/colorConversions';

const ColorSlider = React.memo(({ label, value, min = 0, max = 100, onChange, isAlpha = false, isHue = false, hsla = { h: 0, s: 100, l: 50, a: 1 } }) => {
  const displayValue = isAlpha ? value.toFixed(2) : Math.round(value);
  const [inputValue, setInputValue] = useState(displayValue.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const numValue = Number(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(isAlpha ? parseFloat(numValue.toFixed(2)) : numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = Number(inputValue);
    if (isNaN(numValue) || numValue < min) {
      setInputValue(isAlpha ? min.toFixed(2) : min.toString());
      onChange(min);
    } else if (numValue > max) {
      setInputValue(isAlpha ? max.toFixed(2) : max.toString());
      onChange(max);
    } else {
      const roundedValue = isAlpha ? parseFloat(numValue.toFixed(2)) : Math.round(numValue);
      setInputValue(isAlpha ? roundedValue.toFixed(2) : roundedValue.toString());
      onChange(roundedValue);
    }
  };

  useEffect(() => {
    setInputValue(displayValue.toString());
  }, [displayValue]);

  const getSliderBackground = () => {
    if (isHue) {
      return `linear-gradient(to right, 
        hsl(0, 100%, 50%), hsl(60, 100%, 50%), 
        hsl(120, 100%, 50%), hsl(180, 100%, 50%), 
        hsl(240, 100%, 50%), hsl(300, 100%, 50%), 
        hsl(359, 100%, 50%))`;
    } else if (label === "Saturation") {
      return `linear-gradient(to right, 
        hsl(${hsla.h}, 0%, ${hsla.l}%), 
        hsl(${hsla.h}, 100%, ${hsla.l}%))`;
    } else if (label === "Lightness") {
      return `linear-gradient(to right, 
        hsl(${hsla.h}, ${hsla.s}%, 0%), 
        hsl(${hsla.h}, ${hsla.s}%, 50%), 
        hsl(${hsla.h}, ${hsla.s}%, 100%))`;
    } else if (isAlpha) {
      const rgb = hslToRgb(hsla.h, hsla.s, hsla.l);
      return `linear-gradient(to right, 
        rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0), 
        rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1))`;
    }
    return '';
  };

  return (
    <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center mb-2">
      <Label className="w-20">{label}</Label>
      <div className="relative h-5">
        <div
          className="absolute inset-0 rounded-md"
          style={{ background: getSliderBackground() }}
        />
        <Slider
          min={min}
          max={max}
          step={isAlpha ? 0.01 : 1}
          value={[isAlpha ? parseFloat(value.toFixed(2)) : value]}
          onValueChange={([newValue]) => onChange(isAlpha ? parseFloat(newValue.toFixed(2)) : newValue)}
          className="relative z-10"
        />
      </div>
      <Input
        type="number"
        min={min}
        max={max}
        step={isAlpha ? 0.01 : 1}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="w-16 text-right"
      />
    </div>
  );
});

type ColorModel = 'hsla' | 'rgba' | 'cmyka';

export function ColorPicker() {
  const { currentColor, setCurrentColor, updatePaletteColor, selectedColorId } = useColor();
  const [colorModel, setColorModel] = useState<ColorModel>('rgba');
  const [hsla, setHsla] = useState({ h: 0, s: 100, l: 50, a: 1 });
  const [rgba, setRgba] = useState({ r: 200, g: 200, b: 200, a: 1 });
  const [cmyka, setCmyka] = useState({ c: 0, m: 0, y: 0, k: 20, a: 1 });

  const updateAllColors = useCallback((newRgba) => {
    const validRgba = {
      r: isNaN(newRgba.r) ? 0 : Math.min(255, Math.max(0, Math.round(newRgba.r))),
      g: isNaN(newRgba.g) ? 0 : Math.min(255, Math.max(0, Math.round(newRgba.g))),
      b: isNaN(newRgba.b) ? 0 : Math.min(255, Math.max(0, Math.round(newRgba.b))),
      a: isNaN(newRgba.a) ? 1 : Math.min(1, Math.max(0, newRgba.a))
    };

    const [h, s, l] = rgbToHsl(validRgba.r, validRgba.g, validRgba.b);
    const [c, m, y, k] = rgbToCmyk(validRgba.r, validRgba.g, validRgba.b);

    setRgba(validRgba);
    setHsla({ h, s, l, a: validRgba.a });
    setCmyka({ c, m, y, k, a: validRgba.a });
  }, []);

  useEffect(() => {
    if (currentColor) {
      const rgbaValues = currentColor.match(/\d+(\.\d+)?/g);
      if (rgbaValues && rgbaValues.length === 4) {
        const [r, g, b, a] = rgbaValues.map(Number);
        updateAllColors({ r, g, b, a });
      }
    } else {
      updateAllColors({ r: 200, g: 200, b: 200, a: 1 });
    }
  }, [currentColor, updateAllColors]);

  const handleSliderChange = useCallback((model: ColorModel, component: string, value: number) => {
    let newColor;
    switch (model) {
      case 'hsla':
        const newHsla = { ...hsla, [component]: value };
        if (component === 'h') {
          newHsla.h = Math.min(359, Math.max(0, newHsla.h));
        }
        const [r, g, b] = hslToRgb(newHsla.h, newHsla.s, newHsla.l);
        newColor = { r, g, b, a: newHsla.a };
        setHsla(newHsla);
        break;
      case 'rgba':
        newColor = { ...rgba, [component]: value };
        setRgba(newColor);
        break;
      case 'cmyka':
        const newCmyka = { ...cmyka, [component]: value };
        const [rr, gg, bb] = cmykToRgb(newCmyka.c, newCmyka.m, newCmyka.y, newCmyka.k);
        newColor = { r: rr, g: gg, b: bb, a: newCmyka.a };
        setCmyka(newCmyka);
        break;
    }
    
    // Update all color models
    updateAllColors(newColor);
    
    // Update currentColor in real-time
    const updatedColor = `rgba(${Math.round(newColor.r)}, ${Math.round(newColor.g)}, ${Math.round(newColor.b)}, ${newColor.a})`;
    setCurrentColor(updatedColor);
  }, [hsla, rgba, cmyka, updateAllColors, setCurrentColor]);

  useEffect(() => {
    if (currentColor && selectedColorId) {
      updatePaletteColor(selectedColorId, currentColor);
    }
  }, [currentColor, selectedColorId, updatePaletteColor]);

  return (
    <div className="flex flex-col h-full">
      <Tabs value={colorModel} onValueChange={(value) => setColorModel(value as ColorModel)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hsla">HSLA</TabsTrigger>
          <TabsTrigger value="rgba">RGBA</TabsTrigger>
          <TabsTrigger value="cmyka">CMYKA</TabsTrigger>
        </TabsList>
        <div className="overflow-y-auto p-4">
          <TabsContent value="hsla" className="mt-0">
            <ColorSlider 
              label="Hue" 
              value={hsla.h} 
              min={0} 
              max={359} 
              onChange={(v) => handleSliderChange('hsla', 'h', v)} 
              isHue={true}
              hsla={hsla}
            />
            <ColorSlider 
              label="Saturation" 
              value={hsla.s} 
              min={0} 
              max={100} 
              onChange={(v) => handleSliderChange('hsla', 's', v)} 
              hsla={hsla}
            />
            <ColorSlider 
              label="Lightness" 
              value={hsla.l} 
              min={0} 
              max={100} 
              onChange={(v) => handleSliderChange('hsla', 'l', v)} 
              hsla={hsla}
            />
            <ColorSlider 
              label="Alpha" 
              value={hsla.a} 
              min={0} 
              max={1} 
              onChange={(v) => handleSliderChange('hsla', 'a', v)} 
              isAlpha 
              hsla={hsla}
            />
          </TabsContent>
          <TabsContent value="rgba" className="mt-0">
            <ColorSlider label="Red" value={rgba.r} min={0} max={255} onChange={(v) => handleSliderChange('rgba', 'r', v)} hsla={hsla} />
            <ColorSlider label="Green" value={rgba.g} min={0} max={255} onChange={(v) => handleSliderChange('rgba', 'g', v)} hsla={hsla} />
            <ColorSlider label="Blue" value={rgba.b} min={0} max={255} onChange={(v) => handleSliderChange('rgba', 'b', v)} hsla={hsla} />
            <ColorSlider label="Alpha" value={rgba.a} min={0} max={1} onChange={(v) => handleSliderChange('rgba', 'a', v)} isAlpha hsla={hsla} />
          </TabsContent>
          <TabsContent value="cmyka" className="mt-0">
            <ColorSlider label="Cyan" value={cmyka.c} min={0} max={100} onChange={(v) => handleSliderChange('cmyka', 'c', v)} hsla={hsla} />
            <ColorSlider label="Magenta" value={cmyka.m} min={0} max={100} onChange={(v) => handleSliderChange('cmyka', 'm', v)} hsla={hsla} />
            <ColorSlider label="Yellow" value={cmyka.y} min={0} max={100} onChange={(v) => handleSliderChange('cmyka', 'y', v)} hsla={hsla} />
            <ColorSlider label="Key (Black)" value={cmyka.k} min={0} max={100} onChange={(v) => handleSliderChange('cmyka', 'k', v)} hsla={hsla} />
            <ColorSlider label="Alpha" value={cmyka.a} min={0} max={1} onChange={(v) => handleSliderChange('cmyka', 'a', v)} isAlpha hsla={hsla} />
          </TabsContent>
        </div>
      </Tabs>
      <div 
        className="flex-grow rounded-b-lg"
        style={{ 
          backgroundColor: 'transparent',
          backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                            linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #ccc 75%), 
                            linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          position: 'relative'
        }}
      >
        <div
          className="absolute inset-0 rounded-b-lg"
          style={{ backgroundColor: currentColor || 'transparent' }}
        />
      </div>
    </div>
  );
}