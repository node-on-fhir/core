// /imports/ui-fhir/communications/CommunicationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Chip,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  FormHelperText
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

function CommunicationDetail(props) {
  const navigate = useNavigate();
  const { id: communicationId } = useParams();
  
  console.log('CommunicationDetail - communicationId from params:', communicationId);
  console.log('Is new communication?', communicationId === 'new');
  
  // Subscribe to Communications collection
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if(autoPublishEnabled){
      handle = Meteor.subscribe('autopublish.Communications', {}, {});
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchType, setSearchType] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Load existing communication
  useEffect(() => {
    if (communicationId && communicationId !== 'new' && isSubscriptionReady) {
      const existingCommunication = Communications.findOne({_id: communicationId});
      if (existingCommunication) {
        setCommunication(existingCommunication);
        setIsEditing(false);
      }
    }
  }, [communicationId, isSubscriptionReady]);

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
        // FHIR resources reference each other using FHIR IDs
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

  return (
    <Container id="communicationDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={(!communicationId || communicationId === 'new') ? 'New Communication' : 'Edit Communication'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {(communicationId && communicationId !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{communicationId}</span>
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          <Grid container spacing={3}>
            {/* Subject (Patient) */}
            <Grid item xs={12}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient"
                value={get(communication, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for patient">
                        <IconButton
                          onClick={() => handleSearchUser('subject')}
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

            {/* Sender */}
            <Grid item xs={12} md={6}>
              <TextField
                id="senderDisplay"
                fullWidth
                label="Sender"
                value={get(communication, 'sender.display', '')}
                onChange={(e) => handleChange('sender.display', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for sender">
                        <IconButton
                          onClick={() => handleSearchUser('sender')}
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

            {/* Recipient */}
            <Grid item xs={12} md={6}>
              <TextField
                id="recipientDisplay"
                fullWidth
                label="Recipient"
                value={get(communication, 'recipient.0.display', '')}
                onChange={(e) => handleChange('recipient.0.display', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for recipient">
                        <IconButton
                          onClick={() => handleSearchUser('recipient')}
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

            {/* Category */}
            <Grid item xs={12} md={6}>
              <TextField
                id="categoryCode"
                fullWidth
                label="Category Code"
                value={get(communication, 'category.0.coding.0.code', '')}
                onChange={(e) => handleChange('category.0.coding.0.code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="categoryDisplay"
                fullWidth
                label="Category Display"
                value={get(communication, 'category.0.coding.0.display', '')}
                onChange={(e) => handleChange('category.0.coding.0.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  id="status"
                  labelId="status-label"
                  value={get(communication, 'status', 'in-progress')}
                  label="Status"
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <MenuItem value="preparation">Preparation</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="not-done">Not Done</MenuItem>
                  <MenuItem value="on-hold">On Hold</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Medium */}
            <Grid item xs={12} md={6}>
              <TextField
                id="mediumCode"
                fullWidth
                label="Medium Code"
                value={get(communication, 'medium.0.coding.0.code', '')}
                onChange={(e) => handleChange('medium.0.coding.0.code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="mediumDisplay"
                fullWidth
                label="Medium Display"
                value={get(communication, 'medium.0.coding.0.display', '')}
                onChange={(e) => handleChange('medium.0.coding.0.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Topic */}
            <Grid item xs={12} md={6}>
              <TextField
                id="topicCode"
                fullWidth
                label="Topic Code"
                value={get(communication, 'topic.0.coding.0.code', '')}
                onChange={(e) => handleChange('topic.0.coding.0.code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="topicDisplay"
                fullWidth
                label="Topic Display"
                value={get(communication, 'topic.0.coding.0.display', '')}
                onChange={(e) => handleChange('topic.0.coding.0.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Sent DateTime */}
            <Grid item xs={12}>
              <TextField
                id="sentDateTime"
                fullWidth
                label="Sent Date/Time"
                type="datetime-local"
                value={moment(get(communication, 'sent', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('sent', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss'))}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Reason */}
            <Grid item xs={12} md={6}>
              <TextField
                id="reasonCode"
                fullWidth
                label="Reason Code"
                value={get(communication, 'reasonCode.0.coding.0.code', '')}
                onChange={(e) => handleChange('reasonCode.0.coding.0.code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="reasonDisplay"
                fullWidth
                label="Reason Display"
                value={get(communication, 'reasonCode.0.coding.0.display', '')}
                onChange={(e) => handleChange('reasonCode.0.coding.0.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Payload Content */}
            <Grid item xs={12}>
              <TextField
                id="payloadContent"
                fullWidth
                multiline
                rows={4}
                label="Message Content"
                value={get(communication, 'payload.0.contentString', '')}
                onChange={(e) => handleChange('payload.0.contentString', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                value={get(communication, 'note.0.text', '')}
                onChange={(e) => handleChange('note.0.text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && communicationId && communicationId !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button
                variant="outlined"
                onClick={() => navigate('/communications')}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteButton}
                disabled={loading}
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button
                variant="outlined"
                onClick={handleCancelButton}
                disabled={loading}
              >
                Cancel
              </Button>
              {communicationId && communicationId !== 'new' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteButton}
                  disabled={loading}
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
              )}
              <Button
                id="saveCommunicationButton"
                variant="contained"
                onClick={handleSaveButton}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
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