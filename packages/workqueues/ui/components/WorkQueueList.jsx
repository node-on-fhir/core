// /packages/workqueues/ui/components/WorkQueueList.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { WorkQueueItems } from '../../lib/collections';
import { get } from 'lodash';
import moment from 'moment';

export function WorkQueueList({ 
  queueId = null, 
  filters = {}, 
  onItemClick = null,
  showCheckboxes = true,
  showActions = true 
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    const options = {
      ...filters,
      limit: 100
    };

    let handle;
    if (queueId) {
      handle = Meteor.subscribe('workqueues.queueTasks', queueId, options, {
        onReady: () => setIsLoading(false),
        onError: (error) => {
          console.error('Subscription error:', error);
          setIsLoading(false);
        }
      });
    } else {
      handle = Meteor.subscribe('workqueues.myTasks', options, {
        onReady: () => setIsLoading(false),
        onError: (error) => {
          console.error('Subscription error:', error);
          setIsLoading(false);
        }
      });
    }

    const computation = Tracker.autorun(() => {
      const selector = {};
      if (queueId) {
        selector.queueId = queueId;
      } else {
        selector.$or = [
          { assignee: Meteor.userId() },
          { creator: Meteor.userId() },
          { owner: Meteor.userId() }
        ];
      }

      if (filters.status) {
        selector.status = filters.status;
      }
      if (filters.priority) {
        selector.priority = filters.priority;
      }
      if (filters.showCompleted === false) {
        selector.done = { $ne: true };
      }

      const taskList = WorkQueueItems.find(selector, {
        sort: { 
          star: -1,
          priority: -1,
          createdAt: -1 
        }
      }).fetch();

      setTasks(taskList);
    });

    return () => {
      computation.stop();
      if (handle) {
        handle.stop();
      }
    };
  }, [queueId, JSON.stringify(filters)]);

  const handleToggleDone = useCallback(async (taskId, currentDone) => {
    try {
      await Meteor.callAsync('workqueues.updateTask', taskId, { done: !currentDone });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }, []);

  const handleToggleStar = useCallback(async (taskId, currentStar) => {
    try {
      await Meteor.callAsync('workqueues.starTask', taskId, !currentStar);
    } catch (error) {
      console.error('Error starring task:', error);
    }
  }, []);

  const handleDelete = useCallback(async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await Meteor.callAsync('workqueues.deleteTask', taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'stat': return 'error';
      case 'urgent': return 'warning';
      case 'asap': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (task) => {
    if (task.done) {
      return null;
    }
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return <WarningIcon color="error" fontSize="small" />;
    }
    if (task.status === 'in-progress') {
      return <AccessTimeIcon color="primary" fontSize="small" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <AssignmentIcon sx={{ fontSize: 64, color: 'action.disabled' }} />
        <Typography variant="h6" color="textSecondary" mt={2}>
          No tasks found
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Create a new task to get started
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={0}>
      <List>
        {tasks.map((task) => (
          <ListItem
            key={task._id}
            divider
            sx={{
              opacity: task.done ? 0.6 : 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            {showCheckboxes && (
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={task.done}
                  onChange={() => handleToggleDone(task._id, task.done)}
                  color="primary"
                />
              </ListItemIcon>
            )}
            
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="body1"
                    sx={{
                      textDecoration: task.done ? 'line-through' : 'none',
                      cursor: onItemClick ? 'pointer' : 'default'
                    }}
                    onClick={() => onItemClick && onItemClick(task)}
                  >
                    {task.text}
                  </Typography>
                  {getStatusIcon(task)}
                  {task.priority !== 'routine' && (
                    <Chip
                      label={task.priority}
                      size="small"
                      color={getPriorityColor(task.priority)}
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
              }
              secondary={
                <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                  {task.dueDate && (
                    <Typography variant="caption" color="textSecondary">
                      Due: {moment(task.dueDate).format('MMM D, h:mm A')}
                    </Typography>
                  )}
                  {task.assignee && task.assignee !== task.creator && (
                    <Typography variant="caption" color="textSecondary">
                      Assigned to: {task.assignee}
                    </Typography>
                  )}
                  {task.progress > 0 && task.progress < 100 && (
                    <Typography variant="caption" color="textSecondary">
                      Progress: {task.progress}%
                    </Typography>
                  )}
                </Box>
              }
              secondaryTypographyProps={{
                component: 'div'
              }}
            />
            
            {showActions && (
              <ListItemSecondaryAction>
                <Tooltip title={task.star ? "Unmark as urgent" : "Mark as urgent"}>
                  <IconButton
                    edge="end"
                    onClick={() => handleToggleStar(task._id, task.star)}
                    size="small"
                  >
                    {task.star ? <StarIcon color="warning" /> : <StarBorderIcon />}
                  </IconButton>
                </Tooltip>
                
                {onItemClick && (
                  <Tooltip title="View details">
                    <IconButton
                      edge="end"
                      onClick={() => onItemClick(task)}
                      size="small"
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Delete task">
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(task._id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}