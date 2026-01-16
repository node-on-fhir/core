// /packages/pacio-core/client/components/goals/GoalAchievementIndicator.jsx

import React from 'react';
import { 
  Box,
  Typography,
  CircularProgress,
  Chip,
  Tooltip,
  LinearProgress,
  Paper
} from '@mui/material';
import { 
  CheckCircle as AchievedIcon,
  Cancel as NotAchievedIcon,
  HourglassEmpty as InProgressIcon,
  Help as UnknownIcon,
  TrendingUp as ImprovingIcon,
  TrendingDown as WorseningIcon,
  TrendingFlat as NoChangeIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';

export function GoalAchievementIndicator(props) {
  const {
    achievementStatus,
    lifecycleStatus,
    target,
    startDate,
    targetDate,
    showDetails = true,
    showTrend = false,
    size = 'medium',
    variant = 'chip' // 'chip', 'icon', 'progress', 'detailed'
  } = props;
  
  const achievementCode = get(achievementStatus, 'coding[0].code');
  const achievementDisplay = get(achievementStatus, 'coding[0].display', 'Unknown');
  
  function getAchievementColor() {
    switch (achievementCode) {
      case 'achieved':
      case 'improving':
        return 'success';
      case 'not-achieved':
      case 'worsening':
        return 'error';
      case 'in-progress':
      case 'sustaining':
        return 'primary';
      case 'no-change':
        return 'warning';
      default:
        return 'default';
    }
  }
  
  function getAchievementIcon() {
    switch (achievementCode) {
      case 'achieved':
        return <AchievedIcon />;
      case 'not-achieved':
        return <NotAchievedIcon />;
      case 'in-progress':
        return <InProgressIcon />;
      case 'improving':
        return <ImprovingIcon />;
      case 'worsening':
        return <WorseningIcon />;
      case 'no-change':
        return <NoChangeIcon />;
      default:
        return <UnknownIcon />;
    }
  }
  
  function calculateTimeProgress() {
    if (!startDate || !targetDate) return null;
    
    const start = moment(startDate);
    const target = moment(targetDate);
    const now = moment();
    
    if (now.isBefore(start)) return 0;
    if (now.isAfter(target)) return 100;
    
    const totalDays = target.diff(start, 'days');
    const elapsedDays = now.diff(start, 'days');
    
    return Math.round((elapsedDays / totalDays) * 100);
  }
  
  function renderLifecycleChip() {
    if (!lifecycleStatus) return null;
    
    let color = 'default';
    switch (lifecycleStatus) {
      case 'active':
        color = 'primary';
        break;
      case 'completed':
        color = 'success';
        break;
      case 'cancelled':
      case 'rejected':
        color = 'error';
        break;
      case 'on-hold':
        color = 'warning';
        break;
    }
    
    return (
      <Chip 
        label={lifecycleStatus}
        size="small"
        color={color}
        variant="outlined"
        style={{ marginLeft: 8 }}
      />
    );
  }
  
  if (variant === 'icon') {
    return (
      <Tooltip title={achievementDisplay}>
        <Box color={`${getAchievementColor()}.main`}>
          {getAchievementIcon()}
        </Box>
      </Tooltip>
    );
  }
  
  if (variant === 'chip') {
    return (
      <Box display="flex" alignItems="center">
        <Chip
          label={achievementDisplay}
          color={getAchievementColor()}
          size={size}
          icon={getAchievementIcon()}
        />
        {showDetails && renderLifecycleChip()}
      </Box>
    );
  }
  
  if (variant === 'progress') {
    const timeProgress = calculateTimeProgress();
    const achievementProgress = achievementCode === 'achieved' ? 100 : 
                               achievementCode === 'not-achieved' ? 0 : 
                               timeProgress || 50;
    
    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="body2">
            {achievementDisplay}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {achievementProgress}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={achievementProgress}
          color={getAchievementColor()}
          style={{ height: 8, borderRadius: 4 }}
        />
        {timeProgress !== null && showDetails && (
          <Box mt={1}>
            <Typography variant="caption" color="textSecondary">
              Time elapsed: {timeProgress}%
            </Typography>
          </Box>
        )}
      </Box>
    );
  }
  
  if (variant === 'detailed') {
    const timeProgress = calculateTimeProgress();
    
    return (
      <Paper variant="outlined" style={{ padding: 16 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box color={`${getAchievementColor()}.main`}>
              {getAchievementIcon()}
            </Box>
            <Typography variant="h6">
              {achievementDisplay}
            </Typography>
          </Box>
          {renderLifecycleChip()}
        </Box>
        
        {showDetails && (
          <Box>
            {startDate && (
              <Typography variant="body2" gutterBottom>
                <strong>Started:</strong> {moment(startDate).format('MMM D, YYYY')}
              </Typography>
            )}
            
            {targetDate && (
              <Typography variant="body2" gutterBottom>
                <strong>Target Date:</strong> {moment(targetDate).format('MMM D, YYYY')}
                {moment(targetDate).isBefore(moment()) && 
                  <Chip label="Overdue" size="small" color="error" style={{ marginLeft: 8 }} />
                }
              </Typography>
            )}
            
            {timeProgress !== null && (
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  Time Progress
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={timeProgress}
                  style={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {timeProgress}% of time elapsed
                </Typography>
              </Box>
            )}
            
            {showTrend && achievementCode && (
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  Trend
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {achievementCode === 'improving' && <TrendingUpIcon color="success" />}
                  {achievementCode === 'worsening' && <TrendingDownIcon color="error" />}
                  {achievementCode === 'no-change' && <TrendingFlatIcon color="warning" />}
                  <Typography variant="body2" color="textSecondary">
                    {achievementCode === 'improving' && 'Goal metrics are improving'}
                    {achievementCode === 'worsening' && 'Goal metrics are worsening'}
                    {achievementCode === 'no-change' && 'No significant change'}
                    {achievementCode === 'sustaining' && 'Maintaining achieved status'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    );
  }
  
  // Default fallback
  return (
    <Typography variant="body2" color={`${getAchievementColor()}.main`}>
      {achievementDisplay}
    </Typography>
  );
}