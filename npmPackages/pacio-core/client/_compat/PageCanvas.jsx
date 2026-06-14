// npmPackages/pacio-core/client/_compat/PageCanvas.jsx
//
// Compatibility shim. The Atmosphere pacio-core imported PageCanvas from the
// host app (/imports/ui-fhir/layouts/PageCanvas), which has since been removed
// (packages/CLAUDE.md: "replace <PageCanvas> with <div>"). This wrapper
// preserves the <PageCanvas> usage by rendering a Box, mapping the legacy
// paddingLeft/paddingRight props to sx padding. Root page bgcolor is left to
// StyledMainRouter per the theming rules.

import React from 'react';
import { Box } from '@mui/material';

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

export default PageCanvas;
