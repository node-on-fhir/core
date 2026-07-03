// packages/pacio-core/client/components/pfe/PfeScoreCard.jsx
//
// Summary card showing physical/mental health T-scores from PROMIS-10.

import React from 'react';
import { get } from 'lodash';

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';

import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PsychologyIcon from '@mui/icons-material/Psychology';

function PfeScoreCard(props) {
  const { observation } = props;

  if (!observation) {
    return null;
  }

  const components = get(observation, 'component', []);

  // Extract physical and mental health scores
  let physicalScore = null;
  let mentalScore = null;

  components.forEach(function(component) {
    const code = get(component, 'code.coding[0].code', '');
    const value = get(component, 'valueQuantity.value', null);

    if (code === '71969-0') {
      physicalScore = value;
    } else if (code === '71967-4') {
      mentalScore = value;
    }
  });

  function getScoreColor(score) {
    if (score === null) return 'default';
    if (score >= 16) return 'success';
    if (score >= 12) return 'warning';
    return 'error';
  }

  function getScoreLabel(score) {
    if (score === null) return 'N/A';
    // Raw score range for 4 items is 4-20
    if (score >= 16) return 'Good';
    if (score >= 12) return 'Fair';
    return 'Poor';
  }

  // Normalize score to 0-100 range for progress bar (raw range 4-20)
  function normalizeScore(score) {
    if (score === null) return 0;
    return Math.min(100, Math.max(0, ((score - 4) / 16) * 100));
  }

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title="PROMIS-10 Scores"
        subheader={get(observation, 'effectiveDateTime', '')}
        titleTypographyProps={{ variant: 'subtitle1' }}
      />
      <CardContent>
        {/* Physical Health Score */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FitnessCenterIcon fontSize="small" color="primary" />
              <Typography variant="body2">Physical Health</Typography>
            </Box>
            <Chip
              label={physicalScore !== null ? physicalScore + ' - ' + getScoreLabel(physicalScore) : 'N/A'}
              color={getScoreColor(physicalScore)}
              size="small"
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={normalizeScore(physicalScore)}
            color={getScoreColor(physicalScore)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Mental Health Score */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon fontSize="small" color="secondary" />
              <Typography variant="body2">Mental Health</Typography>
            </Box>
            <Chip
              label={mentalScore !== null ? mentalScore + ' - ' + getScoreLabel(mentalScore) : 'N/A'}
              color={getScoreColor(mentalScore)}
              size="small"
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={normalizeScore(mentalScore)}
            color={getScoreColor(mentalScore)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default PfeScoreCard;
