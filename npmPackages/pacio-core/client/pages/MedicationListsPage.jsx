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

  const handlePrint = () => {
    window.print();
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
                <MedicationRequestsTable 
                  medicationRequests={data.activeMeds}
                  hideCheckbox={!reconciliationMode}
                  multiline={true}
                  showMinutes={false}
                />
              </TabPanel>

              <TabPanel value={tabIndex} index={1}>
                <Typography variant="h6" gutterBottom>Medication Administrations</Typography>
                <MedicationAdministrationsTable 
                  medicationAdministrations={data.medicationAdministrations}
                  hideCheckbox={true}
                  multiline={true}
                />
              </TabPanel>

              <TabPanel value={tabIndex} index={2}>
                <Typography variant="h6" gutterBottom>Discontinued Medications</Typography>
                <MedicationRequestsTable 
                  medicationRequests={data.discontinuedMeds}
                  hideCheckbox={!reconciliationMode}
                  multiline={true}
                  showMinutes={false}
                />
              </TabPanel>

              <TabPanel value={tabIndex} index={3}>
                <Typography variant="h6" gutterBottom>On Hold Medications</Typography>
                <MedicationRequestsTable 
                  medicationRequests={data.onHoldMeds}
                  hideCheckbox={!reconciliationMode}
                  multiline={true}
                  showMinutes={false}
                />
              </TabPanel>

              <TabPanel value={tabIndex} index={4}>
                <Typography variant="h6" gutterBottom>Allergies & Intolerances</Typography>
                <AllergyIntolerancesTable 
                  allergyIntolerances={data.allergies}
                  hideCheckbox={true}
                  multiline={true}
                />
              </TabPanel>
            </CardContent>
          </Card>
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