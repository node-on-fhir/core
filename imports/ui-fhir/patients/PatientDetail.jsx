// /imports/ui-fhir/patients/PatientDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';

import { KARYOTYPE_OPTIONS, PATIENT_KARYOTYPE_URL, SNOMED_SYSTEM } from '/imports/lib/PatientSexGender';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import { get, set } from 'lodash';
import moment from 'moment';

import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import PatientFormView from './PatientFormView';
import PatientPreview from './PatientPreview';

const log = (Meteor.Logger ? Meteor.Logger.for('PatientDetail') : console);

function PatientDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Track subscription readiness to avoid race conditions
  // Use targeted subscription for existing patients to ensure the specific patient is included
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    if (id && id !== 'new') {
      // For existing patients, use patients.byId to fetch this specific patient
      // This is the same approach used by MyProfilePage
      const handle = Meteor.subscribe('patients.byId', id);
      return handle.ready();
    } else {
      // For new patients, no subscription needed
      return true;
    }
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  // IMPORTANT: Don't set id in initial state - let server generate it
  // This prevents stale IDs from being reused across patient creations
  const [patient, setPatient] = useState({
    resourceType: "Patient",
    active: true,
    name: [{
      use: "official",
      family: "",
      given: [""],
      text: ""
    }],
    telecom: [
      {
        system: "phone",
        value: "",
        use: "mobile"
      },
      {
        system: "email",
        value: "",
        use: "home"
      }
    ],
    gender: "",
    birthDate: "",
    address: [{
      use: "home",
      type: "both",
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: "USA"
    }],
    identifier: [{
      system: "http://hospital.example.org/identifiers/mrn",
      value: ""
    }],
    maritalStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
        code: "",
        display: ""
      }]
    },
    communication: [{
      language: {
        coding: [{
          system: "urn:ietf:bcp:47",
          code: "en-US",
          display: "English (United States)"
        }]
      },
      preferred: true
    }],
    extension: [
      {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
        valueCode: ""
      },
      {
        url: "http://hl7.org/fhir/StructureDefinition/patient-karyotype",
        valueCodeableConcept: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }]
        }
      }
    ]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setPatient(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // onResourceChange: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(patient);
    }
  }, [patient]);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(isEmbedded);

  const isNewPatient = !id || id === 'new';
  const isExistingPatient = id && id !== 'new';

  // Load existing patient if ID is provided
  // Wait for subscription to be ready to avoid race conditions
  useEffect(function() {
    if (!isSubscriptionReady) {
      console.log('[PatientDetail] Waiting for subscription to be ready...'); // phi-audit: ok
      return;
    }

    if (id && id !== 'new') {
      // IMPORTANT: Avoid $or anti-pattern per CLAUDE.md
      // URL uses FHIR id, so try that first, then fallback to _id
      let existingPatient = Patients.findOne({ id: id });
      if (!existingPatient) {
        existingPatient = Patients.findOne({ _id: id });
      }

      if (existingPatient) {
        log.phi('Loaded patient', existingPatient, { action: 'read' });
        setPatient(existingPatient);
        setIsEditing(false);
      } else {
        log.error('Patient not found for id:', { id });
      }
    } else if (!id || id === 'new') {
      // For new patients, create fresh state - don't spread old patient!
      // This prevents reusing IDs from previously viewed patients
      const newPatient = {
        resourceType: "Patient",
        active: true,
        name: [{
          use: "official",
          family: "",
          given: [""],
          text: ""
        }],
        telecom: [
          {
            system: "phone",
            value: "",
            use: "mobile"
          },
          {
            system: "email",
            value: "",
            use: "home"
          }
        ],
        gender: "",
        birthDate: "",
        address: [{
          use: "home",
          type: "both",
          line: [""],
          city: "",
          state: "",
          postalCode: "",
          country: "USA"
        }],
        identifier: [{
          system: "http://hospital.example.org/identifiers/mrn",
          value: ""
        }],
        maritalStatus: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
            code: "",
            display: ""
          }]
        },
        communication: [{
          language: {
            coding: [{
              system: "urn:ietf:bcp:47",
              code: "en-US",
              display: "English (United States)"
            }]
          },
          preferred: true
        }],
        extension: []
      };

      // IMPORTANT: Don't set id field - let server generate it
      // This prevents ID reuse across patient creations

      // Pre-fill with user's information if available
      if (currentUser) {
        // Set name from user
        if (get(currentUser, 'fullLegalName')) {
          const nameParts = currentUser.fullLegalName.split(' ');
          set(newPatient, 'name[0].given', nameParts.slice(0, -1));
          set(newPatient, 'name[0].family', nameParts[nameParts.length - 1]);
          set(newPatient, 'name[0].text', currentUser.fullLegalName);
        }

        // Set email from user
        if (get(currentUser, 'emails[0].address')) {
          const emailIndex = newPatient.telecom.findIndex(function(t) { return t.system === 'email'; });
          if (emailIndex >= 0) {
            newPatient.telecom[emailIndex].value = currentUser.emails[0].address;
          }
        }

        // Only set patient ID if user is creating their own patient record
        if (get(currentUser, 'patientId')) {
          newPatient.id = currentUser.patientId;
        }
      }

      setPatient(newPatient);
      setIsEditing(true);
    }
  }, [id, currentUser, isSubscriptionReady]);

  // Handle form field changes
  function handleChange(path, value) {
    pendingUpdate.current = true;
    const updatedPatient = { ...patient };
    set(updatedPatient, path, value);

    // Update display text for name
    if (path.includes('name[0]')) {
      const given = get(updatedPatient, 'name[0].given', []).join(' ');
      const family = get(updatedPatient, 'name[0].family', '');
      set(updatedPatient, 'name[0].text', (given + ' ' + family).trim());
    }

    setPatient(updatedPatient);
  }

  // Handle birth sex extension change
  function handleBirthSexChange(value) {
    var updatedPatient = { ...patient };
    if (!updatedPatient.extension) {
      updatedPatient.extension = [];
    }
    var birthSexIndex = updatedPatient.extension.findIndex(function(ext) {
      return ext.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex';
    });
    if (birthSexIndex >= 0) {
      updatedPatient.extension[birthSexIndex].valueCode = value;
    } else {
      updatedPatient.extension.push({
        url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex',
        valueCode: value
      });
    }
    pendingUpdate.current = true;
    setPatient(updatedPatient);
  }

  // Handle karyotype extension change
  function handleKaryotypeChange(value) {
    var selected = KARYOTYPE_OPTIONS.find(function(opt) { return opt.value === value; });
    var updatedPatient = { ...patient };
    if (!updatedPatient.extension) {
      updatedPatient.extension = [];
    }
    var karyotypeIndex = updatedPatient.extension.findIndex(function(ext) {
      return ext.url === PATIENT_KARYOTYPE_URL;
    });
    var karyotypeExtension = {
      url: PATIENT_KARYOTYPE_URL,
      valueCodeableConcept: {
        coding: [{
          system: SNOMED_SYSTEM,
          code: value,
          display: selected ? selected.label : ''
        }]
      }
    };
    if (karyotypeIndex >= 0) {
      updatedPatient.extension[karyotypeIndex] = karyotypeExtension;
    } else {
      updatedPatient.extension.push(karyotypeExtension);
    }
    pendingUpdate.current = true;
    setPatient(updatedPatient);
  }

  // Build/replace a US Core race or ethnicity COMPLEX extension from the
  // selected option objects ([{ code, display, system }]). Empty selection
  // removes the extension. Shared by race + ethnicity.
  function setComplexDemographicExtension(url, selected) {
    var updatedPatient = { ...patient };
    if (!updatedPatient.extension) {
      updatedPatient.extension = [];
    }
    var index = updatedPatient.extension.findIndex(function(ext) { return ext.url === url; });
    if (!selected || selected.length === 0) {
      if (index >= 0) { updatedPatient.extension.splice(index, 1); }
      pendingUpdate.current = true;
      setPatient(updatedPatient);
      return;
    }
    var complexExtension = {
      url: url,
      extension: selected.map(function(s) {
        return { url: 'ombCategory', valueCoding: { system: s.system, code: s.code, display: s.display } };
      }).concat([{
        url: 'text',
        valueString: selected.map(function(s) { return s.display; }).join(', ')
      }])
    };
    if (index >= 0) {
      updatedPatient.extension[index] = complexExtension;
    } else {
      updatedPatient.extension.push(complexExtension);
    }
    pendingUpdate.current = true;
    setPatient(updatedPatient);
  }

  function handleRaceChange(selected) {
    setComplexDemographicExtension('http://hl7.org/fhir/us/core/StructureDefinition/us-core-race', selected);
  }
  function handleEthnicityChange(selected) {
    setComplexDemographicExtension('http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity', selected);
  }

  // Handle adding a new telecom entry
  function handleAddTelecom() {
    var updatedPatient = { ...patient };
    if (!updatedPatient.telecom) {
      updatedPatient.telecom = [];
    }
    updatedPatient.telecom.push({
      system: 'phone',
      value: '',
      use: 'home'
    });
    setPatient(updatedPatient);
  }

  // Handle removing a telecom entry
  function handleRemoveTelecom(index) {
    var updatedPatient = { ...patient };
    if (updatedPatient.telecom && updatedPatient.telecom.length > index) {
      updatedPatient.telecom.splice(index, 1);
      setPatient(updatedPatient);
    }
  }

  // Handle save
  async function handleSave() {
    console.log('[PatientDetail] Starting save operation...'); // phi-audit: ok
    log.phi('Patient data to save', patient, { action: id && id !== 'new' ? 'update' : 'create' });
    log.debug('Current ID:', { id });
    log.debug('Current user patientId:', { patientId: get(currentUser, 'patientId') });

    // Determine if we're editing an existing patient (vs creating new)
    const isEditingExisting = id && id !== 'new';

    // For navigation: check if we're editing the user's OWN patient
    // Only applies when editing existing patients, not creating new ones
    const isEditingOwnPatient = isEditingExisting && (get(currentUser, 'patientId') === id);

    // Track if we just linked this patient (for navigation logic)
    let patientWasJustLinked = false;

    try {
      let result;

      if (isEditingExisting) {
        // Update existing patient
        // CRITICAL: Use MongoDB _id for updates per CLAUDE.md anti-pattern guidelines
        // Never use $or logic or fallback to FHIR id for lookups
        const mongoId = patient._id;
        if (!mongoId) {
          throw new Error('Cannot update: patient _id is missing. The patient may not have loaded correctly.');
        }
        log.debug('Updating patient with MongoDB _id:', { mongoId });
        result = await Meteor.callAsync('patients.update',
          { _id: mongoId },
          { $set: patient }
        );
        log.debug('Update result:', { result });
        if (result === 0) {
          log.warn('Update matched 0 documents for _id:', { mongoId });
        }
        setIsEditing(false);
      } else {
        // Create new patient
        console.log('[PatientDetail] Creating new patient...'); // phi-audit: ok
        log.phi('Calling patients.insert', patient, { action: 'create' });

        try {
          // Add a timeout wrapper for the method call
          const timeoutPromise = new Promise(function(_, reject) {
            return setTimeout(function() { reject(new Error('Method call timeout after 10s')); }, 10000);
          });

          const methodPromise = Meteor.callAsync('patients.insert', patient);

          result = await Promise.race([methodPromise, timeoutPromise]);
          log.debug('Insert result:', { result });
        } catch (methodError) {
          console.error('[PatientDetail] Method call error:', methodError); // phi-audit: ok
          console.error('[PatientDetail] Error details:', { // phi-audit: ok
            error: methodError.error,
            reason: methodError.reason,
            details: methodError.details,
            message: methodError.message,
            stack: methodError.stack
          });
          throw methodError;
        }

        // If this is the current user's patient, update the user record
        if (currentUser && !currentUser.patientId) {
          console.log('[PatientDetail] Linking patient to user...'); // phi-audit: ok
          try {
            await Meteor.callAsync('users.linkPatient', result);
            console.log('[PatientDetail] User link successful'); // phi-audit: ok
            patientWasJustLinked = true;
          } catch (linkError) {
            console.error('[PatientDetail] User link error:', linkError); // phi-audit: ok
            // Don't throw here - patient was created successfully
          }
        } else {
          console.log('[PatientDetail] User already has a patient linked, skipping link'); // phi-audit: ok
        }
      }

      setSuccessMessage('Patient saved successfully');
      console.log('[PatientDetail] Save successful, navigating in 1.5s...'); // phi-audit: ok
      console.log('[PatientDetail] isEditingExisting:', isEditingExisting); // phi-audit: ok
      console.log('[PatientDetail] isEditingOwnPatient:', isEditingOwnPatient); // phi-audit: ok
      console.log('[PatientDetail] patientWasJustLinked:', patientWasJustLinked); // phi-audit: ok

      // Navigate to profile only if editing user's own patient (not creating new)
      // This ensures new patients always navigate to /patients list
      setTimeout(function() {
        console.log('[PatientDetail] Navigating back to list...'); // phi-audit: ok
        if (isEditingOwnPatient && !patientWasJustLinked) {
          console.log('[PatientDetail] Navigating to /my-profile (editing own profile)'); // phi-audit: ok
          navigate('/my-profile');
        } else {
          console.log('[PatientDetail] Navigating to /patients'); // phi-audit: ok
          navigate('/patients');
        }
      }, 1500);

    } catch (error) {
      console.error('[PatientDetail] Error saving patient:', error); // phi-audit: ok
      setErrors({ save: error.message || 'Failed to save patient' });
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingPatient) {
      setIsEditing(false);
      setErrors({});
      // Reload the patient to discard changes
      let existingPatient = Patients.findOne({ id: id });
      if (!existingPatient) {
        existingPatient = Patients.findOne({ _id: id });
      }
      if (existingPatient) {
        setPatient(existingPatient);
      }
    } else {
      navigate(-1);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingPatient) return;

    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        var mongoId = patient._id;
        if (!mongoId) {
          throw new Error('Cannot delete: patient _id is missing.');
        }
        await Meteor.callAsync('patients.remove', { _id: mongoId });
        console.log('[PatientDetail] Patient deleted successfully'); // phi-audit: ok
        navigate('/patients');
      } catch (err) {
        console.error('[PatientDetail] Error deleting patient:', err); // phi-audit: ok
        setErrors({ save: err.message || 'Failed to delete patient' });
      }
    }
  }

  // Build the header title
  var headerTitle = 'Create New Patient';
  if (isExistingPatient) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new patients */}
        {!isNewPatient && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new patients (always form) */}
        {!isNewPatient && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Edit toggle — only for existing records */}
        {!isNewPatient && (
          <Button
              id="editButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete — only for existing records */}
        {!isNewPatient && (
          <Button
              id="deleteButton"
              onClick={handleDelete}
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <PatientFormView
          resource={patient}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onAddTelecom={handleAddTelecom}
          onRemoveTelecom={handleRemoveTelecom}
          onBirthSexChange={handleBirthSexChange}
          onKaryotypeChange={handleKaryotypeChange}
          onRaceChange={handleRaceChange}
          onEthnicityChange={handleEthnicityChange}
          onSetPatient={setPatient}
        />

        {/* Error/Success Messages */}
        {errors.save && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {errors.save}
          </Typography>
        )}
        {successMessage && (
          <Typography color="success.main" variant="body2" sx={{ mt: 2 }}>
            {successMessage}
          </Typography>
        )}

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              id="cancelButton"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              data-testid="cancel-patient-button"
            >
              Cancel
            </Button>
            <Button
              id="savePatientButton"
              data-testid="save-patient-button"
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!get(patient, 'name[0].family') || !get(patient, 'name[0].given[0]')}
            >
              Save
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    return <PatientPreview resource={patient} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="patientDetailPage" data-testid="patient-detail-page" maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default PatientDetail;
