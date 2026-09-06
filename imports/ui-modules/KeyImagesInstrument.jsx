// imports/ui-modules/KeyImagesInstrument.jsx
//
// Inline Instrument card 5 — imaging key-image tiles. A grid of square tiles
// (one per shown DICOM instance, series label bottom-left, mono 9px) with a
// "+N" overflow tile. Tile rendering escalates:
//   1. a consumer-supplied renderTile(tile) prop (full control), else
//   2. Meteor.Cornerstone3D.DicomTileViewport when the global is attached AND
//      the tile carries an imageUrl (consumers own the GridFS blob-URL fetch
//      pipeline — see extensions/chronicle MedicalImagingPanel.jsx), else
//   3. a neutral placeholder tile.
// The Cornerstone global is checked at RENDER time, never at module scope.
// onOpenImage(tile) fires on tile click — no navigation happens in here.
//
// Pass `imagingStudy` (mapped via imagingStudyToTiles) or pre-built `tiles`
// (+ overflowCount).

import React, { useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import get from 'lodash/get.js';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { InstrumentCard, INSTRUMENT_MONO_FONT } from './InstrumentCard';
import { imagingStudyToTiles } from './instrumentHelpers';

function TileFrame({ children, onClick, label, sx }) {
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={function (event) {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick(event);
        }
      }}
      aria-label={label}
      sx={[theme => ({
        aspectRatio: '1',
        borderRadius: '6px',
        boxShadow: 'inset 0 0 0 1px ' + theme.palette.divider,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        p: '6px',
        cursor: onClick ? 'pointer' : 'default'
      }), ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {children}
    </Box>
  );
}

export function KeyImagesInstrument(props) {
  const {
    kicker, kickerRight, title, imagingStudy, tiles, overflowCount,
    renderTile, onOpenImage, meta, maxTiles, sx
  } = props || {};

  const tileData = useMemo(function () {
    if (tiles) {
      return { tiles: tiles, overflowCount: overflowCount || 0, seriesCount: null };
    }
    return imagingStudyToTiles(imagingStudy, { max: maxTiles || 3 });
  }, [tiles, overflowCount, imagingStudy, maxTiles]);

  const DicomTileViewport = get(Meteor, 'Cornerstone3D.DicomTileViewport');
  const studyDate = get(imagingStudy, 'started');
  const defaultKicker = kicker
    || ('ImagingStudy' + (studyDate ? ' · ' + String(studyDate).slice(0, 10) : ''));
  const defaultKickerRight = kickerRight
    || (tileData.seriesCount ? ('DICOM · ' + tileData.seriesCount + ' series') : null);

  return (
    <InstrumentCard
      kicker={defaultKicker}
      kickerRight={defaultKickerRight}
      title={title || 'Key images'}
      meta={meta}
      sx={sx}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {tileData.tiles.map(function (tile, index) {
          const handleOpen = onOpenImage ? function () { onOpenImage(tile); } : undefined;
          const seriesLabel = tile.seriesLabel && (
            <Box component="span" sx={{
              fontSize: 9,
              fontFamily: INSTRUMENT_MONO_FONT,
              color: 'text.secondary',
              position: 'relative',
              zIndex: 1
            }}>
              {tile.seriesLabel}
            </Box>
          );

          if (renderTile) {
            return (
              <React.Fragment key={'tile:' + index}>{renderTile(tile, { onOpen: handleOpen })}</React.Fragment>
            );
          }

          return (
            <TileFrame
              key={'tile:' + index}
              onClick={handleOpen}
              label={'Open image' + (tile.seriesLabel ? ' ' + tile.seriesLabel : '')}
              sx={theme => ({
                background: (DicomTileViewport && tile.imageUrl)
                  ? 'transparent'
                  : 'radial-gradient(circle at 50% 45%, ' + alpha(theme.palette.text.primary, 0.3) + ', ' + alpha(theme.palette.text.primary, 0.06) + ' 70%)'
              })}
            >
              {DicomTileViewport && tile.imageUrl && (
                <Box sx={{ position: 'absolute', inset: 0 }}>
                  <DicomTileViewport imageUrl={tile.imageUrl} />
                </Box>
              )}
              {seriesLabel}
            </TileFrame>
          );
        })}
        {tileData.overflowCount > 0 && (
          <TileFrame label={tileData.overflowCount + ' more images'} sx={theme => ({
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            alignItems: 'center',
            justifyContent: 'center'
          })}>
            <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
              +{tileData.overflowCount}
            </Box>
          </TileFrame>
        )}
      </Box>
    </InstrumentCard>
  );
}

export default KeyImagesInstrument;
