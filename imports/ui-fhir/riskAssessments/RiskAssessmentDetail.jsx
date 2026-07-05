// imports/ui-fhir/riskAssessments/RiskAssessmentDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import { RiskAssessments } from '/imports/lib/schemas/SimpleSchemas/RiskAssessments';

import RiskAssessmentFormView from './RiskAssessmentFormView';
import RiskAssessmentPreview from './RiskAssessmentPreview';

export function RiskAssessmentDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [riskAssessmentId, setRiskAssessmentId] = useState(false);

  const [riskAssessment, setRiskAssessment] = useState({
    resourceType: 'RiskAssessment',
    status: 'preliminary',
    subject: {},
    performer: {},
    date: new Date().toISOString().split('T')[0],
    occurrenceDateTime: '',
    code: {},
    method: {},
    prediction: [],
    mitigation: ''
  });

  const [form, setForm] = useState({
    status: 'preliminary',
    date: new Date().toISOString().split('T')[0],
    codeText: '',
    methodText: '',
    prediction: '',
    mitigation: '',
    occurrenceDateTime: '',
    performerDisplay: '',
    subjectDisplay: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setRiskAssessment(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewReport = !id || id === 'new';
  const isExistingReport = riskAssessmentId && riskAssessmentId !== 'new';

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.RiskAssessments', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('riskassessments.all');
    }
    return handle.ready();
  }, []);

  // Load risk assessment data
  useEffect(function() {
    if (id && id !== 'new') {
      setRiskAssessmentId(id);
      setIsEditing(false);

      // Try to load from collection first
      var existingRiskAssessment = RiskAssessments.findOne({_id: id});

      // Fallback: try by id field
      if (!existingRiskAssessment) {
        existingRiskAssessment = RiskAssessments.findOne({id: id});
      }

      if (existingRiskAssessment) {
        setRiskAssessment(existingRiskAssessment);
        setForm({
          status: get(existingRiskAssessment, 'status', 'preliminary'),
          date: get(existingRiskAssessment, 'date', '').split('T')[0],
          codeText: get(existingRiskAssessment, 'code.text', get(existingRiskAssessment, 'code.coding.0.display', '')),
          methodText: get(existingRiskAssessment, 'method.text', get(existingRiskAssessment, 'method.coding.0.display', '')),
          prediction: get(existingRiskAssessment, 'prediction.0.outcome.text', ''),
          mitigation: get(existingRiskAssessment, 'mitigation', ''),
          occurrenceDateTime: get(existingRiskAssessment, 'occurrenceDateTime', '').substring(0, 16),
          performerDisplay: get(existingRiskAssessment, 'performer.display', ''),
          subjectDisplay: get(existingRiskAssessment, 'subject.display', '')
        });
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
      // New risk assessment - set patient from Session
      var selectedPatient = Session.get('selectedPatient');
      var patientDisplay = '';
      var patientReference = '';

      if (selectedPatient) {
        patientReference = 'Patient/' + get(selectedPatient, 'id', selectedPatient._id);
        if (get(selectedPatient, 'name.0.text')) {
          patientDisplay = get(selectedPatient, 'name.0.text');
        } else {
          patientDisplay = get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', '');
        }
      }

      setRiskAssessment(function(prev) {
        return Object.assign({}, prev, {
          subject: {
            reference: patientReference,
            display: patientDisplay
          }
        });
      });
      setForm(function(prev) {
        return Object.assign({}, prev, {
          subjectDisplay: patientDisplay
        });
      });
    }
  }, [id, isSubscriptionReady]);

  function handleChange(name, value) {
    pendingUpdate.current = true;
    var newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Also update the resource object for fields that map back
    setRiskAssessment(function(prev) {
      var updated = Object.assign({}, prev);
      if (name === 'status') { set(updated, 'status', value); }
      if (name === 'date') { set(updated, 'date', value); }
      if (name === 'codeText') { set(updated, 'code.text', value); }
      if (name === 'methodText') { set(updated, 'method.text', value); }
      if (name === 'prediction') { set(updated, 'prediction.0.outcome.text', value); }
      if (name === 'mitigation') { set(updated, 'mitigation', value); }
      if (name === 'occurrenceDateTime') { set(updated, 'occurrenceDateTime', value); }
      if (name === 'performerDisplay') { set(updated, 'performer.display', value); }
      if (name === 'subjectDisplay') { set(updated, 'subject.display', value); }
      return updated;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(riskAssessment);
    }
  }, [riskAssessment]);

  async function handleSave() {
    setIsLoading(true);

    try {
      var dataToSave = {
        status: form.status,
        subject: get(riskAssessment, 'subject', {}),
        subjectDisplay: form.subjectDisplay,
        performer: get(riskAssessment, 'performer', {}),
        performerDisplay: form.performerDisplay,
        date: form.date,
        occurrenceDateTime: form.occurrenceDateTime,
        code: form.codeText,
        codeCode: get(riskAssessment, 'code.coding.0.code', ''),
        method: form.methodText,
        prediction: form.prediction,
        mitigation: form.mitigation
      };

      if (riskAssessmentId && riskAssessmentId !== 'new') {
        await Meteor.callAsync('riskAssessments.update', riskAssessmentId, dataToSave);
        console.log('Risk assessment updated:', riskAssessmentId);
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('riskAssessments.insert', dataToSave);
        console.log('Risk assessment created:', newId);
        navigate('/risk-assessments');
      }
    } catch (saveError) {
      console.error('Error saving risk assessment:', saveError);
      setError(saveError.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (!riskAssessmentId || riskAssessmentId === 'new') return;

    if (window.confirm('Are you sure you want to delete this risk assessment?')) {
      Meteor.call('riskAssessments.remove', riskAssessmentId, function(deleteError) {
        if (deleteError) {
          console.error('Error deleting risk assessment:', deleteError);
          setError(deleteError.message);
        } else {
          console.log('Risk assessment deleted:', riskAssessmentId);
          navigate('/risk-assessments');
        }
      });
    }
  }

  function handleCancel() {
    if (riskAssessmentId && riskAssessmentId !== 'new') {
      setIsEditing(false);
      setError(null);
      // Reload from collection
      var existingRiskAssessment = RiskAssessments.findOne({_id: riskAssessmentId});
      if (existingRiskAssessment) {
        setRiskAssessment(existingRiskAssessment);
        setForm({
          status: get(existingRiskAssessment, 'status', 'preliminary'),
          date: get(existingRiskAssessment, 'date', '').split('T')[0],
          codeText: get(existingRiskAssessment, 'code.text', get(existingRiskAssessment, 'code.coding.0.display', '')),
          methodText: get(existingRiskAssessment, 'method.text', get(existingRiskAssessment, 'method.coding.0.display', '')),
          prediction: get(existingRiskAssessment, 'prediction.0.outcome.text', ''),
          mitigation: get(existingRiskAssessment, 'mitigation', ''),
          occurrenceDateTime: get(existingRiskAssessment, 'occurrenceDateTime', '').substring(0, 16),
          performerDisplay: get(existingRiskAssessment, 'performer.display', ''),
          subjectDisplay: get(existingRiskAssessment, 'subject.display', '')
        });
      }
    } else {
      navigate('/risk-assessments');
    }
  }

  // Build the header title
  var headerTitle = 'New Risk Assessment';
  if (isExistingReport) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{riskAssessmentId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new records */}
        {!isNewReport && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function(){ setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle -- hidden for new records (always form) */}
        {!isNewReport && (
          <Tooltip title="Form">
            <IconButton
              onClick={function(){ setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle -- only for existing records */}
        {!isNewReport && (
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

        {/* Delete -- only for existing records, gated on edit mode */}
        {!isNewReport && (
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
  function renderFormView(){
    return (
      <>
        <RiskAssessmentFormView
          resource={riskAssessment}
          form={form}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveRiskAssessmentButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <RiskAssessmentPreview
        resource={riskAssessment}
        form={form}
        resourceId={riskAssessmentId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="riskAssessmentDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default RiskAssessmentDetail;
