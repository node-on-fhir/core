// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/data-importer/client/AppleHealthPreview.jsx

import React, { useState, useEffect, useMemo } from 'react';
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
  Grid,
  TextField
} from '@mui/material';
import moment from 'moment';
import { get } from 'lodash';
import MedicalRecordImporter from '../lib/MedicalRecordImporter';
import { TIME_RANGE_OPTIONS, resolveTimeRange } from '/imports/lib/importTimeRange';

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
  const [summarizeTypes, setSummarizeTypes] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const { importBuffer, onImport, onAnalysisComplete, importDisabled, onSelectionChange } = props;

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

        if (typeof onAnalysisComplete === 'function') {
          onAnalysisComplete(result);
        }
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

  function handleSummarizeToggle(type, checked) {
    setSummarizeTypes(prev => ({ ...prev, [type]: checked }));
  }

  function getDayCount(info) {
    if (info.uniqueDays) return info.uniqueDays;
    if (!info.earliestDate || !info.latestDate) return info.count;
    var start = moment(info.earliestDate);
    var end = moment(info.latestDate);
    return end.diff(start, 'days') + 1;
  }

  // Exact per-type counts within the selected time range, computed from the
  // analyzer's per-day count maps (day granularity — no XML re-scan on range
  // change). This is what the table, the selected-count, and the right-panel
  // import summary all read, so displayed numbers match what an import with
  // this filter will actually insert.
  const rangeFilter = useMemo(function() {
    const resolved = resolveTimeRange(timeRange, customRange);
    const active = !!(resolved.start || resolved.end);

    function toDayKey(date) {
      return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
    }
    const startKey = resolved.start ? toDayKey(resolved.start) : null;
    const endKey = resolved.end ? toDayKey(resolved.end) : null;

    const byType = {};
    let total = 0;
    if (analysis) {
      Object.entries(analysis.healthRecords).forEach(function([type, info]) {
        if (!active) {
          byType[type] = { count: info.count, days: getDayCount(info) };
        } else if (info.dayCounts) {
          let count = 0;
          let days = 0;
          Object.keys(info.dayCounts).forEach(function(day) {
            if ((startKey && day < startKey) || (endKey && day > endKey)) return;
            count += info.dayCounts[day];
            days++;
          });
          byType[type] = { count: count, days: days };
        } else {
          // Legacy analysis without dayCounts — fall back to unfiltered totals
          byType[type] = { count: info.count, days: getDayCount(info) };
        }
        total += byType[type].count;
      });
    }
    return { active: active, byType: byType, total: total };
  }, [analysis, timeRange, customRange]);

  function getFilteredInfo(type, info) {
    return rangeFilter.byType[type] || { count: info.count, days: getDayCount(info) };
  }

  // Notify parent of selection changes
  useEffect(function() {
    if (typeof onSelectionChange === 'function') {
      var selectedTypesList = Object.keys(selectedTypes).filter(function(type) { return selectedTypes[type]; });
      var importSummary = [];
      if (analysis) {
        selectedTypesList.forEach(function(type) {
          var info = analysis.healthRecords[type];
          if (info) {
            var isSummarized = summarizeTypes[type] === true;
            var filteredInfo = getFilteredInfo(type, info);
            var importCount = isSummarized ? filteredInfo.days : filteredInfo.count;
            importSummary.push({
              displayName: info.displayName,
              rawCount: info.count,
              importCount: importCount,
              summarized: isSummarized
            });
          }
        });
      }
      onSelectionChange({
        selectedCount: getSelectedCount(),
        selectedTypes: selectedTypesList,
        summarizeTypes: summarizeTypes,
        timeRange: timeRange,
        customRange: customRange,
        importSummary: importSummary
      });
    }
  }, [selectedTypes, summarizeTypes, timeRange, customRange, analysis]);

  function handleImport() {
    const selectedTypesList = Object.keys(selectedTypes).filter(type => selectedTypes[type]);

    // Build summarizeTypes map for selected types only
    var summarizeMap = {};
    selectedTypesList.forEach(function(type) {
      if (summarizeTypes[type]) {
        summarizeMap[type] = true;
      }
    });

    if (typeof onImport === 'function') {
      onImport({
        selectedTypes: selectedTypesList,
        summarizeTypes: summarizeMap,
        timeRange: timeRange,
        customRange: customRange,
        includeWorkouts: true,
        includeClinicalRecords: true
      });
    }
  }
  
  function getSelectedCount() {
    if (!analysis) return 0;

    return Object.keys(analysis.healthRecords).reduce((total, type) => {
      if (selectedTypes[type]) {
        var info = analysis.healthRecords[type];
        var filteredInfo = getFilteredInfo(type, info);
        if (summarizeTypes[type]) {
          return total + filteredInfo.days;
        }
        return total + filteredInfo.count;
      }
      return total;
    }, 0);
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
                id="timeRangeFilterSelect"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range Filter"
                sx={{
                  color: cardTextColor,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
                  '& .MuiSvgIcon-root': { color: cardTextColor }
                }}
              >
                {TIME_RANGE_OPTIONS.map(function(option) {
                  return (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          {timeRange === 'custom' && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  id="customRangeStartInput"
                  label="From"
                  type="date"
                  size="small"
                  fullWidth
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  InputLabelProps={{ shrink: true, sx: { color: cardTextColor } }}
                  sx={{
                    '& .MuiInputBase-input': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor }
                  }}
                />
                <TextField
                  id="customRangeEndInput"
                  label="To"
                  type="date"
                  size="small"
                  fullWidth
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  InputLabelProps={{ shrink: true, sx: { color: cardTextColor } }}
                  sx={{
                    '& .MuiInputBase-input': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor }
                  }}
                />
              </Box>
            </Grid>
          )}
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
              <TableCell sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>LOINC Code</TableCell>
              <TableCell sx={{ bgcolor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>Summarize</TableCell>
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
                      {/* Category color dot — legible plain-text name, color pop from the dot
                          (legend chips above map dot color → category) */}
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: getCategoryBadgeColor(type) === 'default'
                          ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)')
                          : getCategoryBadgeColor(type) + '.main'
                      }} />
                      <Typography variant="body2" sx={{ color: cardTextColor }}>
                        {info.displayName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatNumber(getFilteredInfo(type, info).count)}
                    </Typography>
                    {rangeFilter.active && getFilteredInfo(type, info).count !== info.count && (
                      <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                        of {formatNumber(info.count)}
                      </Typography>
                    )}
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
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {info.loincCode || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={summarizeTypes[type] || false}
                      onChange={(e) => handleSummarizeToggle(type, e.target.checked)}
                      color="primary"
                      disabled={!info.earliestDate || !info.latestDate || type.includes('CategoryType')}
                      size="small"
                    />
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
        flexShrink: 0
      }}>
        <Typography variant="body2" sx={{ color: cardTextColor }}>
          {formatNumber(getSelectedCount())} records selected for import
        </Typography>
        {rangeFilter.active && (
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }} key={timeRange}>
            {formatNumber(rangeFilter.total)} of {formatNumber(get(analysis, 'totalRecords', 0))} total records fall within the selected time range
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default AppleHealthPreview;