// /packages/workqueues/ui/components/WorkQueueFilters.jsx

import React, { useState } from 'react';
import { 
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Badge,
  Divider
} from '@mui/material';
import { 
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export function WorkQueueFilters({ 
  filters = {}, 
  onFiltersChange,
  taskCounts = {} 
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      let newFilters = { ...filters };
      
      switch (newView) {
        case 'all':
          delete newFilters.status;
          delete newFilters.priority;
          newFilters.showCompleted = true;
          break;
        case 'active':
          newFilters.status = ['requested', 'accepted', 'in-progress'];
          newFilters.showCompleted = false;
          break;
        case 'urgent':
          newFilters.priority = ['stat', 'urgent'];
          newFilters.showCompleted = false;
          break;
        case 'completed':
          newFilters.status = 'completed';
          newFilters.showCompleted = true;
          break;
        case 'overdue':
          newFilters.overdue = true;
          newFilters.showCompleted = false;
          break;
      }
      
      onFiltersChange(newFilters);
    }
  };

  const getCurrentView = () => {
    if (filters.overdue) return 'overdue';
    if (filters.status === 'completed') return 'completed';
    if (filters.priority && (filters.priority.includes('urgent') || filters.priority.includes('stat'))) return 'urgent';
    if (filters.showCompleted === false) return 'active';
    return 'all';
  };

  const handlePriorityFilter = (priority) => {
    const newFilters = { ...filters };
    if (newFilters.priority === priority) {
      delete newFilters.priority;
    } else {
      newFilters.priority = priority;
    }
    onFiltersChange(newFilters);
    setAnchorEl(null);
  };

  const handleStatusFilter = (status) => {
    const newFilters = { ...filters };
    if (newFilters.status === status) {
      delete newFilters.status;
    } else {
      newFilters.status = status;
    }
    onFiltersChange(newFilters);
    setAnchorEl(null);
  };

  const handleSortChange = (sortBy) => {
    const newFilters = { ...filters, sortBy };
    onFiltersChange(newFilters);
    setSortAnchorEl(null);
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    key => key !== 'showCompleted' && filters[key] !== undefined
  ).length;

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={getCurrentView()}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="all">
              <Badge badgeContent={taskCounts.all || 0} color="default">
                All
              </Badge>
            </ToggleButton>
            <ToggleButton value="active">
              <Badge badgeContent={taskCounts.active || 0} color="primary">
                <RadioButtonUncheckedIcon sx={{ mr: 0.5 }} fontSize="small" />
                Active
              </Badge>
            </ToggleButton>
            <ToggleButton value="urgent">
              <Badge badgeContent={taskCounts.urgent || 0} color="warning">
                <StarIcon sx={{ mr: 0.5 }} fontSize="small" />
                Urgent
              </Badge>
            </ToggleButton>
            <ToggleButton value="overdue">
              <Badge badgeContent={taskCounts.overdue || 0} color="error">
                <WarningIcon sx={{ mr: 0.5 }} fontSize="small" />
                Overdue
              </Badge>
            </ToggleButton>
            <ToggleButton value="completed">
              <Badge badgeContent={taskCounts.completed || 0} color="success">
                <CheckCircleIcon sx={{ mr: 0.5 }} fontSize="small" />
                Done
              </Badge>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterListIcon />
            </Badge>
          </IconButton>
          
          <IconButton
            size="small"
            onClick={(e) => setSortAnchorEl(e.currentTarget)}
          >
            <SortIcon />
          </IconButton>
          
          {activeFilterCount > 0 && (
            <IconButton
              size="small"
              onClick={handleClearFilters}
            >
              <ClearIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      
      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
          {filters.priority && (
            <Chip
              label={`Priority: ${filters.priority}`}
              size="small"
              onDelete={() => {
                const newFilters = { ...filters };
                delete newFilters.priority;
                onFiltersChange(newFilters);
              }}
            />
          )}
          {filters.status && (
            <Chip
              label={`Status: ${Array.isArray(filters.status) ? filters.status.join(', ') : filters.status}`}
              size="small"
              onDelete={() => {
                const newFilters = { ...filters };
                delete newFilters.status;
                onFiltersChange(newFilters);
              }}
            />
          )}
          {filters.category && (
            <Chip
              label={`Category: ${filters.category}`}
              size="small"
              onDelete={() => {
                const newFilters = { ...filters };
                delete newFilters.category;
                onFiltersChange(newFilters);
              }}
            />
          )}
          {filters.overdue && (
            <Chip
              label="Overdue"
              size="small"
              color="error"
              onDelete={() => {
                const newFilters = { ...filters };
                delete newFilters.overdue;
                onFiltersChange(newFilters);
              }}
            />
          )}
        </Box>
      )}
      
      {/* Filter menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem disabled>
          <Typography variant="caption">Priority</Typography>
        </MenuItem>
        <MenuItem onClick={() => handlePriorityFilter('stat')}>
          STAT
        </MenuItem>
        <MenuItem onClick={() => handlePriorityFilter('urgent')}>
          Urgent
        </MenuItem>
        <MenuItem onClick={() => handlePriorityFilter('asap')}>
          ASAP
        </MenuItem>
        <MenuItem onClick={() => handlePriorityFilter('routine')}>
          Routine
        </MenuItem>
        
        <Divider />
        
        <MenuItem disabled>
          <Typography variant="caption">Status</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleStatusFilter('requested')}>
          Requested
        </MenuItem>
        <MenuItem onClick={() => handleStatusFilter('accepted')}>
          Accepted
        </MenuItem>
        <MenuItem onClick={() => handleStatusFilter('in-progress')}>
          In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusFilter('on-hold')}>
          On Hold
        </MenuItem>
        <MenuItem onClick={() => handleStatusFilter('completed')}>
          Completed
        </MenuItem>
        
        <Divider />
        
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={filters.showCompleted !== false}
                onChange={(e) => {
                  const newFilters = { ...filters };
                  newFilters.showCompleted = e.target.checked;
                  onFiltersChange(newFilters);
                }}
              />
            }
            label="Show completed"
          />
        </MenuItem>
      </Menu>
      
      {/* Sort menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem onClick={() => handleSortChange('priority')}>
          Priority (High to Low)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('dueDate')}>
          Due Date (Earliest First)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('createdAt')}>
          Created (Newest First)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('updatedAt')}>
          Updated (Recent First)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('alphabetical')}>
          Alphabetical
        </MenuItem>
      </Menu>
    </Paper>
  );
}