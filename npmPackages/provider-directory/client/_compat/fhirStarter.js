// npmPackages/provider-directory/client/_compat/fhirStarter.js
//
// Compatibility shim for the `fhir-starter` UI library (PageCanvas, StyledCard,
// DynamicSpacer), which is not available as an npm package in this app. DynamicSpacer
// has a real home in the app (imports/ui/DynamicSpacer); PageCanvas and StyledCard
// were deprecated host components (see packages/CLAUDE.md: PageCanvas -> div,
// StyledCard -> Card) and are reproduced here as thin theme-compliant wrappers.

import React from 'react';
import { Box, Card } from '@mui/material';

export { DynamicSpacer } from '/imports/ui/DynamicSpacer';

export function PageCanvas(props) {
  const { children, paddingLeft, paddingRight, id, sx, ...rest } = props;
  return (
    <Box
      id={id}
      sx={{
        minHeight: '100vh',
        pl: paddingLeft != null ? `${paddingLeft}px` : undefined,
        pr: paddingRight != null ? `${paddingRight}px` : undefined,
        ...sx
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}

export function StyledCard(props) {
  const { children, sx, ...rest } = props;
  return (
    <Card sx={{ mb: 2, ...sx }} {...rest}>
      {children}
    </Card>
  );
}
