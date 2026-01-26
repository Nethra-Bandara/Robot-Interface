import React, { useState } from 'react';
import MobileBottomNav from './MobileBottomNav';
import VisionZone from './VisionZone';
import ScreenshotGallery from './ScreenshotGallery';
import Sidebar from './Sidebar';
import { Box } from '@mui/material';

const MobileLayout = ({
    mode,
    setMode,
    handleCapture,
    screenshots,
    handleSelectScreenshot,
    activeIndex,
    handleDelete,
    handleDeleteAll
}) => {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#0b0f0c',
            overflow: 'hidden'
        }}>
            {/* Content Area */}
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

                {/* 1. VISION TAB */}
                {tab === 0 && (
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>
                        <VisionZone
                            onCapture={handleCapture}
                            mode={mode}
                            onModeChange={setMode}
                        />
                    </Box>
                )}

                {/* 2. GALLERY TAB */}
                {tab === 1 && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
                        <ScreenshotGallery
                            screenshots={screenshots}
                            onSelect={handleSelectScreenshot}
                            activeIndex={activeIndex}
                            onDelete={handleDelete}
                            onDeleteAll={handleDeleteAll}
                        />
                    </Box>
                )}

                {/* 3. INTEL TAB (Map + Chat) */}
                {tab === 2 && (
                    <Box sx={{ height: '100%', overflowY: 'auto' }}>
                        <Sidebar
                            activeContext={screenshots[activeIndex]}
                            currentMode={mode}
                            onModeChange={setMode}
                        />
                    </Box>
                )}
            </Box>

            {/* Bottom Navigation */}
            <MobileBottomNav value={tab} onChange={setTab} />
        </Box>
    );
};

export default MobileLayout;
