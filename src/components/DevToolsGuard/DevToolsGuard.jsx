import { useDevToolsDetect } from '../../hooks/useDevToolsDetect';
import './DevToolsGuard.css';

export default function DevToolsGuard({ children }) {
  const { isDevToolsOpen, resetDetection } = useDevToolsDetect();

  const handleReturnHome = () => {
    resetDetection();
    window.location.href = '/';
  };

  return (
    <>
      {isDevToolsOpen && (
        <div className="devtools-overlay" aria-live="assertive">
          <div className="devtools-overlay__backdrop" />
          <div className="devtools-overlay__content">
            <div className="devtools-overlay__icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <h1 className="devtools-overlay__title">Access Denied</h1>
            <p className="devtools-overlay__message">
              You don&apos;t have permission to use <span className="devtools-overlay__highlight">DevTools</span> on this website!
            </p>
            <p className="devtools-overlay__submessage">
              Please close the developer tools and try again.
            </p>
            <button
              className="devtools-overlay__button"
              onClick={handleReturnHome}
            >
              <span>Return Home</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
