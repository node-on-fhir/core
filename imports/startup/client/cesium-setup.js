// imports/startup/client/cesium-setup.js
// Guarded initialization of CesiumJS for 3D globe / lunar map viewing
// Static imports ensure no lazy-compilation-web.js EventSource conflicts

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Static import - avoids rspack lazy compilation runtime (lazy-compilation-web.js)
// which opens an EventSource that conflicts with Meteor's dev server
import * as Cesium from 'cesium';

let isInitialized = false;
let initializationPromise = null;

// HMR cleanup - reset state on hot reload
if (import.meta.hot) {
  import.meta.hot.dispose(function() {
    console.log('[HMR] Disposing CesiumJS...');
    isInitialized = false;
    initializationPromise = null;
    // Remove injected CSS link
    const link = document.getElementById('cesium-widgets-css');
    if (link) {
      link.remove();
    }
  });
}

/**
 * Initialize CesiumJS with settings-based guard
 * Returns null if cesium is disabled
 */
export async function initializeCesium() {
  // Return existing initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Already initialized
  if (isInitialized) {
    console.log('CesiumJS already initialized');
    return { Cesium: window.Cesium };
  }

  // Check if CesiumJS is enabled in settings
  const cesiumEnabled = get(Meteor, 'settings.public.modules.cesium.enabled', false);

  if (!cesiumEnabled) {
    console.log('CesiumJS disabled via settings - will not be loaded');
    return null;
  }

  console.log('Initializing CesiumJS...');

  initializationPromise = (async function() {
    try {
      // Set base URL for Workers/Assets/Widgets
      window.CESIUM_BASE_URL = '/cesium/';

      // Inject Cesium Widgets CSS
      if (!document.getElementById('cesium-widgets-css')) {
        const link = document.createElement('link');
        link.id = 'cesium-widgets-css';
        link.rel = 'stylesheet';
        link.href = '/cesium/Widgets/widgets.css';
        document.head.appendChild(link);
      }

      // Configure Cesium Ion access token (optional, not needed for LROC WMS)
      const ionAccessToken = get(Meteor, 'settings.public.cesium.ionAccessToken', '');
      if (ionAccessToken) {
        Cesium.Ion.defaultAccessToken = ionAccessToken;
      }

      // Expose to window for package access
      window.Cesium = Cesium;

      isInitialized = true;
      console.log('CesiumJS initialized successfully');

      return { Cesium };

    } catch (error) {
      console.error('Failed to initialize CesiumJS:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Check if CesiumJS is initialized
 */
export function isCesiumInitialized() {
  return isInitialized;
}
