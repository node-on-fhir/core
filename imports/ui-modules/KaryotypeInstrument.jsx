// imports/ui-modules/KaryotypeInstrument.jsx
//
// Inline Instrument card 6 — karyotype (MolecularSequence). The main repo
// must not import @orbital/genome-central (it lives in an extension), so the
// real Ideogram arrives as the IdeogramComponent prop (with ideogramProps
// passed through); without it the card falls back to the handoff's 23-bar
// chromosome strip (chr 1–22 in a quiet neutral, the sex chromosome in the
// accent). Kicker-right shows the karyotype string (e.g. `46,XX · reference`).

import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { InstrumentCard } from './InstrumentCard';

// Relative bar heights for the fallback strip: descending chromosome sizes
// 1–22, then the sex chromosome (accent).
const FALLBACK_HEIGHTS = [100, 96, 82, 78, 74, 70, 66, 60, 57, 55, 55, 54, 46, 43, 41, 37, 34, 32, 24, 26, 19, 21, 63];

export function KaryotypeInstrument(props) {
  const {
    kicker, karyotype, variantCount, IdeogramComponent, ideogramProps, meta, dense, sx
  } = props || {};

  const kickerRightText = karyotype
    ? karyotype + (variantCount > 0 ? '' : ' · reference')
    : null;
  const defaultMeta = meta !== undefined ? meta : (
    <span>
      {variantCount > 0
        ? variantCount + ' patient variant' + (variantCount === 1 ? '' : 's') + ' on file'
        : 'no patient variants on file'}
    </span>
  );

  return (
    <InstrumentCard
      kicker={kicker || 'MolecularSequence'}
      kickerRight={kickerRightText}
      meta={defaultMeta}
      dense={dense !== false}
      sx={sx}
    >
      {IdeogramComponent ? (
        <IdeogramComponent {...(ideogramProps || {})} />
      ) : (
        <Box
          role="img"
          aria-label={'Karyotype ' + (karyotype || 'ideogram') + ' (placeholder strip)'}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(' + FALLBACK_HEIGHTS.length + ', 1fr)',
            gap: '3px',
            alignItems: 'end',
            height: 40
          }}
        >
          {FALLBACK_HEIGHTS.map(function (height, index) {
            const isSexChromosome = index === FALLBACK_HEIGHTS.length - 1;
            return (
              <Box
                key={'chr:' + index}
                sx={theme => ({
                  height: height + '%',
                  borderRadius: '2px',
                  bgcolor: isSexChromosome
                    ? theme.palette.primary.main
                    : alpha(theme.palette.text.primary, 0.45)
                })}
              />
            );
          })}
        </Box>
      )}
    </InstrumentCard>
  );
}

export default KaryotypeInstrument;
