// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import MapContainer from './MapContainer';
import ChatWindow from './ChatWindow';
import TelemetryHistory from './TelemetryHistory';

const Sidebar = ({ activeContext, currentMode, onModeChange, theme, telemetry }) => {
    const [historyOpen, setHistoryOpen] = useState(false);
    const isDark = theme === 'dark';

    return (
        // Full-height flex column — no position:fixed anywhere
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: 'var(--panel-bg)',
            }}
        >
            {/* ── Telemetry logs button ── */}
            <Box sx={{ p: 1, flexShrink: 0 }}>
                <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => setHistoryOpen(true)}
                    fullWidth
                    sx={{
                        color: isDark ? '#00ff88' : '#2e7d32',
                        borderColor: isDark ? '#00ff88' : '#2e7d32',
                        '&:hover': {
                            backgroundColor: isDark
                                ? 'rgba(0, 255, 136, 0.1)'
                                : 'rgba(46, 125, 50, 0.1)',
                        },
                    }}
                >
                    View Telemetry Logs
                </Button>
            </Box>

            <TelemetryHistory
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                theme={theme}
            />

            {/* ── GPS Map — takes remaining space above chat ── */}
            <Box sx={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
                <MapContainer theme={theme} />
            </Box>

            {/* ── Chat window — fixed height at the bottom ── */}
            <Box
                sx={{
                    flexShrink: 0,
                    borderTop: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
                    overflow: 'hidden',
                }}
            >
                <ChatWindow
                    activeContext={activeContext}
                    currentMode={currentMode}
                    theme={theme}
                />
            </Box>
        </Box>
    );
};

export default Sidebar;
