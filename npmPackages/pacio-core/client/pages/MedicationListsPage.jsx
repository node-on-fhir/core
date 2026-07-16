// /packages/pacio-core/client/pages/MedicationListsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useNavigate } from 'react-router-dom';

import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { paramPathFromSearch } = WorkflowNavigation;

import MedicationReconciliation from '../../lib/MedicationReconciliation.js';
const { matchMedicationPairs, extractMedicationCodings, getMedicationDisplay } = MedicationReconciliation;

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
  AlertTitle,
  Snackbar,
  Stack
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SaveIcon from '@mui/icons-material/Save';

// Access collections via Meteor global object (packages can't import from /imports/)
let MedicationRequests;
let MedicationStatements;
let MedicationAdministrations;
let AllergyIntolerances;
let Lists;

if (Meteor.isClient) {
  MedicationRequests = window.MedicationRequests || get(Meteor, 'Collections.MedicationRequests');
  MedicationStatements = window.MedicationStatements || get(Meteor, 'Collections.MedicationStatements');
  MedicationAdministrations = window.MedicationAdministrations || get(Meteor, 'Collections.MedicationAdministrations');
  AllergyIntolerances = window.AllergyIntolerances || get(Meteor, 'Collections.AllergyIntolerances');
  Lists = window.Lists || get(Meteor, 'Collections.Lists');
}

// Access tables via Meteor.Tables
const MedicationRequestsTable = Meteor.Tables?.MedicationRequestsTable;
const MedicationStatementsTable = Meteor.Tables?.MedicationStatementsTable;
const MedicationAdministrationsTable = Meteor.Tables?.MedicationAdministrationsTable;
const AllergyIntolerancesTable = Meteor.Tables?.AllergyIntolerancesTable;
const ListsTable = Meteor.Tables?.ListsTable;


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

// Builds the staged-action record for a raw MedicationRequest/MedicationStatement.
function toStagedAction(resource, resourceType, action) {
  const codings = extractMedicationCodings(resource);
  return {
    _id: resource._id,
    resourceType: resourceType,
    action: action,
    display: getMedicationDisplay(resource),
    code: codings.length ? codings[0].code : ''
  };
}

