import React from 'react';
import { LayerProvider } from './contexts/LayerContext';
import { ColorProvider } from './contexts/ColorContext';
import { FileProvider } from './contexts/FileContext';
import { WidgetProvider } from './contexts/WidgetContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PhotoshopLayout from './components/PhotoshopLayout';

function App() {
  return (
    <ThemeProvider>
      <FileProvider>
        <LayerProvider>
          <ColorProvider>
            <WidgetProvider>
              <PhotoshopLayout />
            </WidgetProvider>
          </ColorProvider>
        </LayerProvider>
      </FileProvider>
    </ThemeProvider>
  );
}

export default App;