// /packages/workqueues/ui/components/QuickAddTask.jsx

import React, { useState, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Paper,
  TextField,
  IconButton,
  Box,
  InputAdornment,
  Collapse,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarTodayIcon,
  Label as LabelIcon
} from '@mui/icons-material';
// Removed DateTimePicker imports - using native date input instead
import moment from 'moment';

export function QuickAddTask({ 
  queueId = null, 
  defaultPriority = 'routine',
  onTaskAdded = null,
  placeholder = "Add a new task..."
}) {
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState(defaultPriority);
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [star, setStar] = useState(false);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!taskText.trim()) return;
    
    setIsAdding(true);
    
    const taskData = {
      text: taskText.trim(),
      priority: star ? 'urgent' : priority,
      tags
    };
    
    // Only add optional fields if they have values
    if (queueId) taskData.queueId = queueId;
    if (category) taskData.category = category;
    if (dueDate) taskData.dueDate = dueDate;
    
    try {
      const taskId = await Meteor.callAsync('workqueues.createTask', taskData);
      
      // Reset form
      setTaskText('');
      setPriority(defaultPriority);
      setCategory('');
      setDueDate(null);
      setStar(false);
      setTags([]);
      setShowAdvanced(false);
      
      if (onTaskAdded) {
        onTaskAdded(taskId);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  }, [taskText, priority, star, queueId, category, dueDate, tags, defaultPriority, onTaskAdded]);

  const handleAddTag = useCallback(() => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  }, [currentTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showAdvanced && e.target.name === 'tag') {
        handleAddTag();
      } else {
        handleSubmit(e);
      }
    }
  }, [showAdvanced, handleAddTag, handleSubmit]);

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <form onSubmit={handleSubmit}>
        <Box display="flex" gap={1} alignItems="flex-start">
          <TextField
            fullWidth
            placeholder={placeholder}
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAdding}
            multiline
            maxRows={3}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setStar(!star)}
                    edge="end"
                  >
                    {star ? <StarIcon color="warning" /> : <StarBorderIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    edge="end"
                  >
                    {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <IconButton
            type="submit"
            color="primary"
            disabled={!taskText.trim() || isAdding}
            sx={{ mt: 0.5 }}
          >
            {isAdding ? <CircularProgress size={24} /> : <AddIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={showAdvanced}>
          <Box mt={2} display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                displayEmpty
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="asap">ASAP</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="stat">STAT</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">No Category</MenuItem>
                <MenuItem value="imaging">Imaging</MenuItem>
                <MenuItem value="laboratory">Laboratory</MenuItem>
                <MenuItem value="pharmacy">Pharmacy</MenuItem>
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="procedure">Procedure</MenuItem>
                <MenuItem value="administrative">Administrative</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              size="small"
              type="datetime-local"
              label="Due Date"
              value={dueDate ? moment(dueDate).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
              sx={{ width: 200 }}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              size="small"
              placeholder="Add tag"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleKeyPress}
              name="tag"
              sx={{ width: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LabelIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: currentTag && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleAddTag}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          {tags.length > 0 && (
            <Box mt={1} display="flex" gap={1} flexWrap="wrap">
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
            </Box>
          )}
        </Collapse>
      </form>
    </Paper>
  );
}