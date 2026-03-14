// imports/ui-fhir/measures/MeasureFormView.jsx

import React from 'react';

import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';

//===========================================================================
// COMPONENT

function MeasureFormView({ resource, isEditing, onChange, isEmbedded }) {
  return (
    <Grid container spacing={3}>
      {/* Basic Information */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Basic Information</Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="identifierInput"
          fullWidth
          label="Identifier"
          value={get(resource, 'identifier[0].value', '')}
          onChange={(e) => onChange('identifier[0].value', e.target.value)}
          disabled={!isEditing}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="versionInput"
          fullWidth
          label="Version"
          value={get(resource, 'version', '')}
          onChange={(e) => onChange('version', e.target.value)}
          disabled={!isEditing}
          required
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="nameInput"
          fullWidth
          label="Name (Computer Friendly)"
          value={get(resource, 'name', '')}
          onChange={(e) => onChange('name', e.target.value)}
          disabled={!isEditing}
          required
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="titleInput"
          fullWidth
          label="Title (Human Friendly)"
          value={get(resource, 'title', '')}
          onChange={(e) => onChange('title', e.target.value)}
          disabled={!isEditing}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            id="statusSelect"
            labelId="status-label"
            value={get(resource, 'status', 'draft')}
            onChange={(e) => onChange('status', e.target.value)}
            disabled={!isEditing}
            label="Status"
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="retired">Retired</MenuItem>
            <MenuItem value="unknown">Unknown</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel id="improvement-notation-label">Improvement Notation</InputLabel>
          <Select
            id="improvementNotationSelect"
            labelId="improvement-notation-label"
            value={get(resource, 'improvementNotation.coding[0].code', 'increase')}
            onChange={(e) => {
              var notations = {
                'increase': 'Increased score indicates improvement',
                'decrease': 'Decreased score indicates improvement'
              };
              onChange('improvementNotation.coding[0].code', e.target.value);
              onChange('improvementNotation.coding[0].display', notations[e.target.value]);
            }}
            disabled={!isEditing}
            label="Improvement Notation"
          >
            <MenuItem value="increase">Increase</MenuItem>
            <MenuItem value="decrease">Decrease</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Descriptions */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Descriptions</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="descriptionTextarea"
          fullWidth
          multiline
          rows={3}
          label="Description"
          value={get(resource, 'description', '')}
          onChange={(e) => onChange('description', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="purposeTextarea"
          fullWidth
          multiline
          rows={3}
          label="Purpose"
          value={get(resource, 'purpose', '')}
          onChange={(e) => onChange('purpose', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="usageTextarea"
          fullWidth
          multiline
          rows={2}
          label="Usage"
          value={get(resource, 'usage', '')}
          onChange={(e) => onChange('usage', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Dates */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Dates</Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="effectivePeriodStartInput"
          fullWidth
          label="Effective Period Start"
          type="date"
          value={get(resource, 'effectivePeriod.start', '')}
          onChange={(e) => onChange('effectivePeriod.start', e.target.value)}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="effectivePeriodEndInput"
          fullWidth
          label="Effective Period End"
          type="date"
          value={get(resource, 'effectivePeriod.end', '')}
          onChange={(e) => onChange('effectivePeriod.end', e.target.value)}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="lastReviewDateInput"
          fullWidth
          label="Last Review Date"
          type="date"
          value={get(resource, 'lastReviewDate', '')}
          onChange={(e) => onChange('lastReviewDate', e.target.value)}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="approvalDateInput"
          fullWidth
          label="Approval Date"
          type="date"
          value={get(resource, 'approvalDate', '')}
          onChange={(e) => onChange('approvalDate', e.target.value)}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Additional Fields */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Additional Information</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="copyrightTextarea"
          fullWidth
          multiline
          rows={2}
          label="Copyright"
          value={get(resource, 'copyright', '')}
          onChange={(e) => onChange('copyright', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="guidanceTextarea"
          fullWidth
          multiline
          rows={3}
          label="Guidance"
          value={get(resource, 'guidance', '')}
          onChange={(e) => onChange('guidance', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="rateAggregationInput"
          fullWidth
          label="Rate Aggregation"
          value={get(resource, 'rateAggregation', '')}
          onChange={(e) => onChange('rateAggregation', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="clinicalRecommendationStatementTextarea"
          fullWidth
          multiline
          rows={3}
          label="Clinical Recommendation Statement"
          value={get(resource, 'clinicalRecommendationStatement', '')}
          onChange={(e) => onChange('clinicalRecommendationStatement', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="disclaimerTextarea"
          fullWidth
          multiline
          rows={2}
          label="Disclaimer"
          value={get(resource, 'disclaimer', '')}
          onChange={(e) => onChange('disclaimer', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="riskAdjustmentTextarea"
          fullWidth
          multiline
          rows={2}
          label="Risk Adjustment"
          value={get(resource, 'riskAdjustment', '')}
          onChange={(e) => onChange('riskAdjustment', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="rationaleTextarea"
          fullWidth
          multiline
          rows={3}
          label="Rationale"
          value={get(resource, 'rationale', '')}
          onChange={(e) => onChange('rationale', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>
    </Grid>
  );
}

export default MeasureFormView;
