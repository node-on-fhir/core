// /imports/ui-fhir/lists/ListDetail.jsx

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
  IconButton,
  List as MuiList,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { get, set } from 'lodash';
import moment from 'moment';

import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function ListDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [list, setList] = useState({
    resourceType: "List",
    status: "current",
    mode: "working",
    title: "",
    code: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/list-example-use-codes",
        code: "",
        display: ""
      }],
      text: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    date: moment().format('YYYY-MM-DDTHH:mm:ss'),
    source: {
      reference: "",
      display: ""
    },
    orderedBy: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/list-order",
        code: "system",
        display: "Sorted by System"
      }]
    },
    note: [{
      text: ""
    }],
    entry: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setList(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [newItemReference, setNewItemReference] = useState('');
  const [newItemDisplay, setNewItemDisplay] = useState('');

  // Set patient name and source on component mount for new lists
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new lists
      setIsEditing(true);
      
      // For new lists, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }
      
      // Set source to current user
      let sourceName = '';
      let sourceReference = '';
      
      if (currentUser) {
        sourceName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        sourceReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setList(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        source: {
          reference: sourceReference,
          display: sourceName
        }
      }));
    } else {
      // Viewing existing list - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load list if editing
  useEffect(function() {
    async function loadList() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('lists.get', id);
          if (result) {
            setList(result);
          }
        } catch (err) {
          console.error('Error loading list:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadList();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedList = { ...list };
    set(updatedList, path, value);
    setList(updatedList);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedList);
    }
  }

  // Handle adding new item to list
  function handleAddItem() {
    if (newItemReference && newItemDisplay) {
      const newEntry = {
        flag: {
          text: ""
        },
        deleted: false,
        date: moment().format('YYYY-MM-DDTHH:mm:ss'),
        item: {
          reference: newItemReference,
          display: newItemDisplay
        }
      };
      
      const updatedList = { ...list };
      if (!updatedList.entry) {
        updatedList.entry = [];
      }
      updatedList.entry.push(newEntry);
      setList(updatedList);
      
      // Clear the input fields
      setNewItemReference('');
      setNewItemDisplay('');
    }
  }

  // Handle removing item from list
  function handleRemoveItem(index) {
    const updatedList = { ...list };
    updatedList.entry.splice(index, 1);
    setList(updatedList);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing list
        await Meteor.callAsync('lists.update', id, list);
        console.log('List updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new list
        const newId = await Meteor.callAsync('lists.create', list);
        console.log('List created with ID:', newId);
        // Navigate back to lists list for new lists
        navigate('/lists');
      }
    } catch (err) {
      console.error('Error saving list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this list?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('lists.remove', id);
        console.log('List deleted successfully');
        navigate('/lists');
      } catch (err) {
        console.error('Error deleting list:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/lists');
  }

  const statusOptions = [
    { code: 'current', display: 'Current' },
    { code: 'retired', display: 'Retired' },
    { code: 'entered-in-error', display: 'Entered in Error' }
  ];

  const modeOptions = [
    { code: 'working', display: 'Working' },
    { code: 'snapshot', display: 'Snapshot' },
    { code: 'changes', display: 'Changes' }
  ];

  const listTypeOptions = [
    { code: 'medications', display: 'Medication List' },
    { code: 'allergies', display: 'Allergy List' },
    { code: 'problems', display: 'Problem List' },
    { code: 'worklist', display: 'Worklist' },
    { code: 'waiting', display: 'Waiting List' },
    { code: 'alerts', display: 'Alert List' },
    { code: 'plans', display: 'Care Plans' }
  ];

  const orderByOptions = [
    { code: 'system', display: 'Sorted by System' },
    { code: 'category', display: 'Sorted by Category' },
    { code: 'patient', display: 'Sorted by Patient' },
    { code: 'user', display: 'Sorted by User' },
    { code: 'priority', display: 'Sorted by Priority' },
    { code: 'event-date', display: 'Sorted by Event Date' },
    { code: 'entry-date', display: 'Sorted by Entry Date' }
  ];

  if (isEmbedded) {
    return (
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="List Title"
          value={get(list, 'title', '')}
          onChange={(e) => handleChange('title', e.target.value)}
          helperText="Title of the list"
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          label="Patient Name"
          value={get(list, 'subject.display', '')}
          helperText={get(list, 'subject.reference', '') || 'Patient reference will be assigned'}
          disabled
        />

        <TextField
          fullWidth
          label="Source Name"
          value={get(list, 'source.display', '')}
          onChange={(e) => handleChange('source.display', e.target.value)}
          helperText={get(list, 'source.reference', '') || 'Source reference will be assigned'}
          disabled={!isEditing}
        />

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            value={get(list, 'status', 'current')}
            onChange={(e) => handleChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Mode</InputLabel>
          <Select
            value={get(list, 'mode', 'working')}
            onChange={(e) => handleChange('mode', e.target.value)}
            label="Mode"
          >
            {modeOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>List Type</InputLabel>
          <Select
            value={get(list, 'code.coding[0].code', '')}
            onChange={(e) => {
              const option = listTypeOptions.find(o => o.code === e.target.value);
              handleChange('code.coding[0].code', option.code);
              handleChange('code.coding[0].display', option.display);
              handleChange('code.text', option.display);
            }}
            label="List Type"
          >
            {listTypeOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Order By</InputLabel>
          <Select
            value={get(list, 'orderedBy.coding[0].code', 'system')}
            onChange={(e) => {
              const option = orderByOptions.find(o => o.code === e.target.value);
              handleChange('orderedBy.coding[0].code', option.code);
              handleChange('orderedBy.coding[0].display', option.display);
            }}
            label="Order By"
          >
            {orderByOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="datetime-local"
          label="Date"
          value={moment(get(list, 'date', '')).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => handleChange('date', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(list, 'note[0].text', '')}
          onChange={(e) => handleChange('note[0].text', e.target.value)}
          helperText="Additional notes about the list"
          disabled={!isEditing}
        />

        {/* List Items Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            List Items ({get(list, 'entry', []).length})
          </Typography>

          {isEditing && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <TextField
                label="Item Reference"
                value={newItemReference}
                onChange={(e) => setNewItemReference(e.target.value)}
                placeholder="e.g., Condition/123"
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Item Display"
                value={newItemDisplay}
                onChange={(e) => setNewItemDisplay(e.target.value)}
                placeholder="e.g., Hypertension"
                size="small"
                sx={{ flex: 1 }}
              />
              <IconButton
                color="primary"
                onClick={handleAddItem}
                disabled={!newItemReference || !newItemDisplay}
              >
                <AddIcon />
              </IconButton>
            </Box>
          )}

          <MuiList sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {get(list, 'entry', []).length === 0 ? (
              <ListItem>
                <ListItemText primary="No items in this list" secondary="Add items using the form above" />
              </ListItem>
            ) : (
              get(list, 'entry', []).map((entry, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={get(entry, 'item.display', 'Unnamed Item')}
                    secondary={
                      <>
                        {get(entry, 'item.reference', 'No reference')}
                        {get(entry, 'date') && ` • Added: ${moment(get(entry, 'date')).format('MMM D, YYYY')}`}
                      </>
                    }
                  />
                  {isEditing && (
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveItem(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))
            )}
          </MuiList>
        </Box>
      </Stack>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit List' : 'New List'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="List Title"
              value={get(list, 'title', '')}
              onChange={(e) => handleChange('title', e.target.value)}
              helperText="Title of the list"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Patient Name"
              value={get(list, 'subject.display', '')}
              helperText={get(list, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              fullWidth
              label="Source Name"
              value={get(list, 'source.display', '')}
              onChange={(e) => handleChange('source.display', e.target.value)}
              helperText={get(list, 'source.reference', '') || 'Source reference will be assigned'}
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                value={get(list, 'status', 'current')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={get(list, 'mode', 'working')}
                onChange={(e) => handleChange('mode', e.target.value)}
                label="Mode"
              >
                {modeOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>List Type</InputLabel>
              <Select
                value={get(list, 'code.coding[0].code', '')}
                onChange={(e) => {
                  const option = listTypeOptions.find(o => o.code === e.target.value);
                  handleChange('code.coding[0].code', option.code);
                  handleChange('code.coding[0].display', option.display);
                  handleChange('code.text', option.display);
                }}
                label="List Type"
              >
                {listTypeOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Order By</InputLabel>
              <Select
                value={get(list, 'orderedBy.coding[0].code', 'system')}
                onChange={(e) => {
                  const option = orderByOptions.find(o => o.code === e.target.value);
                  handleChange('orderedBy.coding[0].code', option.code);
                  handleChange('orderedBy.coding[0].display', option.display);
                }}
                label="Order By"
              >
                {orderByOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              type="datetime-local"
              label="Date"
              value={moment(get(list, 'date', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(list, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about the list"
              disabled={!isEditing}
            />
            
            {/* List Items Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                List Items ({get(list, 'entry', []).length})
              </Typography>
              
              {isEditing && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <TextField
                    label="Item Reference"
                    value={newItemReference}
                    onChange={(e) => setNewItemReference(e.target.value)}
                    placeholder="e.g., Condition/123"
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Item Display"
                    value={newItemDisplay}
                    onChange={(e) => setNewItemDisplay(e.target.value)}
                    placeholder="e.g., Hypertension"
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleAddItem}
                    disabled={!newItemReference || !newItemDisplay}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              )}
              
              <MuiList sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {get(list, 'entry', []).length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No items in this list" secondary="Add items using the form above" />
                  </ListItem>
                ) : (
                  get(list, 'entry', []).map((entry, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={get(entry, 'item.display', 'Unnamed Item')}
                        secondary={
                          <>
                            {get(entry, 'item.reference', 'No reference')}
                            {get(entry, 'date') && ` • Added: ${moment(get(entry, 'date')).format('MMM D, YYYY')}`}
                          </>
                        }
                      />
                      {isEditing && (
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemoveItem(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))
                )}
              </MuiList>
            </Box>
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/lists')}
              >
                Back
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
                    // Cancel editing and reload original data
                    setIsEditing(false);
                    // Reload the list to discard changes
                    async function reloadList() {
                      try {
                        const result = await Meteor.callAsync('lists.get', id);
                        if (result) {
                          setList(result);
                        }
                      } catch (err) {
                        console.error('Error reloading list:', err);
                      }
                    }
                    reloadList();
                  } else {
                    // For new lists, go back
                    navigate('/lists');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default ListDetail;