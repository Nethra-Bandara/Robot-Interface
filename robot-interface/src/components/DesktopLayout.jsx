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
                minHeight: 0,
                overflow: 'hidden',
                bgcolor: 'var(--bg-page)',
            }}
        >
            {/* Left — camera + controls: fills full height, scrolls internally if needed */}
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
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <VisionZone {...props} />
                </Box>
            </Box>

            {/* Right — gallery + sidebar stacked, fixed width */}
            <Box
                className="content-panel"
                sx={{
                    width: { md: '320px', lg: '360px', xl: '400px' },
                    flexShrink: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: 'var(--border, 1px solid rgba(255,255,255,0.1))',
                    overflow: 'hidden',
                }}
            >
                {/* Gallery — top 55%, fully scrollable, never grows into sidebar */}
                <Box
                    sx={{
                        height: '55%',
                        flexShrink: 0,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                    }}
                >
                    <ScreenshotGallery
                        screenshots={screenshots}
                        onSelect={handleSelectScreenshot}
                        activeIndex={activeIndex}
                        onDelete={handleDelete}
                        onDeleteAll={handleDeleteAll}
                        theme={theme}
                        isPurging={isPurging}
                        className="screenshot-gallery"
                    />
                </Box>

                {/* Sidebar — bottom 45%, contained box, scrolls internally */}
                <Box
                    sx={{
                        height: '45%',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderTop: 'var(--border, 1px solid rgba(255,255,255,0.1))',
                        position: 'relative', // contain any absolute/fixed children
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
        </Box>
    );
};

export default DesktopLayout;
