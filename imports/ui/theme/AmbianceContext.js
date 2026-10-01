// imports/ui/theme/AmbianceContext.js
//
// React context carrying the zone composition object (see
// ambianceComposition.js). Provided by AmbianceZone on enableAmbiance /
// enableFluidInterface routes; useAmbiance() returns null everywhere else,
// so shared components (StyledCard/StyledContainer) can fall back to
// Session/global reads outside a zone.

import React from 'react';

export const AmbianceContext = React.createContext(null);

export function useAmbiance() {
  return React.useContext(AmbianceContext);
}
