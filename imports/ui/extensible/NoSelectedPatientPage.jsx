// imports/ui/extensible/NoSelectedPatientPage.jsx
//
// Default full-page fallback rendered by PatientGuard when a route declares
// `requirePatient: true` and no patient is selected
// (Session.get('selectedPatient') is falsy). Brand packages can replace this
// app-wide via components: { NoSelectedPatientPage: ... } on their workflow
// default export (see extensions/API.md).
//
// Formerly imports/ui/components/NoPatientSelectedPage.jsx — the old path
// re-exports this component as a deprecated alias.
//
// NOTE: placeholder content for now — the framing/copy will be designed after
// the routing scaffolding lands. It reuses the existing NoPatientSelectedCard
// (which already provides the "Lookup Patient" -> /patient-directory action).

import React from 'react';
import { Container, Box } from '@mui/material';
import NoPatientSelectedCard from '../components/NoPatientSelectedCard';

export function NoSelectedPatientPage() {
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

export default NoSelectedPatientPage;
