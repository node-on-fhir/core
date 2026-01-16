// /packages/checklist-manifesto/ui/components/ListForm.jsx

import React, { useState } from 'react';
import { 
  Box, TextField, Button, FormControlLabel, Switch,
  Grid, Typography
} from '@mui/material';

export function ListForm({ onSubmit, onCancel, initialData = {} }) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    public: initialData.public || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      public: formData.public
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="List Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.public}
                onChange={(e) => setFormData({ ...formData, public: e.target.checked })}
              />
            }
            label="Make this list public"
          />
          <Typography variant="caption" display="block" color="text.secondary">
            Public lists can be viewed and cloned by other users
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={onCancel} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {initialData._id ? 'Update List' : 'Create List'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}