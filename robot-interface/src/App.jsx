import React, { useState, useEffect } from 'react';
import VisionZone from './components/VisionZone';
import Sidebar from './components/Sidebar';
import ScreenshotGallery from './components/ScreenshotGallery';
import { api } from './services/api';
import { useMQTT } from './hooks/useMQTT';
import useMobile from './hooks/useMobile';
import MobileLayout from './components/MobileLayout';
import ConfirmDialog from './components/ConfirmDialog';
import ModeSelector from './components/ModeSelector';


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

  // Load locally-saved screenshots from localStorage
  const loadLocalScreenshots = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('local_screenshots') || '[]');
      return stored;
    } catch {
      return [];
    }
  };

  const saveLocalScreenshot = (imageSrc) => {
    const stored = loadLocalScreenshots();
    const entry = {
      id: `local_${Date.now()}`,
      filename: `local_${Date.now()}`,
      url: imageSrc,
      timestamp: new Date().toLocaleTimeString(),
      isLocal: true,
    };
    const updated = [entry, ...stored].slice(0, 50); // keep max 50 local
    localStorage.setItem('local_screenshots', JSON.stringify(updated));
    return entry;
  };
  const { 
    telemetry, 
    sendMoveCommand, 
    sendSpeedCommand, 
    sendCameraToggle, 
    sendMicToggle, 
    sendLightsToggle, 
    sendCameraCommand,
    sendModeCommand
  } = useMQTT();
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
    const localShots = loadLocalScreenshots();
    try {
      const data = await api.getScreenshots();
      const remoteFormatted = data.map(item => ({
        ...item,
        id: item.filename,
        timestamp: new Date(item.timestamp * 1000).toLocaleTimeString()
      }));
      // Merge: remote first, then local-only ones not on remote
      const remoteIds = new Set(remoteFormatted.map(s => s.id));
      const localOnly = localShots.filter(s => !remoteIds.has(s.id));
      setScreenshots([...remoteFormatted, ...localOnly]);
    } catch (err) {
      console.error("Failed to load remote screenshots, using local only", err);
      setScreenshots(localShots);
    }
  };

  const handleCapture = async (imageSrc) => {
    try {
      await api.upload(imageSrc);
      await loadScreenshots();
      setActiveIndex(0);
    } catch (err) {
      console.warn("Backend unreachable, saving screenshot locally", err);
      // Fallback: save to localStorage
      const entry = saveLocalScreenshot(imageSrc);
      setScreenshots(prev => [entry, ...prev]);
      setActiveIndex(0);
    }
  };

  const handleSelectScreenshot = (shot, index) => {
    setActiveIndex(index);
  };

  const handleDelete = async (id) => {
    // Optimistically remove from UI immediately
    const newScreenshots = screenshots.filter(shot => shot.id !== id);
    setScreenshots(newScreenshots);
    if (activeIndex !== null && screenshots[activeIndex]?.id === id) {
      setActiveIndex(null);
    }

    // Always remove from localStorage (covers local-only shots)
    const stored = loadLocalScreenshots().filter(s => s.id !== id);
    localStorage.setItem('local_screenshots', JSON.stringify(stored));

    // Try to delete from backend too (non-blocking)
    if (!String(id).startsWith('local_')) {
      try {
        await api.deleteScreenshot(id);
      } catch (err) {
        console.warn("Backend delete failed (already removed from UI)", err);
      }
    }
  };

  const handleDeleteAll = () => {
    if (screenshots.length === 0 || isPurging) return;
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setIsPurging(true);
    // Optimistically clear UI and localStorage immediately
    localStorage.removeItem('local_screenshots');
    setScreenshots([]);
    setActiveIndex(null);
    setShowConfirm(false);

    // Try backend delete (non-blocking)
    try {
      await api.deleteAllScreenshots();
    } catch (err) {
      console.warn("Backend delete-all failed (UI already cleared)", err);
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
          onToggleTheme={toggleTheme}
          sendMoveCommand={sendMoveCommand}
          sendSpeedCommand={sendSpeedCommand}
          sendCameraToggle={sendCameraToggle}
          sendMicToggle={sendMicToggle}
          sendLightsToggle={sendLightsToggle}
          sendCameraCommand={sendCameraCommand}
          sendModeCommand={sendModeCommand}
          telemetry={telemetry}
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
          sendSpeedCommand={sendSpeedCommand}
          sendCameraToggle={sendCameraToggle}
          sendMicToggle={sendMicToggle}
          sendLightsToggle={sendLightsToggle}
          sendCameraCommand={sendCameraCommand}
          sendModeCommand={sendModeCommand}
          telemetry={telemetry}
        />

        <ModeSelector 
        theme={theme} onModeChange={setMode} />

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
