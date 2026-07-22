// imports/ui/extensible/ErrorPage.jsx
//
// Default crash screen rendered by the per-route ErrorBoundary when a page
// throws during render. Brand packages can replace this app-wide via
// components: { ErrorPage: ... } on their workflow default export
// (see extensions/API.md).
//
// Props: optional `routePath` (string) naming the route that failed.
// Extracted from the inline Alert fallback formerly in App.jsx
// StyledMainRouter.

import React from 'react';
import { Container, Alert, AlertTitle } from '@mui/material';

export function ErrorPage({ routePath }) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Alert severity="error">
        <AlertTitle>This page failed to load</AlertTitle>
        An error occurred rendering <code>{routePath || 'this route'}</code>.
        Try navigating elsewhere and back, or reload the app.
      </Alert>
    </Container>
  );
}

export default ErrorPage;
