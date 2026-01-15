import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Terrain, Air, Water } from '@mui/icons-material';

const ModeSelector = ({ currentMode, onModeChange }) => {

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            onModeChange(newMode);
        }
    };

    return (
        <Box className="mode-selector" sx={{ p: 2, bgcolor: '#141a16' }}>
            <Typography variant="caption" sx={{ color: '#aaa', mb: 1, display: 'block' }}>OPERATIONAL DOMAIN</Typography>
            <ToggleButtonGroup
                value={currentMode}
                exclusive
                onChange={handleModeChange}
                aria-label="device mode"
                sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.05)' }}
            >
                <ToggleButton value="LAND" sx={{ flex: 1, color: '#aaa', '&.Mui-selected': { color: '#4caf50', borderColor: '#4caf50' } }}>
                    <Terrain fontSize="small" sx={{ mr: 1 }} /> Land
                </ToggleButton>
                <ToggleButton value="AIR" sx={{ flex: 1, color: '#aaa', '&.Mui-selected': { color: '#00e5ff', borderColor: '#00e5ff' } }}>
                    <Air fontSize="small" sx={{ mr: 1 }} /> Air
                </ToggleButton>
                <ToggleButton value="WATER" sx={{ flex: 1, color: '#aaa', '&.Mui-selected': { color: '#2979ff', borderColor: '#2979ff' } }}>
                    <Water fontSize="small" sx={{ mr: 1 }} /> Water
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
};

export default ModeSelector;
