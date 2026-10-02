// imports/ui-modules/InstrumentCard.jsx
//
// Shared card frame for the Inline Instruments family
// (workzone/design_handoff_inline_instruments): kicker row (left: uppercase
// `ResourceType · date` in the accent color; right: source/provenance or tabs),
// optional title, body children, and a meta footer row with an optional
// trailing accent action. Also exports InstrumentGrid — the 2-column layout
// with the staggered "rise" entrance animation (disabled under
// prefers-reduced-motion) — and the shared monospace font stack.
//
// Pure presentational: no Meteor, no Session. Colors come from MUI theme
// tokens so the cards render correctly under any preset (the design's
// "Nocturne" ground is available as an app theme preset) and in light mode.

import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const INSTRUMENT_MONO_FONT = 'ui-monospace, "SF Mono", Menlo, monospace';

export function InstrumentCard(props) {
  const { kicker, kickerRight, title, titleAdornment, children, meta, action, span, dense, sx } = props || {};

  return (
    <Box
      sx={[{
        bgcolor: 'background.paper',
        borderRadius: '8px',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: dense ? 1 : 1.25,
        gridColumn: span ? '1 / -1' : undefined
      }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {(kicker || kickerRight) && (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
          {kicker && (
            <Typography component="div" sx={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              color: 'primary.main'
            }}>
              {kicker}
            </Typography>
          )}
          {kickerRight && (
            <Box sx={{ marginLeft: 'auto', fontSize: 11, color: 'text.secondary', display: 'flex', gap: 0.25 }}>
              {kickerRight}
            </Box>
          )}
        </Box>
      )}
      {title && (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
          <Typography component="div" sx={{ fontSize: 17, fontWeight: 500, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {titleAdornment}
        </Box>
      )}
      {children}
      {(meta || action) && (
        <Box sx={theme => ({
          display: 'flex',
          alignItems: 'baseline',
          gap: 0.75,
          fontSize: 11,
          color: alpha(theme.palette.text.primary, 0.5)
        })}>
          {meta}
          {action && (
            <Box
              component="span"
              role="button"
              tabIndex={0}
              onClick={action.onClick}
              onKeyDown={function (event) {
                if (action.onClick && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  action.onClick(event);
                }
              }}
              sx={{
                marginLeft: 'auto',
                color: 'primary.light',
                cursor: action.onClick ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                '&:focus-visible': { outline: '1px solid', outlineColor: 'primary.main', outlineOffset: '2px', borderRadius: '2px' }
              }}
            >
              {action.label}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// Uppercase micro column header used inside the data-grid instruments.
export function InstrumentColumnHeader({ align, children }) {
  return (
    <Typography component="span" sx={{
      fontSize: 10,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'text.secondary',
      textAlign: align
    }}>
      {children}
    </Typography>
  );
}

// 2-column instrument layout with the staggered entrance animation from the
// handoff. Children fade/slide up 8px over 500ms, staggered 60ms; the
// animation is removed entirely under prefers-reduced-motion.
export function InstrumentGrid({ children, sx }) {
  const staggered = {};
  for (let i = 1; i <= 12; i++) {
    staggered['& > *:nth-of-type(' + i + ')'] = { animationDelay: (0.02 + (i - 1) * 0.06) + 's' };
  }

  return (
    <Box sx={[{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      gap: 1.75,
      '@keyframes hcInstrumentRise': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'none' }
      },
      '& > *': { animation: 'hcInstrumentRise .5s cubic-bezier(.2,.7,.2,1) both' },
      ...staggered,
      '@media (prefers-reduced-motion: reduce)': {
        '& > *': { animation: 'none' }
      }
    }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {children}
    </Box>
  );
}

export default InstrumentCard;
