import React from 'react';
import { Box } from '@mui/material';

const MapContainer = ({ theme }) => {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                bgcolor: theme === 'dark' ? '#0a0a0a' : '#e8f0e8',
            }}
        >
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Google_Maps_icon_%282020%29.svg"
                style={{ width: '35%', maxWidth: 80, opacity: 0.5, objectFit: 'contain' }}
                alt="GPS Map"
            />

            {/* GPS marker, centered */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#00ff88',
                    boxShadow: '0 0 10px #00ff88',
                    transform: 'translate(-50%, -50%)',
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    fontSize: '10px',
                    bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    px: 1,
                    py: 0.25,
                    borderRadius: '4px',
                }}
            >
                LAT: 6.38°N | LON: 80.41°E
            </Box>
        </Box>
    );
};

export default MapContainer;