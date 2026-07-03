// imports/ui/components/NoPatientSelectedPage.jsx
//
// Default full-page fallback rendered by the router when a route declares
// `requirePatient: true` and no patient is selected
// (Session.get('selectedPatient') is falsy). Packages can replace this
// app-wide by registering a `noPatientSelectedPage` on their workflow default
// export (see WorkflowRegistry.getNoPatientSelectedPage()).
//
// NOTE: placeholder content for now — the framing/copy will be designed after
// the routing scaffolding lands. It reuses the existing NoPatientSelectedCard
// (which already provides the "Lookup Patient" -> /patient-directory action).

import React from 'react';
import { Container, Box } from '@mui/material';
import NoPatientSelectedCard from './NoPatientSelectedCard';

export function NoPatientSelectedPage() {
  // Root container intentionally does NOT set a page-level bgcolor —
  // StyledMainRouter paints background.default for every page.
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        {/* Placeholder page framing — reuses the existing card action. */}
        <NoPatientSelectedCard />
      </Box>
    </Container>
  );
}

export default NoPatientSelectedPage;
