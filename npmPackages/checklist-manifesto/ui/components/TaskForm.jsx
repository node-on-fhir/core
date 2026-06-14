// /packages/checklist-manifesto/ui/components/TaskForm.jsx

import React, { useState } from 'react';
import { 
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Grid, Typography
} from '@mui/material';

export function TaskForm({ listId, onSubmit, onCancel, initialData = {} }) {
  const [formData, setFormData] = useState({
    description: initialData.description || '',
    priority: initialData.priority || 'routine',
    dueDate: initialData.dueDate || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      return;
    }

    const taskData = {
      description: formData.description.trim(),
      priority: formData.priority,
      listId: listId
    };

    if (formData.dueDate) {
      taskData.dueDate = new Date(formData.dueDate);
    }

    onSubmit(taskData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Task Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            autoFocus
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="routine">Routine</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="asap">ASAP</MenuItem>
              <MenuItem value="stat">STAT</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Due Date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={onCancel} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {initialData._id ? 'Update Task' : 'Add Task'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}