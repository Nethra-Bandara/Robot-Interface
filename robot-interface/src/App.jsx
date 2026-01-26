import React, { useState, useEffect } from 'react';
import VisionZone from './components/VisionZone';
import Sidebar from './components/Sidebar';
import ScreenshotGallery from './components/ScreenshotGallery';
import { api } from './services/api';
import useMobile from './hooks/useMobile';
import MobileLayout from './components/MobileLayout';

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
  const isMobile = useMobile();

  // Fetch screenshots on mount
  useEffect(() => {
    loadScreenshots();
  }, []);

  const loadScreenshots = async () => {
    try {
      const data = await api.getScreenshots();
      // Backend returns { filename, url, timestamp }
      // We map it to our internal structure if needed, or just use as is.
      // We need 'id' for lists. Filename is unique enough.
      const formatted = data.map(item => ({
        ...item,
        id: item.filename,
        // formatted timestamp?
        timestamp: new Date(item.timestamp * 1000).toLocaleTimeString()
      }));
      setScreenshots(formatted);
    } catch (err) {
      console.error("Failed to load screenshots", err);
    }
  };

  const handleCapture = async (imageSrc) => {
    try {
      // Upload to backend
      // imageSrc is a data URL from VisionZone?
      const res = await api.upload(imageSrc);

      await loadScreenshots();
      setActiveIndex(0); // Select the newest one (first in list)
    } catch (err) {
      console.error("Upload failed", err);
      alert(`Capture failed: ${err.message}`);
    }
  };

  const handleSelectScreenshot = (shot, index) => {
    setActiveIndex(index);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteScreenshot(id);
      const newScreenshots = screenshots.filter(shot => shot.id !== id);
      setScreenshots(newScreenshots);
      if (activeIndex !== null && screenshots[activeIndex]?.id === id) {
        setActiveIndex(null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete ALL screenshots? This cannot be undone.")) {
      try {
        await api.deleteAllScreenshots();
        setScreenshots([]);
        setActiveIndex(null);
      } catch (err) {
        console.error("Delete all failed", err);
        alert("Failed to delete all screenshots");
      }
    }
  };

  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileLayout
          mode={mode}
          setMode={setMode}
          handleCapture={handleCapture}
          screenshots={screenshots}
          handleSelectScreenshot={handleSelectScreenshot}
          activeIndex={activeIndex}
          handleDelete={handleDelete}
          handleDeleteAll={handleDeleteAll}
        />
      </ErrorBoundary>
    );
  }

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
