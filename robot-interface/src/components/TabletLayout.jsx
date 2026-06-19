// src/components/TabletLayout.jsx
import React, { useState } from 'react';
import { Box, Drawer, IconButton, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Menu, Videocam, PhotoLibrary, Info } from '@mui/icons-material';
import VisionZone from './VisionZone';
import ScreenshotGallery from './ScreenshotGallery';
import Sidebar from './Sidebar';

const BOTTOM_NAV_HEIGHT = 56;

const TabletLayout = (props) => {
    const {
        theme, screenshots, activeIndex, handleDelete,
        handleDeleteAll, isPurging, handleSelectScreenshot,
        mode, setMode, telemetry,
    } = props;

    const [tab, setTab]         = useState(0);
    const [drawerOpen, setDrawer] = useState(false);

    return (
        <Box
            className={`theme-${theme} mode-${mode?.toLowerCase()}`}
            sx={{
                width: '100vw',
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'var(--bg-page)',
                overflow: 'hidden',
            }}
        >
            {/* ── Sidebar drawer — slides in from right ── */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawer(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '85vw', sm: 360 },
                        bgcolor: 'var(--panel-bg)',
                        borderLeft: 'var(--border, 1px solid rgba(255,255,255,0.1))',
                    },
                }}
            >
                <Sidebar
                    activeContext={screenshots[activeIndex]}
                    currentMode={mode}
                    onModeChange={setMode}
                    theme={theme}
                    telemetry={telemetry}
                />
            </Drawer>

            {/* ── Intel / Menu button — top-right overlay ── */}
            <IconButton
                onClick={() => setDrawer(true)}
                sx={{
                    position: 'fixed',
                    top: 12,
                    right: 12,
                    zIndex: 200,
                    color: 'var(--accent-primary)',
                    bgcolor: 'var(--panel-bg)',
                    border: 'var(--border, 1px solid rgba(255,255,255,0.2))',
                    '&:hover': { bgcolor: 'var(--panel-bg-hover, rgba(255,255,255,0.08))' },
                }}
            >
                <Menu />
            </IconButton>

            {/* ── Main content area — fills space above bottom nav ── */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    pb: `${BOTTOM_NAV_HEIGHT}px`, // reserve space for fixed bottom nav
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {tab === 0 && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1.5 }}>
                        <VisionZone {...props} />
                    </Box>
                )}
                {tab === 1 && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1.5 }}>
                        <ScreenshotGallery
                            screenshots={screenshots}
                            onSelect={handleSelectScreenshot}
                            activeIndex={activeIndex}
                            onDelete={handleDelete}
                            onDeleteAll={handleDeleteAll}
                            theme={theme}
                            isPurging={isPurging}
                        />
                    </Box>
                )}
                {tab === 2 && (
                    <Box sx={{ height: '100%', overflowY: 'auto' }}>
                        <Sidebar
                            activeContext={screenshots[activeIndex]}
                            currentMode={mode}
                            onModeChange={setMode}
                            theme={theme}
                            telemetry={telemetry}
                        />
                    </Box>
                )}
            </Box>

            {/* ── Bottom navigation bar ── */}
            <BottomNavigation
                value={tab}
                onChange={(_, newVal) => setTab(newVal)}
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${BOTTOM_NAV_HEIGHT}px`,
                    zIndex: 100,
                    bgcolor: 'var(--panel-bg)',
                    borderTop: 'var(--border, 1px solid rgba(255,255,255,0.1))',
                }}
            >
                <BottomNavigationAction
                    label="Camera"
                    icon={<Videocam />}
                    sx={{ color: tab === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                />
                <BottomNavigationAction
                    label="Gallery"
                    icon={<PhotoLibrary />}
                    sx={{ color: tab === 1 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                />
                <BottomNavigationAction
                    label="Intel"
                    icon={<Info />}
                    sx={{ color: tab === 2 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                />
            </BottomNavigation>
        </Box>
    );
};

export default TabletLayout;
