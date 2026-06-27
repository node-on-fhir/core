// npmPackages/allergy-testing/client/AllergyPanelChecklist.jsx

import React, { useState, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';

import { PANELS, allergenKey } from '../lib/allergyPanels.js';

const CATEGORY_LABELS = {
  food: 'Foods',
  inhalant: 'Inhalants',
  medication: 'Medications',
  venom: 'Venoms / Contact',
  environmental: 'Chemicals / Environmental'
};

// Group a flat allergen list by category, preserving category display order.
function groupByCategory(allergens) {
  const order = ['food', 'inhalant', 'medication', 'venom', 'environmental'];
  const groups = {};
  allergens.forEach(function(a) {
    const cat = a.category || 'environmental';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(a);
  });
  return order.filter((c) => groups[c]).map((c) => ({ category: c, allergens: groups[c] }));
}

export function AllergyPanelChecklist({ patientReference, recordedBy, onSubmitted }) {
  const [level, setLevel] = useState('default');
  const [positives, setPositives] = useState({}); // allergenKey -> allergen
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const panel = PANELS[level];
  const grouped = useMemo(() => groupByCategory(panel.allergens), [level]);
  const positiveList = Object.values(positives);

  function toggleAllergen(allergen) {
    const key = allergenKey(allergen);
    setPositives(function(prev) {
      const next = Object.assign({}, prev);
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = allergen;
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (positiveList.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const ids = await Meteor.callAsync('allergyTesting.submitPanel', patientReference, positiveList, recordedBy);
      setPositives({});
      onSubmitted(ids || []);
    } catch (err) {
      console.error('[allergy-testing] submitPanel failed', err);
      setError(get(err, 'reason', err.message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Choose a panel, mark each positive result, then submit. One AllergyIntolerance
        is created per positive allergen.
      </Typography>

      <ToggleButtonGroup
        value={level}
        exclusive
        size="small"
        onChange={(e, v) => { if (v) setLevel(v); }}
        sx={{ mb: 1 }}
      >
        <ToggleButton value="default">Default</ToggleButton>
        <ToggleButton value="standard">Standard</ToggleButton>
        <ToggleButton value="deluxe">Deluxe</ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2 }}>
        {panel.description} — {panel.allergens.length} allergens
      </Typography>

      {grouped.map(function(group) {
        return (
          <Box key={group.category} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 0.5 }}>
              {CATEGORY_LABELS[group.category] || group.category}
            </Typography>
            <FormGroup row>
              {group.allergens.map(function(allergen) {
                const key = allergenKey(allergen);
                return (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={!!positives[key]}
                        onChange={() => toggleAllergen(allergen)}
                      />
                    }
                    label={allergen.display}
                    sx={{ minWidth: 220 }}
                  />
                );
              })}
            </FormGroup>
          </Box>
        );
      })}

      <Divider sx={{ my: 2 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {positiveList.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Positive results ({positiveList.length}):
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {positiveList.map(function(a) {
              return <Chip key={allergenKey(a)} label={a.display} onDelete={() => toggleAllergen(a)} />;
            })}
          </Stack>
        </Box>
      )}

      <Button
        id="allergyTestingSubmitPanel"
        variant="contained"
        color="primary"
        startIcon={<ScienceIcon />}
        disabled={submitting || positiveList.length === 0}
        onClick={handleSubmit}
      >
        Submit {positiveList.length > 0 ? '(' + positiveList.length + ')' : ''} Results
      </Button>
    </Box>
  );
}

export default AllergyPanelChecklist;
