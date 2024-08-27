import React from 'react';
import { PhotoshopLayout } from './components/PhotoshopLayout';
import { ColorProvider } from './contexts/ColorContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <ColorProvider>
        <PhotoshopLayout />
      </ColorProvider>
    </ThemeProvider>
  );
}

export default App;