function MedicationListsPage(props) {
  const navigate = useNavigate();

  // Home breadcrumb: client-side navigation (preserves Session patient context)
  // to the threaded ?home= workflow callback, else the deployment default route.
  function handleBreadcrumbHome(event) {
    event.preventDefault();
    const settingsRoute = get(Meteor, 'settings.public.defaults.route');
    const homePath = paramPathFromSearch(window.location.search, 'home')
      || ((typeof settingsRoute === 'string' && settingsRoute.length && settingsRoute !== '/') ? settingsRoute : '/');
    navigate(homePath);
  }

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

  // Reconciliation selection + staging state
  const [selectedActiveIds, setSelectedActiveIds] = useState([]);         // MedicationRequest _ids
  const [selectedStatementIds, setSelectedStatementIds] = useState([]);   // MedicationStatement _ids
  const [reconciledActions, setReconciledActions] = useState({});         // { _id: stagedAction }
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // RxNorm assist decoration (Phase B) — null while loading/disabled;
  // { available: false } when RxNav is unreachable. Reconciliation never
  // depends on it.
  const [rxnormAssist, setRxnormAssist] = useState(null);
  const rxnormAssistEnabled = get(Meteor, 'settings.public.modules.rxnormAssist', false);

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
    const medicationStatements = MedicationStatements ? MedicationStatements.find(query).fetch() : [];
    const medicationAdministrations = MedicationAdministrations.find(query).fetch();
    const allergies = AllergyIntolerances.find(query).fetch();

    const reconciledLists = Lists ? Lists.find({
      'subject.reference': { $in: [`Patient/${patientId}`] },
      'code.coding.code': '10160-0',
      title: 'Reconciled Medication List'
    }, { sort: { date: -1 } }).fetch() : [];

    const activeMeds = medicationRequests.filter(req =>
      get(req, 'status') === 'active' || get(req, 'status') === 'completed'
    );

    const discontinuedMeds = medicationRequests.filter(req =>
      get(req, 'status') === 'stopped' || get(req, 'status') === 'cancelled'
    );

    const onHoldMeds = medicationRequests.filter(req =>
      get(req, 'status') === 'on-hold' || get(req, 'status') === 'draft'
    );

    // Home meds: statements the patient reports currently taking
    const activeStatements = medicationStatements.filter(statement =>
      get(statement, 'status') !== 'stopped' && get(statement, 'status') !== 'entered-in-error'
    );

    return {
      medicationRequests,
      medicationStatements,
      activeStatements,
      medicationAdministrations,
      allergies,
      activeMeds,
      discontinuedMeds,
      onHoldMeds,
      reconciledLists,
      patientId
    };
  }, [selectedPatientId]);

  // Fetch RxNorm assist decoration when entering reconciliation mode.
  useEffect(() => {
    if (!reconciliationMode || !rxnormAssistEnabled || !data.patientId) {
      return;
    }
    let cancelled = false;
    Meteor.callAsync('rxnorm.reconciliationAssist', data.patientId).then(function(result) {
      if (!cancelled) {
        setRxnormAssist(result);
      }
    }).catch(function(error) {
      console.warn('[MedicationListsPage] RxNorm assist unavailable:', get(error, 'reason', error.message));
      if (!cancelled) {
        setRxnormAssist({ available: false });
      }
    });
    return function() { cancelled = true; };
  }, [reconciliationMode, data.patientId]);

  const handlePrint = () => {
    window.print();
  };

  // Ride the /import-data pipeline: auto-fetch $everything for this patient,
  // then bounce back here after import.
  const handleFetchRecords = () => {
    navigate('/import-data?tab=rest-api&patient=' + data.patientId + '&next=medication-management');
  };

  const toggleReconciliation = () => {
    // Entering or exiting always resets staging state
    setSelectedActiveIds([]);
    setSelectedStatementIds([]);
    setReconciledActions({});
    setRxnormAssist(null);
    setReconciliationMode(!reconciliationMode);
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

  // --------------------------------------------------------------------------
  // Selection handling

  function handleActiveCheckbox(id, checked) {
    setSelectedActiveIds(function(previous) {
      if (checked) {
        return previous.includes(id) ? previous : previous.concat([id]);
      }
      return previous.filter(function(existing) { return existing !== id; });
    });
  }

  function handleStatementCheckbox(id, checked) {
    setSelectedStatementIds(function(previous) {
      if (checked) {
        return previous.includes(id) ? previous : previous.concat([id]);
      }
      return previous.filter(function(existing) { return existing !== id; });
    });
  }

  const selectionCount = selectedActiveIds.length + selectedStatementIds.length;
  const stagedActionsList = Object.values(reconciledActions);

  // Collects the currently selected raw resources as staged-action records.
  function collectSelectedActions(action) {
    const actions = [];
    selectedActiveIds.forEach(function(id) {
      const resource = data.medicationRequests.find(function(request) { return request._id === id; });
      if (resource) {
        actions.push(toStagedAction(resource, 'MedicationRequest', action));
      }
    });
    selectedStatementIds.forEach(function(id) {
      const resource = data.medicationStatements.find(function(statement) { return statement._id === id; });
      if (resource) {
        actions.push(toStagedAction(resource, 'MedicationStatement', action));
      }
    });
    return actions;
  }

  function stageActions(actions) {
    setReconciledActions(function(previous) {
      const next = Object.assign({}, previous);
      actions.forEach(function(stagedAction) {
        next[stagedAction._id] = stagedAction;
      });
      return next;
    });
    setSelectedActiveIds([]);
    setSelectedStatementIds([]);
  }

  function unstageAction(id) {
    setReconciledActions(function(previous) {
      const next = Object.assign({}, previous);
      delete next[id];
      return next;
    });
  }

  // --------------------------------------------------------------------------
  // Reconciliation actions

  function handleContinueSelected() {
    const actions = collectSelectedActions('continue');
    if (!actions.length) {
      return;
    }
    stageActions(actions);
    setSnackbar({
      open: true,
      severity: 'success',
      message: actions.length + ' medication(s) marked to continue'
    });
  }

  async function handleDiscontinueSelected() {
    const actions = collectSelectedActions('discontinue');
    if (!actions.length) {
      return;
    }
    setSaving(true);
    try {
      const items = actions.map(function(stagedAction) {
        return { _id: stagedAction._id, resourceType: stagedAction.resourceType };
      });
      const result = await Meteor.callAsync('pacio.medicationReconciliation.discontinue', items, 'Discontinued during medication reconciliation');
      stageActions(actions);
      setSnackbar({
        open: true,
        severity: 'warning',
        message: get(result, 'modified', 0) + ' medication(s) discontinued'
      });
    } catch (error) {
      console.error('[MedicationListsPage] Discontinue failed:', error);
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Discontinue failed: ' + get(error, 'reason', error.message)
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReconciliation() {
    if (!stagedActionsList.length) {
      return;
    }
    setSaving(true);
    try {
      const patient = Session.get('selectedPatient');
      const result = await Meteor.callAsync('pacio.medicationReconciliation.save', {
        patientId: data.patientId,
        patientDisplay: get(patient, 'name[0].text', ''),
        actions: stagedActionsList,
        note: 'Reconciled via /medication-management'
      });
      setSnackbar({
        open: true,
        severity: 'success',
        message: 'Reconciliation saved — List/' + get(result, 'listId')
      });
      setReconciledActions({});
      setSelectedActiveIds([]);
      setSelectedStatementIds([]);
      setReconciliationMode(false);
    } catch (error) {
      console.error('[MedicationListsPage] Save reconciliation failed:', error);
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Save failed: ' + get(error, 'reason', error.message)
      });
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------------------------------
  // Compare strip: home meds (statements) vs active orders (requests).
  // Exact-code matching is the always-available baseline; RxNorm assist
  // upgrades matching to RxCUI/ingredient level when available.

  const exactPairs = matchMedicationPairs(data.activeStatements, data.activeMeds);
  const matchedStatementIds = {};
  const matchedRequestIds = {};
  exactPairs.matches.forEach(function(pair) {
    matchedStatementIds[pair.statementId] = 'code';
    matchedRequestIds[pair.requestId] = 'code';
  });
  if (get(rxnormAssist, 'available') && Array.isArray(get(rxnormAssist, 'matches'))) {
    rxnormAssist.matches.forEach(function(pair) {
      matchedStatementIds[pair.statementId] = pair.via || 'rxnorm';
      matchedRequestIds[pair.requestId] = pair.via || 'rxnorm';
    });
  }

  function renderCompareRow(resource, matchLookup, keyPrefix) {
    const via = matchLookup[resource._id];
    return (
      <Box key={keyPrefix + resource._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
        <Typography variant="body2" sx={{ mr: 1 }}>
          {getMedicationDisplay(resource)}
        </Typography>
        {via ? (
          <Chip size="small" color="success" variant="outlined"
            label={via === 'ingredient' ? 'matched (ingredient)' : 'matched'} />
        ) : (
          <Chip size="small" variant="outlined" label="unmatched" />
        )}
      </Box>
    );
  }

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

  const actionButtonSx = { mr: 1, mb: 1 };

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
            onClick={handleBreadcrumbHome}
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
                    id="toggleReconciliationButton"
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
                <Tabs value={tabIndex} onChange={handleTabChange} aria-label="medication lists tabs" variant="scrollable" scrollButtons="auto">
                  <Tab label={`Active (${data.activeMeds.length})`} />
                  <Tab label={`Home Meds (${data.activeStatements.length})`} />
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
                    selectedIds={reconciliationMode ? selectedActiveIds : undefined}
                    onCheckboxChange={handleActiveCheckbox}
                    multiline={true}
                    showMinutes={false}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={1}>
                <Typography variant="h6" gutterBottom>Home Medications (Patient Reported)</Typography>
                {MedicationStatementsTable ? (
                  <MedicationStatementsTable
                    medicationStatements={data.activeStatements}
                    hideCheckbox={!reconciliationMode}
                    selectedIds={reconciliationMode ? selectedStatementIds : undefined}
                    onCheckboxChange={handleStatementCheckbox}
                    multiline={true}
                  />
                ) : (
                  <Alert severity="info">MedicationStatements table not available.</Alert>
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={2}>
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

              <TabPanel value={tabIndex} index={3}>
                <Typography variant="h6" gutterBottom>Discontinued Medications</Typography>
                {data.discontinuedMeds.length === 0 ? (
                  <EmptyTabState
                    message="No discontinued medications on file for this patient."
                    onFetchRecords={handleFetchRecords}
                  />
                ) : (
                  <MedicationRequestsTable
                    medicationRequests={data.discontinuedMeds}
                    hideCheckbox={true}
                    multiline={true}
                    showMinutes={false}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={4}>
                <Typography variant="h6" gutterBottom>On Hold Medications</Typography>
                {data.onHoldMeds.length === 0 ? (
                  <EmptyTabState
                    message="No on-hold or draft medication orders for this patient."
                    onFetchRecords={handleFetchRecords}
                  />
                ) : (
                  <MedicationRequestsTable
                    medicationRequests={data.onHoldMeds}
                    hideCheckbox={true}
                    multiline={true}
                    showMinutes={false}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabIndex} index={5}>
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
            <Paper id="medicationReconciliationPanel" sx={{ p: 3, bgcolor: 'background.paper', color: 'text.primary' }}>
              <Typography variant="h6" gutterBottom>
                Medication Reconciliation
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Review medications from all sources and verify accuracy. Select medications on the
                Active and Home Meds tabs, then continue or discontinue them. Save records the
                reconciled list with full provenance.
              </Typography>

              {/* RxNorm assist decorations (never block reconciliation) */}
              {rxnormAssistEnabled && get(rxnormAssist, 'available') === false && (
                <Chip size="small" variant="outlined" sx={{ mb: 2 }}
                  label="RxNorm assist offline — reconciliation unaffected" />
              )}
              {get(rxnormAssist, 'available') && get(rxnormAssist, 'duplicates', []).map(function(duplicate, index) {
                return (
                  <Alert severity="warning" sx={{ mb: 1 }} key={'duplicate-' + index}>
                    Duplicate ingredient: <strong>{duplicate.ingredientName}</strong> appears in {duplicate.memberIds.length} active medications
                  </Alert>
                );
              })}
              {get(rxnormAssist, 'available') && get(rxnormAssist, 'allergyWarnings', []).map(function(warning, index) {
                return (
                  <Alert severity="error" sx={{ mb: 1 }} key={'allergy-' + index}>
                    <AlertTitle>Possible allergy conflict</AlertTitle>
                    <strong>{warning.medDisplay}</strong> is in class <strong>{warning.className}</strong>,
                    which may conflict with documented allergy: {warning.allergyDisplay}
                  </Alert>
                );
              })}

              {/* Compare strip: home meds vs active orders */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Home Meds (patient reported) — {data.activeStatements.length}
                    </Typography>
                    {data.activeStatements.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No home medications recorded.</Typography>
                    )}
                    {data.activeStatements.map(function(statement) {
                      return renderCompareRow(statement, matchedStatementIds, 'stmt-');
                    })}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Active Orders — {data.activeMeds.length}
                    </Typography>
                    {data.activeMeds.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No active orders.</Typography>
                    )}
                    {data.activeMeds.map(function(request) {
                      return renderCompareRow(request, matchedRequestIds, 'rx-');
                    })}
                  </Box>
                </Grid>
              </Grid>

              {/* Staged actions summary */}
              {stagedActionsList.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Staged for reconciliation:</Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {stagedActionsList.map(function(stagedAction) {
                      return (
                        <Chip
                          key={stagedAction._id}
                          size="small"
                          icon={stagedAction.action === 'continue' ? <CheckCircleIcon /> : <RemoveCircleIcon />}
                          color={stagedAction.action === 'continue' ? 'success' : 'error'}
                          variant="outlined"
                          label={(stagedAction.action === 'continue' ? 'Continue: ' : 'Discontinue: ') + stagedAction.display}
                          onDelete={function() { unstageAction(stagedAction._id); }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <Button
                  id="continueSelectedButton"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  sx={actionButtonSx}
                  disabled={selectionCount === 0 || saving}
                  onClick={handleContinueSelected}
                >
                  Continue Selected ({selectionCount})
                </Button>
                <Button
                  id="discontinueSelectedButton"
                  variant="outlined"
                  color="error"
                  startIcon={<RemoveCircleIcon />}
                  sx={actionButtonSx}
                  disabled={selectionCount === 0 || saving}
                  onClick={handleDiscontinueSelected}
                >
                  Discontinue Selected ({selectionCount})
                </Button>
                <Button
                  id="saveReconciliationButton"
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  sx={actionButtonSx}
                  disabled={stagedActionsList.length === 0 || saving}
                  onClick={handleSaveReconciliation}
                >
                  Save Reconciliation ({stagedActionsList.length} reviewed)
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Reconciliation history */}
        {data.reconciledLists.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: cardBgColor, color: cardTextColor }}>
              <CardHeader title="Reconciliation History" subheader="Saved reconciled medication lists" />
              <CardContent>
                {ListsTable ? (
                  <ListsTable lists={data.reconciledLists} hideCheckbox={true} />
                ) : (
                  data.reconciledLists.map(function(list) {
                    return (
                      <Box key={list._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
                        <Typography variant="body2">{moment(get(list, 'date')).format('YYYY-MM-DD HH:mm')}</Typography>
                        <Typography variant="body2">{get(list, 'title')}</Typography>
                        <Chip size="small" label={get(list, 'status')} />
                        <Typography variant="body2" color="text.secondary">{get(list, 'entry', []).length} medication(s)</Typography>
                      </Box>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={function() { setSnackbar(Object.assign({}, snackbar, { open: false })); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={function() { setSnackbar(Object.assign({}, snackbar, { open: false })); }}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MedicationListsPage;
