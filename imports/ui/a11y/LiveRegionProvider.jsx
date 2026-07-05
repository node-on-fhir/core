// imports/ui/a11y/LiveRegionProvider.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AnnounceContext = createContext(function () {});

// Visually-hidden but screen-reader-available (do not use display:none — SRs skip it).
const srOnly = {
  position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px',
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
};

export function LiveRegionProvider({ children }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const clearTimerPolite = useRef(null);
  const clearTimerAlert = useRef(null);

  const announce = useCallback(function (message, politeness) {
    if (!message) return;
    const isAssertive = politeness === 'assertive';
    const setter = isAssertive ? setAssertive : setPolite;
    const timerRef = isAssertive ? clearTimerAlert : clearTimerPolite;
    // Clear then set on next tick so identical consecutive messages re-announce.
    setter('');
    window.requestAnimationFrame(function () { setter(String(message)); });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(function () { setter(''); }, 4000);
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      {/* class names let the print stylesheet / e2e find these */}
      <div className="a11y-live-status" role="status" aria-live="polite" aria-atomic="true" style={srOnly}>
        {polite}
      </div>
      <div className="a11y-live-alert" role="alert" aria-live="assertive" aria-atomic="true" style={srOnly}>
        {assertive}
      </div>
    </AnnounceContext.Provider>
  );
}

export function useAnnounce() {
  return useContext(AnnounceContext);
}
