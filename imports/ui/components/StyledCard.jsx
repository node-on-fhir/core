// imports/ui/components/StyledCard.jsx
//
// Surface-aware Card, Meteor-object-distributed (Meteor.StyledCard) like
// Meteor.useTheme — workflow packages consume it without import-path
// coupling: `const Card = Meteor.StyledCard || MuiCard;`. Resolves its
// surface from (in order) the `surface` prop, the ambiance zone
// composition, the global Session axis, then 'solid'. Transitions between
// states are animated (glass fades, flat melts into negative space). Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React from 'react';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { useAmbiance } from '../theme/AmbianceContext.js';
import { buildSurfaceStyles } from '../theme/surfaceStyles.js';
import { CARD_SURFACE } from '/imports/lib/SessionKeys.js';

// forwardRef so MUI transitions (Fade/Grow/Collapse around cards) can attach
// their ref to the underlying Card.
export const StyledCard = React.forwardRef(function StyledCard(props, ref) {
  const { surface, sx, children, ...rest } = props;
  const theme = useTheme();
  const composition = useAmbiance();
  const sessionSurface = useTracker(function() { return Session.get(CARD_SURFACE); }, []);

  const active = surface || get(composition, 'cardSurface') || sessionSurface || 'solid';
  const styles = buildSurfaceStyles({
    surface: active,
    paperColor: get(theme, 'palette.background.paper', '#ffffff'),
    dividerColor: get(theme, 'palette.divider', 'rgba(128,128,128,0.3)')
  });

  return (
    <Card ref={ref} {...rest} sx={Object.assign({}, styles.root, sx)}>
      {children}
    </Card>
  );
});

export default StyledCard;
