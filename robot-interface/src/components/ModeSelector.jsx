import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Terrain,Water } from '@mui/icons-material';

const sendRobotCommand = async (action, value) => {
    try {
        await fetch('https://robot-interface-production-d0d3.up.railway.app/', { // Replace with your backend URL if deployed
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, value })
        });
    } catch (error) {
        console.error("Failed to send command to backend:", error);
    }
};

const ModeSelector = ({ currentMode, onModeChange, theme }) => {

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            onModeChange(newMode);

            let translatedMode = newMode.toLowerCase() + " mode";
            if (newMode === "LAND") translatedMode = "ground mode";
            if (newMode === "WATER") translatedMode = "aquatic mode";

            sendRobotCommand("change_mode", translatedMode);
        }
    };

    return (
        <Box className="mode-selector" sx={{ p: 2, bgcolor: theme === 'dark' ? '#141a16' : '#fff', borderBottom: `1px solid ${theme === 'dark' ? 'transparent' : 'rgba(0,0,0,0.1)'}` }}>
            <Typography variant="caption" sx={{ color: '#aaa', mb: 1, display: 'block' }}>OPERATIONAL DOMAIN</Typography>
            <ToggleButtonGroup
                value={currentMode}
                exclusive
                onChange={handleModeChange}
                aria-label="device mode"
                sx={{
                    width: '100%',
                    bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fdfa',
                    border: theme === 'dark' ? 'none' : '1.5px solid #1a3324',
                    boxShadow: theme === 'dark'
                        ? 'inset 2px 2px 5px rgba(255, 255, 255, 0.05), inset -2px -2px 5px rgba(0, 0, 0, 0.5)'
                        : 'inset 2px 2px 5px rgba(255, 255, 255, 1), inset -2px -2px 5px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0,0,0,0.1)'
                }}
            >
                <ToggleButton value="LAND" sx={{ flex: 1, color: theme === 'dark' ? '#aaa' : '#555', '&.Mui-selected': { color: '#4caf50', borderColor: '#4caf50', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' } }}>
                    <Terrain fontSize="small" sx={{ mr: 1 }} /> Land
                </ToggleButton>
                <ToggleButton value="WATER" sx={{ flex: 1, color: theme === 'dark' ? '#aaa' : '#555', '&.Mui-selected': { color: '#2979ff', borderColor: '#2979ff', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' } }}>
                    <Water fontSize="small" sx={{ mr: 1 }} /> Water
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
};

export default ModeSelector;
