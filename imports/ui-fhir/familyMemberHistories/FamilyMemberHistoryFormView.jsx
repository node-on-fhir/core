// imports/ui-fhir/familyMemberHistories/FamilyMemberHistoryFormView.jsx

import React, { useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Grid,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Autocomplete,
  Button
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const relationshipOptions = [
  { code: "FTH", display: "Father" },
  { code: "MTH", display: "Mother" },
  { code: "BRO", display: "Brother" },
  { code: "SIS", display: "Sister" },
  { code: "SON", display: "Son" },
  { code: "DAU", display: "Daughter" },
  { code: "GRNFTH", display: "Grandfather" },
  { code: "GRNMTH", display: "Grandmother" },
  { code: "GRNDSON", display: "Grandson" },
  { code: "GRNDDAU", display: "Granddaughter" },
  { code: "UNCLE", display: "Uncle" },
  { code: "AUNT", display: "Aunt" },
  { code: "NEPHEW", display: "Nephew" },
  { code: "NIECE", display: "Niece" },
  { code: "COUSN", display: "Cousin" },
  { code: "HBRO", display: "Half Brother" },
  { code: "HSIS", display: "Half Sister" }
];

const statusOptions = [
  { value: 'partial', label: 'Partial' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'health-unknown', label: 'Health Unknown' }
];

const commonConditions = [
  "Diabetes mellitus",
  "Hypertension",
  "Heart disease",
  "Stroke",
  "Cancer",
  "Breast cancer",
  "Colorectal cancer",
  "Lung cancer",
  "Alzheimer's disease",
  "Depression",
  "Anxiety disorder",
  "Asthma",
  "Arthritis",
  "Kidney disease",
  "Liver disease",
  "Obesity",
  "High cholesterol",
  "Osteoporosis",
  "Glaucoma",
  "Migraine"
];

//===========================================================================
// COMPONENT

function FamilyMemberHistoryFormView({ resource, isEditing, onChange, isEmbedded, onSearchPatient }) {
  var familyMemberHistory = resource || {};

  // Local state for the "add condition" form
  const [currentCondition, setCurrentCondition] = useState({
    code: { coding: [{ system: "", code: "", display: "" }], text: "" },
    onsetAge: { value: null, unit: "years" },
    note: [{ text: "" }]
  });

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  function handleRelationshipChange(event) {
    var selectedRelationship = relationshipOptions.find(function(r) { return r.code === event.target.value; });
    if (selectedRelationship) {
      handleChange('relationship', {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          code: selectedRelationship.code,
          display: selectedRelationship.display
        }],
        text: selectedRelationship.display
      });
    }
  }

  function handleAddCondition() {
    if (currentCondition.code.text) {
      var newCondition = {
        code: {
          coding: [{
            system: "http://snomed.info/sct",
            code: currentCondition.code.text.replace(/\s+/g, '-').toLowerCase(),
            display: currentCondition.code.text
          }],
          text: currentCondition.code.text
        },
        onsetAge: currentCondition.onsetAge.value ? currentCondition.onsetAge : undefined,
        note: currentCondition.note[0].text ? currentCondition.note : []
      };

      var updatedConditions = [...get(familyMemberHistory, 'condition', []), newCondition];
      handleChange('condition', updatedConditions);

      // Reset form
      setCurrentCondition({
        code: { coding: [{ system: "", code: "", display: "" }], text: "" },
        onsetAge: { value: null, unit: "years" },
        note: [{ text: "" }]
      });
    }
  }

  function handleRemoveCondition(index) {
    var updatedConditions = get(familyMemberHistory, 'condition', []).filter(function(_, i) { return i !== index; });
    handleChange('condition', updatedConditions);
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient Reference */}
        <Grid item xs={12}>
          <TextField
            id="patientDisplay"
            fullWidth
            label="Patient"
            value={get(familyMemberHistory, 'patient.display', '')}
            onChange={function(e) { handleChange('patient.display', e.target.value); }}
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for patient">
                    <IconButton
                      onClick={function() { if (typeof onSearchPatient === 'function') { onSearchPatient(); } }}
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

        {/* Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              value={get(familyMemberHistory, 'status', '')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Relationship */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Relationship</InputLabel>
            <Select
              value={get(familyMemberHistory, 'relationship.coding.0.code', '')}
              onChange={handleRelationshipChange}
              label="Relationship"
            >
              {relationshipOptions.map(function(relationship) {
                return (
                  <MenuItem key={relationship.code} value={relationship.code}>
                    {relationship.display}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Name */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Family Member Name (Optional)"
            value={get(familyMemberHistory, 'name', '')}
            onChange={function(e) { handleChange('name', e.target.value); }}
            disabled={!isEditing}
            helperText="Leave blank to use relationship type"
          />
        </Grid>

        {/* Born Date */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Birth Date"
            value={get(familyMemberHistory, 'bornDate', '')}
            onChange={function(e) { handleChange('bornDate', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Age */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Current Age (years)"
            value={get(familyMemberHistory, 'ageAge.value', '')}
            onChange={function(e) { handleChange('ageAge.value', parseInt(e.target.value) || null); }}
            disabled={!isEditing || get(familyMemberHistory, 'deceasedBoolean', false)}
            helperText={get(familyMemberHistory, 'deceasedBoolean', false) ? "Disabled for deceased" : ""}
          />
        </Grid>

        {/* Deceased Toggle */}
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={get(familyMemberHistory, 'deceasedBoolean', false)}
                onChange={function(e) { handleChange('deceasedBoolean', e.target.checked); }}
                disabled={!isEditing}
              />
            }
            label="Deceased"
          />
          {get(familyMemberHistory, 'deceasedBoolean', false) && (
            <TextField
              fullWidth
              type="number"
              label="Age at Death (years)"
              value={get(familyMemberHistory, 'deceasedAge.value', '')}
              onChange={function(e) { handleChange('deceasedAge.value', parseInt(e.target.value) || null); }}
              disabled={!isEditing}
              sx={{ mt: 1 }}
            />
          )}
        </Grid>

        {/* Conditions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Health Conditions
          </Typography>

          {/* Existing conditions */}
          <Box sx={{ mb: 2 }}>
            {get(familyMemberHistory, 'condition', []).map(function(condition, index) {
              return (
                <Chip
                  key={index}
                  label={get(condition, 'code.text', '')}
                  onDelete={isEditing ? function() { handleRemoveCondition(index); } : undefined}
                  color="primary"
                  sx={{ mr: 1, mb: 1 }}
                />
              );
            })}
          </Box>

          {/* Add new condition */}
          {isEditing && (
            <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={commonConditions}
                    value={currentCondition.code.text}
                    onChange={function(event, newValue) {
                      setCurrentCondition(function(prev) {
                        return {
                          ...prev,
                          code: { ...prev.code, text: newValue || '' }
                        };
                      });
                    }}
                    renderInput={function(params) {
                      return (
                        <TextField
                          {...params}
                          label="Condition"
                          placeholder="Type or select condition"
                        />
                      );
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    type="number"
                    label="Age at Onset"
                    value={currentCondition.onsetAge.value || ''}
                    onChange={function(e) {
                      setCurrentCondition(function(prev) {
                        return {
                          ...prev,
                          onsetAge: { ...prev.onsetAge, value: parseInt(e.target.value) || null }
                        };
                      });
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddCondition}
                    disabled={!currentCondition.code.text}
                    fullWidth
                  >
                    Add
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Additional Notes"
                    value={currentCondition.note[0]?.text || ''}
                    onChange={function(e) {
                      setCurrentCondition(function(prev) {
                        return {
                          ...prev,
                          note: [{ text: e.target.value }]
                        };
                      });
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default FamilyMemberHistoryFormView;
