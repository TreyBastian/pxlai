import React from 'react';
import { PhotoshopLayout } from './components/PhotoshopLayout';
import { ColorProvider } from './contexts/ColorContext';

function App() {
  return (
    <ColorProvider>
      <PhotoshopLayout />
    </ColorProvider>
  );
}

export default App;