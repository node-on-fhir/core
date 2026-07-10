// imports/ui-fhir/documentReferences/DocumentReferenceFormView.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Typography,
  Stack
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import LanguageIcon from '@mui/icons-material/Language';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { code: 'current', display: 'Current' },
  { code: 'superseded', display: 'Superseded' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

const docStatusOptions = [
  { code: 'preliminary', display: 'Preliminary' },
  { code: 'final', display: 'Final' },
  { code: 'amended', display: 'Amended' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

const categoryOptions = [
  { code: 'clinical-note', display: 'Clinical Note' },
  { code: 'consent', display: 'Consent' },
  { code: 'advance-directive', display: 'Advance Directive' },
  { code: 'imaging', display: 'Imaging' },
  { code: 'laboratory', display: 'Laboratory' },
  { code: 'procedure', display: 'Procedure' },
  { code: 'questionnaire', display: 'Questionnaire' },
  { code: 'therapy', display: 'Therapy' }
];

const contentTypeOptions = [
  { code: 'text/plain', display: 'Plain Text' },
  { code: 'text/html', display: 'HTML' },
  { code: 'application/pdf', display: 'PDF' },
  { code: 'image/jpeg', display: 'JPEG Image' },
  { code: 'image/png', display: 'PNG Image' },
  { code: 'application/json', display: 'JSON' },
  { code: 'application/xml', display: 'XML' }
];

function DocumentReferenceFormView({ resource, form, isEditing, onChange, isEmbedded }) {
  var documentReference = form || resource || {};
  var navigate = useNavigate();

  function handleSearchUser() {
    console.log('[DocumentReferenceFormView] Opening patient search dialog...'); // phi-audit: ok
  }

  // Send the attachment URL to the Data Import REST API tab for fetching
  // (client-side navigation — no Meteor.absoluteUrl/full reload needed).
  function handleFetchDocumentUrl() {
    var documentUrl = get(documentReference, 'content[0].attachment.url', '');
    if (!documentUrl) { return; }
    navigate('/import-data?tab=rest-api&url=' + encodeURIComponent(documentUrl));
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Document Information</Typography>

      <TextField
        id="subjectDisplay"
        fullWidth
        label="Patient Name"
        value={get(documentReference, 'subject.display', '')}
        helperText={get(documentReference, 'subject.reference', '') || 'Patient reference will be assigned'}
        disabled
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Search for patient">
                <IconButton
                  onClick={handleSearchUser}
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

      <TextField
        fullWidth
        label="Author Name"
        value={get(documentReference, 'author[0].display', '')}
        onChange={(e) => onChange('author[0].display', e.target.value)}
        helperText={get(documentReference, 'author[0].reference', '') || 'Author reference will be assigned'}
        disabled={!isEditing}
      />

      <TextField
        id="contentTitleInput"
        fullWidth
        label="Document Title"
        value={get(documentReference, 'content[0].attachment.title', '')}
        onChange={(e) => onChange('content[0].attachment.title', e.target.value)}
        helperText="Title of the document"
        disabled={!isEditing}
      />

      <TextField
        id="descriptionInput"
        fullWidth
        label="Document Description"
        value={get(documentReference, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        multiline
        rows={2}
        helperText="Brief description of the document"
        disabled={!isEditing}
      />

      <Divider />
      <Typography variant="h6">Classification</Typography>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="statusSelect"
            value={get(documentReference, 'status', 'current')}
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
          <InputLabel>Document Status</InputLabel>
          <Select
            value={get(documentReference, 'docStatus', 'final')}
            onChange={(e) => onChange('docStatus', e.target.value)}
            label="Document Status"
          >
            {docStatusOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Category</InputLabel>
        <Select
          value={get(documentReference, 'category[0].coding[0].code', 'clinical-note')}
          onChange={(e) => {
            const option = categoryOptions.find(function(o) { return o.code === e.target.value; });
            if (option) {
              onChange('category[0].coding[0].code', option.code);
              onChange('category[0].coding[0].display', option.display);
            }
          }}
          label="Category"
        >
          {categoryOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <Stack direction="row" spacing={2}>
        <TextField
          id="typeInput"
          fullWidth
          label="LOINC Code"
          value={get(documentReference, 'type.coding[0].code', '')}
          onChange={(e) => onChange('type.coding[0].code', e.target.value)}
          helperText="LOINC code for document type"
          disabled={!isEditing}
        />

        <TextField
          id="typeDisplayInput"
          fullWidth
          label="Document Type"
          value={get(documentReference, 'type.coding[0].display', '')}
          onChange={(e) => {
            onChange('type.coding[0].display', e.target.value);
            onChange('type.text', e.target.value);
          }}
          helperText="Human-readable document type"
          disabled={!isEditing}
        />
      </Stack>

      <Divider />
      <Typography variant="h6">Content</Typography>

      <TextField
        id="createdInput"
        fullWidth
        type="datetime-local"
        label="Document Date"
        value={moment(get(documentReference, 'date', '')).format('YYYY-MM-DDTHH:mm')}
        onChange={(e) => onChange('date', e.target.value)}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Content Type</InputLabel>
          <Select
            id="contentTypeInput"
            value={get(documentReference, 'content[0].attachment.contentType', 'text/plain')}
            onChange={(e) => onChange('content[0].attachment.contentType', e.target.value)}
            label="Content Type"
          >
            {contentTypeOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <TextField
          id="contentSizeInput"
          fullWidth
          type="number"
          label="Document Size (bytes)"
          value={get(documentReference, 'content[0].attachment.size', '')}
          onChange={(e) => onChange('content[0].attachment.size', parseInt(e.target.value))}
          helperText="Size of the document in bytes"
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="contentUrlInput"
        fullWidth
        label="Document URL"
        value={get(documentReference, 'content[0].attachment.url', '')}
        onChange={(e) => onChange('content[0].attachment.url', e.target.value)}
        helperText="URL where the document can be accessed"
        disabled={!isEditing}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Fetch in Data Import (REST API tab)">
                <span>
                  <IconButton
                    id="fetchDocumentUrlButton"
                    edge="end"
                    onClick={handleFetchDocumentUrl}
                    disabled={!get(documentReference, 'content[0].attachment.url')}
                  >
                    <LanguageIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={4}
        label="Notes"
        value={get(documentReference, 'content[0].attachment.data', '')}
        onChange={(e) => onChange('content[0].attachment.data', e.target.value)}
        helperText="Additional notes or base64 encoded document content"
        disabled={!isEditing}
      />

      <Divider />
      <Typography variant="h6">Context</Typography>

      <TextField
        fullWidth
        label="Custodian Organization"
        value={get(documentReference, 'custodian.display', '')}
        onChange={(e) => onChange('custodian.display', e.target.value)}
        helperText="Organization maintaining the document"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          type="date"
          label="Period Start"
          value={moment(get(documentReference, 'context.period.start', '')).format('YYYY-MM-DD')}
          onChange={(e) => onChange('context.period.start', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          type="date"
          label="Period End"
          value={moment(get(documentReference, 'context.period.end', '')).format('YYYY-MM-DD')}
          onChange={(e) => onChange('context.period.end', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>
    </Stack>
  );
}

export default DocumentReferenceFormView;
