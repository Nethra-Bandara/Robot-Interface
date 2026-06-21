import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Dialog, DialogTitle, DialogContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const TelemetryHistory = ({ open, onClose, theme }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            loadHistory();
        }
    }, [open]);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getTelemetryHistory(100);
            setHistory(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load telemetry history.');
        } finally {
            setLoading(false);
        }
    };

    const isDark = theme === 'dark';

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                style: {
                    backgroundColor: isDark ? '#1b1b1b' : '#fff',
                    color: isDark ? '#fff' : '#000',
                    border: isDark ? '1px solid rgba(0, 255, 136, 0.4)' : '1.5px solid #1a3324',
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div" sx={{ color: isDark ? '#00ff88' : '#2e7d32', fontWeight: 'bold' }}>
                    Telemetry History Log
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: isDark ? '#aaa' : '#555',
                        '&:hover': { color: isDark ? '#fff' : '#000' }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <CircularProgress sx={{ color: isDark ? '#00ff88' : '#2e7d32' }} />
                    </div>
                ) : error ? (
                    <Typography color="error" align="center">{error}</Typography>
                ) : history.length === 0 ? (
                    <Typography align="center" sx={{ color: isDark ? '#aaa' : '#666' }}>No historical data found.</Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                        <Table size="small" aria-label="telemetry history table">
                            <TableHead>
                                <TableRow sx={{ borderBottom: `2px solid ${isDark ? '#00ff88' : '#2e7d32'}` }}>
                                    <TableCell sx={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}>Timestamp</TableCell>
                                    <TableCell sx={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}>Temp</TableCell>
                                    <TableCell sx={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}>Humidity</TableCell>

                                    <TableCell sx={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}>Pressure</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((row) => (
                                    <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                                        <TableCell sx={{ color: isDark ? '#aaa' : '#333' }}>
                                            {new Date(row.timestamp + 'Z').toLocaleString()}
                                        </TableCell>
                                        <TableCell sx={{ color: isDark ? '#aaa' : '#333' }}>{row.temperature != null ? `${row.temperature}°C` : '-'}</TableCell>
                                        <TableCell sx={{ color: isDark ? '#aaa' : '#333' }}>{row.humidity != null ? `${row.humidity}%` : '-'}</TableCell>

                                        <TableCell sx={{ color: isDark ? '#aaa' : '#333' }}>{row.pressure != null ? `${row.pressure} hPa` : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TelemetryHistory;
