import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { useMQTT } from './hooks/useMQTT';
import { useMediaQuery } from '@mui/material';
import MobileLayout from './components/MobileLayout';
import TabletLayout from './components/TabletLayout';
import DesktopLayout from './components/DesktopLayout';
import ConfirmDialog from './components/ConfirmDialog';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ color: 'red', padding: 20 }}>
        <h1>Something went wrong.</h1>
        <pre>{this.state.error?.toString()}</pre>
      </div>
    );
    return this.props.children;
  }
}

function App() {
  const [screenshots, setScreenshots] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [mode, setMode] = useState('LAND');
  const [theme, setTheme] = useState('dark');
  const [isPurging, setIsPurging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    telemetry, sendMoveCommand, sendSpeedCommand, sendCameraToggle,
    sendMicToggle, sendLightsToggle, sendCameraCommand, sendModeCommand, mqttConnected
  } = useMQTT();

  // Breakpoints:
  //   < 768px  → Mobile   (single column, bottom nav)
  //   768–1100px → Tablet (single column, bottom nav)  
  //   > 1100px  → Desktop (three-column side-by-side)
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1100px)');

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const loadLocalScreenshots = () => {
    try { return JSON.parse(localStorage.getItem('local_screenshots') || '[]'); }
    catch { return []; }
  };

  const saveLocalScreenshot = (imageSrc) => {
    const stored = loadLocalScreenshots();
    const entry = { id: `local_${Date.now()}`, filename: `local_${Date.now()}`, url: imageSrc, timestamp: new Date().toLocaleTimeString(), isLocal: true };
    const updated = [entry, ...stored].slice(0, 50);
    localStorage.setItem('local_screenshots', JSON.stringify(updated));
    return entry;
  };

  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);

  const loadScreenshots = async () => {
    const localShots = loadLocalScreenshots();
    try {
      const data = await api.getScreenshots();
      const remoteFormatted = data.map(item => ({ ...item, id: item.filename, timestamp: new Date(item.timestamp * 1000).toLocaleTimeString() }));
      const remoteIds = new Set(remoteFormatted.map(s => s.id));
      const localOnly = localShots.filter(s => !remoteIds.has(s.id));
      setScreenshots([...remoteFormatted, ...localOnly]);
    } catch {
      setScreenshots(localShots);
    }
  };

  useEffect(() => { loadScreenshots(); }, []);

  const handleCapture = async (imageSrc) => {
    try { await api.upload(imageSrc); await loadScreenshots(); setActiveIndex(0); }
    catch { const entry = saveLocalScreenshot(imageSrc); setScreenshots(prev => [entry, ...prev]); setActiveIndex(0); }
  };

  const handleSelectScreenshot = (shot, index) => setActiveIndex(index);

  const handleDelete = async (id) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
    if (activeIndex !== null && screenshots[activeIndex]?.id === id) setActiveIndex(null);
    localStorage.setItem('local_screenshots', JSON.stringify(loadLocalScreenshots().filter(s => s.id !== id)));
    if (!String(id).startsWith('local_')) { try { await api.deleteScreenshot(id); } catch {} }
  };

  const handleDeleteAll = () => { if (screenshots.length === 0 || isPurging) return; setShowConfirm(true); };

  const confirmDelete = async () => {
    setIsPurging(true);
    localStorage.removeItem('local_screenshots');
    setScreenshots([]); setActiveIndex(null); setShowConfirm(false);
    try { await api.deleteAllScreenshots(); } catch {} finally { setIsPurging(false); }
  };

  const layoutProps = {
    mode, setMode, handleCapture, screenshots, handleSelectScreenshot,
    activeIndex, handleDelete, handleDeleteAll, theme, isPurging,
    onToggleTheme: toggleTheme, sendMoveCommand, sendSpeedCommand,
    sendCameraToggle, sendMicToggle, sendLightsToggle,
    sendCameraCommand, sendModeCommand, telemetry,
  };

  return (
    <ErrorBoundary>
      {isMobile ? (
        <MobileLayout {...layoutProps} />
      ) : isTablet ? (
        <TabletLayout {...layoutProps} />
      ) : (
        <DesktopLayout {...layoutProps} />
      )}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Confirm Global Delete"
        message="Are you sure you want to delete ALL captured screenshots? This action is permanent and cannot be reversed."
        theme={theme}
      />
    </ErrorBoundary>
  );
}

export default App;
