import { useEffect, useState } from 'react';

const getIsMobile = (breakpoint: number) => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth <= breakpoint;
};

/**
 * Small utility hook to detect when the viewport is at or under the given breakpoint.
 * Components can rely on this to render their dedicated smartphone layouts.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => getIsMobile(breakpoint));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => setIsMobile(getIsMobile(breakpoint));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}
