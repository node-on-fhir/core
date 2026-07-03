// packages/vital-signs/client/components/panels/VitalSignsPanel.jsx

import React from 'react';
import PropTypes from 'prop-types';

import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';

import { get } from 'lodash';
import moment from 'moment';

// Helper function to determine trend
function getTrendIcon(currentValue, previousValue) {
  if (!previousValue || !currentValue) return <RemoveIcon fontSize="small" />;
  
  const current = parseFloat(currentValue);
  const previous = parseFloat(previousValue);
  
  if (current > previous) return <TrendingUpIcon fontSize="small" color="error" />;
  if (current < previous) return <TrendingDownIcon fontSize="small" color="success" />;
  return <RemoveIcon fontSize="small" />;
}

// Helper function to get status color based on value
function getStatusColor(value, type) {
  const numValue = parseFloat(value);
  
  // Define normal ranges for common vital signs
  const ranges = {
    'heart-rate': { low: 60, high: 100 },
    'blood-pressure-systolic': { low: 90, high: 140 },
    'blood-pressure-diastolic': { low: 60, high: 90 },
    'respiratory-rate': { low: 12, high: 20 },
    'oxygen-saturation': { low: 95, high: 100 },
    'body-temperature': { low: 97.0, high: 99.0 }
  };
  
  const range = ranges[type];
  if (!range) return 'default';
  
  if (numValue < range.low) return 'warning';
  if (numValue > range.high) return 'error';
  return 'success';
}

// Component for displaying individual vital sign
function VitalSignCard(props) {
  const { vitalSign, previousValue, onRefresh } = props;
  
  const code = get(vitalSign, 'code.coding[0].code', '');
  const display = get(vitalSign, 'code.text', get(vitalSign, 'code.coding[0].display', ''));
  const value = get(vitalSign, 'valueQuantity.value', get(vitalSign, 'valueString', ''));
  const unit = get(vitalSign, 'valueQuantity.unit', '');
  const effectiveDateTime = get(vitalSign, 'effectiveDateTime');
  const status = get(vitalSign, 'status', 'unknown');
  
  // Determine vital type for styling
  let vitalType = 'unknown';
  if (code === '8867-4') vitalType = 'heart-rate';
  else if (code === '8480-6') vitalType = 'blood-pressure-systolic';
  else if (code === '8462-4') vitalType = 'blood-pressure-diastolic';
  else if (code === '9279-1') vitalType = 'respiratory-rate';
  else if (code === '2708-6') vitalType = 'oxygen-saturation';
  else if (code === '8310-5') vitalType = 'body-temperature';
  
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {display}
            </Typography>
            {getTrendIcon(value, previousValue)}
          </Box>
          
          <Box display="flex" alignItems="baseline" gap={1}>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {unit}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip 
              label={status} 
              size="small" 
              color={getStatusColor(value, vitalType)}
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {moment(effectiveDateTime).fromNow()}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

VitalSignCard.propTypes = {
  vitalSign: PropTypes.object.isRequired,
  previousValue: PropTypes.string,
  onRefresh: PropTypes.func
};

// Main panel component
function VitalSignsPanel(props) {
  const {
    vitalSigns,
    title,
    onRefresh,
    onViewHistory,
    showRefreshButton,
    gridColumns,
    ...otherProps
  } = props;
  
  // Group vital signs by type and get the most recent
  const latestVitals = {};
  const previousVitals = {};
  
  if (vitalSigns && Array.isArray(vitalSigns)) {
    // Sort by date descending
    const sorted = [...vitalSigns].sort((a, b) => {
      const dateA = new Date(get(a, 'effectiveDateTime', 0));
      const dateB = new Date(get(b, 'effectiveDateTime', 0));
      return dateB - dateA;
    });
    
    // Group by code and get latest and previous
    sorted.forEach(function(vital) {
      const code = get(vital, 'code.coding[0].code', '');
      if (!latestVitals[code]) {
        latestVitals[code] = vital;
      } else if (!previousVitals[code]) {
        previousVitals[code] = vital;
      }
    });
  }
  
  return (
    <Card {...otherProps}>
      <CardHeader
        title={title}
        action={
          showRefreshButton && (
            <Tooltip title="Refresh vital signs">
              <IconButton onClick={onRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )
        }
      />
      <Divider />
      <CardContent>
        {Object.keys(latestVitals).length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No vital signs recorded
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {Object.entries(latestVitals).map(([code, vitalSign]) => (
              <Grid item xs={12} sm={6} md={gridColumns ? 12 / gridColumns : 4} key={code}>
                <VitalSignCard
                  vitalSign={vitalSign}
                  previousValue={get(previousVitals[code], 'valueQuantity.value')}
                  onRefresh={onRefresh}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

VitalSignsPanel.propTypes = {
  vitalSigns: PropTypes.array,
  title: PropTypes.string,
  onRefresh: PropTypes.func,
  onViewHistory: PropTypes.func,
  showRefreshButton: PropTypes.bool,
  gridColumns: PropTypes.number
};

VitalSignsPanel.defaultProps = {
  vitalSigns: [],
  title: 'Vital Signs',
  showRefreshButton: true,
  gridColumns: 3
};

export default VitalSignsPanel;