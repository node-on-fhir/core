// /packages/pacio-core/client/components/shared/ResourceFilter.jsx

import React, { useState } from 'react';
import { 
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Collapse,
  Typography,
  Grid,
  Paper,
  InputAdornment
} from '@mui/material';
import { 
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { get } from 'lodash';
import moment from 'moment';

export function ResourceFilter(props) {
  const {
    onFilterChange,
    filters = {},
    filterConfig = {},
    showAdvanced = true,
    collapsible = true,
    defaultExpanded = false
  } = props;
  
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Default filter configuration
  const defaultConfig = {
    search: { enabled: true, label: 'Search', placeholder: 'Search...' },
    status: { 
      enabled: true, 
      label: 'Status', 
      options: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'completed', label: 'Completed' }
      ]
    },
    dateRange: { 
      enabled: true, 
      label: 'Date Range',
      startLabel: 'From',
      endLabel: 'To'
    },
    category: {
      enabled: false,
      label: 'Category',
      options: []
    },
    author: {
      enabled: false,
      label: 'Author',
      options: []
    }
  };
  
  const config = { ...defaultConfig, ...filterConfig };
  
  function handleFilterChange(filterName, value) {
    const newFilters = { ...localFilters, [filterName]: value };
    setLocalFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  }
  
  function handleClearFilters() {
    const clearedFilters = {};
    Object.keys(config).forEach(function(key) {
      if (config[key].enabled) {
        clearedFilters[key] = key === 'status' ? 'all' : '';
      }
    });
    
    setLocalFilters(clearedFilters);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  }
  
  function toggleExpanded() {
    setExpanded(!expanded);
  }
  
  function getActiveFilterCount() {
    let count = 0;
    
    Object.entries(localFilters).forEach(function([key, value]) {
      if (key === 'search' && value) count++;
      if (key === 'status' && value && value !== 'all') count++;
      if (key === 'dateRange' && (value.start || value.end)) count++;
      if (key === 'category' && value && value !== 'all') count++;
      if (key === 'author' && value && value !== 'all') count++;
    });
    
    return count;
  }
  
  function renderBasicFilters() {
    return (
      <Grid container spacing={2} alignItems="center">
        {config.search.enabled && (
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label={config.search.label}
              placeholder={config.search.placeholder}
              value={get(localFilters, 'search', '')}
              onChange={function(e) { handleFilterChange('search', e.target.value); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        )}
        
        {config.status.enabled && (
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{config.status.label}</InputLabel>
              <Select
                value={get(localFilters, 'status', 'all')}
                onChange={function(e) { handleFilterChange('status', e.target.value); }}
                label={config.status.label}
              >
                {config.status.options.map(function(option) {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        <Grid item xs={12} sm={12} md={2}>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
            >
              Clear
            </Button>
            
            {collapsible && showAdvanced && (
              <IconButton onClick={toggleExpanded} size="small">
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </Grid>
        
        {getActiveFilterCount() > 0 && (
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="textSecondary">
                Active filters:
              </Typography>
              <Chip 
                label={`${getActiveFilterCount()} applied`}
                size="small"
                color="primary"
                onDelete={handleClearFilters}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    );
  }
  
  function renderAdvancedFilters() {
    if (!showAdvanced) return null;
    
    return (
      <Collapse in={expanded || !collapsible}>
        <Box mt={2} pt={2} borderTop={1} borderColor="divider">
          <Grid container spacing={2}>
            {config.dateRange.enabled && (
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={config.dateRange.startLabel}
                    value={get(localFilters, 'dateRange.start', null)}
                    onChange={function(newValue) {
                      handleFilterChange('dateRange', {
                        ...get(localFilters, 'dateRange', {}),
                        start: newValue
                      });
                    }}
                    renderInput={function(params) {
                      return <TextField {...params} size="small" fullWidth />;
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={config.dateRange.endLabel}
                    value={get(localFilters, 'dateRange.end', null)}
                    onChange={function(newValue) {
                      handleFilterChange('dateRange', {
                        ...get(localFilters, 'dateRange', {}),
                        end: newValue
                      });
                    }}
                    renderInput={function(params) {
                      return <TextField {...params} size="small" fullWidth />;
                    }}
                    minDate={get(localFilters, 'dateRange.start', null)}
                  />
                </Grid>
              </LocalizationProvider>
            )}
            
            {config.category.enabled && config.category.options.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{config.category.label}</InputLabel>
                  <Select
                    value={get(localFilters, 'category', 'all')}
                    onChange={function(e) { handleFilterChange('category', e.target.value); }}
                    label={config.category.label}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {config.category.options.map(function(option) {
                      return (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {config.author.enabled && config.author.options.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{config.author.label}</InputLabel>
                  <Select
                    value={get(localFilters, 'author', 'all')}
                    onChange={function(e) { handleFilterChange('author', e.target.value); }}
                    label={config.author.label}
                  >
                    <MenuItem value="all">All Authors</MenuItem>
                    {config.author.options.map(function(option) {
                      return (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Box>
      </Collapse>
    );
  }
  
  return (
    <Paper variant="outlined" style={{ padding: 16 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <FilterIcon color="action" />
        <Typography variant="h6">Filters</Typography>
      </Box>
      
      {renderBasicFilters()}
      {renderAdvancedFilters()}
    </Paper>
  );
}