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
        <Box className={`dashboard theme-${theme} mode-${mode?.toLowerCase()}`}>

            {/* Left — camera + controls */}
            <VisionZone {...props} />

            {/* Right — gallery + sidebar stacked */}
            <Box className="content-panel">
                <ScreenshotGallery
                    screenshots={screenshots} onSelect={handleSelectScreenshot}
                    activeIndex={activeIndex} onDelete={handleDelete}
                    onDeleteAll={handleDeleteAll} theme={theme} isPurging={isPurging}
                    className="screenshot-gallery" />
                <Sidebar
                    activeContext={screenshots[activeIndex]}
                    currentMode={mode} onModeChange={setMode}
                    theme={theme} telemetry={telemetry} />
            </Box>
        </Box>
    );
};

export default DesktopLayout;