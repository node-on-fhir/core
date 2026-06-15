// npmPackages/provider-directory/client/_compat/Carousel.jsx
//
// Compatibility shim for `react-multi-carousel` (not installed). Installing it
// caused a large, risky package-lock rewrite (re-keying ~40 unrelated entries),
// so the carousel — a presentation-only element on the stats/preferences pages —
// is replaced with a horizontal scroll row that renders the same children.
// Accepts and ignores the react-multi-carousel props (responsive, infinite, etc.).

import React from 'react';
import { Box } from '@mui/material';

export default function Carousel(props) {
  const { children } = props;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        overflowX: 'auto',
        py: 1,
        '& > *': { flex: '0 0 auto' }
      }}
    >
      {children}
    </Box>
  );
}
