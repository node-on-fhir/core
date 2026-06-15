// packages/vital-signs/client/charts/nivo/VitalSignsChart.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ResponsiveLine } from '@nivo/line';

import {
  Card,
  CardHeader,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider,
  Stack,
  Chip,
  useTheme
} from '@mui/material';

import { get, groupBy } from 'lodash';
import moment from 'moment';

// Define vital sign configurations with normal ranges
const VITAL_SIGN_CONFIG = {
  '8867-4': {
    name: 'Heart Rate',
    color: '#f44336',
    unit: 'bpm',
    normalRange: { min: 60, max: 100 }
  },
  '8480-6': {
    name: 'Systolic BP',
    color: '#9c27b0',
    unit: 'mmHg',
    normalRange: { min: 90, max: 120 }
  },
  '8462-4': {
    name: 'Diastolic BP',
    color: '#673ab7',
    unit: 'mmHg',
    normalRange: { min: 60, max: 80 }
  },
  '8310-5': {
    name: 'Body Temperature',
    color: '#ff9800',
    unit: '°F',
    normalRange: { min: 97.0, max: 99.0 }
  },
  '9279-1': {
    name: 'Respiratory Rate',
    color: '#2196f3',
    unit: 'breaths/min',
    normalRange: { min: 12, max: 20 }
  },
  '59408-5': {
    name: 'Oxygen Saturation',
    color: '#00bcd4',
    unit: '%',
    normalRange: { min: 95, max: 100 }
  },
  '29463-7': {
    name: 'Body Weight',
    color: '#4caf50',
    unit: 'kg'
  },
  '39156-5': {
    name: 'BMI',
    color: '#8bc34a',
    unit: 'kg/m²',
    normalRange: { min: 18.5, max: 24.9 }
  }
};

function VitalSignsChart(props) {
  const {
    observations = [],
    height = 400,
    timeRange = '7d',
    selectedVitalSigns = [],
    showNormalRange = true,
    ...otherProps
  } = props;

  const theme = useTheme();
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedVitals, setSelectedVitals] = useState(selectedVitalSigns);
  const [chartData, setChartData] = useState([]);

  // Process observations into Nivo line chart format
  useEffect(function(){
    if (!observations || observations.length === 0) {
      setChartData([]);
      return;
    }

    // Group by vital sign code
    const vitalGroups = groupBy(observations, obs => 
      get(obs, 'code.coding[0].code', '')
    );

    // Transform to Nivo format
    const nivoData = Object.keys(vitalGroups).map(code => {
      const config = VITAL_SIGN_CONFIG[code];
      if (!config || (selectedVitals.length > 0 && !selectedVitals.includes(code))) {
        return null;
      }

      const data = vitalGroups[code]
        .sort((a, b) => new Date(a.effectiveDateTime) - new Date(b.effectiveDateTime))
        .map(obs => ({
          x: moment(obs.effectiveDateTime).format('MM/DD HH:mm'),
          y: get(obs, 'valueQuantity.value', 0)
        }));

      return {
        id: config.name,
        color: config.color,
        data: data
      };
    }).filter(Boolean);

    setChartData(nivoData);
  }, [observations, selectedVitals]);

  // Filter by time range
  const getFilteredData = function() {
    if (!selectedTimeRange) return chartData;
    
    const cutoffDate = moment().subtract(
      parseInt(selectedTimeRange),
      selectedTimeRange.includes('d') ? 'days' : 
      selectedTimeRange.includes('w') ? 'weeks' : 'months'
    );

    return chartData.map(series => ({
      ...series,
      data: series.data.filter(point => 
        moment(point.x, 'MM/DD HH:mm').isAfter(cutoffDate)
      )
    }));
  };

  const handleTimeRangeChange = function(event, newRange) {
    if (newRange !== null) {
      setSelectedTimeRange(newRange);
    }
  };

  const handleVitalSignChange = function(event) {
    setSelectedVitals(event.target.value);
  };

  const filteredData = getFilteredData();

  if (!observations || observations.length === 0) {
    return (
      <Card {...otherProps}>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            No vital signs data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...otherProps}>
      <CardHeader
        title="Vital Signs Trends"
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Vital Signs</InputLabel>
              <Select
                multiple
                value={selectedVitals}
                onChange={handleVitalSignChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={VITAL_SIGN_CONFIG[value]?.name} 
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.keys(VITAL_SIGN_CONFIG).map((code) => (
                  <MenuItem key={code} value={code}>
                    {VITAL_SIGN_CONFIG[code].name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={selectedTimeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
            >
              <ToggleButton value="1d">1D</ToggleButton>
              <ToggleButton value="7d">7D</ToggleButton>
              <ToggleButton value="1m">1M</ToggleButton>
              <ToggleButton value="3m">3M</ToggleButton>
              <ToggleButton value="">All</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <Box sx={{ height: height }}>
          <ResponsiveLine
            data={filteredData}
            margin={{ top: 20, right: 120, bottom: 60, left: 80 }}
            xScale={{ type: 'point' }}
            yScale={{ 
              type: 'linear', 
              min: 'auto', 
              max: 'auto',
              stacked: false,
              reverse: false
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Date/Time',
              legendOffset: 50,
              legendPosition: 'middle'
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Value',
              legendOffset: -60,
              legendPosition: 'middle'
            }}
            colors={{ datum: 'color' }}
            pointSize={8}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            enableSlices="x"
            useMesh={true}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            theme={{
              axis: {
                domain: {
                  line: {
                    stroke: theme.palette.divider
                  }
                },
                ticks: {
                  line: {
                    stroke: theme.palette.divider
                  },
                  text: {
                    fill: theme.palette.text.secondary
                  }
                },
                legend: {
                  text: {
                    fill: theme.palette.text.primary
                  }
                }
              },
              grid: {
                line: {
                  stroke: theme.palette.divider,
                  strokeWidth: 1
                }
              },
              legends: {
                text: {
                  fill: theme.palette.text.primary
                }
              },
              tooltip: {
                container: {
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  boxShadow: theme.shadows[3]
                }
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

VitalSignsChart.propTypes = {
  observations: PropTypes.array,
  height: PropTypes.number,
  timeRange: PropTypes.string,
  selectedVitalSigns: PropTypes.array,
  showNormalRange: PropTypes.bool
};

export default VitalSignsChart;