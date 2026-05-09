// imports/ui-fhir/medias/MediaFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Grid,
  Divider
} from '@mui/material';

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

const typeOptions = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'photo', label: 'Photo' }
];

const typeMap = {
  'image': 'Image',
  'video': 'Video',
  'audio': 'Audio',
  'photo': 'Photo'
};

//===========================================================================
// COMPONENT

function MediaFormView({ resource, isEditing, onChange, isEmbedded }) {
  var media = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="statusLabel">Status</InputLabel>
            <Select
              id="statusSelect"
              labelId="statusLabel"
              value={get(media, 'status', 'completed')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Type */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="typeLabel">Type</InputLabel>
            <Select
              id="typeSelect"
              labelId="typeLabel"
              value={get(media, 'type.coding[0].code', 'photo')}
              onChange={function(e) {
                handleChange('type.coding[0].code', e.target.value);
                handleChange('type.coding[0].display', typeMap[e.target.value]);
                handleChange('type.text', typeMap[e.target.value]);
              }}
              label="Type"
            >
              {typeOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Modality Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="modalityInput"
            fullWidth
            label="Modality Code"
            value={get(media, 'modality.coding[0].code', '')}
            onChange={function(e) { handleChange('modality.coding[0].code', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Modality Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="modalityDisplayInput"
            fullWidth
            label="Modality Display"
            value={get(media, 'modality.coding[0].display', '') || get(media, 'modality.text', '')}
            onChange={function(e) {
              handleChange('modality.coding[0].display', e.target.value);
              handleChange('modality.text', e.target.value);
            }}
            disabled={!isEditing}
          />
        </Grid>

        {/* View Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="viewInput"
            fullWidth
            label="View Code"
            value={get(media, 'view.coding[0].code', '')}
            onChange={function(e) { handleChange('view.coding[0].code', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* View Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="viewDisplayInput"
            fullWidth
            label="View Display"
            value={get(media, 'view.coding[0].display', '') || get(media, 'view.text', '')}
            onChange={function(e) {
              handleChange('view.coding[0].display', e.target.value);
              handleChange('view.text', e.target.value);
            }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Patient */}
        <Grid item xs={12}>
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(media, 'subject.display', '')}
            onChange={function(e) { handleChange('subject.display', e.target.value); }}
            disabled={!isEditing}
            helperText={get(media, 'subject.reference', '') || 'Patient reference'}
          />
        </Grid>

        {/* Operator */}
        <Grid item xs={12} md={6}>
          <TextField
            id="operatorInput"
            fullWidth
            label="Operator Name"
            value={get(media, 'operator[0].display', '')}
            onChange={function(e) { handleChange('operator[0].display', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="operatorReferenceInput"
            fullWidth
            label="Operator Reference"
            value={get(media, 'operator[0].reference', '')}
            onChange={function(e) { handleChange('operator[0].reference', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Reason Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="reasonCodeInput"
            fullWidth
            label="Reason Code"
            value={get(media, 'reasonCode[0].text', '')}
            onChange={function(e) { handleChange('reasonCode[0].text', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="reasonCodeDisplayInput"
            fullWidth
            label="Reason Code Display"
            value={get(media, 'reasonCode[0].coding[0].display', '')}
            onChange={function(e) { handleChange('reasonCode[0].coding[0].display', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Body Site */}
        <Grid item xs={12} md={6}>
          <TextField
            id="bodySiteInput"
            fullWidth
            label="Body Site"
            value={get(media, 'bodySite.text', '')}
            onChange={function(e) { handleChange('bodySite.text', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="bodySiteDisplayInput"
            fullWidth
            label="Body Site Display"
            value={get(media, 'bodySite.coding[0].display', '')}
            onChange={function(e) { handleChange('bodySite.coding[0].display', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Device */}
        <Grid item xs={12} md={6}>
          <TextField
            id="deviceNameInput"
            fullWidth
            label="Device Name"
            value={get(media, 'deviceName', '')}
            onChange={function(e) { handleChange('deviceName', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="deviceReferenceInput"
            fullWidth
            label="Device Reference"
            value={get(media, 'device.reference', '')}
            onChange={function(e) { handleChange('device.reference', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Dimensions */}
        <Grid item xs={12} md={3}>
          <TextField
            id="heightInput"
            fullWidth
            label="Height"
            type="number"
            value={get(media, 'height', '')}
            onChange={function(e) { handleChange('height', e.target.value ? parseInt(e.target.value) : null); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            id="widthInput"
            fullWidth
            label="Width"
            type="number"
            value={get(media, 'width', '')}
            onChange={function(e) { handleChange('width', e.target.value ? parseInt(e.target.value) : null); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            id="framesInput"
            fullWidth
            label="Frames"
            type="number"
            value={get(media, 'frames', '')}
            onChange={function(e) { handleChange('frames', e.target.value ? parseInt(e.target.value) : null); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            id="durationInput"
            fullWidth
            label="Duration (s)"
            type="number"
            value={get(media, 'duration', '')}
            onChange={function(e) { handleChange('duration', e.target.value ? parseFloat(e.target.value) : null); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Dates */}
        <Grid item xs={12} md={6}>
          <TextField
            id="createdInput"
            fullWidth
            label="Created Date"
            type="date"
            value={moment(get(media, 'created', '')).format('YYYY-MM-DD')}
            onChange={function(e) { handleChange('created', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="issuedInput"
            fullWidth
            label="Issued Date"
            type="date"
            value={moment(get(media, 'issued', '')).format('YYYY-MM-DD')}
            onChange={function(e) { handleChange('issued', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Content Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="h6" gutterBottom>Content</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="contentTypeInput"
            fullWidth
            label="Content Type"
            value={get(media, 'content.contentType', '')}
            onChange={function(e) { handleChange('content.contentType', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="contentSizeInput"
            fullWidth
            label="Content Size (bytes)"
            type="number"
            value={get(media, 'content.size', '')}
            onChange={function(e) { handleChange('content.size', e.target.value ? parseInt(e.target.value) : null); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="contentUrlInput"
            fullWidth
            label="Content URL"
            value={get(media, 'content.url', '')}
            onChange={function(e) { handleChange('content.url', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="contentTitleInput"
            fullWidth
            label="Content Title"
            value={get(media, 'content.title', '')}
            onChange={function(e) { handleChange('content.title', e.target.value); }}
            disabled={!isEditing}
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
            value={get(media, 'note[0].text', '')}
            onChange={function(e) { handleChange('note[0].text', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default MediaFormView;
