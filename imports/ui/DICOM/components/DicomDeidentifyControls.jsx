// imports/ui/DICOM/components/DicomDeidentifyControls.jsx
// Shared pre-upload de-identification / tag-filter controls, used by the
// /dicom/upload page and data-importer's BinaryImportPreview so the two
// surfaces stay in lockstep. Pure controlled component: state lives in the
// parent as one bag (see DEFAULT_DEID_CONTROLS), processing itself happens
// in imports/ui/DICOM/utils/DicomProcessing.js.

import React, { useState } from 'react';
import { get } from 'lodash';
import {
  Box,
  Switch,
  Checkbox,
  Collapse,
  FormControlLabel,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Button,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  RemoveCircleOutline as RemoveIcon
} from '@mui/icons-material';

import { normalizeTag } from '../utils/DicomProcessing';

export const DEFAULT_DEID_CONTROLS = {
  anonymizeEnabled: false,
  regenerateUids: false,
  patientName: 'ANON^PATIENT',
  patientId: 'ANON^ID',
  setRules: [],   // [{ tag, value }]
  dropTags: []    // ['GGGGEEEE']
};

/**
 * Translate the control-bag state into processDicomArrayBuffer options.
 * Returns null when no processing is requested (caller should take the
 * untouched-bytes path). uidMapper is only attached when both anonymize
 * and regenerateUids are on.
 */
export function buildProcessingOptions(controls, uidMapper) {
  const anonymize = !!get(controls, 'anonymizeEnabled');
  const setRules = get(controls, 'setRules', []);
  const dropTags = get(controls, 'dropTags', []);

  if (!anonymize && setRules.length === 0 && dropTags.length === 0) {
    return null;
  }

  return {
    anonymize: anonymize,
    replacements: {
      patientName: get(controls, 'patientName') || 'ANON^PATIENT',
      patientId: get(controls, 'patientId') || 'ANON^ID'
    },
    setRules: setRules,
    dropTags: dropTags,
    uidMapper: (anonymize && get(controls, 'regenerateUids')) ? uidMapper : null
  };
}

function DicomDeidentifyControls({ value, onChange, disabled }) {
  const controls = value || DEFAULT_DEID_CONTROLS;

  const [newSetTag, setNewSetTag] = useState('');
  const [newSetValue, setNewSetValue] = useState('');
  const [newDropTag, setNewDropTag] = useState('');
  const [tagError, setTagError] = useState(null);

  const update = function(patch) {
    if (onChange) {
      onChange({ ...controls, ...patch });
    }
  };

  const handleAddSetRule = function() {
    try {
      const tag = normalizeTag(newSetTag);
      update({ setRules: controls.setRules.concat([{ tag: tag, value: newSetValue }]) });
      setNewSetTag('');
      setNewSetValue('');
      setTagError(null);
    } catch (err) {
      setTagError(err.message);
    }
  };

  const handleRemoveSetRule = function(index) {
    update({
      setRules: controls.setRules.filter(function(_, i) { return i !== index; })
    });
  };

  const handleAddDropTag = function() {
    try {
      const tag = normalizeTag(newDropTag);
      if (controls.dropTags.indexOf(tag) === -1) {
        update({ dropTags: controls.dropTags.concat([tag]) });
      }
      setNewDropTag('');
      setTagError(null);
    } catch (err) {
      setTagError(err.message);
    }
  };

  const handleRemoveDropTag = function(tag) {
    update({
      dropTags: controls.dropTags.filter(function(t) { return t !== tag; })
    });
  };

  return (
    <Box id="dicomDeidentifyControls" sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Switch
            id="dicomDeidentifySwitch"
            checked={controls.anonymizeEnabled}
            onChange={function(event) { update({ anonymizeEnabled: event.target.checked }); }}
            disabled={disabled}
          />
        }
        label="De-identify before upload"
      />

      <Collapse in={controls.anonymizeEnabled}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1, mb: 1 }}>
          <TextField
            id="deidPatientNameInput"
            label="Replacement patient name"
            size="small"
            value={controls.patientName}
            onChange={function(event) { update({ patientName: event.target.value }); }}
            disabled={disabled}
          />
          <TextField
            id="deidPatientIdInput"
            label="Replacement patient ID"
            size="small"
            value={controls.patientId}
            onChange={function(event) { update({ patientId: event.target.value }); }}
            disabled={disabled}
          />
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              id="deidRegenerateUidsCheckbox"
              checked={controls.regenerateUids}
              onChange={function(event) { update({ regenerateUids: event.target.checked }); }}
              disabled={disabled}
            />
          }
          label="Regenerate UIDs (keeps study grouping across this batch)"
        />
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 1 }}>
          Runs entirely in your browser — identified bytes never leave this machine.
          Dates, physician and institution fields are emptied; patient name/ID are replaced.
        </Typography>
      </Collapse>

      <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} id="advancedTagFiltersSummary" sx={{ px: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Advanced tag filters (set / drop)
            {(controls.setRules.length + controls.dropTags.length) > 0 &&
              ' — ' + (controls.setRules.length + controls.dropTags.length) + ' active'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          {/* Set rules */}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Set replaces the value of existing elements (multi-valued elements collapse
            to the one replacement); it does not add missing elements.
          </Typography>
          {controls.setRules.map(function(rule, index) {
            return (
              <Box key={rule.tag + '-' + index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip label={rule.tag} size="small" />
                <Typography variant="body2" sx={{ flex: 1 }}>= {rule.value}</Typography>
                <IconButton
                  size="small"
                  onClick={function() { handleRemoveSetRule(index); }}
                  disabled={disabled}
                  aria-label="Remove set rule"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'flex-start' }}>
            <TextField
              id="setRuleTagInput"
              label="Tag (e.g. 0008,0080)"
              size="small"
              value={newSetTag}
              onChange={function(event) { setNewSetTag(event.target.value); }}
              disabled={disabled}
            />
            <TextField
              id="setRuleValueInput"
              label="Value"
              size="small"
              value={newSetValue}
              onChange={function(event) { setNewSetValue(event.target.value); }}
              disabled={disabled}
            />
            <Button
              id="addSetRuleButton"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddSetRule}
              disabled={disabled || !newSetTag}
            >
              Set
            </Button>
          </Box>

          {/* Drop tags */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'flex-start' }}>
            <TextField
              id="dropTagInput"
              label="Tag to drop (e.g. 0008,1030)"
              size="small"
              value={newDropTag}
              onChange={function(event) { setNewDropTag(event.target.value); }}
              disabled={disabled}
            />
            <Button
              id="addDropTagButton"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddDropTag}
              disabled={disabled || !newDropTag}
            >
              Drop
            </Button>
          </Box>
          {controls.dropTags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {controls.dropTags.map(function(tag) {
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={disabled ? undefined : function() { handleRemoveDropTag(tag); }}
                  />
                );
              })}
            </Box>
          )}

          {tagError && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 1 }}>
              {tagError}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default DicomDeidentifyControls;
