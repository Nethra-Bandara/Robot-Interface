import { Box, Card, CardMedia, Typography, Fab } from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';
import React, { useRef } from 'react';

const ScreenshotGallery = ({ screenshots, onSelect, activeIndex }) => {
    const galleryRef = useRef(null);

    const scrollToTop = () => {
        galleryRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box className="screenshot-gallery" ref={galleryRef} sx={{
            height: '100%',
            overflowY: 'auto',
            p: 1,
            bgcolor: '#0f1310',
            borderRight: '1px solid #333'
        }}>
            <Typography variant="overline" sx={{ color: '#666', mb: 2, display: 'block', textAlign: 'center', letterSpacing: 2 }}>
                CAPTURES ({screenshots.length})
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {screenshots.map((shot, index) => (
                    <Card
                        key={index}
                        onClick={() => onSelect(shot, index)}
                        sx={{
                            cursor: 'pointer',
                            bgcolor: activeIndex === index ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            border: activeIndex === index ? '1px solid #ff9800' : '1px solid #333',
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                borderColor: '#ff9800'
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
                        <Box sx={{ p: 1 }}>
                            <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>
                                IMG_{1000 + index}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555', fontSize: '0.6rem' }}>
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
                            backgroundColor: 'rgba(255, 152, 0, 0.8)',
                            '&:hover': { backgroundColor: '#f57c00' },
                            display: screenshots.length > 3 ? 'flex' : 'none' // Only show if list is somewhat long
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
