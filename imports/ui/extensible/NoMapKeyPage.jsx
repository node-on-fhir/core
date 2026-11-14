// imports/ui/extensible/NoMapKeyPage.jsx
//
// Overridable fallback rendered by MapGuard (variant="page") when no Google
// Maps key resolves. Default content is the guided BYOK onramp.

import React from 'react';
import { Box } from '@mui/material';
import GoogleMapsOnramp from '../components/GoogleMapsOnramp.jsx';

export function NoMapKeyPage({ onKeySaved }) {
  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <GoogleMapsOnramp onKeySaved={onKeySaved} />
    </Box>
  );
}

export default NoMapKeyPage;
