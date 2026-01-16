import React, { useState } from 'react';
import VisionZone from './components/VisionZone';
import Sidebar from './components/Sidebar';
import ScreenshotGallery from './components/ScreenshotGallery';

import './App.css';

class ErrorBoundary extends React.Component {
  // ... (keep existing)
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 20 }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [screenshots, setScreenshots] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [mode, setMode] = useState('LAND'); // LAND, AIR, WATER

  const handleCapture = (imageSrc) => {
    const newScreenshot = {
      url: imageSrc,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now(),
      mode: mode
    };
    setScreenshots(prev => [newScreenshot, ...prev]);
    setActiveIndex(0);
  };

  const handleSelectScreenshot = (shot, index) => {
    setActiveIndex(index);
  };

  const handleDelete = (id) => {
    setScreenshots(prev => prev.filter(shot => shot.id !== id));
    if (screenshots[activeIndex]?.id === id) {
      setActiveIndex(null);
    }
  };

  const handleDeleteAll = () => {
    setScreenshots([]);
    setActiveIndex(null);
  };

  return (
    <ErrorBoundary>
      <div className={`dashboard mode-${mode.toLowerCase()}`}>
        <VisionZone onCapture={handleCapture} mode={mode} onModeChange={setMode} />

        <div className="content-panel">
          {/* Screenshot Gallery scrolls normally */}
          <ScreenshotGallery
            screenshots={screenshots}
            onSelect={handleSelectScreenshot}
            activeIndex={activeIndex}
            onDelete={handleDelete}
            onDeleteAll={handleDeleteAll}
          />

          <Sidebar
            activeContext={screenshots[activeIndex]}
            currentMode={mode}
            onModeChange={setMode}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
