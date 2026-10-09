import { useEffect } from 'react';

/**
 * Hook to dynamically calculate and expose safe bottom insets
 * for mobile browsers (especially Chrome and Safari on iOS) where
 * the browser's dynamic bottom toolbar (back, forward, tabs, address bar)
 * can overlay position: fixed bottom navigation elements.
 */
export function useMobileViewport() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateInsets = () => {
      const ua = navigator.userAgent || '';
      const isIos = /iPhone|iPad|iPod/i.test(ua);
      const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS/i.test(ua);
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;

      let inset = 0;

      // 1. Check window.visualViewport if available
      if (window.visualViewport) {
        const vv = window.visualViewport;
        const diff = window.innerHeight - (vv.height + vv.offsetTop);
        if (diff > 12) {
          inset = Math.round(diff);
        }
      }

      // 2. Specific fix for Chrome / third-party browsers on iOS:
      // In iOS Chrome (CriOS), the bottom toolbar sits over the WebKit webview and
      // window.innerHeight doesn't always shrink, leaving bottom-fixed elements
      // occluded behind Chrome's bottom bar.
      if (isIos && isOtherIosBrowser && !isStandalone) {
        // Standard iOS Chrome bottom toolbar height is 48px-56px
        if (inset < 48) {
          inset = 52;
        }
      }

      document.documentElement.style.setProperty(
        '--browser-bottom-inset',
        `${inset}px`
      );
    };

    updateInsets();

    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateInsets);
      window.visualViewport.addEventListener('scroll', updateInsets);
    }

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateInsets);
        window.visualViewport.removeEventListener('scroll', updateInsets);
      }
    };
  }, []);
}
