// /packages/pacio-core/client/components/goals/GoalTargetDisplay.jsx

import React from 'react';
import { 
  Box,
  Typography,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';

export function GoalTargetDisplay(props) {
  const {
    targets = [],
    showProgress = true,
    showDates = true,
    compact = false
  } = props;
  
  if (targets.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        No targets defined
      </Typography>
    );
  }
  
  function calculateProgress(target) {
    const detailQuantity = get(target, 'detailQuantity');
    const detailRange = get(target, 'detailRange');
    const achieved = get(target, 'achieved');
    
    if (achieved) {
      // If we have an achieved value, calculate percentage
      const targetValue = get(detailQuantity, 'value') || get(detailRange, 'high.value');
      const achievedValue = get(achieved, 'value');
      
      if (targetValue && achievedValue) {
        return Math.min(100, Math.round((achievedValue / targetValue) * 100));
      }
    }
    
    // If no achieved value, check if due date has passed
    const dueDate = get(target, 'dueDate');
    if (dueDate && moment(dueDate).isBefore(moment())) {
      return 0; // Overdue
    }
    
    return null; // In progress
  }
  
  function renderTargetValue(target) {
    const detailQuantity = get(target, 'detailQuantity');
    const detailRange = get(target, 'detailRange');
    const detailCodeableConcept = get(target, 'detailCodeableConcept');
    const detailString = get(target, 'detailString');
    const detailBoolean = get(target, 'detailBoolean');
    const detailRatio = get(target, 'detailRatio');
    
    if (detailQuantity) {
      return `${get(detailQuantity, 'value')} ${get(detailQuantity, 'unit', '')}`;
    } else if (detailRange) {
      const low = get(detailRange, 'low.value');
      const high = get(detailRange, 'high.value');
      const unit = get(detailRange, 'low.unit', '');
      return `${low}-${high} ${unit}`;
    } else if (detailCodeableConcept) {
      return get(detailCodeableConcept, 'coding[0].display', get(detailCodeableConcept, 'text'));
    } else if (detailString) {
      return detailString;
    } else if (detailBoolean !== undefined) {
      return detailBoolean ? 'Yes' : 'No';
    } else if (detailRatio) {
      const numerator = get(detailRatio, 'numerator.value');
      const denominator = get(detailRatio, 'denominator.value');
      return `${numerator}:${denominator}`;
    }
    
    return 'Target defined';
  }
  
  function renderTargetStatus(target, progress) {
    const dueDate = get(target, 'dueDate');
    const isOverdue = dueDate && moment(dueDate).isBefore(moment());
    
    if (progress === 100) {
      return <Chip label="Achieved" color="success" size="small" icon={<CheckIcon />} />;
    } else if (isOverdue) {
      return <Chip label="Overdue" color="error" size="small" icon={<WarningIcon />} />;
    } else if (progress !== null) {
      return <Chip label={`${progress}%`} color="primary" size="small" />;
    } else {
      return <Chip label="In Progress" color="default" size="small" icon={<PendingIcon />} />;
    }
  }
  
  if (compact) {
    return (
      <Box>
        {targets.map(function(target, index) {
          const progress = calculateProgress(target);
          const measure = get(target, 'measure.coding[0].display', 'Target');
          
          return (
            <Box key={index} mb={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2">
                  {measure}: {renderTargetValue(target)}
                </Typography>
                {renderTargetStatus(target, progress)}
              </Box>
              {showProgress && progress !== null && (
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  style={{ marginTop: 4 }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    );
  }
  
  return (
    <List>
      {targets.map(function(target, index) {
        const progress = calculateProgress(target);
        const measure = get(target, 'measure.coding[0].display', 'Target');
        const dueDate = get(target, 'dueDate');
        const achieved = get(target, 'achieved');
        
        return (
          <ListItem key={index} alignItems="flex-start">
            <ListItemIcon>
              <TrendingUpIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2">
                    {measure}
                  </Typography>
                  {renderTargetStatus(target, progress)}
                </Box>
              }
              secondary={
                <Box mt={1}>
                  <Typography variant="body2" gutterBottom>
                    Target: {renderTargetValue(target)}
                  </Typography>
                  
                  {achieved && (
                    <Typography variant="body2" color="primary" gutterBottom>
                      Achieved: {get(achieved, 'value')} {get(achieved, 'unit', '')}
                    </Typography>
                  )}
                  
                  {showDates && dueDate && (
                    <Typography variant="caption" color="textSecondary">
                      Due: {moment(dueDate).format('MMM D, YYYY')}
                    </Typography>
                  )}
                  
                  {showProgress && progress !== null && (
                    <Box mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        style={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
}