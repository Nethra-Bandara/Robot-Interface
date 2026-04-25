import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogContentText, 
    DialogActions, 
    Button, 
    Box 
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

const ConfirmDialog = ({ open, onClose, onConfirm, title, message, theme }) => {
    const isDark = theme === 'dark';

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{
                sx: {
                    bgcolor: isDark ? '#0d1510' : '#fff',
                    color: isDark ? '#fff' : '#000',
                    border: `1px solid ${isDark ? 'rgba(0, 255, 136, 0.2)' : '#1a3324'}`,
                    borderRadius: '12px',
                    backgroundImage: 'none'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmber sx={{ color: '#00ff88' }} />
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button 
                    onClick={onClose} 
                    sx={{ color: isDark ? '#aaa' : '#666' }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }} 
                    variant="contained"
                    autoFocus
                    sx={{ 
                        bgcolor: '#00ff88', 
                        color: '#000',
                        fontWeight: 'bold',
                        '&:hover': {
                            bgcolor: '#00e676'
                        }
                    }}
                >
                    Confirm Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
