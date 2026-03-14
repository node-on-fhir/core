// /imports/ui-fhir/communications/CommunicationDetail.jsx

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
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

import CommunicationFormView from './CommunicationFormView';
import CommunicationPreview from './CommunicationPreview';

function CommunicationDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var communicationId = _params.id || null;

  console.log('CommunicationDetail - communicationId from params:', communicationId);
  console.log('Is new communication?', communicationId === 'new');

  // Subscribe to Communications collection
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Communications', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('communications.all');
    }
    return handle.ready();
  }, []);

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    const patient = Session.get('selectedPatient');
    console.log('Selected patient from Session:', patient);
    return patient;
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [communication, setCommunication] = useState({
    resourceType: "Communication",
    status: "in-progress",
    category: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "185347001",
        display: "Encounter documentation"
      }],
      text: "Encounter documentation"
    }],
    subject: {
      reference: "",
      display: ""
    },
    topic: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "409073007",
        display: "Education"
      }],
      text: "Education"
    }],
    sent: moment().format('YYYY-MM-DDTHH:mm:ss'),
    recipient: [{
      reference: "",
      display: ""
    }],
    sender: {
      reference: "",
      display: ""
    },
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "444971000124105",
        display: "Annual health maintenance"
      }],
      text: "Annual health maintenance"
    }],
    payload: [{
      contentString: ""
    }],
    note: [{
      text: ""
    }],
    medium: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationMode",
        code: "WRITTEN",
        display: "written"
      }],
      text: "Written communication"
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setCommunication(function(prev) {
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
      props.onResourceChange(communication);
    }
  }, [communication]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchType, setSearchType] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const isNewCommunication = !communicationId || communicationId === 'new';
  const isExistingCommunication = communicationId && communicationId !== 'new';

  // Load existing communication
  useEffect(() => {
    if (communicationId && communicationId !== 'new') {
      const existingCommunication = Communications.findOne({_id: communicationId}) || Communications.findOne({id: communicationId});
      if (existingCommunication) {
        setCommunication(existingCommunication);
        setIsEditing(false);
      }
    }
  }, [communicationId]);

  // Set default values for new communications
  useEffect(() => {
    if (!communicationId || communicationId === 'new') {
      // Enable editing for new communications
      setIsEditing(true);

      // Set patient if selected
      if (selectedPatient) {
        // Get patient name - similar to ServiceRequestDetail pattern
        const patientName = get(selectedPatient, 'name[0].text', '') ||
                          `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim() ||
                          FhirUtilities.pluckName(selectedPatient);

        // Use FHIR id for reference - NOT MongoDB _id (per CLAUDE.md anti-pattern guidance)
        const patientFhirId = get(selectedPatient, 'id', '');
        const patientReference = `Patient/${patientFhirId}`;

        console.log('Setting patient in communication:', { patientReference, patientName, patientFhirId });

        setCommunication(prev => ({
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          }
        }));
      } else {
        console.log('No selected patient found in Session');
      }

      // Set sender as current user
      if (currentUser) {
        setCommunication(prev => ({
          ...prev,
          sender: {
            reference: `Practitioner/${currentUser._id}`,
            display: currentUser.username || 'Current User'
          }
        }));
      }
    } else {
      // Viewing existing communication - start in read-only mode
      setIsEditing(false);
    }
  }, [communicationId, selectedPatient, currentUser]);

  // Handler functions
  const handleChange = (path, value) => {
    pendingUpdate.current = true;
    const newCommunication = {...communication};
    set(newCommunication, path, value);
    setCommunication(newCommunication);
  };

  const handleSearchUser = (type) => {
    setSearchType(type);
    setSearchDialogOpen(true);

    // Load search results based on type
    if (type === 'subject') {
      const patients = Patients.find({}).fetch();
      setSearchResults(patients.map(p => ({
        id: p._id,
        display: get(p, 'name[0].text', '') ||
                 `${get(p, 'name[0].given[0]', '')} ${get(p, 'name[0].family', '')}`.trim() ||
                 FhirUtilities.pluckName(p),
        reference: `Patient/${p._id}`
      })));
    } else if (type === 'sender' || type === 'recipient') {
      const practitioners = Practitioners.find({}).fetch();
      setSearchResults(practitioners.map(p => ({
        id: p._id,
        display: FhirUtilities.pluckName(p),
        reference: `Practitioner/${p.id || p._id}`
      })));
    }
  };

  const handleSelectSearchResult = (result) => {
    if (searchType === 'subject') {
      handleChange('subject', {
        reference: result.reference,
        display: result.display
      });
    } else if (searchType === 'sender') {
      handleChange('sender', {
        reference: result.reference,
        display: result.display
      });
    } else if (searchType === 'recipient') {
      handleChange('recipient.0', {
        reference: result.reference,
        display: result.display
      });
    }
    setSearchDialogOpen(false);
  };

  const handleSaveButton = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare data for save - only include fields that the validated method accepts
      const dataToSave = {
        resourceType: 'Communication',
        status: get(communication, 'status', 'in-progress'),
        subject: get(communication, 'subject'),
        sender: get(communication, 'sender'),
        recipient: get(communication, 'recipient'),
        sent: get(communication, 'sent'),
        received: get(communication, 'received'),
        payload: get(communication, 'payload'),
        category: get(communication, 'category'),
        medium: get(communication, 'medium'),
        identifier: get(communication, 'identifier'),
        note: get(communication, 'note')
      };

      console.log('Data being saved:', dataToSave);
      console.log('Subject reference:', get(dataToSave, 'subject.reference'));
      console.log('Subject display:', get(dataToSave, 'subject.display'));

      if (communicationId && communicationId !== 'new') {
        await Meteor.callAsync('communications.update', { _id: communicationId, update: dataToSave });
        console.log('Communication updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('communications.insert', dataToSave);
        console.log('Communication created successfully:', newId);
        // Navigate back to communications list for new communications
        navigate('/communications');
      }
    } catch (error) {
      console.error('Error saving communication:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteButton = async () => {
    if (window.confirm('Are you sure you want to delete this communication?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('communications.removeById', { _id: communicationId });
        console.log('Communication deleted successfully');
        navigate('/communications');
      } catch (error) {
        console.error('Error deleting communication:', error);
        setError(error.message);
        setLoading(false);
      }
    }
  };

  const handleCancelButton = () => {
    if (communicationId === 'new') {
      navigate('/communications');
    } else {
      // Reload original data
      const existingCommunication = Communications.findOne({_id: communicationId});
      if (existingCommunication) {
        setCommunication(existingCommunication);
      }
      setIsEditing(false);
    }
  };

  // Build the header title
  let headerTitle = 'New Communication';
  if (isExistingCommunication) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{communicationId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewCommunication && (
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

        {/* Form toggle */}
        {!isNewCommunication && (
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

        {/* Lock / Unlock toggle */}
        {!isNewCommunication && (
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

        {/* Delete */}
        {!isNewCommunication && (
          <Button
              id="deleteButton"
              onClick={handleDeleteButton}
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
        <CommunicationFormView
          resource={communication}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchUser={handleSearchUser}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="saveCommunicationButton"
              onClick={handleSaveButton}
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
      <CommunicationPreview
        resource={communication}
        resourceId={communicationId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="communicationDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

      {/* Search Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Select {searchType === 'subject' ? 'Patient' : searchType === 'sender' ? 'Sender' : 'Recipient'}
        </DialogTitle>
        <DialogContent>
          <List>
            {searchResults.map((result) => (
              <ListItem
                key={result.id}
                button
                onClick={() => handleSelectSearchResult(result)}
              >
                <ListItemText primary={result.display} secondary={result.reference} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default CommunicationDetail;
