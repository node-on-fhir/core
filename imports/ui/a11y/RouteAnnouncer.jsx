// imports/ui/a11y/RouteAnnouncer.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { get } from 'lodash';

/**
 * Map a pathname to a human page title.
 * Uses the first non-empty path segment, title-cased; falls back to "Home".
 */
export function deriveTitle(pathname) {
  const seg = get((pathname || '/').split('/').filter(Boolean), '0', '');
  if (!seg) return 'Home';
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
}

/**
 * RouteAnnouncer — renders nothing visible.
 * On every route change it:
 *   (a) sets document.documentElement.lang = 'en'      (WCAG 3.1.1)
 *   (b) updates document.title to "<PageName> · Honeycomb FHIR"  (WCAG 2.4.2)
 *   (c) moves focus to #mainAppRouter                  (WCAG 2.4.3)
 *   (d) calls announce() if provided (wired in Task 2)
 *
 * Must be rendered inside a Router so useLocation() is valid.
 */
export function RouteAnnouncer({ announce }) {
  const location = useLocation();

  useEffect(function () {
    // WCAG 3.1.1 — programmatic lang attribute (Meteor does not allow setting it in main.html)
    document.documentElement.setAttribute('lang', 'en');

    // WCAG 2.4.2 — per-route page title
    const pageName = deriveTitle(location.pathname);
    document.title = pageName + ' · Honeycomb FHIR';

    // WCAG 2.4.3 — move focus to main content region on navigation
    const main = document.getElementById('mainAppRouter');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: false });
    }

    // Task 2 wiring — announce to screen reader (no-op until announce prop is provided)
    if (typeof announce === 'function') {
      announce('Navigated to ' + pageName);
    }
  }, [location.pathname, announce]);

  return null;
}
