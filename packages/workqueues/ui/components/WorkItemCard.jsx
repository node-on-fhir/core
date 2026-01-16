// /packages/workqueues/ui/components/WorkItemCard.jsx

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Avatar,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';

export function WorkItemCard({ 
  task, 
  onToggleDone, 
  onToggleStar, 
  onClick,
  compact = false 
}) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'stat': return 'error';
      case 'urgent': return 'warning';
      case 'asap': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'cancelled': return 'error';
      case 'on-hold': return 'warning';
      default: return 'default';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.done;

  return (
    <Card 
      variant="outlined"
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        opacity: task.done ? 0.7 : 1,
        borderLeft: isOverdue ? 4 : 0,
        borderLeftColor: 'error.main',
        '&:hover': onClick ? {
          boxShadow: 2,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s'
        } : {}
      }}
      onClick={onClick}
    >
      {task.progress > 0 && task.progress < 100 && (
        <LinearProgress 
          variant="determinate" 
          value={task.progress} 
          sx={{ height: 2 }}
        />
      )}
      
      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography 
              variant={compact ? "body2" : "h6"}
              gutterBottom
              sx={{ 
                textDecoration: task.done ? 'line-through' : 'none',
                fontWeight: task.star ? 600 : 400
              }}
            >
              {task.text}
            </Typography>
            
            {!compact && task.description && (
              <Typography variant="body2" color="textSecondary" paragraph>
                {task.description}
              </Typography>
            )}
          </Box>
          
          <Box display="flex" gap={0.5}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(task._id, task.star);
              }}
            >
              {task.star ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </IconButton>
            
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDone(task._id, task.done);
              }}
            >
              {task.done ? 
                <CheckCircleIcon color="success" fontSize="small" /> : 
                <RadioButtonUncheckedIcon fontSize="small" />
              }
            </IconButton>
          </Box>
        </Box>
        
        <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
          {task.priority !== 'routine' && (
            <Chip
              label={task.priority.toUpperCase()}
              size="small"
              color={getPriorityColor(task.priority)}
            />
          )}
          
          {task.status && task.status !== 'requested' && (
            <Chip
              label={task.status.replace('-', ' ')}
              size="small"
              color={getStatusColor(task.status)}
              variant="outlined"
            />
          )}
          
          {task.category && (
            <Chip
              label={task.category}
              size="small"
              variant="outlined"
            />
          )}
          
          {task.tags && task.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
        
        <Box display="flex" alignItems="center" gap={2} mt={1}>
          {task.assignee && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                {task.assignee}
              </Typography>
            </Box>
          )}
          
          {task.dueDate && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {isOverdue ? (
                <WarningIcon fontSize="small" color="error" />
              ) : (
                <AccessTimeIcon fontSize="small" color="action" />
              )}
              <Typography 
                variant="caption" 
                color={isOverdue ? "error" : "textSecondary"}
              >
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {moment(task.dueDate).fromNow()}
              </Typography>
            </Box>
          )}
        </Box>
        
        {task.patientReference && (
          <Box mt={1}>
            <Typography variant="caption" color="textSecondary">
              Patient: {task.patientReference}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}