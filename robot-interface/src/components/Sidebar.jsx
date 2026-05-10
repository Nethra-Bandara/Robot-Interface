import React, { useState } from 'react';
import MapContainer from './MapContainer';
import ChatWindow from './ChatWindow';
import TelemetryHistory from './TelemetryHistory';
import { Button } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

const Sidebar = ({ activeContext, currentMode, onModeChange, theme, telemetry }) => {
    const [historyOpen, setHistoryOpen] = useState(false);

    const isDark = theme === 'dark';

    return (
        <aside className="sidebar">
            <div style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
                <Button 
                    variant="outlined" 
                    startIcon={<HistoryIcon />}
                    onClick={() => setHistoryOpen(true)}
                    sx={{
                        width: '100%',
                        color: isDark ? '#00ff88' : '#2e7d32',
                        borderColor: isDark ? '#00ff88' : '#2e7d32',
                        '&:hover': {
                            backgroundColor: isDark ? 'rgba(0, 255, 136, 0.1)' : 'rgba(46, 125, 50, 0.1)'
                        }
                    }}
                >
                    View Telemetry Logs
                </Button>
            </div>

            <TelemetryHistory 
                open={historyOpen} 
                onClose={() => setHistoryOpen(false)} 
                theme={theme} 
            />

            <MapContainer theme={theme} />
            <ChatWindow activeContext={activeContext} currentMode={currentMode} theme={theme} />
        </aside>
    );
};

export default Sidebar;
