import React, { useState } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Terrain, Water } from '@mui/icons-material';

const BACKEND_URL = 'https://robot-interface-production-d0d3.up.railway.app';

const sendRobotCommand = async (action, value) => {
    try {
        await fetch(`${BACKEND_URL}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, value })
        });
    } catch (error) {
        console.error("Failed to send command:", error);
    }
};

const ModeSelector = ({ theme }) => {
    const [domain, setDomain] = useState('LAND');   // 'LAND' | 'WATER'
    const [modeNum, setModeNum] = useState('1');
    const [lastLandMode, setLastLandMode] = useState('1');    // '1' | '2' | '3'

    const handleDomainChange = (_, newDomain) => {
        if (!newDomain) return;
        setDomain(newDomain);

        if (newDomain === 'WATER') {
            // Water: no sub-mode, publish water mode directly
            setModeNum(null);
            sendRobotCommand('set_mode', { domain: 'water', mode: null });
        } else {
            // Switching back to land: restore last selected mode number
            setModeNum(lastLandMode);
            sendRobotCommand('set_mode', { domain: 'land', mode: parseInt(modeNum) });
        }
    };

    const handleModeNumChange = (_, newNum) => {
        if (!newNum) return;   // prevent deselecting
        setModeNum(newNum);
        setLastLandMode(newNum);
        sendRobotCommand('set_mode', { domain: 'land', mode: parseInt(newNum) });
    };

    const isDark = theme === 'dark';
    const baseBg = isDark ? '#141a16' : '#fff';
    const innerBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fdfa';
    const innerBorder = isDark ? 'none' : '1.5px solid #1a3324';

    return (
        <Box sx={{ p: 2, bgcolor: baseBg, borderBottom: `1px solid ${isDark ? 'transparent' : 'rgba(0,0,0,0.1)'}` }}>

            {/* ── Domain selector ── */}
            <Typography variant="caption" sx={{ color: '#aaa', mb: 1, display: 'block' }}>
                OPERATIONAL DOMAIN
            </Typography>
            <ToggleButtonGroup
                value={domain}
                exclusive
                onChange={handleDomainChange}
                aria-label="domain mode"
                sx={{ width: '100%', mb: 2, bgcolor: innerBg, border: innerBorder }}
            >
                <ToggleButton value="LAND" sx={{
                    flex: 1, color: isDark ? '#aaa' : '#555',
                    '&.Mui-selected': { color: '#4caf50', borderColor: '#4caf50' }
                }}>
                    <Terrain fontSize="small" sx={{ mr: 1 }} /> Land
                </ToggleButton>
                <ToggleButton value="WATER" sx={{
                    flex: 1, color: isDark ? '#aaa' : '#555',
                    '&.Mui-selected': { color: '#2979ff', borderColor: '#2979ff' }
                }}>
                    <Water fontSize="small" sx={{ mr: 1 }} /> Water
                </ToggleButton>
            </ToggleButtonGroup>

            {/* ── Mode number selector (disabled in Water mode) ── */}
            <Typography variant="caption" sx={{ color: '#aaa', mb: 1, display: 'block' }}>
                MODE
            </Typography>
            <ToggleButtonGroup
                value={domain === 'WATER' ? null : modeNum}
                exclusive
                onChange={handleModeNumChange}
                aria-label="mode number"
                disabled={domain === 'WATER'}   // disables all children at once
                sx={{ width: '100%', bgcolor: innerBg, border: innerBorder,
                    opacity: domain === 'WATER' ? 0.4 : 1,
                    transition: 'opacity 0.2s'
                }}
            >
                {['1', '2', '3'].map(n => (
                    <ToggleButton key={n} value={n} sx={{
                        flex: 1, color: isDark ? '#aaa' : '#555',
                        '&.Mui-selected': { color: domain === 'WATER' ? (isDark ? '#aaa' : '#555')
                : '#4caf50', borderColor: domain === 'WATER'
                ? 'transparent'
                : '#4caf50',
            backgroundColor: domain === 'WATER'
                ? 'transparent !important'
                : undefined,}
                    }}>
                        {n}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
};

export default ModeSelector;