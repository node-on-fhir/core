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

function AppleHealthPreview(props) {
  const [analysis, setAnalysis] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  
  const { importBuffer, onImport } = props;
  
  useEffect(function() {
    if (importBuffer instanceof ArrayBuffer) {
      analyzeData();
    }
  }, [importBuffer]);
  
  async function analyzeData() {
    setLoading(true);
    setError(null);
    
    try {
      const result = await MedicalRecordImporter.analyzeAppleHealthExport(importBuffer);
      
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
      overflow: 'hidden'
    }}>
      {/* Summary Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Apple Health Data Preview</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatNumber(analysis.totalRecords)} total records
              {analysis.dateRange.earliest && (
                <> from {moment(analysis.dateRange.earliest).format('MMM YYYY')} to {moment(analysis.dateRange.latest).format('MMM YYYY')}</>
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip size="small" color="error" label="Vitals" sx={{ height: 20 }} />
              <Chip size="small" color="primary" label="Body Metrics" sx={{ height: 20 }} />
              <Chip size="small" color="success" label="Activity" sx={{ height: 20 }} />
              <Chip size="small" color="info" label="Sleep/Mindfulness" sx={{ height: 20 }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range Filter</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range Filter"
              >
                <MenuItem value="all">All Data</MenuItem>
                <MenuItem value="lastDecade">Last 10 Years</MenuItem>
                <MenuItem value="lastYear">Last Year</MenuItem>
                <MenuItem value="lastMonth">Last Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      {/* Data Types Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          maxHeight: '100%'
        }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  color="primary"
                />
              </TableCell>
              <TableCell>Data Type</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell>Date Range</TableCell>
              <TableCell>FHIR Resource</TableCell>
              <TableCell>LOINC Code</TableCell>
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
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
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
        borderColor: 'divider', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Typography variant="body2">
          {getSelectedCount()} records selected for import
        </Typography>
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