// packages/vital-signs/client/components/displays/VitalSignsChart.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

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

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

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
    normalRange: { min: 90, max: 140 }
  },
  '8462-4': {
    name: 'Diastolic BP',
    color: '#673ab7',
    unit: 'mmHg',
    normalRange: { min: 60, max: 90 }
  },
  '9279-1': {
    name: 'Respiratory Rate',
    color: '#2196f3',
    unit: 'breaths/min',
    normalRange: { min: 12, max: 20 }
  },
  '2708-6': {
    name: 'Oxygen Saturation',
    color: '#00bcd4',
    unit: '%',
    normalRange: { min: 95, max: 100 }
  },
  '8310-5': {
    name: 'Body Temperature',
    color: '#ff9800',
    unit: '°F',
    normalRange: { min: 97.0, max: 99.0 }
  }
};

// Custom tooltip for chart
function CustomTooltip({ active, payload, label }) {
  const theme = useTheme();
  
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          boxShadow: 2
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {moment(label).format('MMM DD, YYYY hh:mm A')}
        </Typography>
        {payload.map((entry, index) => (
          <Box key={index} sx={{ mt: 0.5 }}>
            <Typography variant="body2" style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value}</strong> {entry.payload.unit}
            </Typography>
            {entry.payload.status && (
              <Typography variant="caption" color="text.secondary">
                Status: {entry.payload.status}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  }
  return null;
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.any
};

// Main chart component
function VitalSignsChart(props) {
  const {
    vitalSigns,
    height,
    showLegend,
    showGrid,
    showNormalRanges,
    selectedVitalTypes,
    dateRange,
    title,
    ...otherProps
  } = props;
  
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTypes, setSelectedTypes] = useState(selectedVitalTypes || []);
  const [chartData, setChartData] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  
  // Process vital signs data
  useEffect(function() {
    if (!vitalSigns || vitalSigns.length === 0) {
      setChartData([]);
      setAvailableTypes([]);
      return;
    }
    
    // Group by date/time
    const dataByTime = {};
    const typeSet = new Set();
    
    vitalSigns.forEach(function(vital) {
      const code = get(vital, 'code.coding[0].code', '');
      const dateTime = get(vital, 'effectiveDateTime');
      const value = parseFloat(get(vital, 'valueQuantity.value', 0));
      const unit = get(vital, 'valueQuantity.unit', '');
      const status = get(vital, 'status', '');
      
      if (code && dateTime && !isNaN(value)) {
        typeSet.add(code);
        
        const timeKey = moment(dateTime).valueOf();
        
        if (!dataByTime[timeKey]) {
          dataByTime[timeKey] = {
            time: timeKey,
            dateTime: dateTime
          };
        }
        
        dataByTime[timeKey][code] = value;
        dataByTime[timeKey][`${code}_unit`] = unit;
        dataByTime[timeKey][`${code}_status`] = status;
      }
    });
    
    // Convert to array and sort by time
    const processedData = Object.values(dataByTime).sort((a, b) => a.time - b.time);
    
    // Filter by time range
    const now = moment();
    let filteredData = processedData;
    
    switch (timeRange) {
      case '24h':
        filteredData = processedData.filter(d => 
          moment(d.dateTime).isAfter(now.clone().subtract(24, 'hours'))
        );
        break;
      case '7d':
        filteredData = processedData.filter(d => 
          moment(d.dateTime).isAfter(now.clone().subtract(7, 'days'))
        );
        break;
      case '30d':
        filteredData = processedData.filter(d => 
          moment(d.dateTime).isAfter(now.clone().subtract(30, 'days'))
        );
        break;
      case '90d':
        filteredData = processedData.filter(d => 
          moment(d.dateTime).isAfter(now.clone().subtract(90, 'days'))
        );
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    setChartData(filteredData);
    setAvailableTypes(Array.from(typeSet));
    
    // Set default selected types if none specified
    if (selectedTypes.length === 0 && typeSet.size > 0) {
      setSelectedTypes(Array.from(typeSet).slice(0, 3)); // Default to first 3 types
    }
  }, [vitalSigns, timeRange]);
  
  // Handle vital type selection
  function handleTypeToggle(event, newTypes) {
    if (newTypes.length > 0) {
      setSelectedTypes(newTypes);
    }
  }
  
  // Format Y-axis
  function formatYAxis(value) {
    return value.toFixed(0);
  }
  
  // Format X-axis
  function formatXAxis(timestamp) {
    const date = moment(timestamp);
    switch (timeRange) {
      case '24h':
        return date.format('HH:mm');
      case '7d':
        return date.format('MMM DD');
      case '30d':
      case '90d':
        return date.format('MMM DD');
      default:
        return date.format('MMM YYYY');
    }
  }
  
  // Get Y-axis domain with padding
  function getYDomain(dataKey) {
    const values = chartData
      .map(d => d[dataKey])
      .filter(v => v !== undefined && !isNaN(v));
    
    if (values.length === 0) return [0, 100];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }
  
  return (
    <Card {...otherProps}>
      <CardHeader
        title={title}
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              size="small"
              value={timeRange}
              exclusive
              onChange={(e, v) => v && setTimeRange(v)}
            >
              <ToggleButton value="24h">24h</ToggleButton>
              <ToggleButton value="7d">7d</ToggleButton>
              <ToggleButton value="30d">30d</ToggleButton>
              <ToggleButton value="90d">90d</ToggleButton>
              <ToggleButton value="all">All</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        {availableTypes.length > 1 && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select vital signs to display:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {availableTypes.map(type => {
                const config = VITAL_SIGN_CONFIG[type];
                if (!config) return null;
                
                return (
                  <Chip
                    key={type}
                    label={config.name}
                    onClick={() => {
                      if (selectedTypes.includes(type)) {
                        setSelectedTypes(selectedTypes.filter(t => t !== type));
                      } else {
                        setSelectedTypes([...selectedTypes, type]);
                      }
                    }}
                    color={selectedTypes.includes(type) ? "primary" : "default"}
                    variant={selectedTypes.includes(type) ? "filled" : "outlined"}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
        
        {chartData.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No data available for the selected time range
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              
              {selectedTypes.map(type => {
                const config = VITAL_SIGN_CONFIG[type];
                if (!config) return null;
                
                return (
                  <React.Fragment key={type}>
                    {showNormalRanges && config.normalRange && (
                      <>
                        <ReferenceLine
                          y={config.normalRange.min}
                          stroke={config.color}
                          strokeDasharray="3 3"
                          strokeOpacity={0.3}
                        />
                        <ReferenceLine
                          y={config.normalRange.max}
                          stroke={config.color}
                          strokeDasharray="3 3"
                          strokeOpacity={0.3}
                        />
                      </>
                    )}
                    <Line
                      type="monotone"
                      dataKey={type}
                      stroke={config.color}
                      name={config.name}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </React.Fragment>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

VitalSignsChart.propTypes = {
  vitalSigns: PropTypes.array,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showGrid: PropTypes.bool,
  showNormalRanges: PropTypes.bool,
  selectedVitalTypes: PropTypes.array,
  dateRange: PropTypes.string,
  title: PropTypes.string
};

VitalSignsChart.defaultProps = {
  vitalSigns: [],
  height: 400,
  showLegend: true,
  showGrid: true,
  showNormalRanges: true,
  selectedVitalTypes: [],
  title: 'Vital Signs Trends'
};

export default VitalSignsChart;