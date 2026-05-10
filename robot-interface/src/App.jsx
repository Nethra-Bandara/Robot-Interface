import React, { useState, useEffect } from 'react';
import VisionZone from './components/VisionZone';
import Sidebar from './components/Sidebar';
import ScreenshotGallery from './components/ScreenshotGallery';
import { api } from './services/api';
import { useMQTT } from './hooks/useMQTT';
import useMobile from './hooks/useMobile';
import MobileLayout from './components/MobileLayout';
import ConfirmDialog from './components/ConfirmDialog';

import './App.css';

class ErrorBoundary extends React.Component {
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
  const [mode, setMode] = useState('LAND');
  const { telemetry, sendMoveCommand } = useMQTT();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isPurging, setIsPurging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Fetch screenshots on mount
  useEffect(() => {
    loadScreenshots();
  }, []);

  const loadScreenshots = async () => {
    try {
      const data = await api.getScreenshots();
      const formatted = data.map(item => ({
        ...item,
        id: item.filename,
        timestamp: new Date(item.timestamp * 1000).toLocaleTimeString()
      }));
      setScreenshots(formatted);
    } catch (err) {
      console.error("Failed to load screenshots", err);
    }
  };

  const handleCapture = async (imageSrc) => {
    try {
      const res = await api.upload(imageSrc);
      await loadScreenshots();
      setActiveIndex(0);
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

  const handleDeleteAll = () => {
    if (screenshots.length === 0 || isPurging) return;
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setIsPurging(true);
    try {
      console.log("Initiating Delete All...");
      const result = await api.deleteAllScreenshots();
      console.log("Delete Result:", result);

      setScreenshots([]);
      setActiveIndex(null);

      if (result.errors) {
        console.warn("Some files could not be deleted:", result.errors);
      }
    } catch (err) {
      console.error("Delete all failed", err);
      alert(`Failed to delete all screenshots: ${err.message}`);
    } finally {
      setIsPurging(false);
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
          theme={theme}
          isPurging={isPurging}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`dashboard theme-${theme} mode-${mode.toLowerCase()}`}>
        <VisionZone
          onCapture={handleCapture}
          mode={mode}
          onModeChange={setMode}
          theme={theme}
          onToggleTheme={toggleTheme}
          sendMoveCommand={sendMoveCommand}
          telemetry={telemetry}
        />

        <div className="content-panel">
          <ScreenshotGallery
            screenshots={screenshots}
            onSelect={handleSelectScreenshot}
            activeIndex={activeIndex}
            onDelete={handleDelete}
            onDeleteAll={handleDeleteAll}
            theme={theme}
            isPurging={isPurging}
          />

          <Sidebar
            activeContext={screenshots[activeIndex]}
            currentMode={mode}
            onModeChange={setMode}
            theme={theme}
            telemetry={telemetry}
          />
        </div>

        <ConfirmDialog
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
          title="Confirm Global Delete"
          message="Are you sure you want to delete ALL captured screenshots? This action is permanent and cannot be reversed."
          theme={theme}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
