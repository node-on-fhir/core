// /packages/workqueues/ui/components/WorkItemDetail.jsx

import React, { useState, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  Slider,
  Paper
} from '@mui/material';
import { 
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
// Removed DateTimePicker imports - using native date input instead
import { get, debounce } from 'lodash';
import moment from 'moment';

export function WorkItemDetail({ 
  task, 
  open, 
  onClose,
  onSave = null,
  onDelete = null,
  readOnly = false 
}) {
  const [editedTask, setEditedTask] = useState({
    text: task?.text || '',
    description: task?.description || '',
    priority: task?.priority || 'routine',
    status: task?.status || 'requested',
    category: task?.category || '',
    tags: task?.tags || [],
    dueDate: task?.dueDate || null,
    assignee: task?.assignee || Meteor.userId(),
    progress: task?.progress || 0,
    done: task?.done || false,
    star: task?.star || false
  });
  
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = useCallback((field, value) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!task?._id || readOnly) return;
    
    setIsSaving(true);
    try {
      await Meteor.callAsync('workqueues.updateTask', task._id, editedTask);
      if (onSave) {
        onSave(editedTask);
      }
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [task, editedTask, onSave, onClose, readOnly]);

  const handleDelete = useCallback(async () => {
    if (!task?._id || readOnly) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await Meteor.callAsync('workqueues.deleteTask', task._id);
        if (onDelete) {
          onDelete(task._id);
        }
        onClose();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task: ' + error.message);
      }
    }
  }, [task, onDelete, onClose, readOnly]);

  const handleAddTag = useCallback(() => {
    if (newTag && !editedTask.tags.includes(newTag)) {
      handleFieldChange('tags', [...editedTask.tags, newTag]);
      setNewTag('');
    }
  }, [newTag, editedTask.tags, handleFieldChange]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    handleFieldChange('tags', editedTask.tags.filter(tag => tag !== tagToRemove));
  }, [editedTask.tags, handleFieldChange]);

  const handleAddNote = useCallback(async () => {
    if (!newNote || !task?._id) return;
    
    try {
      await Meteor.callAsync('workqueues.addNote', task._id, newNote);
      setNewNote('');
      // In a real app, you'd refresh the task data here
    } catch (error) {
      console.error('Error adding note:', error);
    }
  }, [newNote, task]);

  if (!task) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Task Details</Typography>
          <Box>
            <IconButton
              onClick={() => handleFieldChange('star', !editedTask.star)}
              disabled={readOnly}
            >
              {editedTask.star ? <StarIcon color="warning" /> : <StarBorderIcon />}
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Title"
              value={editedTask.text}
              onChange={(e) => handleFieldChange('text', e.target.value)}
              disabled={readOnly}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editedTask.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              disabled={readOnly}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={editedTask.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                disabled={readOnly}
                label="Priority"
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="asap">ASAP</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="stat">STAT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editedTask.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                disabled={readOnly}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="requested">Requested</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="on-hold">On Hold</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editedTask.category || ''}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                disabled={readOnly}
                label="Category"
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="imaging">Imaging</MenuItem>
                <MenuItem value="laboratory">Laboratory</MenuItem>
                <MenuItem value="pharmacy">Pharmacy</MenuItem>
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="procedure">Procedure</MenuItem>
                <MenuItem value="administrative">Administrative</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Due Date"
              value={editedTask.dueDate ? moment(editedTask.dueDate).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) => handleFieldChange('dueDate', e.target.value ? new Date(e.target.value) : null)}
              disabled={readOnly}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Progress: {editedTask.progress}%
            </Typography>
            <Slider
              value={editedTask.progress}
              onChange={(e, value) => handleFieldChange('progress', value)}
              disabled={readOnly}
              marks
              step={10}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                {editedTask.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={readOnly ? undefined : () => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
              {!readOnly && (
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button 
                    size="small" 
                    onClick={handleAddTag}
                    disabled={!newTag}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
          
          {task.notes && task.notes.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Notes
              </Typography>
              <List dense>
                {task.notes.map((note, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <CommentIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={note.text}
                      secondary={
                        <>
                          By {note.authorId} • {moment(note.timestamp).format('MMM D, h:mm A')}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
          
          {!readOnly && (
            <Grid item xs={12}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button onClick={handleAddNote} disabled={!newNote}>
                  Add Note
                </Button>
              </Box>
            </Grid>
          )}
          
          {task.fhirTask && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  FHIR Task Resource
                </Typography>
                <Typography variant="caption" component="pre" sx={{ overflow: 'auto' }}>
                  {JSON.stringify(task.fhirTask, null, 2)}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        {!readOnly && (
          <>
            <Button 
              color="error" 
              onClick={handleDelete}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
            <Box flex={1} />
          </>
        )}
        <Button onClick={onClose}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            Save Changes
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}