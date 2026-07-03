// imports/startup/client/hotkeys.js

import { Session } from 'meteor/session';

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

    // Cmd/Ctrl + Shift + A — Toggle Admin Links sidebar section
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'A' || event.key === 'a')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleAdminLinks'));
    }

    // Cmd/Ctrl + Shift + L — Toggle flat card mode (Life Support dashboard)
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'L' || event.key === 'l')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggleFlatCards'));
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

    // Escape — Close dialogs
    if (event.key === 'Escape') {
      Session.set('mainAppDialogOpen', false);
      Session.set('quickSearchOpen', false);
    }
  });
}
