// npmPackages/radiology-workflow/client/components/WorklistFilterRow.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';

// =============================================================================
// COLUMN FILTER CONTROL - Single per-column filter input (text or select)
// =============================================================================
//
// Rendered INSIDE each column header cell so the header and filter share one
// row (no separate filter row). Text inputs are debounced 300ms; selects apply
// immediately. The parent owns the canonical `filters` map.
//
//   col:      column definition ({ key, filterType, filterOptions })
//   value:    current filter value for this column
//   onChange: (key, value) => void
// =============================================================================

function ColumnFilterControl({ col, value, onChange }) {
  const [localValue, setLocalValue] = useState(value || '');
  const debounceTimer = useRef(null);

  useEffect(function() {
    setLocalValue(value || '');
  }, [value]);

  function handleTextChange(next) {
    setLocalValue(next);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(function() {
      onChange(col.key, next);
    }, 300);
  }

  function handleSelectChange(next) {
    setLocalValue(next);
    onChange(col.key, next);
  }

  if (!col.filterable) {
    return null;
  }

  if (col.filterType === 'select') {
    return (
      <FormControl size="small" fullWidth variant="standard">
        <Select
          value={localValue}
          onChange={function(e) { handleSelectChange(e.target.value); }}
          onClick={function(e) { e.stopPropagation(); }}
          displayEmpty
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value=""><em>All</em></MenuItem>
          {(col.filterOptions || []).map(function(opt) {
            return (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    );
  }

  // Default: text filter
  return (
    <TextField
      size="small"
      variant="standard"
      placeholder="Filter..."
      value={localValue}
      onChange={function(e) { handleTextChange(e.target.value); }}
      onClick={function(e) { e.stopPropagation(); }}
      inputProps={{ style: { fontSize: '0.75rem', padding: '2px 0' } }}
      fullWidth
    />
  );
}

export { ColumnFilterControl };
export default ColumnFilterControl;
