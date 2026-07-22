// imports/ui/extensible/LoadingPage.jsx
//
// Default loading / splash view for auth handshakes and subscription-wait
// states. Brand packages can replace this app-wide via
// components: { LoadingPage: ... } on their workflow default export
// (see extensions/API.md).
//
// Props: optional `message` (string) rendered under the spinner.

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingPage({ message }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        height: '100%',
        minHeight: '50vh'
      }}
    >
      <CircularProgress aria-label="Loading" role="status" />
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingPage;
