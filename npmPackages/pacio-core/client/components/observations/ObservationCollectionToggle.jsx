// /packages/pacio-core/client/components/observations/ObservationCollectionToggle.jsx

import React from 'react';
import { 
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import { 
  ViewList as IndividualIcon,
  ViewModule as CollectionIcon,
  ViewAgenda as GroupedIcon
} from '@mui/icons-material';

export function ObservationCollectionToggle(props) {
  const {
    value = 'individual',
    onChange,
    options = ['individual', 'collection', 'grouped'],
    size = 'medium',
    showLabel = true,
    orientation = 'horizontal',
    color = 'primary',
    exclusive = true
  } = props;
  
  function handleChange(event, newValue) {
    if (newValue !== null && onChange) {
      onChange(newValue);
    }
  }
  
  function renderToggleButton(optionValue, icon, label, tooltip) {
    if (!options.includes(optionValue)) return null;
    
    return (
      <Tooltip key={optionValue} title={tooltip} placement="top">
        <ToggleButton value={optionValue} aria-label={label}>
          <Box display="flex" alignItems="center" gap={1}>
            {icon}
            {showLabel && size !== 'small' && (
              <Typography variant="body2">{label}</Typography>
            )}
          </Box>
        </ToggleButton>
      </Tooltip>
    );
  }
  
  return (
    <Box>
      <ToggleButtonGroup
        value={value}
        exclusive={exclusive}
        onChange={handleChange}
        size={size}
        orientation={orientation}
        color={color}
      >
        {renderToggleButton(
          'individual',
          <IndividualIcon />,
          'Individual',
          'Show each observation as a separate row'
        )}
        {renderToggleButton(
          'collection',
          <CollectionIcon />,
          'Collections',
          'Show observations grouped as collections'
        )}
        {renderToggleButton(
          'grouped',
          <GroupedIcon />,
          'Grouped',
          'Show observations grouped by category'
        )}
      </ToggleButtonGroup>
    </Box>
  );
}