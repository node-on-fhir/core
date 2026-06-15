// /packages/pacio-core/client/components/advanceDirectives/AdvanceDirectiveStatusFilter.jsx

import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Chip,
  Box
} from '@mui/material';
import { get } from 'lodash';

export function AdvanceDirectiveStatusFilter(props) {
  const { 
    value = 'all', 
    onChange,
    showCounts = false,
    counts = {},
    label = 'Status Filter',
    fullWidth = true,
    size = 'medium',
    variant = 'outlined'
  } = props;
  
  function handleChange(event) {
    if (onChange) {
      onChange(event.target.value);
    }
  }
  
  function renderMenuItem(statusValue, statusLabel, color) {
    return (
      <MenuItem value={statusValue}>
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center" gap={1}>
            {color && (
              <Box 
                width={12} 
                height={12} 
                borderRadius="50%" 
                bgcolor={
                  color === 'success' ? 'success.main' : 
                  color === 'warning' ? 'warning.main' : 
                  color === 'error' ? 'error.main' : 
                  'grey.500'
                }
              />
            )}
            <span>{statusLabel}</span>
          </Box>
          {showCounts && counts[statusValue] !== undefined && (
            <Chip 
              label={counts[statusValue]} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>
      </MenuItem>
    );
  }
  
  return (
    <FormControl fullWidth={fullWidth} size={size} variant={variant}>
      <InputLabel>{label}</InputLabel>
      <Select 
        value={value} 
        onChange={handleChange}
        label={label}
      >
        {renderMenuItem('all', 'All Documents', null)}
        {renderMenuItem('current', 'Current', 'success')}
        {renderMenuItem('superseded', 'Superseded', 'warning')}
        {renderMenuItem('entered-in-error', 'Revoked', 'error')}
        {renderMenuItem('draft', 'Draft', null)}
      </Select>
    </FormControl>
  );
}