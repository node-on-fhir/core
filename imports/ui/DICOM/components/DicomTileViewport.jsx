// imports/ui/DICOM/components/DicomTileViewport.jsx
// Minimal, chrome-free Cornerstone3D viewport for thumbnail/tile layouts
// (e.g. the chronicle Medical Imaging carousel). One image, no toolbar, no
// metadata overlay, no tools — just the rendered pixel data filling its box.
// For interactive viewing use SimpleDicomViewport / the /dicom/viewer page.

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { parseDicomFromArrayBuffer, cleanupBlobUrl } from '../utils/SimpleDicomLoader';
import { initializeCornerstone3D } from '/imports/startup/client/cornerstone-setup';

let tileCounter = 0;

/**
 * DicomTileViewport - renders a single DICOM image (by URL) into a tile.
 * Each tile owns its own RenderingEngine (unique id) so any number can
 * coexist on one page.
 */
export const DicomTileViewport = React.memo(function DicomTileViewport({ dicomUrl }) {
  const viewportRef = useRef(null);
  const renderingEngineRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(function() {
    if (!dicomUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let parsedBlobUrl = null;
    // Per-EFFECT-RUN ids and engine handle. The ids must not be reused across
    // re-runs of this effect: the previous run's deferred destroy() deletes its
    // engine id from Cornerstone's registry, and a same-id successor would be
    // deregistered with it — leaving the element's enabled-element lookup dead
    // (tools' global mouseup handler then crashes in getEnabledElement).
    let tileEngine = null;
    const engineId = 'dicomTileEngine-' + (++tileCounter);
    const viewportId = 'DICOM_TILE_VIEWPORT-' + tileCounter;

    async function loadAndRenderTile() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(dicomUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch DICOM file: ' + response.status);
        }
        const arrayBuffer = await response.arrayBuffer();
        const parsed = parseDicomFromArrayBuffer(arrayBuffer);
        parsedBlobUrl = parsed.blobUrl;

        const initResult = await initializeCornerstone3D();
        if (!initResult) {
          throw new Error('Cornerstone3D not enabled');
        }
        if (cancelled || !viewportRef.current) {
          return;
        }

        const cornerstone3D = window.cornerstone3D;
        tileEngine = new cornerstone3D.RenderingEngine(engineId);
        renderingEngineRef.current = tileEngine;

        tileEngine.enableElement({
          viewportId: viewportId,
          type: cornerstone3D.Enums.ViewportType.STACK,
          element: viewportRef.current,
          defaultOptions: {
            background: [0, 0, 0]
          }
        });

        const viewport = tileEngine.getViewport(viewportId);
        await viewport.setStack([parsed.imageId], 0);

        // Apply the file's own window/level so the thumbnail is legible
        const windowCenter = parseFloat(parsed.dataSet.string('x00281050'));
        const windowWidth = parseFloat(parsed.dataSet.string('x00281051'));
        if (!isNaN(windowCenter) && !isNaN(windowWidth)) {
          viewport.setProperties({
            voiRange: {
              lower: windowCenter - windowWidth / 2,
              upper: windowCenter + windowWidth / 2
            }
          });
        }

        viewport.render();
        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('[DicomTileViewport] Error rendering tile:', err.message);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadAndRenderTile();

    return function() {
      cancelled = true;
      // Destroy SYNCHRONOUSLY (unlike SimpleDicomViewport's deferred cleanup):
      // React runs this before the next effect body, so the old engine is fully
      // deregistered before a successor re-enables the same DOM element. A
      // deferred destroy would fire ELEMENT_DISABLED on the shared element
      // after the successor's enableElement and break its registration.
      // Destroy exactly the engine THIS run created — never the ref, which may
      // already point at a successor run's engine.
      if (tileEngine) {
        try {
          tileEngine.destroy();
        } catch (e) {
          console.warn('[DicomTileViewport] Error destroying rendering engine:', e);
        }
        if (renderingEngineRef.current === tileEngine) {
          renderingEngineRef.current = null;
        }
        tileEngine = null;
      }
      if (parsedBlobUrl) {
        cleanupBlobUrl(parsedBlobUrl);
      }
    };
  }, [dicomUrl]);

  // Keep the Cornerstone canvas in sync with tile resizes (density toggles)
  useEffect(function() {
    if (!viewportRef.current) return;
    const resizeObserver = new ResizeObserver(function() {
      const engine = renderingEngineRef.current;
      if (engine) {
        try {
          engine.resize(true);
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
    <Box sx={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }}>
      {/* pointerEvents none: keep cornerstone-tools' element mouse listeners from
          ever engaging on this display-only tile. Tools' double-click detection
          REPLAYS a click's mousedown/mouseup ~400ms later; when the click
          navigates away and this engine is destroyed in the meantime, the replay
          crashes in getEnabledElement. Tiles have no tools, so opt out entirely;
          clicks fall through to the host's wrapper (e.g. navigate-to-viewer). */}
      <div
        ref={viewportRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {loading && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <CircularProgress size={20} />
        </Box>
      )}
      {error && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'grey.700', pointerEvents: 'none' }}>
          <BrokenImageIcon fontSize="small" />
        </Box>
      )}
    </Box>
  );
});

export default DicomTileViewport;
