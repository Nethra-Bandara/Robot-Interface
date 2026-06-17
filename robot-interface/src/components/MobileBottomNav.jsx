import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Videocam, PhotoLibrary, Map } from '@mui/icons-material';

const MobileBottomNav = ({ value, onChange }) => {
    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
            <BottomNavigation sx={{ bgcolor: 'var(--bg-page)', borderTop: 'var(--border)' }}>
    <BottomNavigationAction label="Vision" icon={<Videocam />}
        sx={{ color: 'var(--text-dim)', '&.Mui-selected': { color: 'var(--accent-primary)' } }} />
    <BottomNavigationAction label="Gallery" icon={<PhotoLibrary />}
        sx={{ color: 'var(--text-dim)', '&.Mui-selected': { color: 'var(--accent-primary)' } }} />
    <BottomNavigationAction label="Intel" icon={<Map />}
        sx={{ color: 'var(--text-dim)', '&.Mui-selected': { color: 'var(--accent-primary)' } }} />
</BottomNavigation>
        </Paper>
    );
};

export default MobileBottomNav;
