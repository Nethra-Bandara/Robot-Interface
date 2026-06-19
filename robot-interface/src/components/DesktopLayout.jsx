// src/components/DesktopLayout.jsx
import React from 'react';
import { Box } from '@mui/material';
import VisionZone from './VisionZone';
import ScreenshotGallery from './ScreenshotGallery';
import Sidebar from './Sidebar';

const DesktopLayout = (props) => {
    const { theme, mode, setMode, screenshots, activeIndex,
            handleDelete, handleDeleteAll, isPurging,
            handleSelectScreenshot, telemetry } = props;

    return (
        <Box
            className={`dashboard theme-${theme} mode-${mode?.toLowerCase()}`}
            sx={{
                display: 'flex',
                flexDirection: 'row',
                width: '100vw',
                height: '100dvh',
                overflow: 'hidden',
                bgcolor: 'var(--bg-page)',
            }}
        >
            {/* ── LEFT: Camera + controls ── */}
            <Box
                sx={{
                    flex: '1 1 0',
                    minWidth: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Scrollable so controls are never clipped on short screens */}
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                    <VisionZone {...props} />
                </Box>
            </Box>

            {/* ── MIDDLE: Screenshot gallery ── */}
            <Box
                sx={{
                    width: { md: '220px', lg: '260px', xl: '300px' },
                    flexShrink: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
                    overflow: 'hidden',
                }}
            >
                {/* ScreenshotGallery already has its own internal overflowY:auto */}
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
            </Box>

            {/* ── RIGHT: Sidebar (GPS map + chat) ── */}
            <Box
                sx={{
                    width: { md: '260px', lg: '300px', xl: '340px' },
                    flexShrink: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
                    overflow: 'hidden',
                    // Force a new stacking/compositing context so that any
                    // position:fixed children inside Sidebar are clipped here
                    // instead of escaping to the viewport.
                    transform: 'translateZ(0)',
                    isolation: 'isolate',
                }}
            >
                <Sidebar
                    activeContext={screenshots[activeIndex]}
                    currentMode={mode}
                    onModeChange={setMode}
                    theme={theme}
                    telemetry={telemetry}
                />
            </Box>
        </Box>
    );
};

export default DesktopLayout;
