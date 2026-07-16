// imports/ui/DICOM/components/SimpleDicomViewport.jsx
// Simple DICOM viewport using Cornerstone3D RenderingEngine
// Loads DICOM images via image ID and uses Cornerstone's built-in decompression

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { parseDicomFromBase64, parseDicomFromArrayBuffer, extractDicomMetadata, cleanupBlobUrl } from '../utils/SimpleDicomLoader';
import { Toolbar } from './Toolbar';
import { useTools } from '../hooks/useTools';
import { initializeCornerstone3D } from '/imports/startup/client/cornerstone-setup';

// Monotonic suffix so every load gets its own rendering-engine id — engines are
// registered globally by id in Cornerstone3D, and destroy() of a prior run is
// deferred (see effect cleanup), so ids must never be shared across runs.
let engineCounter = 0;

/**
 * Simple DICOM Viewport Component
 * Uses Cornerstone3D RenderingEngine to display DICOM images
 * Supports single image or multi-image stack with scroll navigation
 */
export const SimpleDicomViewport = React.memo(function SimpleDicomViewport({ dicomData, dicomUrl, dicomUrls }) {
  const viewportRef = useRef(null);
  const renderingEngineRef = useRef(null);
  const [renderingEngine, setRenderingEngine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [activeTool, setActiveTool] = useState('Wwwc');
  const [currentImageIndex, setCurrentImageIndex] = useState(1);
  const [totalImages, setTotalImages] = useState(1);

  // Initialize tools — uses state (not ref) so useTools re-runs when engine is created
  const { setActiveTool: changeActiveTool, resetViewport, takeScreenshot } = useTools(
    'SIMPLE_DICOM_VIEWPORT',
    renderingEngine
  );

  // Handle tool change
  const handleToolChange = function(toolId) {
    setActiveTool(toolId);
    changeActiveTool(toolId);
  };

  // Handle reset
  const handleReset = function() {
    resetViewport();
  };

  // Handle screenshot
  const handleScreenshot = function() {
    takeScreenshot();
  };

  useEffect(function() {
    if (!dicomData && !dicomUrl && (!dicomUrls || dicomUrls.length === 0)) {
      return;
    }

    // Each effect run owns its engine and blob URLs. A re-run (e.g. a new file
    // appended to dicomUrls mid-session) must never destroy the engine the next
    // run is rendering into — see cleanup below.
    let cancelled = false;
    let runEngine = null;
    const runBlobUrls = [];

    async function loadAndRenderDicom() {
      setLoading(true);
      setError(null);

      try {
        const imageIds = [];
        let firstParsed = null;

        // /api/dicom/files/:fileId requires a Bearer token (DicomEndpoints.js);
        // blob: URLs ignore headers, so sending them unconditionally is safe
        const loginToken = localStorage.getItem('Meteor.loginToken');
        const fetchHeaders = {};
        if (loginToken) {
          fetchHeaders['Authorization'] = 'Bearer ' + loginToken;
        }

        // Handle multi-image stack (dicomUrls array)
        if (dicomUrls && dicomUrls.length > 0) {
          console.log('Loading multi-image stack:', dicomUrls.length, 'images');
          setTotalImages(dicomUrls.length);

          for (let i = 0; i < dicomUrls.length; i++) {
            const url = dicomUrls[i];
            console.log('Fetching image', i + 1, 'of', dicomUrls.length);
            const response = await fetch(url, { headers: fetchHeaders });
            if (!response.ok) {
              throw new Error('Failed to fetch DICOM file ' + (i + 1) + ': ' + response.status);
            }
            const arrayBuffer = await response.arrayBuffer();
            if (cancelled) return;
            const parsed = parseDicomFromArrayBuffer(arrayBuffer);
            imageIds.push(parsed.imageId);
            runBlobUrls.push(parsed.blobUrl);

            // Use first image's metadata for display
            if (i === 0) {
              firstParsed = parsed;
            }
          }
        } else if (dicomData) {
          // Legacy path: parse from base64 string
          console.log('Parsing DICOM from base64 data...');
          firstParsed = parseDicomFromBase64(dicomData);
          imageIds.push(firstParsed.imageId);
          runBlobUrls.push(firstParsed.blobUrl);
          setTotalImages(1);
        } else if (dicomUrl) {
          // Single image path: fetch URL and parse from ArrayBuffer
          console.log('Fetching DICOM from URL:', dicomUrl);
          const response = await fetch(dicomUrl, { headers: fetchHeaders });
          if (!response.ok) {
            throw new Error('Failed to fetch DICOM file: ' + response.status + ' ' + response.statusText);
          }
          const arrayBuffer = await response.arrayBuffer();
          if (cancelled) return;
          console.log('Fetched DICOM file:', arrayBuffer.byteLength, 'bytes');
          firstParsed = parseDicomFromArrayBuffer(arrayBuffer);
          imageIds.push(firstParsed.imageId);
          runBlobUrls.push(firstParsed.blobUrl);
          setTotalImages(1);
        }

        if (cancelled) return;

        console.log('DICOM parsed successfully, total images:', imageIds.length);
        const meta = extractDicomMetadata(firstParsed.dataSet);
        console.log('DICOM metadata:', meta);
        setMetadata(meta);

        // CRITICAL: Ensure Cornerstone is fully initialized (not just checking existence)
        // This awaits the initialization promise which registers image loaders
        console.log('Initializing Cornerstone3D...');
        const initResult = await initializeCornerstone3D();
        if (!initResult) {
          throw new Error('Cornerstone3D initialization failed or not enabled in settings');
        }
        if (cancelled) return;
        console.log('✅ Cornerstone3D initialized successfully');

        const cornerstone3D = window.cornerstone3D;

        // Ensure viewport element is ready
        if (!viewportRef.current) {
          throw new Error('Viewport element not ready');
        }

        // In v4.x, we use utilities.loadImageToCanvas directly for simple cases
        // Or we can use the RenderingEngine if available
        const viewportId = 'SIMPLE_DICOM_VIEWPORT';

        // Create a rendering engine owned by THIS effect run. The id must be
        // unique per run: a previous run's deferred destroy() is still pending,
        // and reusing its id (or the engine itself) hands this run an engine
        // that is about to be torn down — image flashes, then a black canvas.
        engineCounter += 1;
        const renderingEngineId = 'simpleDicomViewerEngine-' + engineCounter;
        let engine = null;

        if (cornerstone3D.RenderingEngine) {
          console.log('Creating new rendering engine:', renderingEngineId);
          engine = new cornerstone3D.RenderingEngine(renderingEngineId);
          runEngine = engine;
          renderingEngineRef.current = engine;
          // Trigger state update so useTools re-runs with the new engine
          setRenderingEngine(engine);
        }

        // If we have a rendering engine, use it
        let viewport;
        if (engine && engine.enableElement) {
          // Use RenderingEngine API
          const viewportInput = {
            viewportId,
            type: cornerstone3D.Enums.ViewportType.STACK,
            element: viewportRef.current,
            defaultOptions: {
              background: [0, 0, 0],
            },
          };

          engine.enableElement(viewportInput);
          console.log(`✅ Viewport ${viewportId} initialized`);

          viewport = engine.getViewport(viewportId);
        } else {
          // Fallback: use simpler API if RenderingEngine not available
          console.log('Using simpler Cornerstone API without RenderingEngine');

          // Enable the element for cornerstone
          cornerstone3D.enable(viewportRef.current);

          // Get or create viewport
          viewport = {
            element: viewportRef.current,
            setStack: async function(imageIds) {
              // Load and display the first image
              const image = await cornerstone3D.imageLoader.loadAndCacheImage(imageIds[0]);
              cornerstone3D.displayImage(viewportRef.current, image);
            },
            setProperties: function(props) {
              // Apply VOI
              if (props.voiRange && viewportRef.current) {
                cornerstone3D.setViewport(viewportRef.current, {
                  voi: {
                    windowWidth: props.voiRange.upper - props.voiRange.lower,
                    windowCenter: (props.voiRange.upper + props.voiRange.lower) / 2,
                  },
                });
              }
            },
            render: function() {
              // Render is automatic in v4
            },
          };
        }

        // Load the images using Cornerstone's image loader
        console.log('📥 Loading', imageIds.length, 'image(s) into stack');
        console.log('First image ID:', imageIds[0]);

        try {
          console.log('Calling viewport.setStack()...');

          // Add timeout to detect hanging (longer for multi-image)
          const timeoutMs = Math.max(30000, imageIds.length * 5000);
          const timeoutPromise = new Promise(function(_, reject) {
            setTimeout(function() {
              reject(new Error('Timeout: Image loading took longer than ' + (timeoutMs / 1000) + ' seconds'));
            }, timeoutMs);
          });

          await Promise.race([
            viewport.setStack(imageIds, 0),
            timeoutPromise
          ]);
          if (cancelled) return;

          console.log('✅ viewport.setStack() completed successfully');

          // CRITICAL: Explicitly render the viewport to display pixel data
          viewport.render();
          console.log('✅ viewport.render() called');

          // Set up event listener for stack scroll (image index changes)
          if (viewportRef.current && imageIds.length > 1) {
            const element = viewportRef.current;
            element.addEventListener('CORNERSTONE_STACK_NEW_IMAGE', function(event) {
              const detail = event.detail || {};
              const newIndex = (detail.imageIdIndex || 0) + 1; // 1-indexed for display
              setCurrentImageIndex(newIndex);
              console.log('Stack scrolled to image:', newIndex, '/', imageIds.length);
            });
          }
        } catch (stackError) {
          console.error('❌ Error in viewport.setStack():', stackError);
          throw stackError;
        }

        // Apply window/level if available
        if (meta.windowCenter && meta.windowWidth) {
          try {
            const windowCenter = parseFloat(meta.windowCenter);
            const windowWidth = parseFloat(meta.windowWidth);

            if (!isNaN(windowCenter) && !isNaN(windowWidth)) {
              viewport.setProperties({
                voiRange: {
                  lower: windowCenter - windowWidth / 2,
                  upper: windowCenter + windowWidth / 2,
                },
              });
            }
          } catch (e) {
            console.warn('Could not apply window/level:', e);
          }
        }

        // Render the viewport
        viewport.render();

        console.log('✅ DICOM image loaded and rendered successfully');

      } catch (err) {
        console.error('Error loading DICOM:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAndRenderDicom();

    // Cleanup: destroy only what THIS run created. Capture the engine now —
    // reading renderingEngineRef inside the timeout would pick up the NEXT
    // run's engine and destroy it mid-display (image flash → black canvas).
    return function() {
      cancelled = true;

      const engineToDestroy = runEngine;
      if (renderingEngineRef.current === engineToDestroy) {
        renderingEngineRef.current = null;
        setRenderingEngine(null);
      }

      // Small delay so any in-flight Cornerstone async ops settle first
      setTimeout(function() {
        runBlobUrls.forEach(function(url) {
          cleanupBlobUrl(url);
        });

        if (engineToDestroy) {
          try {
            engineToDestroy.destroy();
          } catch (e) {
            console.warn('Error destroying rendering engine:', e);
          }
        }
      }, 100);
    };
  }, [dicomData, dicomUrl, dicomUrls]);

  /**
   * Handle viewport resize
   */
  useEffect(function() {
    if (!viewportRef.current) return;

    const resizeObserver = new ResizeObserver(function() {
      const renderingEngine = renderingEngineRef.current;
      if (renderingEngine) {
        try {
          renderingEngine.resize(true);
        } catch (e) {
          // Viewport may not be ready yet
        }
      }
    });

    resizeObserver.observe(viewportRef.current);

    return function() {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      {metadata && !loading && !error && (
        <Toolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          onReset={handleReset}
          onScreenshot={handleScreenshot}
          currentImage={currentImageIndex}
          totalImages={totalImages}
        />
      )}

      {/* Viewport container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: '400px',
          backgroundColor: '#000',
        }}
      >
        {/* Viewport canvas container */}
        <div
          ref={viewportRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />

      {/* Loading indicator */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="white">
            Loading DICOM image...
          </Typography>
        </Box>
      )}

      {/* Error message */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'error.main',
            p: 3,
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" gutterBottom>
            ⚠️ Load Error
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Box>
      )}

      {/* Metadata overlay */}
      {metadata && !loading && !error && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            p: 1.5,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          <div><strong>Patient:</strong> {metadata.patientName}</div>
          <div><strong>Study:</strong> {metadata.studyDescription}</div>
          <div><strong>Modality:</strong> {metadata.modality}</div>
          <div><strong>Size:</strong> {metadata.columns} x {metadata.rows}</div>
          <div><strong>W/L:</strong> {metadata.windowWidth} / {metadata.windowCenter}</div>
        </Box>
      )}

      {/* Empty state */}
      {!dicomData && !dicomUrl && (!dicomUrls || dicomUrls.length === 0) && !loading && !error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="h5" gutterBottom>
            🏥
          </Typography>
          <Typography variant="body1">
            No DICOM file loaded
          </Typography>
          <Typography variant="caption">
            Upload a DICOM file to view
          </Typography>
        </Box>
      )}
      </Box>
    </Box>
  );
});

export default SimpleDicomViewport;
