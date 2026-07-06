// /packages/pacio-core/client/pages/MedicationListsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Box,
  Tabs,
  Tab,
  Chip,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Paper,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

import HomeIcon from '@mui/icons-material/Home';
import MedicationIcon from '@mui/icons-material/Medication';
import PrintIcon from '@mui/icons-material/Print';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import PageInstructions from '../components/PageInstructions.jsx';
import ColumnAdornment from '../components/ColumnAdornment.jsx';

// Access collections via Meteor global object (packages can't import from /imports/)
let MedicationRequests;
let MedicationAdministrations;
let AllergyIntolerances;

if (Meteor.isClient) {
  MedicationRequests = window.MedicationRequests || get(Meteor, 'Collections.MedicationRequests');
  MedicationAdministrations = window.MedicationAdministrations || get(Meteor, 'Collections.MedicationAdministrations');
  AllergyIntolerances = window.AllergyIntolerances || get(Meteor, 'Collections.AllergyIntolerances');
}

// Access tables via Meteor.Tables
const MedicationRequestsTable = Meteor.Tables?.MedicationRequestsTable;
const MedicationAdministrationsTable = Meteor.Tables?.MedicationAdministrationsTable;
const AllergyIntolerancesTable = Meteor.Tables?.AllergyIntolerancesTable;


