// src/components/TabletLayout.jsx
import React, { useState } from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import { Menu } from '@mui/icons-material';
import VisionZone from './VisionZone';
import ScreenshotGallery from './ScreenshotGallery';
import Sidebar from './Sidebar';

const TabletLayout = (props) => {
    const { theme, screenshots, activeIndex, handleDelete,
            handleDeleteAll, isPurging, handleSelectScreenshot,
            mode, setMode, telemetry } = props;
    const [tab, setTab]           = useState(0);
    const [drawerOpen, setDrawer] = useState(false);

    return (
        <Box className={`theme-${theme} mode-${mode?.toLowerCase()}`}
            sx={{ height: '100dvh', display: 'flex', flexDirection: 'column',
                  bgcolor: 'var(--bg-page)', overflow: 'hidden' }}>

            {/* Sidebar drawer — pulls in from right */}
            <Drawer anchor="right" open={drawerOpen}
                onClose={() => setDrawer(false)}
                PaperProps={{ sx: { width: 320, bgcolor: 'var(--panel-bg)',
                    borderLeft: 'var(--border)' } }}>
                <Sidebar activeContext={screenshots[activeIndex]}
                    currentMode={mode} onModeChange={setMode}
                    theme={theme} telemetry={telemetry} />
            </Drawer>

            {/* Intel button top-right */}
            <IconButton onClick={() => setDrawer(true)}
                sx={{ position: 'fixed', top: 12, right: 12, zIndex: 200,
                      color: 'var(--accent-primary)',
                      bgcolor: 'var(--panel-bg)', border: 'var(--border)' }}>
                <Menu />
            </IconButton>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {tab === 0 && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1.5 }}>
                        <VisionZone {...props} />
                    </Box>
                )}
                {tab === 1 && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1.5 }}>
                        <ScreenshotGallery
                            screenshots={screenshots} onSelect={handleSelectScreenshot}
                            activeIndex={activeIndex} onDelete={handleDelete}
                            onDeleteAll={handleDeleteAll} theme={theme} isPurging={isPurging} />
                    </Box>
                )}
            </Box>

        </Box>
    );
};

export default TabletLayout;