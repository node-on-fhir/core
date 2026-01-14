// imports/ui/DICOM/components/SimpleDicomViewport.jsx
// Simple DICOM viewport using Cornerstone3D RenderingEngine
// Loads DICOM images via image ID and uses Cornerstone's built-in decompression

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { parseDicomFromBase64, extractDicomMetadata, cleanupBlobUrl } from '../utils/SimpleDicomLoader';
import { Toolbar } from './Toolbar';
import { useTools } from '../hooks/useTools';

/**
 * Simple DICOM Viewport Component
 * Uses Cornerstone3D RenderingEngine to display DICOM images
 */
export function SimpleDicomViewport({ dicomData }) {
  const viewportRef = useRef(null);
  const renderingEngineRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [activeTool, setActiveTool] = useState('Wwwc');

  // Initialize tools
  const { setActiveTool: changeActiveTool, resetViewport, takeScreenshot } = useTools(
    'SIMPLE_DICOM_VIEWPORT',
    renderingEngineRef.current
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
    if (!dicomData) {
      return;
    }

    async function loadAndRenderDicom() {
      setLoading(true);
      setError(null);

      try {
        console.log('Parsing DICOM from base64 data...');
        const parsed = parseDicomFromBase64(dicomData);

        console.log('DICOM parsed successfully');
        const meta = extractDicomMetadata(parsed.dataSet);
        console.log('DICOM metadata:', meta);
        setMetadata(meta);
        setBlobUrl(parsed.blobUrl);

        // Wait for Cornerstone3D to be initialized
        if (!window.cornerstone3D) {
          throw new Error('Cornerstone3D not initialized');
        }

        const cornerstone3D = window.cornerstone3D;

        // Ensure viewport element is ready
        if (!viewportRef.current) {
          throw new Error('Viewport element not ready');
        }

        // In v4.x, we use utilities.loadImageToCanvas directly for simple cases
        // Or we can use the RenderingEngine if available
        const viewportId = 'SIMPLE_DICOM_VIEWPORT';

        // Create rendering engine
        const renderingEngineId = 'simpleDicomViewerEngine';
        let renderingEngine = renderingEngineRef.current;

        if (!renderingEngine) {
          try {
            // Try to get existing engine
            renderingEngine = cornerstone3D.getRenderingEngine?.(renderingEngineId);
          } catch (e) {
            // Doesn't exist yet
          }

          if (!renderingEngine && cornerstone3D.RenderingEngine) {
            // Create new engine
            console.log('Creating new rendering engine');
            renderingEngine = new cornerstone3D.RenderingEngine(renderingEngineId);
            renderingEngineRef.current = renderingEngine;
          }
        }

        // If we have a rendering engine, use it
        let viewport;
        if (renderingEngine && renderingEngine.enableElement) {
          // Use RenderingEngine API
          const viewportInput = {
            viewportId,
            type: cornerstone3D.Enums.ViewportType.STACK,
            element: viewportRef.current,
            defaultOptions: {
              background: [0, 0, 0],
            },
          };

          renderingEngine.enableElement(viewportInput);
          console.log(`✅ Viewport ${viewportId} initialized`);

          viewport = renderingEngine.getViewport(viewportId);
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

        // Load the image using Cornerstone's image loader
        console.log(`📥 Loading image with ID: ${parsed.imageId}`);

        try {
          console.log('Calling viewport.setStack()...');

          // Add timeout to detect hanging
          const timeoutPromise = new Promise(function(_, reject) {
            setTimeout(function() {
              reject(new Error('Timeout: Image loading took longer than 10 seconds'));
            }, 10000);
          });

          await Promise.race([
            viewport.setStack([parsed.imageId], 0),
            timeoutPromise
          ]);

          console.log('✅ viewport.setStack() completed successfully');
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

    // Cleanup function
    return function() {
      if (blobUrl) {
        cleanupBlobUrl(blobUrl);
      }

      const renderingEngine = renderingEngineRef.current;
      if (renderingEngine) {
        try {
          renderingEngine.disableElement('SIMPLE_DICOM_VIEWPORT');
        } catch (e) {
          console.warn('Error disabling viewport:', e);
        }
      }
    };
  }, [dicomData]);

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
        />
      )}

      {/* Viewport container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '900px', // 50% larger than original 600px
          minHeight: '600px', // 50% larger than original 400px
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
      {!dicomData && !loading && !error && (
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
}

export default SimpleDicomViewport;
