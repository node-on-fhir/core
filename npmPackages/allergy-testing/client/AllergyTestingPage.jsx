// npmPackages/allergy-testing/client/AllergyTestingPage.jsx

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set, cloneDeep } from 'lodash';

import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Tabs,
  Tab,
  Alert,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar
} from '@mui/material';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { FhirUtilities } from '/imports/lib/FhirUtilities';
import LayoutHelpers from '/imports/lib/LayoutHelpers';
import AllergyIntolerancesTable from '/imports/ui-fhir/allergyIntolerances/AllergyIntolerancesTable';
import AllergyIntoleranceFormView from '/imports/ui-fhir/allergyIntolerances/AllergyIntoleranceFormView';

import AllergyPanelChecklist from './AllergyPanelChecklist.jsx';
import NoKnownAllergiesCard from './NoKnownAllergiesCard.jsx';

// Resolve a human-readable patient display from a FHIR Patient resource.
function patientDisplayName(patient) {
  if (!patient) return '';
  const textName = get(patient, 'name[0].text');
  if (textName) return textName;
  const given = get(patient, 'name[0].given', []).join(' ');
  const family = get(patient, 'name[0].family', '');
  return (given + ' ' + family).trim();
}

export function AllergyTestingPage() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [recordedBy, setRecordedBy] = useState('patient');
  const [snack, setSnack] = useState('');

  // Optional return-path handoff from a launching workflow (e.g. Transition of
  // Care). Values arrive without a leading slash (e.g. "transitions-of-care").
  const [searchParams] = useSearchParams();
  const toPath = (p) => (p ? (p.startsWith('/') ? p : '/' + p) : null);
  const backDestination = toPath(searchParams.get('back'));
  const nextDestination = toPath(searchParams.get('next'));

  // After a successful write: hand back to the launching workflow if one passed
  // a `next` target, otherwise return to the Current Allergies tab.
  function finishAction(message) {
    setSnack(message);
    if (nextDestination) {
      navigate(nextDestination);
    } else {
      setTabIndex(0);
    }
  }

  // Reactive patient context (the load-bearing Session contract).
  const selectedPatient = useTracker(() => Session.get('selectedPatient'), []);
  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);

  // Subscribe to and read this patient's allergies (mirrors AllergyIntolerancesPage).
  const allergyIntolerances = useTracker(function() {
    const patient = Session.get('selectedPatient');
    const patientId = Session.get('selectedPatientId');
    const fhirId = get(patient, 'id') || patientId;
    if (!fhirId) return [];

    const autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    const query = FhirUtilities.addPatientFilterToQuery(fhirId);

    if (autoSubscribeEnabled) {
      Meteor.subscribe('autopublish.AllergyIntolerances', query, { limit: 1000 });
    } else {
      Meteor.subscribe('selectedPatient.AllergyIntolerances', patientId, { limit: 1000 });
    }

    return AllergyIntolerances.find(query).fetch();
  }, [selectedPatientId]);

  // Patient guard.
  if (!selectedPatient && !selectedPatientId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }} id="allergyTestingPage">
        <Alert
          severity="warning"
          action={backDestination ? (
            <Button color="inherit" size="small" startIcon={<ArrowBackIcon />} onClick={function() { navigate(backDestination); }}>
              Back
            </Button>
          ) : null}
        >
          No patient selected. Please select a patient from the sidebar to record or review allergies.
        </Alert>
      </Container>
    );
  }

  const fhirId = get(selectedPatient, 'id') || selectedPatientId;
  const patientReference = {
    reference: 'Patient/' + fhirId,
    display: patientDisplayName(selectedPatient)
  };

  const formFactor = LayoutHelpers.determineFormFactor();

  function renderCurrentAllergies() {
    if (allergyIntolerances.length === 0) {
      return (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            No allergies recorded for this patient yet. Use the Test Panels or Self-Report tabs to add some.
          </Typography>
        </Box>
      );
    }
    return (
      <AllergyIntolerancesTable
        id="allergyTestingTable"
        allergyIntolerances={allergyIntolerances}
        count={allergyIntolerances.length}
        formFactorLayout={formFactor}
        rowsPerPage={LayoutHelpers.calcTableRows()}
        hideActionButton={true}
        onRowClick={function(allergyIntoleranceId) {
          navigate('/allergy-intolerances/' + allergyIntoleranceId);
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} id="allergyTestingPage">
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          avatar={<VaccinesIcon />}
          title="Allergy Testing"
          subheader={'Patient: ' + (patientReference.display || patientReference.reference)}
          action={backDestination ? (
            <Button
              id="allergyTestingBack"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={function() { navigate(backDestination); }}
            >
              Back
            </Button>
          ) : null}
          sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* Registrar selector — drives verificationStatus per the BE allergy IG. */}
          <FormControl sx={{ mb: 2 }}>
            <FormLabel id="recorded-by-label">Recorded by</FormLabel>
            <RadioGroup
              row
              aria-labelledby="recorded-by-label"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
            >
              <FormControlLabel value="patient" control={<Radio />} label="Patient (self-report → unconfirmed)" />
              <FormControlLabel value="provider" control={<Radio />} label="Provider (→ confirmed)" />
            </RadioGroup>
          </FormControl>

          <Tabs
            value={tabIndex}
            onChange={(e, v) => setTabIndex(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label={'Current Allergies (' + allergyIntolerances.length + ')'} />
            <Tab label="Test Panels" />
            <Tab label="Self-Report" />
            <Tab label="No Known Allergies" />
          </Tabs>

          {tabIndex === 0 && renderCurrentAllergies()}

          {tabIndex === 1 && (
            <AllergyPanelChecklist
              patientReference={patientReference}
              recordedBy={recordedBy}
              onSubmitted={function(ids) {
                finishAction('Recorded ' + ids.length + ' allergy result(s).');
              }}
            />
          )}

          {tabIndex === 2 && (
            <SelfReportTab
              patientReference={patientReference}
              recordedBy={recordedBy}
              onSaved={function() {
                finishAction('Allergy saved.');
              }}
            />
          )}

          {tabIndex === 3 && (
            <NoKnownAllergiesCard
              patientReference={patientReference}
              recordedBy={recordedBy}
              hasExistingAllergies={allergyIntolerances.length > 0}
              onRecorded={function() {
                finishAction('Recorded: No known allergies.');
              }}
            />
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Container>
  );
}

// -----------------------------------------------------------------------------
// Self-report tab — reuses the core AllergyIntoleranceFormView and writes through
// the existing createAllergyIntolerance method.
// -----------------------------------------------------------------------------
function SelfReportTab({ patientReference, recordedBy, onSaved }) {
  const [resource, setResource] = useState(function() {
    return {
      resourceType: 'AllergyIntolerance',
      patient: { reference: patientReference.reference, display: patientReference.display },
      clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] }
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleChange(path, value) {
    setResource(function(prev) {
      const next = cloneDeep(prev);
      set(next, path, value);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const isProvider = recordedBy === 'provider';
      const dataToSave = cloneDeep(resource);
      set(dataToSave, 'verificationStatus', {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: isProvider ? 'confirmed' : 'unconfirmed',
          display: isProvider ? 'Confirmed' : 'Unconfirmed'
        }]
      });
      // Ensure patient reference is intact even if the display was edited.
      set(dataToSave, 'patient.reference', patientReference.reference);
      await Meteor.callAsync('createAllergyIntolerance', dataToSave);
      onSaved();
    } catch (err) {
      console.error('[allergy-testing] Self-report save failed', err);
      setError(get(err, 'reason', err.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <AllergyIntoleranceFormView
        resource={resource}
        isEditing={true}
        onChange={handleChange}
        onSearchPatient={function() { /* patient is fixed from session context */ }}
      />
      <CardActions sx={{ justifyContent: 'flex-end', px: 0, pt: 2 }}>
        <Button
          id="allergyTestingSelfReportSave"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={saving}
          onClick={handleSave}
        >
          Save Allergy
        </Button>
      </CardActions>
    </Box>
  );
}

export default AllergyTestingPage;
