// imports/ui-fhir/questionnaires/QuestionnaireFormView.jsx

import React from 'react';

import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';

var statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'unknown', label: 'Unknown' }
];

function QuestionnaireFormView({ resource, isEditing, onChange, isEmbedded }) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6">Questionnaire Information</Typography>

      <TextField
        id="title"
        fullWidth
        label="Title"
        value={get(resource, 'title', '')}
        onChange={function(e) { onChange('title', e.target.value); }}
        disabled={!isEditing}
        helperText="Human-readable name for this questionnaire"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            id="name"
            fullWidth
            label="Computer Name"
            value={get(resource, 'name', '')}
            onChange={function(e) { onChange('name', e.target.value); }}
            disabled={!isEditing}
            helperText="Computer-friendly name (no spaces)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="version"
            fullWidth
            label="Version"
            value={get(resource, 'version', '')}
            onChange={function(e) { onChange('version', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="publisher"
            fullWidth
            label="Publisher"
            value={get(resource, 'publisher', '')}
            onChange={function(e) { onChange('publisher', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              id="status"
              labelId="status-label"
              value={get(resource, 'status', 'active')}
              onChange={function(e) { onChange('status', e.target.value); }}
              label="Status"
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
        </Grid>
      </Grid>

      <TextField
        id="description"
        fullWidth
        multiline
        rows={2}
        label="Description"
        value={get(resource, 'description', '')}
        onChange={function(e) { onChange('description', e.target.value); }}
        disabled={!isEditing}
        helperText="Natural language description of the questionnaire"
      />

      <TextField
        id="purpose"
        fullWidth
        multiline
        rows={2}
        label="Purpose"
        value={get(resource, 'purpose', '')}
        onChange={function(e) { onChange('purpose', e.target.value); }}
        disabled={!isEditing}
        helperText="Why this questionnaire is defined"
      />

      <Typography variant="h6">Dates & Period</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TextField
            id="approvalDate"
            fullWidth
            label="Approval Date"
            type="date"
            value={get(resource, 'approvalDate', '')}
            onChange={function(e) { onChange('approvalDate', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="lastReviewDate"
            fullWidth
            label="Last Review Date"
            type="date"
            value={get(resource, 'lastReviewDate', '')}
            onChange={function(e) { onChange('lastReviewDate', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="subjectType"
            fullWidth
            label="Subject Type"
            value={get(resource, 'subjectType[0]', 'Patient')}
            onChange={function(e) { onChange('subjectType[0]', e.target.value); }}
            disabled={!isEditing}
            helperText="Resource type that can answer this questionnaire"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="effectivePeriodStart"
            fullWidth
            label="Effective Period Start"
            type="date"
            value={get(resource, 'effectivePeriod.start', '')}
            onChange={function(e) { onChange('effectivePeriod.start', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="effectivePeriodEnd"
            fullWidth
            label="Effective Period End"
            type="date"
            value={get(resource, 'effectivePeriod.end', '')}
            onChange={function(e) { onChange('effectivePeriod.end', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Typography variant="h6">Code</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            id="codeCode"
            fullWidth
            label="Code"
            value={get(resource, 'code[0].code', '')}
            onChange={function(e) { onChange('code[0].code', e.target.value); }}
            disabled={!isEditing}
            helperText="LOINC or other coding system code"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="codeDisplay"
            fullWidth
            label="Code Display"
            value={get(resource, 'code[0].display', '')}
            onChange={function(e) { onChange('code[0].display', e.target.value); }}
            disabled={!isEditing}
            helperText="Human-readable meaning of the code"
          />
        </Grid>
      </Grid>

      <TextField
        id="copyrightTextarea"
        fullWidth
        multiline
        rows={2}
        label="Copyright"
        value={get(resource, 'copyright', '')}
        onChange={function(e) { onChange('copyright', e.target.value); }}
        disabled={!isEditing}
        helperText="Copyright notice for this questionnaire"
      />
    </Stack>
  );
}

export default QuestionnaireFormView;
