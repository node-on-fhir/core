// /imports/ui-fhir/consents/ConsentDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';
import moment from 'moment';

import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { FhirUtilities } from '../../lib/FhirUtilities';

import ConsentFormView from './ConsentFormView';
import ConsentPreview from './ConsentPreview';

export function ConsentDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewConsent = !id || id === 'new';
  const isExistingConsent = id && id !== 'new';

  const [consent, setConsent] = useState({
    resourceType: 'Consent',
    status: 'draft',
    scope: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/consentscope',
        code: 'patient-privacy',
        display: 'Privacy Consent'
      }]
    },
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IDSCL',
        display: 'Information disclosure'
      }]
    }],
    patient: {},
    dateTime: moment().format('YYYY-MM-DD'),
    policyRule: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'OPTIN'
      }]
    }
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setConsent(function(prev) {
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
      props.onResourceChange(consent);
    }
  }, [consent]);


  const [isEditing, setIsEditing] = useState(!id || isEmbedded);

  // Subscribe to consents and track subscription status
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Consents', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('consents.all');
    }
    return handle.ready();
  }, []);

  // Load existing consent if editing
  useEffect(() => {
    if (isExistingConsent) {
      // Load immediately if data exists - don't wait for subscription
      console.log('ConsentDetail - Looking for consent with id:', id);
      let existingConsent = Consents.findOne({_id: id});

      if (existingConsent) {
        console.log('ConsentDetail - Loading consent data:', existingConsent);
        setConsent(existingConsent);
        setIsEditing(false); // Switch to view mode when loading existing
      } else {
        // Fallback: try id field
        const consentById = Consents.findOne({id: id});
        if (consentById) {
          console.log('ConsentDetail - Found consent by id field:', consentById);
          setConsent(consentById);
          setIsEditing(false);
        } else {
          console.warn('ConsentDetail - No consent found with id:', id);
        }
      }
    }
  }, [id]); // Only depend on id, not subscription status

  // Track patient from session
  const selectedPatient = useTracker(() => Session.get('selectedPatient'), []);
  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);

  // Set patient from session for new consents
  useEffect(() => {
    if (isNewConsent && selectedPatient) {
      // For new consents, set the patient from session
      console.log('ConsentDetail useEffect - selectedPatient:', selectedPatient);
      console.log('ConsentDetail useEffect - selectedPatientId:', selectedPatientId);

      const patientReference = selectedPatient.id ? `Patient/${selectedPatient.id}` : `Patient/${selectedPatientId}`;
      const patientDisplay = FhirUtilities.pluckName(selectedPatient);

      console.log('ConsentDetail useEffect - Setting patient reference:', patientReference);
      console.log('ConsentDetail useEffect - Setting patient display:', patientDisplay);

      setConsent(prevConsent => {
        const updatedConsent = {
          ...prevConsent,
          patient: {
            reference: patientReference,
            display: patientDisplay
          }
        };
        console.log('ConsentDetail useEffect - Updated consent with patient:', updatedConsent.patient);
        return updatedConsent;
      });
    } else if (isNewConsent && !selectedPatient) {
      console.log('ConsentDetail useEffect - No selected patient in Session');
    }
  }, [id, selectedPatient, selectedPatientId]);

  const handleChange = (path, value) => {
    pendingUpdate.current = true;
    console.log('=== handleChange called ===');
    console.log('Path:', path);
    console.log('Value:', typeof value === 'object' ? JSON.stringify(value, null, 2) : value);

    const updated = {...consent};
    set(updated, path, value);

    // Special handling for patient display to preserve reference
    if (path === 'patient.display' && consent.patient?.reference) {
      // Preserve the existing reference when updating display
      updated.patient.reference = consent.patient.reference;
    }

    console.log('Updated consent state (path ' + path + '):', get(updated, path));
    setConsent(updated);
  };

  const handleSearchUser = () => {
    console.log('Search for patient');
    // TODO: Implement patient search dialog
  };

  const handleSave = async () => {
    try {
      const dataToSave = {...consent};

      // Always check and set patient from Session if needed
      const selectedPatient = Session.get('selectedPatient');
      const selectedPatientId = Session.get('selectedPatientId');

      console.log('ConsentDetail handleSave - selectedPatient:', selectedPatient);
      console.log('ConsentDetail handleSave - selectedPatientId:', selectedPatientId);
      console.log('ConsentDetail handleSave - current patient in form:', dataToSave.patient);

      // If patient display exists but reference is missing, or if patient is empty, set from Session
      if (!dataToSave.patient || !dataToSave.patient.reference || dataToSave.patient.reference === '') {
        if (selectedPatient) {
          const patientReference = selectedPatient.id ? `Patient/${selectedPatient.id}` : `Patient/${selectedPatientId}`;
          const patientDisplay = FhirUtilities.pluckName(selectedPatient) || dataToSave.patient?.display || '';

          dataToSave.patient = {
            reference: patientReference,
            display: patientDisplay
          };
          console.log('ConsentDetail - Set patient from Session:', dataToSave.patient);
        } else {
          console.warn('ConsentDetail - No patient in Session, consent will be saved without patient reference');
          // For test compatibility, we allow saving without patient
          // In production, you might want to require a patient
        }
      }

      // Log what we're about to save
      console.log('=== ConsentDetail handleSave ===');
      console.log('dataToSave.policyRule:', JSON.stringify(dataToSave.policyRule, null, 2));
      console.log('dataToSave.note:', JSON.stringify(dataToSave.note, null, 2));
      console.log('dataToSave.patient:', JSON.stringify(dataToSave.patient, null, 2));
      console.log('dataToSave.category:', JSON.stringify(dataToSave.category, null, 2));
      console.log('dataToSave.status:', dataToSave.status);

      // Clean up the data
      delete dataToSave._document;

      if (id) {
        await Meteor.callAsync('updateConsent', id, dataToSave);
        console.log('Consent updated successfully');
      } else {
        const newId = await Meteor.callAsync('createConsent', dataToSave);
        console.log('Consent created successfully:', newId);
        if (!newId) {
          console.error('No ID returned from createConsent - consent may not have been saved');
          alert('Consent save failed - no ID returned');
        } else {
          navigate('/consents');
        }
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving consent:', error);
      console.error('Error details:', error.details);
      console.error('Error reason:', error.reason);
      alert(`Error saving consent: ${error.message || error.reason || 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this consent?')) {
      try {
        await Meteor.callAsync('removeConsent', id);
        navigate('/consents');
      } catch (error) {
        console.error('Error deleting consent:', error);
        alert(`Error deleting consent: ${error.message}`);
      }
    }
  };

  // Handle cancel
  function handleCancel() {
    if (isExistingConsent) {
      setIsEditing(false);
      // Reload original data
      let existingConsent = Consents.findOne({_id: id});
      if (existingConsent) {
        setConsent(existingConsent);
      }
    } else {
      navigate('/consents');
    }
  }

  // Build the header title
  let headerTitle = 'New Consent';
  if (isExistingConsent) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new consents */}
        {!isNewConsent && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new consents (always form) */}
        {!isNewConsent && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Edit toggle — only for existing records */}
        {!isNewConsent && (
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
        {!isNewConsent && (
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
        <ConsentFormView
          resource={consent}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveConsentButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
            >
              {id ? 'Update' : 'Save'} Consent
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    return <ConsentPreview resource={consent} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="consentDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
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

export default ConsentDetail;
