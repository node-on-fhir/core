// /imports/ui-fhir/consents/ConsentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { 
  Container,
  Card,
  CardContent,
  CardHeader,
  CardActions,
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
    if (id && id !== 'new') {
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

  return (
    <Container id="consentDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Consent' : 'New Consent'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
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
                  console.log('=== Category select onChange fired ===');
                  console.log('Selected value:', e.target.value);

                  const categoryMap = {
                    'IDSCL': 'Information disclosure',
                    'RESEARCH': 'Research information access',
                    'RSDID': 'Research subject directory',
                    'RSREID': 'Research re-identification'
                  };

                  const newCategory = {
                    coding: [{
                      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                      code: e.target.value,
                      display: categoryMap[e.target.value] || e.target.value
                    }],
                    text: categoryMap[e.target.value] || e.target.value
                  };

                  console.log('Calling handleChange with category:', JSON.stringify(newCategory, null, 2));
                  handleChange('category.0', newCategory);
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

            {/* Security Label */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="securityLabelSelect"
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Security Label"
                value={get(consent, 'provision.securityLabel.0.code', '') || get(consent, 'provision.provision.0.securityLabel.0.code', '')}
                onChange={(e) => {
                  const securityLabelMap = {
                    'N': 'normal',
                    'R': 'restricted',
                    'V': 'very restricted'
                  };
                  // Try to set at the most nested provision level
                  if (get(consent, 'provision.provision.0')) {
                    handleChange('provision.provision.0.securityLabel.0', {
                      system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                      code: e.target.value,
                      display: securityLabelMap[e.target.value] || e.target.value
                    });
                  } else {
                    handleChange('provision.securityLabel.0', {
                      system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                      code: e.target.value,
                      display: securityLabelMap[e.target.value] || e.target.value
                    });
                  }
                }}
                disabled={!isEditing}
              >
                <option value="">Select security label</option>
                <option value="N">Normal</option>
                <option value="R">Restricted</option>
                <option value="V">Very Restricted</option>
              </TextField>
            </Grid>

            {/* Class */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="classInput"
                fullWidth
                label="Resource Classes"
                value={(() => {
                  const classes = get(consent, 'provision.class') || 
                                get(consent, 'provision.provision.0.class') || [];
                  return classes.map(c => c.code || c.display || c).join(', ');
                })()}
                onChange={(e) => {
                  const classValues = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                  const classes = classValues.map(code => ({
                    code: code,
                    display: code
                  }));
                  // Try to set at the most nested provision level
                  if (get(consent, 'provision.provision.0')) {
                    handleChange('provision.provision.0.class', classes);
                  } else {
                    handleChange('provision.class', classes);
                  }
                }}
                disabled={!isEditing}
                helperText="Comma-separated resource types (e.g., Patient, Observation, Procedure)"
              />
            </Grid>

            {/* Actor Role */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="actorRoleSelect"
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Actor Role"
                value={get(consent, 'provision.actor.0.role.coding.0.code', '') || 
                       get(consent, 'provision.provision.0.actor.0.role.coding.0.code', '')}
                onChange={(e) => {
                  const roleMap = {
                    'PAT': 'patient',
                    'PROV': 'provider',
                    'DELEGATEE': 'delegatee',
                    'GUAR': 'guarantor',
                    'CONSENTER': 'consenter',
                    'CONSENTEE': 'consentee',
                    'SUBJECT': 'subject of consent',
                    'DELEGATOR': 'delegator',
                    'SYSTEM': 'system'
                  };
                  // Try to set at the most nested provision level
                  const path = get(consent, 'provision.provision.0') ? 'provision.provision.0' : 'provision';
                  handleChange(`${path}.actor.0.role`, {
                    coding: [{
                      system: 'http://terminology.hl7.org/CodeSystem/v3-RoleClass',
                      code: e.target.value,
                      display: roleMap[e.target.value] || e.target.value
                    }]
                  });
                }}
                disabled={!isEditing}
              >
                <option value="">Select actor role</option>
                <option value="PAT">Patient</option>
                <option value="PROV">Provider</option>
                <option value="DELEGATEE">Delegatee</option>
                <option value="GUAR">Guarantor</option>
                <option value="CONSENTER">Consenter</option>
                <option value="CONSENTEE">Consentee</option>
                <option value="SUBJECT">Subject of Consent</option>
                <option value="DELEGATOR">Delegator</option>
                <option value="SYSTEM">System</option>
              </TextField>
            </Grid>

            {/* Actor Reference */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="actorReferenceInput"
                fullWidth
                label="Actor Reference"
                value={get(consent, 'provision.actor.0.reference.reference', '') || 
                       get(consent, 'provision.provision.0.actor.0.reference.reference', '')}
                onChange={(e) => {
                  const path = get(consent, 'provision.provision.0') ? 'provision.provision.0' : 'provision';
                  handleChange(`${path}.actor.0.reference.reference`, e.target.value);
                }}
                disabled={!isEditing}
                helperText="Reference to the actor (e.g., Patient/123, Practitioner/456)"
              />
            </Grid>

            {/* Actor Display */}
            <Grid item xs={12}>
              <TextField
                id="actorDisplayInput"
                fullWidth
                label="Actor Display Name"
                value={get(consent, 'provision.actor.0.reference.display', '') || 
                       get(consent, 'provision.provision.0.actor.0.reference.display', '')}
                onChange={(e) => {
                  const path = get(consent, 'provision.provision.0') ? 'provision.provision.0' : 'provision';
                  handleChange(`${path}.actor.0.reference.display`, e.target.value);
                }}
                disabled={!isEditing}
                helperText="Display name for the actor"
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
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/consents')}
              >
                Back to List
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
              >
                Delete
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button 
                onClick={() => {
                  if (id && id !== 'new') {
                    setIsEditing(false);
                  } else {
                    navigate('/consents');
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                id="saveConsentButton"
                onClick={handleSave}
                variant="contained"
                color="primary"
              >
                {id && id !== 'new' ? 'Update' : 'Save'} Consent
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default ConsentDetail;