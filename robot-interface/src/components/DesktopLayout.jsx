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
                width: '100vw',
                height: '100dvh',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                bgcolor: 'var(--bg-page)',
            }}
        >
            {/* ── Left column: camera + controls ── */}
            <Box
                sx={{
                    // On large screens take ~55% width, shrink gracefully on smaller
                    flex: '0 0 auto',
                    width: { xs: '52vw', md: '54vw', lg: '56vw', xl: '58vw' },
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    p: { xs: 0.5, md: 1, lg: 1.5 },
                }}
            >
                <VisionZone {...props} />
            </Box>

            {/* ── Right column: gallery + sidebar ── */}
            <Box
                className="content-panel"
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'hidden',
                    borderLeft: '1px solid var(--panel-border)',
                }}
            >
                {/* Gallery */}
                <Box
                    sx={{
                        flex: '0 0 auto',
                        width: { xs: '220px', md: '240px', lg: '260px' },
                        overflowY: 'auto',
                        borderRight: '1px solid var(--panel-border)',
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

                {/* Sidebar / Intel */}
                <Box sx={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
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
