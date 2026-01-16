// /packages/checklist-manifesto/ui/components/TaskList.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Material UI
import {
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  Checkbox, IconButton, Typography, Chip, Box, Tooltip
} from '@mui/material';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import ScheduleIcon from '@mui/icons-material/Schedule';

export function TaskList({ tasks, listId, onTaskUpdate }) {
  const handleToggleComplete = async (taskId) => {
    try {
      await Meteor.callAsync('checklist.tasks.toggleComplete', taskId);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await Meteor.callAsync('checklist.tasks.remove', taskId);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'asap': return 'warning';
      case 'stat': return 'error';
      default: return 'default';
    }
  };

  const formatDueDate = (task) => {
    const dueDate = get(task, 'executionPeriod.end');
    if (!dueDate) return null;

    const now = moment();
    const due = moment(dueDate);
    const daysUntil = due.diff(now, 'days');

    if (daysUntil < 0) {
      return { text: `Overdue by ${Math.abs(daysUntil)} days`, color: 'error' };
    } else if (daysUntil === 0) {
      return { text: 'Due today', color: 'warning' };
    } else if (daysUntil <= 3) {
      return { text: `Due in ${daysUntil} days`, color: 'warning' };
    } else {
      return { text: due.format('MMM D'), color: 'default' };
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No tasks yet. Add your first task to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {tasks.map((task) => {
        const isCompleted = task.status === 'completed';
        const priority = get(task, 'priority', 'routine');
        const dueInfo = formatDueDate(task);
        const isOwner = task.requester === Meteor.userId() || task.owner === Meteor.userId();

        return (
          <ListItem 
            key={task._id}
            sx={{ 
              opacity: isCompleted ? 0.6 : 1,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <ListItemIcon>
              <Checkbox
                checked={isCompleted}
                onChange={() => handleToggleComplete(task._id)}
                disabled={!isOwner}
              />
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  sx={{ 
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}
                >
                  {get(task, 'description', 'Untitled task')}
                </Typography>
              }
              secondary={
                <Box display="flex" gap={1} mt={0.5}>
                  {priority !== 'routine' && (
                    <Chip
                      size="small"
                      icon={<FlagIcon />}
                      label={priority}
                      color={getPriorityColor(priority)}
                    />
                  )}
                  {dueInfo && (
                    <Chip
                      size="small"
                      icon={<ScheduleIcon />}
                      label={dueInfo.text}
                      color={dueInfo.color}
                    />
                  )}
                </Box>
              }
            />

            {isOwner && (
              <ListItemSecondaryAction>
                <Tooltip title="Delete task">
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        );
      })}
    </List>
  );
}