// imports/ui-fhir/communications/CommunicationFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'not-done', label: 'Not Done' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

//===========================================================================
// COMPONENT

function CommunicationFormView({ resource, isEditing, onChange, isEmbedded, onSearchUser }) {
  var communication = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  function handleSearchClick(type) {
    if (typeof onSearchUser === 'function') {
      onSearchUser(type);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Subject (Patient) */}
        <Grid item xs={12}>
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(communication, 'subject.display', '')}
            onChange={function(e) { handleChange('subject.display', e.target.value); }}
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for patient">
                    <IconButton
                      onClick={function() { handleSearchClick('subject'); }}
                      edge="end"
                      disabled={!isEditing}
                      aria-label="Search for patient"
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
            onChange={function(e) { handleChange('sender.display', e.target.value); }}
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for sender">
                    <IconButton
                      onClick={function() { handleSearchClick('sender'); }}
                      edge="end"
                      disabled={!isEditing}
                      aria-label="Search for sender"
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
            onChange={function(e) { handleChange('recipient.0.display', e.target.value); }}
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for recipient">
                    <IconButton
                      onClick={function() { handleSearchClick('recipient'); }}
                      edge="end"
                      disabled={!isEditing}
                      aria-label="Search for recipient"
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
            onChange={function(e) { handleChange('category.0.coding.0.code', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="categoryDisplay"
            fullWidth
            label="Category Display"
            value={get(communication, 'category.0.coding.0.display', '')}
            onChange={function(e) { handleChange('category.0.coding.0.display', e.target.value); }}
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
              onChange={function(e) { handleChange('status', e.target.value); }}
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
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
            onChange={function(e) { handleChange('medium.0.coding.0.code', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="mediumDisplay"
            fullWidth
            label="Medium Display"
            value={get(communication, 'medium.0.coding.0.display', '')}
            onChange={function(e) { handleChange('medium.0.coding.0.display', e.target.value); }}
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
            onChange={function(e) { handleChange('topic.0.coding.0.code', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="topicDisplay"
            fullWidth
            label="Topic Display"
            value={get(communication, 'topic.0.coding.0.display', '')}
            onChange={function(e) { handleChange('topic.0.coding.0.display', e.target.value); }}
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
            value={get(communication, 'sent') ? moment(get(communication, 'sent', '')).format('YYYY-MM-DDTHH:mm') : ''}
            onChange={function(e) { handleChange('sent', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss')); }}
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
            onChange={function(e) { handleChange('reasonCode.0.coding.0.code', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="reasonDisplay"
            fullWidth
            label="Reason Display"
            value={get(communication, 'reasonCode.0.coding.0.display', '')}
            onChange={function(e) { handleChange('reasonCode.0.coding.0.display', e.target.value); }}
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
            onChange={function(e) { handleChange('payload.0.contentString', e.target.value); }}
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
            onChange={function(e) { handleChange('note.0.text', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default CommunicationFormView;
