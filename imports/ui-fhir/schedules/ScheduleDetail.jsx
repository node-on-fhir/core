// /imports/ui-fhir/schedules/ScheduleDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  FormControlLabel,
  Switch
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Direct import to avoid timing issues
import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';

import ScheduleFormView from './ScheduleFormView';
import SchedulePreview from './SchedulePreview';

function ScheduleDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  const [scheduleId, setScheduleId] = useState(false);

  // Subscribe to schedules data
  const subscriptionReady = useTracker(function() {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    if(autoSubscribeEnabled) {
      return true;
    }

    const schedulesHandle = Meteor.subscribe('schedules', {});
    return schedulesHandle.ready();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [schedule, setSchedule] = useState({
    resourceType: "Schedule",
    active: true,
    identifier: [{
      system: "",
      value: ""
    }],
    serviceCategory: [{
      coding: [{
        system: "http://example.org/service-category",
        code: "",
        display: ""
      }]
    }],
    serviceType: [{
      coding: [{
        system: "http://example.org/service-type",
        code: "",
        display: ""
      }]
    }],
    specialty: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    }],
    actor: [{
      reference: "",
      display: ""
    }],
    planningHorizon: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'month').format('YYYY-MM-DD')
    },
    comment: "",
    notes: ""
  });

  const [form, setForm] = useState({
    active: true,
    identifierValue: '',
    identifierSystem: '',
    serviceCategoryCode: '',
    serviceCategoryDisplay: '',
    serviceTypeCode: '',
    serviceTypeDisplay: '',
    specialtyCode: '',
    specialtyDisplay: '',
    actorDisplay: '',
    actorReference: '',
    planningHorizonStart: moment().format('YYYY-MM-DD'),
    planningHorizonEnd: moment().add(1, 'month').format('YYYY-MM-DD'),
    comment: '',
    notes: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setSchedule(function(prev) {
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
      props.onResourceChange(schedule);
    }
  }, [schedule]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewSchedule = !id || id === 'new';
  const isExistingSchedule = scheduleId && scheduleId !== 'new';

  // Initialize edit state based on id
  useEffect(function() {
    if (id && id !== 'new') {
      setScheduleId(id);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [id]);

  // Load schedule data when subscription is ready
  useEffect(function() {
    if (id && id !== 'new' && subscriptionReady) {
      var foundSchedule = Schedules.findOne({_id: id});
      if (foundSchedule) {
        console.log('Found schedule:', foundSchedule);
        setSchedule(foundSchedule);
        setForm({
          active: get(foundSchedule, 'active', true),
          identifierValue: get(foundSchedule, 'identifier[0].value', ''),
          identifierSystem: get(foundSchedule, 'identifier[0].system', ''),
          serviceCategoryCode: get(foundSchedule, 'serviceCategory[0].coding[0].code', ''),
          serviceCategoryDisplay: get(foundSchedule, 'serviceCategory[0].coding[0].display', ''),
          serviceTypeCode: get(foundSchedule, 'serviceType[0].coding[0].code', ''),
          serviceTypeDisplay: get(foundSchedule, 'serviceType[0].coding[0].display', ''),
          specialtyCode: get(foundSchedule, 'specialty[0].coding[0].code', ''),
          specialtyDisplay: get(foundSchedule, 'specialty[0].coding[0].display', ''),
          actorDisplay: get(foundSchedule, 'actor[0].display', ''),
          actorReference: get(foundSchedule, 'actor[0].reference', ''),
          planningHorizonStart: get(foundSchedule, 'planningHorizon.start', ''),
          planningHorizonEnd: get(foundSchedule, 'planningHorizon.end', ''),
          comment: get(foundSchedule, 'comment', ''),
          notes: get(foundSchedule, 'notes', '')
        });
      } else {
        console.warn('Schedule not found with id:', id);
      }
    }
  }, [id, subscriptionReady]);

  // Form field handlers
  function handleChange(name, value) {
    pendingUpdate.current = true;
    var newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Also update the resource object for fields that map back
    setSchedule(function(prev) {
      var updated = Object.assign({}, prev);
      if (name === 'active') { set(updated, 'active', value); }
      if (name === 'identifierValue') { set(updated, 'identifier[0].value', value); }
      if (name === 'identifierSystem') { set(updated, 'identifier[0].system', value); }
      if (name === 'serviceCategoryCode') { set(updated, 'serviceCategory[0].coding[0].code', value); }
      if (name === 'serviceCategoryDisplay') { set(updated, 'serviceCategory[0].coding[0].display', value); }
      if (name === 'serviceTypeCode') { set(updated, 'serviceType[0].coding[0].code', value); }
      if (name === 'serviceTypeDisplay') { set(updated, 'serviceType[0].coding[0].display', value); }
      if (name === 'specialtyCode') { set(updated, 'specialty[0].coding[0].code', value); }
      if (name === 'specialtyDisplay') { set(updated, 'specialty[0].coding[0].display', value); }
      if (name === 'actorDisplay') { set(updated, 'actor[0].display', value); }
      if (name === 'actorReference') { set(updated, 'actor[0].reference', value); }
      if (name === 'planningHorizonStart') { set(updated, 'planningHorizon.start', value); }
      if (name === 'planningHorizonEnd') { set(updated, 'planningHorizon.end', value); }
      if (name === 'comment') { set(updated, 'comment', value); }
      if (name === 'notes') { set(updated, 'notes', value); }
      return updated;
    });
  }

  function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (scheduleId && scheduleId !== 'new') {
        // Update existing schedule
        Meteor.call('updateSchedule', scheduleId, schedule, function(saveError, result) {
          setLoading(false);
          if (saveError) {
            console.error('Error updating schedule:', saveError);
            setError(saveError.message);
          } else {
            console.log('Schedule updated successfully');
            navigate('/schedules');
          }
        });
      } else {
        // Create new schedule
        console.log('Attempting to save schedule:', JSON.stringify(schedule, null, 2));

        // Store in window for test debugging
        window.lastScheduleSaveAttempt = {
          schedule: schedule,
          timestamp: new Date().toISOString()
        };

        Meteor.call('createSchedule', schedule, function(saveError, result) {
          setLoading(false);

          // Store result for debugging
          window.lastScheduleSaveResult = {
            error: saveError,
            result: result,
            timestamp: new Date().toISOString()
          };

          if (saveError) {
            console.error('Error creating schedule:', saveError);
            console.error('Error details:', saveError.details);
            console.error('Error reason:', saveError.reason);
            setError(saveError.message || saveError.reason || 'Unknown error');
          } else {
            console.log('Schedule created successfully:', result);
            navigate('/schedules');
          }
        });
      }
    } catch (catchError) {
      setLoading(false);
      setError(catchError.message);
      console.error('Error saving schedule:', catchError);
    }
  }

  function handleDelete() {
    if (!scheduleId || scheduleId === 'new') return;

    if (window.confirm('Are you sure you want to delete this schedule?')) {
      setLoading(true);
      Meteor.call('removeSchedule', scheduleId, function(deleteError, result) {
        setLoading(false);
        if (deleteError) {
          console.error('Error deleting schedule:', deleteError);
          setError(deleteError.message);
        } else {
          console.log('Schedule deleted successfully');
          navigate('/schedules');
        }
      });
    }
  }

  function handleCancel() {
    if (scheduleId && scheduleId !== 'new') {
      setIsEditing(false);
      setError(null);
      // Reload from collection
      var foundSchedule = Schedules.findOne({_id: scheduleId});
      if (foundSchedule) {
        setSchedule(foundSchedule);
        setForm({
          active: get(foundSchedule, 'active', true),
          identifierValue: get(foundSchedule, 'identifier[0].value', ''),
          identifierSystem: get(foundSchedule, 'identifier[0].system', ''),
          serviceCategoryCode: get(foundSchedule, 'serviceCategory[0].coding[0].code', ''),
          serviceCategoryDisplay: get(foundSchedule, 'serviceCategory[0].coding[0].display', ''),
          serviceTypeCode: get(foundSchedule, 'serviceType[0].coding[0].code', ''),
          serviceTypeDisplay: get(foundSchedule, 'serviceType[0].coding[0].display', ''),
          specialtyCode: get(foundSchedule, 'specialty[0].coding[0].code', ''),
          specialtyDisplay: get(foundSchedule, 'specialty[0].coding[0].display', ''),
          actorDisplay: get(foundSchedule, 'actor[0].display', ''),
          actorReference: get(foundSchedule, 'actor[0].reference', ''),
          planningHorizonStart: get(foundSchedule, 'planningHorizon.start', ''),
          planningHorizonEnd: get(foundSchedule, 'planningHorizon.end', ''),
          comment: get(foundSchedule, 'comment', ''),
          notes: get(foundSchedule, 'notes', '')
        });
      }
    } else {
      navigate('/schedules');
    }
  }

  // Build the header title
  var headerTitle = 'New Schedule';
  if (isExistingSchedule) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{scheduleId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new schedules */}
        {!isNewSchedule && (
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

        {/* Form toggle -- hidden for new schedules (always form) */}
        {!isNewSchedule && (
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

        {/* Lock / Unlock toggle -- only for existing schedules */}
        {!isNewSchedule && (
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

        {/* Delete -- only for existing schedules, gated on edit mode */}
        {!isNewSchedule && (
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
        <ScheduleFormView
          resource={schedule}
          form={form}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="saveScheduleButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <SchedulePreview
        resource={schedule}
        form={form}
        resourceId={scheduleId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="scheduleDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default ScheduleDetail;
