import { Box, Card, CardMedia, Typography, Fab, IconButton, Tooltip } from '@mui/material';
import { KeyboardArrowUp, Remove, DeleteSweep } from '@mui/icons-material';
import React, { useRef } from 'react';

const ScreenshotGallery = ({ screenshots, onSelect, activeIndex, onDelete, onDeleteAll, theme, isPurging }) => {
    const galleryRef = useRef(null);

    const scrollToTop = () => {
        galleryRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box className="screenshot-gallery" ref={galleryRef} sx={{
            height: '100%',
            overflowY: 'auto',
            p: 1,
            bgcolor: 'var(--bg-page)',
            borderRight: '1px solid var(--panel-border)'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                <Typography variant="overline" sx={{ color: theme === 'dark' ? '#888' : '#444', letterSpacing: 2, fontWeight: 'bold' }}>
                    CAPTURES ({screenshots.length})
                </Typography>
                {screenshots.length > 0 && (
                    <Tooltip title="Delete All Captures">
                        <IconButton
                            size="small"
                            onClick={onDeleteAll}
                            disabled={isPurging || screenshots.length === 0}
                            sx={{ 
                                color: theme === 'dark' ? '#00ff88' : '#2e7d32',
                                transition: 'all 0.2s',
                                '&:hover': { 
                                    bgcolor: '#00ff88',
                                    color: '#000',
                                    borderRadius: '4px'
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            <DeleteSweep />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {screenshots.map((shot, index) => (
                    <Card
                        key={shot.id}
                        onClick={() => onSelect(shot, index)}
                        sx={{
                            cursor: 'pointer',
                            bgcolor: activeIndex === index 
                                ? (theme === 'dark' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(46, 125, 50, 0.1)') 
                                : 'rgba(255, 255, 255, 0.03)',
                            border: activeIndex === index 
                                ? `1px solid ${theme === 'dark' ? '#00ff88' : '#2e7d32'}` 
                                : '1px solid #333',
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                borderColor: theme === 'dark' ? '#00ff88' : '#2e7d32'
                            },
                            position: 'relative'
                        }}
                    >
                        <CardMedia
                            component="img"
                            height="100"
                            image={shot.url}
                            alt={`Capture ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                        />
                        <Tooltip title="Delete">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(shot.id);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 5,
                                    bgcolor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                                    color: theme === 'dark' ? '#fff' : '#d32f2f',
                                    padding: '4px',
                                    border: theme === 'dark' ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                    '&:hover': { bgcolor: '#d32f2f', color: '#fff' }
                                }}
                            >
                                <Remove fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Box sx={{ p: 1 }}>
                            <Typography variant="caption" sx={{ color: theme === 'dark' ? '#aaa' : '#2e3d34', display: 'block', fontWeight: '500' }}>
                                IMG_{1000 + index}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme === 'dark' ? '#555' : '#666', fontSize: '0.6rem' }}>
                                {shot.timestamp}
                            </Typography>
                        </Box>
                    </Card>
                ))}

                {screenshots.length === 0 && (
                    <Typography variant="body2" sx={{ color: '#333', textAlign: 'center', mt: 5 }}>
                        No captures yet.<br />
                        Use the camera to take a snapshot.
                    </Typography>
                )}
            </Box>

            {/* Scroll to Top Button */}
            <Box sx={{ position: 'sticky', bottom: '20px', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <Box sx={{ pointerEvents: 'auto' }}>
                    <Fab
                        size="small"
                        color="primary"
                        aria-label="scroll up"
                        onClick={scrollToTop}
                        sx={{
                            backgroundColor: theme === 'dark' ? 'rgba(0, 255, 136, 0.8)' : 'rgba(46, 125, 50, 0.8)',
                            color: theme === 'dark' ? '#000' : '#fff',
                            '&:hover': { 
                                backgroundColor: '#00ff88',
                                color: '#000',
                                boxShadow: '0 0 15px rgba(0, 255, 136, 0.5)'
                            },
                            display: screenshots.length > 3 ? 'flex' : 'none' 
                        }}
                    >
                        <KeyboardArrowUp />
                    </Fab>
                </Box>
            </Box>
        </Box>
    );
};

export default ScreenshotGallery;
