// src/hooks/useBreakpoint.js
import { useMediaQuery } from '@mui/material';

export const useBreakpoint = () => {
    const isMobile  = useMediaQuery('(max-width: 600px)');
    const isTablet  = useMediaQuery('(min-width: 601px) and (max-width: 1024px)');
    const isLaptop  = useMediaQuery('(min-width: 1025px) and (max-width: 1440px)');
    const isDesktop = useMediaQuery('(min-width: 1441px)');

    return { isMobile, isTablet, isLaptop, isDesktop };
};