// npmPackages/pacio-core/client/_compat/StyledCard.jsx
//
// Compatibility shim. The Atmosphere pacio-core imported StyledCard from the
// host app (/imports/ui-fhir/components/StyledCard), which has since been
// removed (packages/CLAUDE.md: "replace <StyledCard> with <Card>"). This thin
// wrapper preserves the <StyledCard> usage in the migrated pages by rendering a
// theme-compliant MUI Card.

import React from 'react';
import { Card } from '@mui/material';

export function StyledCard(props) {
  const { children, sx, ...rest } = props;
  return (
    <Card sx={{ mb: 2, ...sx }} {...rest}>
      {children}
    </Card>
  );
}

export default StyledCard;
