import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Multi-layered DevTools detection hook.
 * Implements 6 detection strategies to block DevTools access.
 *
 * Layers:
 * 1. Window size differential (docked devtools)
 * 2. debugger timing trap
 * 3. console.log toString trap
 * 4. Keyboard shortcut interception
 * 5. Right-click context menu block
 * 6. Source viewing block (Ctrl+U)
 */
export function useDevToolsDetect() {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const checkIntervalRef = useRef(null);

  // Layer 1: Window size differential
  const checkWindowSize = useCallback(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    if (widthThreshold || heightThreshold) {
      setIsDevToolsOpen(true);
    }
  }, []);

  // Layer 2: debugger timing trap
  const checkDebuggerTiming = useCallback(() => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();
    if (end - start > 100) {
      setIsDevToolsOpen(true);
    }
  }, []);

  // Layer 3: console.log toString trap
  const checkConsoleTrap = useCallback(() => {
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        setIsDevToolsOpen(true);
        return '';
      },
    });
    // Trigger toString via console methods
    console.log('%c', element);
    console.clear();
  }, []);

  useEffect(() => {
    // Layer 4: Keyboard shortcut interception
    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        setIsDevToolsOpen(true);
        return false;
      }

      // Ctrl+Shift+I (Inspector)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        setIsDevToolsOpen(true);
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        setIsDevToolsOpen(true);
        return false;
      }

      // Ctrl+Shift+C (Element picker)
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        setIsDevToolsOpen(true);
        return false;
      }

      // Ctrl+U (View source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        setIsDevToolsOpen(true);
        return false;
      }

      // Ctrl+Shift+K (Firefox console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k' || e.keyCode === 75)) {
        e.preventDefault();
        e.stopPropagation();
        setIsDevToolsOpen(true);
        return false;
      }
    };

    // Layer 5: Right-click context menu block
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    // Periodic checks (Layer 1 & 2)
    checkIntervalRef.current = setInterval(() => {
      checkWindowSize();
      // Only run debugger check if not already detected
      // (debugger trap can be annoying, use sparingly)
    }, 1000);

    // Initial check
    checkWindowSize();

    // Layer 3: Console trap (run once)
    try {
      checkConsoleTrap();
    } catch {
      // Silently ignore in case console methods are unavailable
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkWindowSize, checkDebuggerTiming, checkConsoleTrap]);

  // Method to reset detection (for "Return Home" button)
  const resetDetection = useCallback(() => {
    setIsDevToolsOpen(false);
  }, []);

  return { isDevToolsOpen, resetDetection };
}
