// imports/ui-fhir/messageHeaders/MessageHeaderFormView.jsx

import React from 'react';

import {
  FormControl,
  InputAdornment,
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const eventOptions = [
  { code: 'diagnosticreport-provide', display: 'Provide Diagnostic Report' },
  { code: 'communication-request', display: 'Communication Request' },
  { code: 'observation-provide', display: 'Provide Observation' },
  { code: 'patient-link', display: 'Link Patients' },
  { code: 'patient-unlink', display: 'Unlink Patients' },
  { code: 'valueset-expand', display: 'Expand Value Set' },
  { code: 'admin-notify', display: 'Administrative Notification' },
  { code: 'notification', display: 'Event Notification' }
];

const responseCodeOptions = [
  { value: 'ok', display: 'OK' },
  { value: 'transient-error', display: 'Transient Error' },
  { value: 'fatal-error', display: 'Fatal Error' }
];

const reasonOptions = [
  { code: 'admit', display: 'Admit' },
  { code: 'discharge', display: 'Discharge' },
  { code: 'absent', display: 'Absent' },
  { code: 'return', display: 'Return' },
  { code: 'moved', display: 'Moved' },
  { code: 'edit', display: 'Edit' },
  { code: 'routine-notification', display: 'Routine Notification' }
];

//===========================================================================
// COMPONENT

function MessageHeaderFormView({ resource, isEditing, onChange, isEmbedded }) {
  var messageHeader = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  function handleSearchResource() {
    console.log('Opening resource search dialog...');
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Event Information</Typography>

      {isEditing ? (
        <FormControl fullWidth>
          <InputLabel>Event Type</InputLabel>
          <Select
            id="eventCodingInput"
            value={get(messageHeader, 'eventCoding.code', '')}
            onChange={function(e) {
              var option = eventOptions.find(function(o) { return o.code === e.target.value; });
              if (option) {
                handleChange('eventCoding', {
                  system: "http://hl7.org/fhir/message-events",
                  code: option.code,
                  display: option.display
                });
              }
            }}
            label="Event Type"
          >
            <MenuItem value="">
              <em>Not specified</em>
            </MenuItem>
            {eventOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      ) : (
        <TextField
          id="eventCodingInput"
          fullWidth
          label="Event Type"
          value={get(messageHeader, 'eventCoding.display', '') || get(messageHeader, 'eventCoding.code', '')}
          disabled
          inputProps={{
            'data-value': get(messageHeader, 'eventCoding.code', '')
          }}
        />
      )}

      <TextField
        id="eventDisplayInput"
        fullWidth
        label="Event Display"
        value={get(messageHeader, 'eventCoding.display', '')}
        onChange={function(e) { handleChange('eventCoding.display', e.target.value); }}
        disabled={!isEditing}
      />

      <TextField
        id="eventUriInput"
        fullWidth
        label="Event URI"
        value={get(messageHeader, 'eventUri', '')}
        onChange={function(e) { handleChange('eventUri', e.target.value); }}
        disabled={!isEditing}
        placeholder="http://example.org/event-definition"
      />

      <Typography variant="h6">Destination</Typography>

      <TextField
        id="destinationNameInput"
        fullWidth
        label="Destination Name"
        value={get(messageHeader, 'destination[0].name', '')}
        onChange={function(e) { handleChange('destination[0].name', e.target.value); }}
        disabled={!isEditing}
      />

      <TextField
        id="destinationEndpointInput"
        fullWidth
        label="Destination Endpoint"
        value={get(messageHeader, 'destination[0].endpoint', '')}
        onChange={function(e) { handleChange('destination[0].endpoint', e.target.value); }}
        disabled={!isEditing}
        placeholder="http://example.org/endpoint"
      />

      <TextField
        id="destinationTargetInput"
        fullWidth
        label="Destination Target Reference"
        value={get(messageHeader, 'destination[0].target.reference', '')}
        onChange={function(e) { handleChange('destination[0].target.reference', e.target.value); }}
        disabled={!isEditing}
        placeholder="Device/123"
      />

      <TextField
        id="destinationTargetDisplayInput"
        fullWidth
        label="Destination Target Display"
        value={get(messageHeader, 'destination[0].target.display', '')}
        onChange={function(e) { handleChange('destination[0].target.display', e.target.value); }}
        disabled={!isEditing}
      />

      <Typography variant="h6">Sender & Source</Typography>

      <TextField
        id="senderDisplayInput"
        fullWidth
        label="Sender Display"
        value={get(messageHeader, 'sender.display', '')}
        onChange={function(e) { handleChange('sender.display', e.target.value); }}
        disabled={!isEditing}
      />

      <TextField
        id="senderReferenceInput"
        fullWidth
        label="Sender Reference"
        value={get(messageHeader, 'sender.reference', '')}
        onChange={function(e) { handleChange('sender.reference', e.target.value); }}
        disabled={!isEditing}
        placeholder="Organization/123"
      />

      <TextField
        id="sourceNameInput"
        fullWidth
        label="Source Name"
        value={get(messageHeader, 'source.name', '')}
        onChange={function(e) { handleChange('source.name', e.target.value); }}
        disabled={!isEditing}
      />

      <TextField
        id="senderEndpointInput"
        fullWidth
        label="Source Endpoint"
        value={get(messageHeader, 'source.endpoint', '')}
        onChange={function(e) { handleChange('source.endpoint', e.target.value); }}
        disabled={!isEditing}
        placeholder="http://example.org/source"
        required
      />

      <TextField
        id="senderTargetInput"
        fullWidth
        label="Source Software"
        value={get(messageHeader, 'source.software', '')}
        onChange={function(e) { handleChange('source.software', e.target.value); }}
        disabled={!isEditing}
      />

      <TextField
        id="senderTargetDisplayInput"
        fullWidth
        label="Source Version"
        value={get(messageHeader, 'source.version', '')}
        onChange={function(e) { handleChange('source.version', e.target.value); }}
        disabled={!isEditing}
      />

      <Typography variant="h6">Reason & Response</Typography>

      {isEditing ? (
        <FormControl fullWidth>
          <InputLabel>Reason Code</InputLabel>
          <Select
            id="reasonCodeInput"
            value={get(messageHeader, 'reason.coding[0].code', '')}
            onChange={function(e) {
              var option = reasonOptions.find(function(o) { return o.code === e.target.value; });
              if (option) {
                handleChange('reason', {
                  coding: [{
                    system: "http://terminology.hl7.org/CodeSystem/message-reasons-encounter",
                    code: option.code,
                    display: option.display
                  }],
                  text: option.display
                });
              }
            }}
            label="Reason Code"
          >
            <MenuItem value="">
              <em>Not specified</em>
            </MenuItem>
            {reasonOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      ) : (
        <TextField
          id="reasonCodeInput"
          fullWidth
          label="Reason Code"
          value={get(messageHeader, 'reason.coding[0].display', '') || get(messageHeader, 'reason.coding[0].code', '')}
          disabled
          inputProps={{
            'data-value': get(messageHeader, 'reason.coding[0].code', '')
          }}
        />
      )}

      <TextField
        id="reasonDisplayInput"
        fullWidth
        label="Reason Display"
        value={get(messageHeader, 'reason.text', '')}
        onChange={function(e) { handleChange('reason.text', e.target.value); }}
        disabled={!isEditing}
      />

      <TextField
        id="responseIdInput"
        fullWidth
        label="Response Identifier"
        value={get(messageHeader, 'response.identifier', '')}
        onChange={function(e) { handleChange('response.identifier', e.target.value); }}
        disabled={!isEditing}
        placeholder="Original message ID this is responding to"
      />

      {isEditing ? (
        <FormControl fullWidth>
          <InputLabel>Response Code</InputLabel>
          <Select
            id="responseCodeSelect"
            value={get(messageHeader, 'response.code', 'ok')}
            onChange={function(e) { handleChange('response.code', e.target.value); }}
            label="Response Code"
          >
            {responseCodeOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      ) : (
        <TextField
          id="responseCodeSelect"
          fullWidth
          label="Response Code"
          value={(function() {
            var code = get(messageHeader, 'response.code', 'ok');
            var option = responseCodeOptions.find(function(o) { return o.value === code; });
            return option ? option.display : code;
          })()}
          disabled
          inputProps={{
            'data-value': get(messageHeader, 'response.code', 'ok')
          }}
        />
      )}

      <Typography variant="h6">Focus</Typography>

      <TextField
        id="focusTargetInput"
        fullWidth
        label="Focus Reference"
        value={get(messageHeader, 'focus[0].reference', '')}
        onChange={function(e) { handleChange('focus[0].reference', e.target.value); }}
        disabled={!isEditing}
        placeholder="Patient/123"
      />

      <TextField
        id="focusDisplayInput"
        fullWidth
        label="Focus Display"
        value={get(messageHeader, 'focus[0].display', '')}
        onChange={function(e) { handleChange('focus[0].display', e.target.value); }}
        disabled={!isEditing}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Search for resource">
                <IconButton
                  onClick={handleSearchResource}
                  edge="end"
                  disabled={!isEditing}
                  aria-label="Search for resource"
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />

      <Typography variant="h6">Additional Information</Typography>

      <TextField
        id="definitionInput"
        fullWidth
        label="Definition"
        value={get(messageHeader, 'definition', '')}
        onChange={function(e) { handleChange('definition', e.target.value); }}
        disabled={!isEditing}
        placeholder="http://example.org/MessageDefinition/123"
      />

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={4}
        label="Notes"
        value={get(messageHeader, 'note[0].text', '')}
        onChange={function(e) { handleChange('note[0].text', e.target.value); }}
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default MessageHeaderFormView;
