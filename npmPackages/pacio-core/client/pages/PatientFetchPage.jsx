// /packages/pacio-core/client/pages/PatientFetchPage.jsx

// Summary of the data flow:

//   1. Initial fetch from external server: When you click "Fetch Patient Data" on /patient-fetch, it calls Meteor.call('pacio.fetchPatientEverything', ...) which runs on the server.
//   2. Server-side processing: The server method:
//     - Fetches data from the external FHIR server page by page
//     - Directly inserts/updates resources into MongoDB collections on the server (lines 36-82 in fetchPatientEverything.js)
//     - Returns the complete bundle back to the client
//   3. Client-side processing: After server returns, the client:
//     - Receives the bundle and calls Meteor.MedicalRecordImporter.importBundle()
//     - This importer checks if there's an active subscription for each resource type (line 174-181)
//     - If subscription exists: Calls Meteor.call('proxyInsert', ...) to insert via server method
//     - If no subscription: Directly inserts into the client-side minimongo collection using window[collectionName]._collection.insert() (lines 204-211)

//   So to answer your questions:
//   - Yes, data is saved on the server during the initial fetch
//   - It depends on whether there's a pub/sub:
//     - With active subscriptions: Data flows via pub/sub from server to client
//     - Without subscriptions: Data is also inserted directly into client-side cursors

//   This dual approach ensures data is available on the client regardless of subscription status, though the pub/sub approach is preferred when available.

import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography
} from '@mui/material';
import { Meteor } from 'meteor/meteor';

import { FhirFetchPanel } from '../components/FhirFetchPanel';
import { RemotePatientBrowser } from '../components/RemotePatientBrowser';

export function PatientFetchPage(props) {
  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  // ?view=select (default) browses the remote server's patients;
  // ?view=identifier is the manual URL + patient-id $everything form.
  const useLocation = Meteor.useLocation;
  const location = useLocation ? useLocation() : { search: '' };
  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : function() {};
  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get('view') || 'select';
  // ?url-editable=true exposes the FHIR Server URL input on the select view;
  // by default the configured interface is shown in a read-only Info Alert.
  const urlEditable = searchParams.get('url-editable') === 'true';

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: cardTextColor }}>
              Patient Fetch
            </Typography>
            <Typography variant="body1" paragraph sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }}>
              {view === 'identifier'
                ? 'Fetch all patient data using the FHIR $everything operation'
                : 'Browse a remote FHIR server and select a patient to import'}
            </Typography>
          </Box>
          <Button
            id="patientFetchViewToggle"
            variant="text"
            onClick={function() {
              navigate('/patient-fetch?view=' + (view === 'identifier' ? 'select' : 'identifier'), { replace: true });
            }}
          >
            {view === 'identifier' ? 'Browse patients' : 'Enter patient ID manually'}
          </Button>
        </Box>

        {view === 'identifier' ? <FhirFetchPanel /> : <RemotePatientBrowser urlEditable={urlEditable} />}
      </Container>
    </Box>
  );
}
