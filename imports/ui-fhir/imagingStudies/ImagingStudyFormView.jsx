// imports/ui-fhir/imagingStudies/ImagingStudyFormView.jsx

import React from 'react';

import {
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  InputAdornment,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'available', label: 'Available' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const modalityOptions = [
  { value: 'AR', label: 'Autorefraction' },
  { value: 'BMD', label: 'Bone Mineral Densitometry' },
  { value: 'CR', label: 'Computed Radiography' },
  { value: 'CT', label: 'Computed Tomography' },
  { value: 'DX', label: 'Digital Radiography' },
  { value: 'ECG', label: 'Electrocardiography' },
  { value: 'EPS', label: 'Cardiac Electrophysiology' },
  { value: 'ES', label: 'Endoscopy' },
  { value: 'MG', label: 'Mammography' },
  { value: 'MR', label: 'Magnetic Resonance' },
  { value: 'NM', label: 'Nuclear Medicine' },
  { value: 'OPT', label: 'Ophthalmic Tomography' },
  { value: 'PT', label: 'Positron Emission Tomography' },
  { value: 'PX', label: 'Panoramic X-Ray' },
  { value: 'RF', label: 'Radiofluoroscopy' },
  { value: 'US', label: 'Ultrasound' },
  { value: 'XA', label: 'X-Ray Angiography' }
];

function ImagingStudyFormView({ resource, form, isEditing, onChange, isEmbedded }) {
  var imagingStudy = form || resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  function handleSearchUser() {
    console.log('[ImagingStudyFormView] Search for patient clicked'); // phi-audit: ok
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Patient</Typography>

      {/* Patient Field */}
      <TextField
        id="subjectDisplay"
        fullWidth
        label="Patient"
        value={get(imagingStudy, 'subject.display', '')}
        onChange={function(e) { handleChange('subject.display', e.target.value); }}
        disabled={!isEditing}
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

      <Divider />
      <Typography variant="h6">Study Details</Typography>

      {/* Description */}
      <TextField
        id="descriptionInput"
        fullWidth
        multiline
        rows={2}
        label="Description"
        value={get(imagingStudy, 'description', '')}
        onChange={function(e) { handleChange('description', e.target.value); }}
        helperText="Brief description of the imaging study"
        disabled={!isEditing}
      />

      {/* Started Date/Time */}
      <TextField
        id="startedInput"
        fullWidth
        label="Started Date/Time"
        type="datetime-local"
        value={moment(get(imagingStudy, 'started', '')).format('YYYY-MM-DDTHH:mm')}
        onChange={function(e) { handleChange('started', e.target.value); }}
        disabled={!isEditing}
        InputLabelProps={{
          shrink: true,
        }}
      />

      {/* Series and Instances */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="numberOfSeriesInput"
          fullWidth
          label="Number of Series"
          type="number"
          value={get(imagingStudy, 'numberOfSeries', 1)}
          onChange={function(e) { handleChange('numberOfSeries', parseInt(e.target.value) || 1); }}
          disabled={!isEditing}
          inputProps={{ min: 1 }}
        />
        <TextField
          id="numberOfInstancesInput"
          fullWidth
          label="Number of Instances"
          type="number"
          value={get(imagingStudy, 'numberOfInstances', 1)}
          onChange={function(e) { handleChange('numberOfInstances', parseInt(e.target.value) || 1); }}
          disabled={!isEditing}
          inputProps={{ min: 1 }}
        />
      </Stack>

      <Divider />
      <Typography variant="h6">Procedure</Typography>

      {/* Procedure Code */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="procedureCodeInput"
          fullWidth
          label="Procedure Code"
          value={get(imagingStudy, 'procedureCode[0].coding[0].code', '')}
          onChange={function(e) { handleChange('procedureCode[0].coding[0].code', e.target.value); }}
          helperText="LOINC code"
          disabled={!isEditing}
        />
        <TextField
          id="procedureDisplayInput"
          fullWidth
          label="Procedure Display"
          value={get(imagingStudy, 'procedureCode[0].coding[0].display', '') ||
                 get(imagingStudy, 'procedureCode[0].text', '')}
          onChange={function(e) {
            handleChange('procedureCode[0].coding[0].display', e.target.value);
            handleChange('procedureCode[0].text', e.target.value);
          }}
          disabled={!isEditing}
        />
      </Stack>

      <Divider />
      <Typography variant="h6">Clinical Context</Typography>

      {/* Referrer and Interpreter */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="referrerInput"
          fullWidth
          label="Referrer"
          value={get(imagingStudy, 'referrer.display', '')}
          onChange={function(e) { handleChange('referrer.display', e.target.value); }}
          helperText="Practitioner who referred the patient"
          disabled={!isEditing}
        />
        <TextField
          id="interpreterInput"
          fullWidth
          label="Interpreter"
          value={get(imagingStudy, 'interpreter[0].display', '')}
          onChange={function(e) { handleChange('interpreter[0].display', e.target.value); }}
          helperText="Practitioner who interpreted the images"
          disabled={!isEditing}
        />
      </Stack>

      {/* Reason Code */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="reasonCodeInput"
          fullWidth
          label="Reason Code"
          value={get(imagingStudy, 'reasonCode[0].coding[0].code', '')}
          onChange={function(e) { handleChange('reasonCode[0].coding[0].code', e.target.value); }}
          helperText="SNOMED code"
          disabled={!isEditing}
        />
        <TextField
          id="reasonCodeDisplayInput"
          fullWidth
          label="Reason Display"
          value={get(imagingStudy, 'reasonCode[0].coding[0].display', '') ||
                 get(imagingStudy, 'reasonCode[0].text', '')}
          onChange={function(e) {
            handleChange('reasonCode[0].coding[0].display', e.target.value);
            handleChange('reasonCode[0].text', e.target.value);
          }}
          disabled={!isEditing}
        />
      </Stack>

      <Divider />
      <Typography variant="h6">Status & Imaging</Typography>

      {/* Status and Modality */}
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="statusSelect"
            value={get(imagingStudy, 'status', 'available')}
            label="Status"
            onChange={function(e) { handleChange('status', e.target.value); }}
          >
            {statusOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="modality-label">Modality</InputLabel>
          <Select
            labelId="modality-label"
            id="modalitySelect"
            value={get(imagingStudy, 'modality[0].code', '')}
            label="Modality"
            onChange={function(e) {
              var selected = modalityOptions.find(function(opt){ return opt.value === e.target.value; });
              handleChange('modality[0].code', e.target.value);
              handleChange('modality[0].display', selected ? selected.label : e.target.value);
            }}
          >
            {modalityOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      {/* Endpoint */}
      <TextField
        id="endpointInput"
        fullWidth
        label="Endpoint"
        value={get(imagingStudy, 'endpoint[0].display', '')}
        onChange={function(e) { handleChange('endpoint[0].display', e.target.value); }}
        helperText="Where the images can be accessed"
        disabled={!isEditing}
      />

      {/* Location */}
      <TextField
        id="locationInput"
        fullWidth
        label="Location"
        value={get(imagingStudy, 'location.display', '')}
        onChange={function(e) { handleChange('location.display', e.target.value); }}
        helperText="Where the imaging was performed"
        disabled={!isEditing}
      />

      <Divider />
      <Typography variant="h6">Notes</Typography>

      {/* Notes */}
      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={get(imagingStudy, 'note[0].text', '')}
        onChange={function(e) { handleChange('note[0].text', e.target.value); }}
        helperText="Additional notes about the imaging study"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default ImagingStudyFormView;
