import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
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

const ModeSelector = ({ theme, onModeChange, sendModeCommand }) => {
    const [domain, setDomain] = useState('LAND');
    const [modeNum, setModeNum] = useState('1');
    const [lastLandMode, setLastLandMode] = useState('1');

    const dispatchModeCommand = async (domainValue, modeValue) => {
        if (sendModeCommand) {
            sendModeCommand(domainValue, modeValue);
            return;
        }
        await sendRobotCommand('set_mode', { domain: domainValue, mode: modeValue });
    };

    const isDark = theme === 'dark';
    const isAqua = domain === 'WATER';

    const handleDomainChange = (newDomain) => {
        if (newDomain === domain) return;
        setDomain(newDomain);
        if (onModeChange) onModeChange(newDomain);

        if (newDomain === 'WATER') {
            dispatchModeCommand('water', null);
        } else {
            setModeNum(lastLandMode);
            dispatchModeCommand('land', parseInt(lastLandMode, 10));
        }
    };

    const handleModeNumChange = (newNum) => {
        if (isAqua) return;
        setModeNum(newNum);
        setLastLandMode(newNum);
        dispatchModeCommand('land', parseInt(newNum, 10));
    };

    // ── Colours ──────────────────────────────────────────────────────────────
    const accent      = '#00ff88';
    const bgOuter     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(5, 25, 13, 0.96)';
    const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0, 100, 40, 0.55)';
    const textDim     = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(215,243,209,0.75)';
    const textActive  = isDark ? '#e8f5e9' : '#e8f5e4';
    const labelColor  = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(215,243,209,0.65)';

    // ── Layout values (preserve dark-mode sizes, tighten vertical spacing in light mode) ──
    const outerPadding = isDark ? '12px 8px' : '8px 6px';
    const internalGap  = isDark ? '10px' : '6px';
    const domainPy     = isDark ? '12px' : '8px';
    const modePy       = isDark ? '14px' : '8px';

    // ── Shared domain button ─────────────────────────────────────────────────
    const DomainBtn = ({ value, icon: Icon, label }) => {
        const active = domain === value;
        return (
            <Box
                onClick={() => handleDomainChange(value)}
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    py: domainPy,
                    cursor: 'pointer',
                    borderRadius: '10px',
                    color: active ? textActive : textDim,
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.85rem',
                    letterSpacing: '0.08em',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                    // Active domain gets a subtle inset glow, no fill
                    boxShadow: active
                        ? `inset 0 0 0 1.5px ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,51,36,0.5)'},
                           0 0 12px rgba(0,255,136,0.08)`
                        : 'none',
                    '&:hover': {
                        color: active ? textActive : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(10,28,18,0.7)'),
                    },
                }}
            >
                <Icon sx={{ fontSize: '1.1rem' }} />
                <span>{label}</span>
            </Box>
        );
    };

    // ── Mode number button ───────────────────────────────────────────────────
    const ModeBtn = ({ num }) => {
        const active = !isAqua && modeNum === num;
        return (
            <Box
                onClick={() => handleModeNumChange(num)}
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: modePy,
                    cursor: isAqua ? 'not-allowed' : 'pointer',
                    borderRadius: '10px',
                    color: active ? accent : (isAqua ? 'transparent' : textDim),
                    fontSize: '1.1rem',
                    fontWeight: active ? 700 : 400,
                    letterSpacing: '0.05em',
                    transition: 'all 0.25s ease',
                    userSelect: 'none',
                    // Active mode: just the number glows green, no background fill
                    textShadow: active ? `0 0 12px ${accent}88` : 'none',
                    '&:hover': !isAqua ? {
                        color: active ? accent : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(10,28,18,0.6)'),
                    } : {},
                }}
            >
                {num}
            </Box>
        );
    };

    return (
        <Box sx={{ p: outerPadding, display: 'flex', flexDirection: 'column', gap: internalGap, minWidth: 200 }}>

            {/* ── Label ── */}
            <Typography sx={{
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                color: labelColor,
                fontWeight: 600,
                pl: '2px',
            }}>
                OPERATIONAL DOMAIN
            </Typography>

            {/* ── Domain Toggle ── */}
            <Box sx={{
                display: 'flex',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                background: bgOuter,
                overflow: 'hidden',
                p: '3px',
                gap: '3px',
            }}>
                <DomainBtn value="LAND"  icon={Terrain} label="LAND"  />
                <DomainBtn value="WATER" icon={Water}   label="AQUA"  />
            </Box>

            {/* ── Mode Label ── */}
            <Typography sx={{
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                color: isAqua ? 'transparent' : labelColor,
                fontWeight: 600,
                pl: '2px',
                transition: 'color 0.25s ease',
            }}>
                MODE
            </Typography>

            {/* ── Mode Number Toggle ── */}
            <Box sx={{
                display: 'flex',
                borderRadius: '12px',
                border: `1px solid ${isAqua ? 'transparent' : borderColor}`,
                background: isAqua ? 'transparent' : bgOuter,
                overflow: 'hidden',
                p: '3px',
                gap: '3px',
                transition: 'all 0.25s ease',
                pointerEvents: isAqua ? 'none' : 'auto',
            }}>
                <ModeBtn num="1" />
                <ModeBtn num="2" />
                <ModeBtn num="3" />
            </Box>

        </Box>
    );
};

export default ModeSelector;
