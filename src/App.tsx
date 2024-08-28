import React from 'react';
import { ColorProvider } from './contexts/ColorContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PhotoshopLayout from './components/PhotoshopLayout'; // Change this line

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