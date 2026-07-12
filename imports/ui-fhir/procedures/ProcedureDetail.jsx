// /imports/ui-fhir/procedures/ProcedureDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import {
  Container,
  Button,
  Box,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Dialog
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import ProcedureFormView from '/imports/ui-fhir/procedures/ProcedureFormView';
import ProcedurePreview from '/imports/ui-fhir/procedures/ProcedurePreview';

// Import the collections directly - avoids timing issues
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';

const log = (Meteor.Logger ? Meteor.Logger.for('ProcedureDetail') : console);

//===========================================================================
// COMPONENT

function ProcedureDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  console.log('ProcedureDetail component rendered with id:', id);

  const [procedure, setProcedure] = useState({
    resourceType: 'Procedure',
    status: 'completed',
    subject: {},
    performer: [{
      actor: {}
    }],
    performedDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    code: {
      coding: [{}]
    },
    category: {
      coding: [{}]
    },
    bodySite: [{
      coding: [{}]
    }],
    reasonCode: [{
      coding: [{}]
    }],
    location: {},
    note: [{}]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setProcedure(function(prev) {
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
      props.onResourceChange(procedure);
    }
  }, [procedure]);


  const [isEditing, setIsEditing] = useState(isNewRecord || isEmbedded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Subscribe to procedures
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('autopublish.Procedures', {}, {}).ready();
    } else {
      return Meteor.subscribe('procedures.all').ready();
    }
  }, []);

  // Fetch existing procedure
  useEffect(() => {
    if (isExistingRecord) {
      const existingProcedure = Procedures.findOne({ _id: id }) || Procedures.findOne({ id: id });
      if (existingProcedure) {
        setProcedure(existingProcedure);
        setIsEditing(false);
      }
    } else if (isNewRecord) {
      setIsEditing(true);

      // Set default patient if selected
      const selectedPatientId = Session.get('selectedPatientId');
      const selectedPatient = Session.get('selectedPatient');

      if (selectedPatient && selectedPatientId) {
        setProcedure(prev => ({
          ...prev,
          subject: {
            reference: `Patient/${selectedPatientId}`,
            display: get(selectedPatient, 'name[0].text', '')
          }
        }));
      }
    }
  }, [id]);

  const handleChange = (path, value) => {
    pendingUpdate.current = true;
    const newProcedure = cloneDeep(procedure);
    set(newProcedure, path, value);
    setProcedure(newProcedure);
  };

  const handleSave = async () => {
    console.log('=== ProcedureDetail handleSave called ===');
    console.log('Original procedure data:', procedure);

    const dataToSave = cloneDeep(procedure);

    // Ensure we have required fields
    if (!dataToSave.meta) {
      dataToSave.meta = {};
    }
    dataToSave.meta.lastUpdated = new Date();

    // Convert performedDateTime string to Date object if present
    if (dataToSave.performedDateTime && typeof dataToSave.performedDateTime === 'string') {
      dataToSave.performedDateTime = new Date(dataToSave.performedDateTime);
    }

    // Ensure performer has reference if display is set
    if (get(dataToSave, 'performer[0].actor.display') && !get(dataToSave, 'performer[0].actor.reference')) {
      set(dataToSave, 'performer[0].actor.reference', `Practitioner/${Random.id()}`);
    }

    if (isNewRecord) {
      // Create new procedure
      dataToSave._id = Random.id();
      if (!dataToSave.meta.versionId) {
        dataToSave.meta.versionId = '1';
      }

      console.log('Creating new procedure with data:', dataToSave);

      setLoading(true);
      setError(null);

      try {
        const result = await Meteor.callAsync('createProcedure', dataToSave);
        console.log('Procedure created successfully with result:', result);
        navigate('/procedures');
      } catch (error) {
        console.error('Create error:', error);
        if (error.error === 'validation-error') {
          setError('Validation Error: ' + error.reason);
        } else if (error.error === 'not-authorized') {
          setError('Authorization Error: You must be logged in to create procedures');
        } else {
          setError('Error creating procedure: ' + (error.reason || error.message || 'Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Update existing procedure
      setLoading(true);
      setError(null);

      try {
        const result = await Meteor.callAsync('updateProcedure', id, dataToSave);
        console.log('Procedure updated successfully:', result);
        setIsEditing(false);
      } catch (error) {
        console.error('Update error:', error);
        setError('Error updating procedure: ' + (error.reason || error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (isExistingRecord) {
      // Reload original data
      const existingProcedure = Procedures.findOne({ _id: id });
      if (existingProcedure) {
        setProcedure(existingProcedure);
      }
      setIsEditing(false);
    } else {
      navigate('/procedures');
    }
  };

  const handleDelete = async () => {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this procedure?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeProcedure', id);
        console.log('Procedure deleted');
        navigate('/procedures');
      } catch (error) {
        console.error('Delete error:', error);
        setError('Error deleting procedure: ' + (error.reason || error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearchUser = () => {
    console.log('Search user clicked');
    setPatientSearchOpen(true);
  };

  const handlePatientSelect = (patientId, patient) => {
    log.phi('Patient selected:', { patientId, patient }, { action: 'read' });
    setProcedure(prev => ({
      ...prev,
      subject: {
        reference: `Patient/${patientId}`,
        display: get(patient, 'name[0].text', get(patient, 'name', ''))
      }
    }));
    setPatientSearchOpen(false);
  };

  // Build the header title
  let headerTitle = 'New Record';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle — hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
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
        {isExistingRecord && (
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
        {isExistingRecord && (
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

  // Form view with all editable fields
  function renderFormView() {
    return (
      <Box>
        <ProcedureFormView
          resource={procedure}
          form={procedure}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
        />

        {/* Inline Save/Cancel bar */}
        {isEditing && !isEmbedded && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveProcedureButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Preview view with formatted read-only display
  function renderPreviewView() {
    return (
      <ProcedurePreview
        resource={procedure}
        resourceId={isExistingRecord ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="procedureDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

      {/* Patient Search Dialog */}
      <Dialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PatientSearchDialog
          onSelect={handlePatientSelect}
          defaultSearchTerm={get(procedure, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default ProcedureDetail;
