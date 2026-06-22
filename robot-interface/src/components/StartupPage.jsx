import { Box, Typography, Button, Fade } from '@mui/material';
import logo from '../assets/logo-luminous.jpeg';

export default function StartupPage({ onGetStarted }) {
  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 3,
          background: 'radial-gradient(circle at 50% 30%, #14271f 0%, #0a0f0d 70%)',
          color: '#e8f5e9',
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 56,
            height: 56,
            objectFit: 'contain',
            marginBottom: 16,
          }}
        />

        <Typography
          variant="overline"
          sx={{ letterSpacing: 2, color: '#81c784', mb: 1 }}
        >
          Final Year Project - Group 05
        </Typography>

        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 1, maxWidth: 600 }}
        >
          Wildlife Exploration Robot Dashboard
        </Typography>

        <Typography variant="body2" sx={{ color: '#a5d6a7', mb: 4 }}>
          Multi-terrain robotic system for ecological field exploration
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={onGetStarted}
          sx={{
            bgcolor: '#4caf50',
            px: 4,
            py: 1.2,
            borderRadius: 3,
            fontWeight: 600,
            '&:hover': { bgcolor: '#43a047' },
          }}
        >
          Get Started
        </Button>
      </Box>
    </Fade>
  );
}