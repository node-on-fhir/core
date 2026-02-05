// imports/startup/client/cornerstone-setup.js
// Guarded initialization of Cornerstone3D for DICOM viewing
// Only loads when enabled via settings to allow tree-shaking

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

let isInitialized = false;
let initializationPromise = null;

// HMR cleanup - reset state on hot reload
if (import.meta.webpackHot) {
  import.meta.webpackHot.dispose(() => {
    console.log('[HMR] Disposing Cornerstone3D...');
    isInitialized = false;
    initializationPromise = null;
  });
}

/**
 * Initialize Cornerstone3D with settings-based guard
 * Returns null if DICOM is disabled, allowing tree-shaking
 */
export async function initializeCornerstone3D() {
  // Return existing initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Already initialized
  if (isInitialized) {
    console.log('✅ Cornerstone3D already initialized');
    return {
      cornerstone3D: window.cornerstone3D,
      cornerstone3DTools: window.cornerstone3DTools,
      dicomImageLoader: window.dicomImageLoader
    };
  }

  // Check if DICOM is enabled in settings
  const dicomEnabled = get(Meteor, 'settings.public.modules.DicomViewer.enabled', false);

  if (!dicomEnabled) {
    console.log('📦 DICOM viewer disabled via settings - Cornerstone3D will not be loaded');
    return null;
  }

  console.log('🎯 Initializing Cornerstone3D for DICOM viewing...');

  // Create initialization promise
  initializationPromise = (async function() {
    try {
      // Dynamic imports for tree-shaking
      const [
        cornerstone3D,
        cornerstone3DTools,
        cornerstoneDICOMImageLoader,
        dicomParser
      ] = await Promise.all([
        import('@cornerstonejs/core').then(m => m),
        import('@cornerstonejs/tools').then(m => m),
        import('@cornerstonejs/dicom-image-loader').then(m => m.default),
        import('dicom-parser').then(m => m.default)
      ]);

      console.log('[DICOM] Module imports successful:', {
        cornerstone3D: !!cornerstone3D,
        cornerstone3DTools: !!cornerstone3DTools,
        cornerstoneDICOMImageLoader: !!cornerstoneDICOMImageLoader,
        dicomParser: !!dicomParser
      });

      // Get settings
      const gpuEnabled = get(Meteor, 'settings.public.modules.DicomViewer.enableGPU', true);
      const workerCount = get(Meteor, 'settings.public.modules.DicomViewer.workerCount', 4);

      // Initialize Cornerstone3D Core
      await cornerstone3D.init({
        gpuTier: gpuEnabled ? undefined : 0,
        detectGPUDevice: gpuEnabled,
        strictZSpacingForVolumeViewport: false,
      });

      console.log(`📊 GPU Acceleration: ${gpuEnabled ? 'enabled' : 'disabled'}`);

      // Initialize Tools
      cornerstone3DTools.init();

      // Configure DICOM Image Loader (v1.78 API)
      console.log('⚙️  Configuring DICOM Image Loader...');

      // Set external dependencies
      cornerstoneDICOMImageLoader.external.cornerstone = cornerstone3D;
      cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;

      // Configure with web workers enabled
      cornerstoneDICOMImageLoader.configure({
        useWebWorkers: true,
        decodeConfig: {
          convertFloatPixelDataToInt: false,
          use16BitDataType: true,
        },
      });

      console.log('✅ DICOM Image Loader configured with Web Workers enabled');

      // Register image loaders with Cornerstone (v1.78 API)
      const { imageLoader } = cornerstone3D;

      imageLoader.registerImageLoader('wadouri', cornerstoneDICOMImageLoader.wadouri.loadImage);
      imageLoader.registerImageLoader('dicomweb', cornerstoneDICOMImageLoader.wadors.loadImage);
      imageLoader.registerImageLoader('dicomfile', cornerstoneDICOMImageLoader.wadouri.loadImage);

      console.log('✅ Registered DICOM image loaders');

      // Expose to window for package access
      window.cornerstone3D = cornerstone3D;
      window.cornerstone3DTools = cornerstone3DTools;

      isInitialized = true;
      console.log('✅ Cornerstone3D initialized successfully');

      return {
        cornerstone3D,
        cornerstone3DTools,
        cornerstoneDICOMImageLoader
      };

    } catch (error) {
      console.error('❌ Failed to initialize Cornerstone3D:', error);

      // Try CPU fallback if GPU failed
      if (error.message && (error.message.includes('GPU') || error.message.includes('WebGL'))) {
        console.log('🔄 Retrying without GPU acceleration...');
        try {
          const cornerstone3D = await import('@cornerstonejs/core');
          await cornerstone3D.init({ gpuTier: 0 });

          const cornerstone3DTools = await import('@cornerstonejs/tools');
          cornerstone3DTools.init();

          window.cornerstone3D = cornerstone3D;
          window.cornerstone3DTools = cornerstone3DTools;

          isInitialized = true;
          console.log('✅ Cornerstone3D initialized in CPU mode');

          return { cornerstone3D, cornerstone3DTools };
        } catch (fallbackError) {
          console.error('❌ CPU fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Check if Cornerstone3D is initialized
 */
export function isCornerstone3DInitialized() {
  return isInitialized;
}

/**
 * Get Cornerstone3D configuration info
 */
export function getCornerstone3DInfo() {
  if (!isInitialized) {
    return {
      initialized: false,
      enabled: get(Meteor, 'settings.public.modules.DicomViewer.enabled', false)
    };
  }

  return {
    initialized: true,
    enabled: true,
    gpuEnabled: get(Meteor, 'settings.public.modules.DicomViewer.enableGPU', true),
    workerCount: get(Meteor, 'settings.public.modules.DicomViewer.workerCount', 4),
    version: window.cornerstone3D?.VERSION || 'unknown',
  };
}
