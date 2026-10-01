// imports/startup/client/hotkeys.js

import { Session } from 'meteor/session';
import { SESSION_INSPECTOR_OPEN, THEME_DIALOG_OPEN, ABOUT_DIALOG_OPEN, AMBIANCE_HUD_OPEN } from '/imports/lib/SessionKeys.js';

export function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {

    // Cmd/Ctrl + K — Quick search
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key === 'k') {
      event.preventDefault();
      Session.set('quickSearchOpen', true);
    }

    // Cmd/Ctrl + Shift + S — Toggle sidebar drawer (same as MenuIcon click)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'S' || event.key === 's')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleDrawer'));
    }

    // Cmd/Ctrl + Shift + N — Toggle header/footer visibility
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'N' || event.key === 'n')) {
      event.preventDefault();
      const currentState = Session.get('displayNavbars');
      Session.set('displayNavbars', !currentState);
    }

    // Cmd/Ctrl + Shift + F — Toggle FHIR Modules sidebar visibility
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'F' || event.key === 'f')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleFhirModules'));
    }

    // Cmd/Ctrl + Shift + I — Toggle Index Page sidebar visibility
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'I' || event.key === 'i')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleIndexPage'));
    }

    // Cmd/Ctrl + Shift + C — Toggle Construction Zone sidebar visibility
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'C' || event.key === 'c')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleConstructionZone'));
    }

    // Cmd/Ctrl + Shift + W — Toggle package-based SidebarWorkflow items
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'W' || event.key === 'w')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('togglePackageWorkflows'));
    }

    // Cmd/Ctrl + Shift + G — Toggle Server Configuration sidebar link
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'G' || event.key === 'g')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleServerConfiguration'));
    }

    // Cmd/Ctrl + Shift + A — Toggle About dialog (version + update status)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'A' || event.key === 'a')) {
      event.preventDefault();
      Session.set(ABOUT_DIALOG_OPEN, !Session.get(ABOUT_DIALOG_OPEN));
    }

    // Cmd/Ctrl + Shift + U — Toggle Admin Links sidebar section
    // (was Shift+A; moved 2026-07-31 when the About dialog claimed that combo)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'U' || event.key === 'u')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleAdminLinks'));
    }

    // Cmd/Ctrl + Shift + L — Cycle card surface (solid → glass → flat)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'L' || event.key === 'l')) {
      event.preventDefault();
      import('/imports/ui/themePresets.js').then(function(tp) { tp.cycleCardSurface(); });
    }

    // Cmd/Ctrl + Shift + K — Toggle this route between card and full-height (flat) layout
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'K' || event.key === 'k')) {
      event.preventDefault();
      import('/imports/ui/themePresets.js').then(function(tp) { tp.togglePageSurfaceOverride(window.location.pathname); });
    }

    // Cmd/Ctrl + Shift + B — Toggle lunar background image
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'B' || event.key === 'b')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleLunarBackground'));
    }

    // Cmd/Ctrl + Shift + H — Toggle Home Page sidebar visibility
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'H' || event.key === 'h')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleHomePage'));
    }

    // Cmd/Ctrl + Shift + D — Toggle Session Inspector (internal-state dashboard)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'D' || event.key === 'd')) {
      event.preventDefault();
      Session.set(SESSION_INSPECTOR_OPEN, !Session.get(SESSION_INSPECTOR_OPEN));
    }

    // Cmd/Ctrl + Shift + T — Toggle Theme palette dialog
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'T' || event.key === 't')) {
      event.preventDefault();
      Session.set(THEME_DIALOG_OPEN, !Session.get(THEME_DIALOG_OPEN));
    }

    // Cmd/Ctrl + Shift + E — Toggle Ambiance Tuning HUD (curation dev tool)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'E' || event.key === 'e')) {
      event.preventDefault();
      Session.set(AMBIANCE_HUD_OPEN, !Session.get(AMBIANCE_HUD_OPEN));
    }

    // Escape — Close dialogs
    if (event.key === 'Escape') {
      Session.set(SESSION_INSPECTOR_OPEN, false);
      Session.set(THEME_DIALOG_OPEN, false);
      Session.set(AMBIANCE_HUD_OPEN, false);
      Session.set('quickSearchOpen', false);
    }
  });
}
