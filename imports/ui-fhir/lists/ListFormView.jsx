// imports/ui-fhir/lists/ListFormView.jsx

import React, { useState } from 'react';

import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  List as MuiList,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

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

//===========================================================================
// COMPONENT

function ListFormView({ resource, isEditing, onChange, isEmbedded }) {
  const [newItemReference, setNewItemReference] = useState('');
  const [newItemDisplay, setNewItemDisplay] = useState('');

  function handleAddItem() {
    if (newItemReference && newItemDisplay) {
      var entries = get(resource, 'entry', []).slice();
      entries.push({
        flag: { text: '' },
        deleted: false,
        date: moment().format('YYYY-MM-DDTHH:mm:ss'),
        item: {
          reference: newItemReference,
          display: newItemDisplay
        }
      });
      onChange('entry', entries);
      setNewItemReference('');
      setNewItemDisplay('');
    }
  }

  function handleRemoveItem(index) {
    var entries = get(resource, 'entry', []).slice();
    entries.splice(index, 1);
    onChange('entry', entries);
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">List Information</Typography>

      <TextField
        id="titleInput"
        fullWidth
        label="List Title"
        value={get(resource, 'title', '')}
        onChange={(e) => onChange('title', e.target.value)}
        helperText="Title of the list"
        disabled={!isEditing}
      />

      <TextField
        id="patientNameInput"
        fullWidth
        label="Patient Name"
        value={get(resource, 'subject.display', '')}
        helperText={get(resource, 'subject.reference', '') || 'Patient reference will be assigned'}
        disabled
      />

      <TextField
        id="sourceNameInput"
        fullWidth
        label="Source Name"
        value={get(resource, 'source.display', '')}
        onChange={(e) => onChange('source.display', e.target.value)}
        helperText={get(resource, 'source.reference', '') || 'Source reference will be assigned'}
        disabled={!isEditing}
      />

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Status</InputLabel>
        <Select
          id="statusSelect"
          value={get(resource, 'status', 'current')}
          onChange={(e) => onChange('status', e.target.value)}
          label="Status"
        >
          {statusOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Mode</InputLabel>
        <Select
          id="modeSelect"
          value={get(resource, 'mode', 'working')}
          onChange={(e) => onChange('mode', e.target.value)}
          label="Mode"
        >
          {modeOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>List Type</InputLabel>
        <Select
          id="listTypeSelect"
          value={get(resource, 'code.coding[0].code', '')}
          onChange={(e) => {
            var option = listTypeOptions.find(function(o) { return o.code === e.target.value; });
            onChange('code.coding[0].code', option.code);
            onChange('code.coding[0].display', option.display);
            onChange('code.text', option.display);
          }}
          label="List Type"
        >
          {listTypeOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Order By</InputLabel>
        <Select
          id="orderBySelect"
          value={get(resource, 'orderedBy.coding[0].code', 'system')}
          onChange={(e) => {
            var option = orderByOptions.find(function(o) { return o.code === e.target.value; });
            onChange('orderedBy.coding[0].code', option.code);
            onChange('orderedBy.coding[0].display', option.display);
          }}
          label="Order By"
        >
          {orderByOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <TextField
        id="dateInput"
        fullWidth
        type="datetime-local"
        label="Date"
        value={moment(get(resource, 'date', '')).format('YYYY-MM-DDTHH:mm')}
        onChange={(e) => onChange('date', e.target.value)}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={get(resource, 'note[0].text', '')}
        onChange={(e) => onChange('note[0].text', e.target.value)}
        helperText="Additional notes about the list"
        disabled={!isEditing}
      />

      {/* List Items Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          List Items ({get(resource, 'entry', []).length})
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
          {get(resource, 'entry', []).length === 0 ? (
            <ListItem>
              <ListItemText primary="No items in this list" secondary="Add items using the form above" />
            </ListItem>
          ) : (
            get(resource, 'entry', []).map(function(entry, index) {
              return (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={get(entry, 'item.display', 'Unnamed Item')}
                    secondary={
                      <>
                        {get(entry, 'item.reference', 'No reference')}
                        {get(entry, 'date') && (' - Added: ' + moment(get(entry, 'date')).format('MMM D, YYYY'))}
                      </>
                    }
                  />
                  {isEditing && (
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={function() { handleRemoveItem(index); }}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              );
            })
          )}
        </MuiList>
      </Box>
    </Stack>
  );
}

export default ListFormView;
