// packages/hipaa-compliance/client/AuditLogFilters.jsx

import React, { useState } from 'react';
import { get } from 'lodash';
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Chip,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { EventTypes } from '../lib/Constants';

export default function AuditLogFilters(props) {
  const { filters = {}, onFilterChange } = props;

  // Local state for form
  const [localFilters, setLocalFilters] = useState({
    eventType: filters.eventType || '',
    userId: filters.userId || '',
    patientId: filters.patientId || '',
    collectionName: filters.collectionName || '',
    searchText: filters.searchText || '',
    startDate: filters.startDate,
    endDate: filters.endDate,
    limit: filters.limit || 100
  });

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setLocalFilters({
      ...localFilters,
      [field]: value
    });
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  // Clear filters
  const handleClearFilters = () => {
    const clearedFilters = {
      eventType: '',
      userId: '',
      patientId: '',
      collectionName: '',
      searchText: '',
      startDate: null,
      endDate: null,
      limit: 100
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Common collections
  const commonCollections = [
    'Patients',
    'Observations',
    'Encounters',
    'Conditions',
    'Procedures',
    'MedicationRequests',
    'DiagnosticReports',
    'CarePlans'
  ];

  // Active filter count
  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'limit') return false;
    return value && value !== '';
  }).length;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box>
        <Grid container spacing={2}>
          {/* Event Type Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={localFilters.eventType}
                onChange={(e) => handleFieldChange('eventType', e.target.value)}
                label="Event Type"
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(EventTypes).map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Collection Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Collection</InputLabel>
              <Select
                value={localFilters.collectionName}
                onChange={(e) => handleFieldChange('collectionName', e.target.value)}
                label="Collection"
              >
                <MenuItem value="">All</MenuItem>
                {commonCollections.map(collection => (
                  <MenuItem key={collection} value={collection}>
                    {collection}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Start Date"
              value={localFilters.startDate}
              onChange={(date) => handleFieldChange('startDate', date?.toDate())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small'
                }
              }}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} md={3}>
            <DatePicker
              label="End Date"
              value={localFilters.endDate}
              onChange={(date) => handleFieldChange('endDate', date?.toDate())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small'
                }
              }}
            />
          </Grid>

          {/* User ID Filter */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="User ID"
              value={localFilters.userId}
              onChange={(e) => handleFieldChange('userId', e.target.value)}
              placeholder="Filter by user ID"
            />
          </Grid>

          {/* Patient ID Filter */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Patient ID"
              value={localFilters.patientId}
              onChange={(e) => handleFieldChange('patientId', e.target.value)}
              placeholder="Filter by patient ID"
            />
          </Grid>

          {/* Search Text */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={localFilters.searchText}
              onChange={(e) => handleFieldChange('searchText', e.target.value)}
              placeholder="Search in messages"
            />
          </Grid>

          {/* Limit */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Limit</InputLabel>
              <Select
                value={localFilters.limit}
                onChange={(e) => handleFieldChange('limit', e.target.value)}
                label="Limit"
              >
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
                <MenuItem value={250}>250</MenuItem>
                <MenuItem value={500}>500</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} alignItems="center">
              <Button 
                variant="contained" 
                onClick={handleApplyFilters}
                size="small"
              >
                Apply Filters
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                size="small"
              >
                Clear All
              </Button>
              {activeFilterCount > 0 && (
                <Chip 
                  label={`${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
          </Grid>

          {/* Quick Filters */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Filters:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label="Today"
                size="small"
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  handleFieldChange('startDate', today);
                  handleFieldChange('endDate', new Date());
                }}
              />
              <Chip
                label="Last 7 Days"
                size="small"
                onClick={() => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  handleFieldChange('startDate', sevenDaysAgo);
                  handleFieldChange('endDate', new Date());
                }}
              />
              <Chip
                label="Last 30 Days"
                size="small"
                onClick={() => {
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  handleFieldChange('startDate', thirtyDaysAgo);
                  handleFieldChange('endDate', new Date());
                }}
              />
              <Chip
                label="Security Events"
                size="small"
                onClick={() => {
                  handleFieldChange('eventType', 'denied');
                }}
              />
              <Chip
                label="Data Changes"
                size="small"
                onClick={() => {
                  handleFieldChange('eventType', 'update');
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}