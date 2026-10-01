// imports/ui/components/StyledContainer.jsx
//
// Focus-aware content column, Meteor-object-distributed
// (Meteor.StyledContainer). Places its column into the ambiance image's
// neutral space (left | center | right — from the zone composition, or the
// `focus` prop), with the wide-viewport 200px easement at the xl
// breakpoint and an optional scrim backdrop. Pages using vanilla
// <Container> swap one import and inherit placement:
//   const Wrap = Meteor.StyledContainer || Container;
// Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React from 'react';
import Box from '@mui/material/Box';
import { useTheme, alpha } from '@mui/material/styles';
import { get } from 'lodash';

import { useAmbiance } from '../theme/AmbianceContext.js';

const WIDTHS = { xs: '444px', sm: '600px', md: '900px', lg: '1200px', xl: '1536px' };

// forwardRef so MUI transitions (Fade/Grow around page columns — e.g.
// AutoDashboard) can attach their ref to the underlying Box.
export const StyledContainer = React.forwardRef(function StyledContainer(props, ref) {
  const { focus, scrim, maxWidth, sx, children, ...rest } = props;
  const theme = useTheme();
  const composition = useAmbiance();

  const activeFocus = focus || get(composition, 'focus') || 'center';
  const align = activeFocus === 'left' ? { ml: 0, mr: 'auto' }
    : activeFocus === 'right' ? { ml: 'auto', mr: 0 }
    : { mx: 'auto' };

  const scrimStrength = get(composition, 'scrimStrength', 0.55);
  const showScrim = !!scrim && !!get(composition, 'background');

  return (
    <Box ref={ref} {...rest} sx={Object.assign({
      width: '100%',
      // maxWidth={false} means full-bleed (MUI Container contract).
      maxWidth: maxWidth === false ? 'none' : (WIDTHS[maxWidth || 'lg'] || WIDTHS.lg),
      px: { xs: 2, md: 3, xl: '200px' },
      boxSizing: 'content-box'
    }, align, showScrim ? {
      background: alpha(theme.palette.background.default, scrimStrength),
      backdropFilter: 'blur(2px)',
      borderRadius: '4px'
    } : {}, sx)}>
      {children}
    </Box>
  );
});

export default StyledContainer;
