// /packages/pacio-core/client/components/observations/ObservationCategoryFilter.jsx

import React, { useMemo } from 'react';
import { 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import { get } from 'lodash';

export function ObservationCategoryFilter(props) {
  const {
    observations = [],
    selectedCategories = [],
    onChange,
    multiple = true,
    showCounts = true,
    label = 'Filter by Category',
    fullWidth = true,
    size = 'medium',
    variant = 'outlined'
  } = props;
  
  // Extract unique categories from observations
  const categoryOptions = useMemo(function() {
    const categoryMap = new Map();
    
    observations.forEach(function(obs) {
      const categories = get(obs, 'category', []);
      categories.forEach(function(category) {
        const code = get(category, 'coding[0].code');
        const display = get(category, 'coding[0].display', code);
        
        if (code && !categoryMap.has(code)) {
          categoryMap.set(code, {
            code: code,
            display: display,
            count: 0
          });
        }
        
        if (code) {
          const existing = categoryMap.get(code);
          existing.count++;
        }
      });
    });
    
    // Convert to array and sort by display name
    return Array.from(categoryMap.values()).sort(function(a, b) {
      return a.display.localeCompare(b.display);
    });
  }, [observations]);
  
  function handleChange(event) {
    const value = event.target.value;
    
    if (onChange) {
      if (multiple) {
        // For multiple selection, value is an array
        onChange(typeof value === 'string' ? value.split(',') : value);
      } else {
        // For single selection, value is a string
        onChange(value);
      }
    }
  }
  
  function renderValue(selected) {
    if (!multiple) {
      const option = categoryOptions.find(function(opt) {
        return opt.code === selected;
      });
      return option ? option.display : '';
    }
    
    if (selected.length === 0) {
      return '';
    }
    
    if (selected.length === 1) {
      const option = categoryOptions.find(function(opt) {
        return opt.code === selected[0];
      });
      return option ? option.display : '';
    }
    
    return `${selected.length} categories selected`;
  }
  
  function getCategoryIcon(categoryCode) {
    // Map category codes to emoji/icons
    const iconMap = {
      'vital-signs': '❤️',
      'laboratory': '🧪',
      'imaging': '📷',
      'procedure': '⚕️',
      'survey': '📋',
      'exam': '🩺',
      'therapy': '💊',
      'activity': '🏃',
      'social-history': '👥'
    };
    
    return iconMap[categoryCode] || '📊';
  }
  
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 48 * 4.5 + 8,
        width: 250,
      },
    },
  };
  
  return (
    <FormControl fullWidth={fullWidth} size={size} variant={variant}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple={multiple}
        value={multiple ? selectedCategories : (selectedCategories[0] || '')}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={renderValue}
        MenuProps={MenuProps}
      >
        {!multiple && (
          <MenuItem value="">
            <em>All Categories</em>
          </MenuItem>
        )}
        
        {categoryOptions.map(function(option) {
          const isSelected = multiple ? 
            selectedCategories.includes(option.code) : 
            selectedCategories[0] === option.code;
          
          return (
            <MenuItem key={option.code} value={option.code}>
              {multiple && (
                <Checkbox checked={isSelected} />
              )}
              <ListItemText 
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{getCategoryIcon(option.code)}</span>
                    <span>{option.display}</span>
                  </Box>
                }
              />
              {showCounts && (
                <Chip 
                  label={option.count} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}