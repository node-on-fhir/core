// /imports/ui-fhir/consents/ConsentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { 
  Container,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';
import moment from 'moment';

import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { FhirUtilities } from '../../lib/FhirUtilities';

export function ConsentDetail(props) {
  const { id } = useParams();
  const navigate = useNavigate();
  
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
  
  const [isEditing, setIsEditing] = useState(!id);

  // Subscribe to consents and track subscription status
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if(autoPublishEnabled){
      handle = Meteor.subscribe('autopublish.Consents', {}, {});
    } else {
      handle = Meteor.subscribe('consents.all');
    }
    return handle.ready();
  }, []);

  // Load existing consent if editing
  useEffect(() => {
    if (id && isSubscriptionReady) {
      console.log('ConsentDetail - Looking for consent with id:', id);
      console.log('ConsentDetail - Subscription ready:', isSubscriptionReady);
      const existingConsent = Consents.findOne({_id: id});
      console.log('ConsentDetail - Found consent:', existingConsent);
      if (existingConsent) {
        console.log('ConsentDetail - Loading consent data:', JSON.stringify(existingConsent, null, 2));
        setConsent(existingConsent);
        setIsEditing(false); // Switch to view mode when loading existing
      } else {
        console.warn('ConsentDetail - No consent found with id:', id);
        // Check if any consents exist
        const allConsents = Consents.find().fetch();
        console.log('ConsentDetail - Total consents in collection:', allConsents.length);
        if (allConsents.length > 0) {
          console.log('ConsentDetail - First consent id:', allConsents[0]._id);
        }
      }
    }
  }, [id, isSubscriptionReady]);
  
  // Track patient from session
  const selectedPatient = useTracker(() => Session.get('selectedPatient'), []);
  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  
  // Set patient from session for new consents
  useEffect(() => {
    if (!id && selectedPatient) {
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
    } else if (!id && !selectedPatient) {
      console.log('ConsentDetail useEffect - No selected patient in Session');
    }
  }, [id, selectedPatient, selectedPatientId]);

  const handleChange = (path, value) => {
    const updated = {...consent};
    set(updated, path, value);
    
    // Special handling for patient display to preserve reference
    if (path === 'patient.display' && consent.patient?.reference) {
      // Preserve the existing reference when updating display
      updated.patient.reference = consent.patient.reference;
    }
    
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
      console.log('ConsentDetail - About to save consent:', JSON.stringify(dataToSave, null, 2));
      console.log('ConsentDetail - Patient reference:', dataToSave.patient?.reference);
      console.log('ConsentDetail - Patient display:', dataToSave.patient?.display);
      console.log('ConsentDetail - Full patient object:', dataToSave.patient);
      console.log('ConsentDetail - Category:', dataToSave.category);
      console.log('ConsentDetail - Status:', dataToSave.status);
      
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }} id="consentDetailPage">
      <Card>
        <CardHeader 
          title={
            <Typography variant="h4">
              {id ? 'Edit Consent' : 'New Consent'}
            </Typography>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="statusSelect"
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Status"
                value={get(consent, 'status', '')}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={!isEditing}
              >
                <option value="draft">Draft</option>
                <option value="proposed">Proposed</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
                <option value="entered-in-error">Entered in Error</option>
              </TextField>
            </Grid>

            {/* Date/Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="dateTimeInput"
                fullWidth
                type="date"
                label="Date"
                value={moment(get(consent, 'dateTime')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('dateTime', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="categoryInput"
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Category"
                value={get(consent, 'category.0.coding.0.code', '')}
                onChange={(e) => {
                  const categoryMap = {
                    'IDSCL': 'Information disclosure',
                    'RESEARCH': 'Research information access',
                    'RSDID': 'Research subject directory',
                    'RSREID': 'Research re-identification'
                  };
                  handleChange('category.0', {
                    coding: [{
                      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                      code: e.target.value,
                      display: categoryMap[e.target.value] || e.target.value
                    }],
                    text: categoryMap[e.target.value] || e.target.value
                  });
                }}
                disabled={!isEditing}
              >
                <option value="">Select a category</option>
                <option value="IDSCL">Information disclosure</option>
                <option value="RESEARCH">Research information access</option>
                <option value="RSDID">Research subject directory</option>
                <option value="RSREID">Research re-identification</option>
              </TextField>
            </Grid>

            {/* Patient */}
            <Grid item xs={12}>
              <TextField
                id="patientDisplay"
                fullWidth
                label="Patient"
                value={get(consent, 'patient.display', '')}
                onChange={(e) => handleChange('patient.display', e.target.value)}
                disabled={!isEditing}
                helperText={get(consent, 'patient.reference', '') || 'No patient reference set'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for patient">
                        <IconButton
                          onClick={handleSearchUser}
                          edge="end"
                          disabled={!isEditing}
                        >
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Scope */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="scopeInput"
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Scope"
                value={get(consent, 'scope.coding.0.code', '')}
                onChange={(e) => {
                  const scopeMap = {
                    'patient-privacy': 'Privacy Consent',
                    'treatment': 'Treatment',
                    'research': 'Research',
                    'adr': 'Advanced Care Directive'
                  };
                  handleChange('scope', {
                    coding: [{
                      system: 'http://terminology.hl7.org/CodeSystem/consentscope',
                      code: e.target.value,
                      display: scopeMap[e.target.value] || e.target.value
                    }]
                  });
                }}
                disabled={!isEditing}
              >
                <option value="">Select a scope</option>
                <option value="patient-privacy">Privacy Consent</option>
                <option value="treatment">Treatment</option>
                <option value="research">Research</option>
                <option value="adr">Advanced Care Directive</option>
              </TextField>
            </Grid>

            {/* Policy Rule */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="policyRuleInput"
                fullWidth
                label="Policy Rule"
                value={get(consent, 'policyRule.text', '')}
                onChange={(e) => {
                  handleChange('policyRule', {
                    coding: [{
                      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                      code: 'OPTIN'
                    }],
                    text: e.target.value
                  });
                }}
                disabled={!isEditing}
                helperText="Policy rule for consent"
              />
            </Grid>

            {/* Organization */}
            <Grid item xs={12}>
              <TextField
                id="organizationInput"
                fullWidth
                label="Organization"
                value={get(consent, 'organization.0.display', '')}
                onChange={(e) => handleChange('organization.0.display', e.target.value)}
                disabled={!isEditing}
                helperText="Organization that manages the consent"
              />
            </Grid>

            {/* Source Reference */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="sourceReferenceInput"
                fullWidth
                label="Source Reference"
                value={get(consent, 'sourceReference.reference', '')}
                onChange={(e) => handleChange('sourceReference.reference', e.target.value)}
                disabled={!isEditing}
                helperText="Reference to source consent document"
              />
            </Grid>

            {/* Source Display */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="sourceDisplayInput"
                fullWidth
                label="Source Display"
                value={get(consent, 'sourceReference.display', '')}
                onChange={(e) => handleChange('sourceReference.display', e.target.value)}
                disabled={!isEditing}
                helperText="Display text for source document"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={get(consent, 'note.0.text', '')}
                onChange={(e) => handleChange('note.0.text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {isEditing ? (
              <>
                <Button
                  id="saveConsentButton"
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                >
                  {id ? 'Update' : 'Save'} Consent
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => id ? setIsEditing(false) : navigate('/consents')}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/consents')}
                >
                  Back to List
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ConsentDetail;