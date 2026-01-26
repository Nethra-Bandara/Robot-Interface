import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Videocam, PhotoLibrary, Map } from '@mui/icons-material';

const MobileBottomNav = ({ value, onChange }) => {
    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
            <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                    onChange(newValue);
                }}
                sx={{ bgcolor: '#0b0f0c', borderTop: '1px solid #333' }}
            >
                <BottomNavigationAction
                    label="Vision"
                    icon={<Videocam />}
                    sx={{ color: '#888', '&.Mui-selected': { color: '#ff9800' } }}
                />
                <BottomNavigationAction
                    label="Gallery"
                    icon={<PhotoLibrary />}
                    sx={{ color: '#888', '&.Mui-selected': { color: '#ff9800' } }}
                />
                <BottomNavigationAction
                    label="Intel"
                    icon={<Map />}
                    sx={{ color: '#888', '&.Mui-selected': { color: '#ff9800' } }}
                />
            </BottomNavigation>
        </Paper>
    );
};

export default MobileBottomNav;
