import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (mobile) {
        setScreenSize('mobile');
      } else if (tablet) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize
  };
};

export const useSplitLayout = () => {
  const { isMobile, isTablet } = useResponsive();
  
  const shouldStackLayout = isMobile || (isTablet && window.innerWidth < 900);
  
  return {
    shouldStackLayout,
    isMobile,
    isTablet,
    editorWidth: shouldStackLayout ? '100%' : '50%',
    previewWidth: shouldStackLayout ? '100%' : '50%',
  };
};