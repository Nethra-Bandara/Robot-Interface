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
                // Fill the full viewport
                width: '100vw',
                height: '100dvh',
                overflow: 'hidden',

                // Fluid side-by-side layout
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',

                // Scale the entire dashboard to fit smaller screens.
                // On a 1280px laptop the content stays natural size.
                // On a 900px tablet it shrinks to ~70% so nothing overflows.
                // transformOrigin must stay top-left so the scale anchors correctly.
                transformOrigin: 'top left',
                transform: {
                    // ≥1280px  → no scale needed
                    xl: 'scale(1)',
                    // 1024–1279px (small laptop) → gentle shrink
                    lg: 'scale(0.92)',
                    // 768–1023px (landscape tablet) → moderate shrink
                    md: 'scale(0.78)',
                    // <768px → handled by mobile/tablet layouts, but just in case
                    sm: 'scale(0.65)',
                    xs: 'scale(0.55)',
                },
                // Compensate for the scale so the Box still occupies the right space
                // width / height are kept at 100vw/100dvh above; the scale shrinks
                // visual size but the element still takes up layout space, so we
                // expand the inner dimensions to counteract:
                '& > *': {
                    flexShrink: 0,
                },
            }}
        >
            {/* Left — camera + controls */}
            <VisionZone {...props} />

            {/* Right — gallery + sidebar stacked */}
            <Box
                className="content-panel"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
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
