// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/data-importer/client/AppleHealthPreview.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Grid
} from '@mui/material';
import moment from 'moment';
import { get } from 'lodash';
import MedicalRecordImporter from '../lib/MedicalRecordImporter';

// Get theme from Honeycomb's custom hook
let useAppTheme;
if (Meteor.isClient) {
  Meteor.startup(function(){
    useAppTheme = Meteor.useTheme;
  });
}

function AppleHealthPreview(props) {
  const [analysis, setAnalysis] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');

  const { importBuffer, onImport } = props;

  // Get current theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  
  useEffect(function() {
    if (importBuffer instanceof ArrayBuffer || (typeof importBuffer === 'string' && MedicalRecordImporter.isAppleHealthXml(importBuffer))) {
      analyzeData();
    }
  }, [importBuffer]);

  async function analyzeData() {
    setLoading(true);
    setError(null);

    try {
      let result;

      // Check if this is a ZIP file (ArrayBuffer) or XML string
      if (importBuffer instanceof ArrayBuffer) {
        console.log('Analyzing Apple Health ZIP file...');
        result = await MedicalRecordImporter.analyzeAppleHealthExport(importBuffer);
      } else if (typeof importBuffer === 'string' && MedicalRecordImporter.isAppleHealthXml(importBuffer)) {
        console.log('Analyzing Apple Health XML file...');
        result = MedicalRecordImporter.analyzeAppleHealthXML(importBuffer);
      }

      if (result.error) {
        setError(result.error);
      } else {
        setAnalysis(result);

        // Default selection: select clinically relevant types
        const defaultSelection = {};
        const clinicallyRelevant = [
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierBloodPressureSystolic',
          'HKQuantityTypeIdentifierBloodPressureDiastolic',
          'HKQuantityTypeIdentifierBodyMass',
          'HKQuantityTypeIdentifierHeight',
          'HKQuantityTypeIdentifierBodyMassIndex',
          'HKQuantityTypeIdentifierOxygenSaturation',
          'HKQuantityTypeIdentifierBloodGlucose',
          'HKQuantityTypeIdentifierBodyTemperature',
          'HKQuantityTypeIdentifierRespiratoryRate',
          'HKQuantityTypeIdentifierRestingHeartRate',
          'HKCategoryTypeIdentifierSleepAnalysis'
        ];

        Object.keys(result.healthRecords).forEach(type => {
          defaultSelection[type] = clinicallyRelevant.includes(type);
        });

        setSelectedTypes(defaultSelection);
      }
    } catch (err) {
      console.error('Error analyzing Apple Health data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  function handleSelectAll(event) {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (analysis) {
      const newSelection = {};
      Object.keys(analysis.healthRecords).forEach(type => {
        newSelection[type] = checked;
      });
      setSelectedTypes(newSelection);
    }
  }
  
  function handleTypeSelection(type, checked) {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: checked
    }));
  }
  
  function handleImport() {
    const selectedTypesList = Object.keys(selectedTypes).filter(type => selectedTypes[type]);
    
    if (typeof onImport === 'function') {
      onImport({
        selectedTypes: selectedTypesList,
        timeRange: timeRange,
        includeWorkouts: true,
        includeClinicalRecords: true
      });
    }
  }
  
  function getSelectedCount() {
    if (!analysis) return 0;

    return Object.keys(analysis.healthRecords).reduce((total, type) => {
      if (selectedTypes[type]) {
        return total + analysis.healthRecords[type].count;
      }
      return total;
    }, 0);
  }

  function getFilteredCount() {
    if (!analysis) return 0;

    // Calculate time filter boundary
    const now = moment();
    let startDate;
    switch(timeRange) {
      case 'lastMonth':
        startDate = now.clone().subtract(1, 'month');
        break;
      case 'lastYear':
        startDate = now.clone().subtract(1, 'year');
        break;
      case 'lastDecade':
        startDate = now.clone().subtract(10, 'years');
        break;
      default:
        startDate = moment('1900-01-01'); // All data
    }

    // This is an estimate based on the date range information we have
    // The actual count may differ slightly due to per-record date filtering
    let filteredTotal = 0;

    Object.keys(analysis.healthRecords).forEach(type => {
      if (selectedTypes[type]) {
        const typeInfo = analysis.healthRecords[type];

        // If we have date range info for this type
        if (typeInfo.earliestDate && typeInfo.latestDate) {
          const earliest = moment(typeInfo.earliestDate);
          const latest = moment(typeInfo.latestDate);

          // If entire range is before filter, skip
          if (latest.isBefore(startDate)) {
            return;
          }

          // If entire range is after filter, include all
          if (earliest.isAfter(startDate) || earliest.isSame(startDate)) {
            filteredTotal += typeInfo.count;
          } else {
            // Partial overlap - estimate based on time proportion
            const totalDuration = latest.diff(earliest);
            const filteredDuration = latest.diff(startDate);
            const proportion = totalDuration > 0 ? (filteredDuration / totalDuration) : 1;
            filteredTotal += Math.floor(typeInfo.count * proportion);
          }
        } else {
          // No date info, include all (conservative estimate)
          filteredTotal += typeInfo.count;
        }
      }
    });

    return filteredTotal;
  }
  
  function formatNumber(num) {
    return num.toLocaleString();
  }
  
  function getCategoryBadgeColor(type) {
    if (type.includes('HeartRate') || type.includes('BloodPressure')) return 'error';
    if (type.includes('Body') || type.includes('Height') || type.includes('Weight')) return 'primary';
    if (type.includes('Exercise') || type.includes('Active') || type.includes('Step')) return 'success';
    if (type.includes('Sleep') || type.includes('Mindful')) return 'info';
    return 'default';
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Analyzing Apple Health export...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error analyzing Apple Health data: {error}
      </Alert>
    );
  }
  
  if (!analysis) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No Apple Health data to preview</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{
      height: window.innerHeight - 470,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: cardBgColor,
      color: cardTextColor
    }}>
      {/* Summary Header */}
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: borderColor,
        flexShrink: 0,
        '& .MuiTypography-root': { color: cardTextColor },
        '& .MuiInputLabel-root': { color: cardTextColor },
        '& .MuiSelect-root': { color: cardTextColor },
        '& .MuiSelect-icon': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor }
      }}>
        <Typography variant="h6" sx={{ color: cardTextColor, mb: 1 }}>
          Apple Health Data Preview
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)', mb: 2 }}>
          {formatNumber(analysis.totalRecords)} total records
          {analysis.dateRange.earliest && (
            <> from {moment(analysis.dateRange.earliest).format('MMM YYYY')} to {moment(analysis.dateRange.latest).format('MMM YYYY')}</>
          )}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: cardTextColor }}>Time Range Filter</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range Filter"
                sx={{
                  color: cardTextColor,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
                  '& .MuiSvgIcon-root': { color: cardTextColor }
                }}
              >
                <MenuItem value="all">All Data</MenuItem>
                <MenuItem value="lastDecade">Last 10 Years</MenuItem>
                <MenuItem value="lastYear">Last Year</MenuItem>
                <MenuItem value="lastMonth">Last Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" color="error" label="Vitals" sx={{ height: 20 }} />
              <Chip size="small" color="primary" label="Body Metrics" sx={{ height: 20 }} />
              <Chip size="small" color="success" label="Activity" sx={{ height: 20 }} />
              <Chip size="small" color="info" label="Sleep/Mindfulness" sx={{ height: 20 }} />
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Data Types Table */}
      <TableContainer
        component={Paper}
        sx={{
          flex: 1,
          overflow: 'auto',
          maxHeight: '100%',
          bgcolor: cardBgColor,
          '& .MuiTableCell-root': {
            color: cardTextColor,
            borderColor: borderColor
          },
          '& .MuiTableCell-head': {
            bgcolor: cardBgColor,
            color: cardTextColor,
            fontWeight: 'bold'
          },
          '& .MuiCheckbox-root': {
            color: cardTextColor
          },
          '& .MuiTypography-root': {
            color: cardTextColor
          }
        }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  color="primary"
                  sx={{ color: cardTextColor }}
                />
              </TableCell>
              <TableCell sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>Data Type</TableCell>
              <TableCell align="right" sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>Count</TableCell>
              <TableCell sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>Date Range</TableCell>
              <TableCell sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>FHIR Resource</TableCell>
              <TableCell sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>LOINC Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(analysis.healthRecords)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([type, info]) => (
                <TableRow key={type} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTypes[type] || false}
                      onChange={(e) => handleTypeSelection(type, e.target.checked)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={info.displayName}
                        size="small"
                        color={getCategoryBadgeColor(type)}
                        sx={getCategoryBadgeColor(type) === 'default' ? {
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                          color: cardTextColor
                        } : {}}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatNumber(info.count)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {info.earliestDate && info.latestDate ? (
                        <>
                          {moment(info.earliestDate).format('MMM DD, YYYY')} - 
                          {moment(info.latestDate).format('MMM DD, YYYY')}
                        </>
                      ) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {info.fhirResource}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {info.loincCode || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Clinical Records Summary */}
      {analysis.clinicalRecords && analysis.clinicalRecords.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: borderColor }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: cardTextColor }}>
            Clinical Records Found:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {analysis.clinicalRecords.map(record => (
              <Chip
                key={record.type}
                label={`${record.type} (${record.count})`}
                size="small"
                color="secondary"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Action Footer */}
      <Box sx={{
        p: 2,
        borderTop: 1,
        borderColor: borderColor,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Box>
          <Typography variant="body2" sx={{ color: cardTextColor }}>
            {formatNumber(getSelectedCount())} records selected for import
          </Typography>
          {timeRange !== 'all' && (
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }} key={timeRange}>
              ~{formatNumber(getFilteredCount())} records after {timeRange === 'lastMonth' ? 'last month' : timeRange === 'lastYear' ? 'last year' : 'last decade'} filter (estimate)
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleImport}
          disabled={getSelectedCount() === 0}
        >
          Import Selected Data
        </Button>
      </Box>
    </Box>
  );
}

export default AppleHealthPreview;