function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`medication-tabpanel-${index}`}
      aria-labelledby={`medication-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Compact in-card empty state for a medication tab: one sentence + CTAs.
// Kept inline (not NoDataWrapper) because tab panels shouldn't be 50vh tall.
function EmptyTabState(props) {
  return (
    <Box sx={{ textAlign: 'center', py: 5 }}>
      <MedicationIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        {props.message}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<CloudDownloadIcon />}
          onClick={props.onFetchRecords}
        >
          Fetch Records
        </Button>
        {props.showReconcile && (
          <Button
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            onClick={props.onReconcile}
          >
            Start Reconciliation
          </Button>
        )}
      </Box>
    </Box>
  );
}

function MedicationListsPage(props) {
  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors for cards
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  const [tabIndex, setTabIndex] = useState(0);
  const [reconciliationMode, setReconciliationMode] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(Session.get('selectedPatientId'));

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const data = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    
    let query = {};
    if(patientId){
      query = { 
        'subject.reference': { 
          $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`] 
        } 
      };
    }

    const medicationRequests = MedicationRequests.find(query).fetch();
    const medicationAdministrations = MedicationAdministrations.find(query).fetch();
    const allergies = AllergyIntolerances.find(query).fetch();

    const activeMeds = medicationRequests.filter(req => 
      get(req, 'status') === 'active' || get(req, 'status') === 'completed'
    );
    
    const discontinuedMeds = medicationRequests.filter(req => 
      get(req, 'status') === 'stopped' || get(req, 'status') === 'cancelled'
    );

    const onHoldMeds = medicationRequests.filter(req => 
      get(req, 'status') === 'on-hold' || get(req, 'status') === 'draft'
    );

    return {
      medicationRequests,
      medicationAdministrations,
      allergies,
      activeMeds,
      discontinuedMeds,
      onHoldMeds,
      patientId
    };
  }, [selectedPatientId]);

  const useNavigateHook = Meteor.useNavigate;
  const navigate = useNavigateHook ? useNavigateHook() : function() {};

  const handlePrint = () => {
    window.print();
  };

  // Ride the /import-data pipeline: auto-fetch $everything for this patient,
  // then bounce back here after import.
  const handleFetchRecords = () => {
    navigate('/import-data?tab=rest-api&patient=' + data.patientId + '&next=medication-management');
  };

  const toggleReconciliation = () => {
    setReconciliationMode(!reconciliationMode);
  };

  const getMedicationDisplay = (medication) => {
    if(medication?.medicationCodeableConcept?.text){
      return medication.medicationCodeableConcept.text;
    } else if(medication?.medicationCodeableConcept?.coding?.[0]?.display){
      return medication.medicationCodeableConcept.coding[0].display;
    } else if(medication?.medicationReference?.display){
      return medication.medicationReference.display;
    }
    return 'Unknown Medication';
  };

  const getStatusChip = (status) => {
    const statusColors = {
      active: 'success',
      completed: 'success',
      stopped: 'error',
      cancelled: 'error',
      'on-hold': 'warning',
      draft: 'default'
    };
    return <Chip size="small" label={status} color={statusColors[status] || 'default'} />;
  };

  // Patient context is required — without it the queries would span all patients
  if (!data.patientId) {
    const NoPatientSelectedCard = Meteor.NoPatientSelectedCard;
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ pt: 3, pb: 3 }}>
          {NoPatientSelectedCard ? (
            <NoPatientSelectedCard />
          ) : (
            <Alert severity="warning">
              No patient selected. Please select a patient to view medication lists.
            </Alert>
          )}
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{
          '& .MuiTypography-root': { color: cardTextColor },
          '& .MuiLink-root': { color: cardTextColor }
        }}>
          <Link
            color="inherit"
            href="/"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5, color: cardTextColor }} fontSize="inherit" />
            Home
          </Link>
          <Typography sx={{ display: 'flex', alignItems: 'center', color: cardTextColor }}>
            <MedicationIcon sx={{ mr: 0.5, color: cardTextColor }} fontSize="inherit" />
            Medication Lists
          </Typography>
        </Breadcrumbs>
      </Box>

      <PageInstructions page="medicationManagement">
        Review the patient&apos;s medication lists by status. Start Reconciliation to
        compare and resolve discrepancies after a transition of care.
      </PageInstructions>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTypography-root': { color: cardTextColor },
            '& .MuiCardHeader-title': { color: cardTextColor },
            '& .MuiCardHeader-subheader': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            },
            '& .MuiTab-root': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            },
            '& .Mui-selected': {
              color: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
            }
          }}>
            <CardHeader
              title="Medication Management"
              action={
                <Box>
                  <Button
                    startIcon={<CompareArrowsIcon />}
                    onClick={toggleReconciliation}
                    sx={{ mr: 1 }}
                  >
                    {reconciliationMode ? 'Exit Reconciliation' : 'Start Reconciliation'}
                  </Button>
                  <IconButton onClick={handlePrint}>
                    <PrintIcon />
                  </IconButton>
                </Box>
              }
            />
            <CardContent>
              {data.allergies.length > 0 && (
                <Alert severity="warning" sx={{
                  mb: 2,
                  bgcolor: isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
                  '& .MuiAlertTitle-root': { color: cardTextColor }
                }}>
                  <AlertTitle>Allergy Alert</AlertTitle>
                  Patient has {data.allergies.length} documented {data.allergies.length === 1 ? 'allergy' : 'allergies'}
                </Alert>
              )}

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={handleTabChange} aria-label="medication lists tabs">
                  <Tab label={`Active (${data.activeMeds.length})`} />
                  <Tab label={`Administrations (${data.medicationAdministrations.length})`} />
                  <Tab label={`Discontinued (${data.discontinuedMeds.length})`} />
                  <Tab label={`On Hold (${data.onHoldMeds.length})`} />
                  <Tab label={`Allergies (${data.allergies.length})`} />
                </Tabs>
              </Box>

              <TabPanel value={tabIndex} index={0}>
                <Typography variant="h6" gutterBottom>Active Medications</Typography>
                {data.activeMeds.length === 0 ? (
                  <EmptyTabState
                    message="No active medications on file for this patient."
                    onFetchRecords={handleFetchRecords}
                    onReconcile={toggleReconciliation}
                    showReconcile={!reconciliationMode}
                  />
                ) : (
                  <MedicationRequestsTable
                    medicationRequests={data.activeMeds}
                    hideCheckbox={!reconciliationMode}
                    multiline={true}
                    showMinutes={false}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={1}>
                <Typography variant="h6" gutterBottom>Medication Administrations</Typography>
                {data.medicationAdministrations.length === 0 ? (
                  <EmptyTabState
                    message="No medication administrations recorded for this patient."
                    onFetchRecords={handleFetchRecords}
                  />
                ) : (
                  <MedicationAdministrationsTable
                    medicationAdministrations={data.medicationAdministrations}
                    hideCheckbox={true}
                    multiline={true}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={2}>
                <Typography variant="h6" gutterBottom>Discontinued Medications</Typography>
                {data.discontinuedMeds.length === 0 ? (
                  <EmptyTabState
                    message="No discontinued medications on file for this patient."
                    onFetchRecords={handleFetchRecords}
                  />
                ) : (
                  <MedicationRequestsTable
                    medicationRequests={data.discontinuedMeds}
                    hideCheckbox={!reconciliationMode}
                    multiline={true}
                    showMinutes={false}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={3}>
                <Typography variant="h6" gutterBottom>On Hold Medications</Typography>
                {data.onHoldMeds.length === 0 ? (
                  <EmptyTabState
                    message="No on-hold or draft medication orders for this patient."
                    onFetchRecords={handleFetchRecords}
                  />
                ) : (
                  <MedicationRequestsTable
                    medicationRequests={data.onHoldMeds}
                    hideCheckbox={!reconciliationMode}
                    multiline={true}
                    showMinutes={false}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={4}>
                <Typography variant="h6" gutterBottom>Allergies & Intolerances</Typography>
                {data.allergies.length === 0 ? (
                  <EmptyTabState
                    message="No allergies or intolerances documented for this patient."
                    onFetchRecords={handleFetchRecords}
                  />
                ) : (
                  <AllergyIntolerancesTable
                    allergyIntolerances={data.allergies}
                    hideCheckbox={true}
                    multiline={true}
                  />
                )}
              </TabPanel>
            </CardContent>
          </Card>

          <ColumnAdornment
            icon={MedicationIcon}
            caption="Medication lists reconcile FHIR MedicationRequests, MedicationAdministrations, and AllergyIntolerances for the selected patient."
          />
        </Grid>

        {reconciliationMode && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Medication Reconciliation
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Review medications from all sources and verify accuracy. Select medications to continue, modify, or discontinue.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" sx={{ mr: 1 }}>
                  Continue Selected
                </Button>
                <Button variant="outlined" sx={{ mr: 1 }}>
                  Discontinue Selected
                </Button>
                <Button variant="outlined">
                  Save Reconciliation
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      </Container>
    </Box>
  );
}

export default MedicationListsPage;