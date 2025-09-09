// packages/request-for-corrections/client/components/CorrectionTaskStatus.jsx

import React from 'react';
import {
  Box,
  Chip,
  LinearProgress,
  Typography,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { CorrectionTasks } from '../../lib/collections/CorrectionTasks';

export default function CorrectionTaskStatus({ task, showProgress = true, showSteps = false }) {
  if (!task) return null;
  
  const businessStatus = CorrectionTasks.getBusinessStatusCode(task);
  const stateDisplay = CorrectionTasks.getStateDisplay(task);
  const progress = CorrectionTasks.getProgressPercentage(task);
  
  const getStatusColor = () => {
    const statusColorMap = {
      'queued': 'default',
      'in-review': 'primary',
      'waiting-for-information': 'warning',
      'accepted': 'success',
      'partial-accept': 'warning',
      'amendment-completed': 'success',
      'denied': 'error',
      'disagreement-logged': 'warning',
      'completed': 'success',
      'requester-cancelled': 'default'
    };
    return statusColorMap[businessStatus] || 'default';
  };
  
  const getSteps = () => {
    return [
      { 
        label: 'Request Submitted', 
        completed: true 
      },
      { 
        label: 'Under Review', 
        completed: ['in-review', 'waiting-for-information', 'accepted', 'partial-accept', 'denied', 'amendment-completed'].includes(businessStatus) 
      },
      { 
        label: 'Decision Made', 
        completed: ['accepted', 'partial-accept', 'denied', 'amendment-completed'].includes(businessStatus) 
      },
      { 
        label: 'Completed', 
        completed: ['amendment-completed', 'requester-cancelled'].includes(businessStatus) || (businessStatus === 'denied' && !CorrectionTasks.canFileDisagreement(task)) 
      }
    ];
  };
  
  return (
    <Box>
      {/* Status Chip */}
      <Box sx={{ mb: showProgress ? 2 : 0 }}>
        <Chip 
          label={stateDisplay}
          color={getStatusColor()}
          size="small"
        />
      </Box>
      
      {/* Progress Bar */}
      {showProgress && (
        <Box sx={{ mb: showSteps ? 3 : 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Progress
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={getStatusColor() === 'error' ? 'error' : 'primary'}
          />
        </Box>
      )}
      
      {/* Workflow Steps */}
      {showSteps && (
        <Stepper orientation="vertical">
          {getSteps().map((step, index) => (
            <Step key={index} active={false} completed={step.completed}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
    </Box>
  );
}