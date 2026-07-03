// packages/smart-web-messaging/client/components/ActivityLaunchModal.jsx

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { get } from 'lodash';
import { useSmartMessaging } from './SmartMessagingProvider.jsx';

/**
 * ActivityLaunchModal component
 * Displays UI for activity launches
 */
export const ActivityLaunchModal = function({ 
  open, 
  activityType, 
  parameters, 
  context,
  onComplete,
  onCancel 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const { launchActivity } = useSmartMessaging();
  
  // Get activity definition
  const activityDef = Activities.getDefinition(activityType);
  const activityName = get(activityDef, 'name', activityType);
  const activityDescription = get(activityDef, 'description', '');
  
  // Handle activity launch
  const handleLaunch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const launchResult = await launchActivity(activityType, parameters, context);
      setResult(launchResult);
      
      // Auto-complete after successful launch
      setTimeout(() => {
        if (onComplete) {
          onComplete(launchResult);
        }
      }, 1500);
      
    } catch (err) {
      console.error('Activity launch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-launch on open
  useEffect(() => {
    if (open && !loading && !result && !error) {
      handleLaunch();
    }
  }, [open]);
  
  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setResult(null);
    }
  }, [open]);
  
  return (
    <Dialog
      open={open}
      onClose={!loading ? onCancel : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {activityName}
      </DialogTitle>
      
      <DialogContent>
        {activityDescription && (
          <Typography variant="body2" color="textSecondary" paragraph>
            {activityDescription}
          </Typography>
        )}
        
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" py={3}>
            <CircularProgress />
            <Typography variant="body2" color="textSecondary" mt={2}>
              Launching activity...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {result && (
          <Alert severity="success">
            Activity launched successfully!
          </Alert>
        )}
        
        {!loading && !error && !result && parameters && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Parameters:
            </Typography>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(parameters, null, 2)}
            </pre>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {!loading && !result && (
          <>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            {error && (
              <Button onClick={handleLaunch} color="primary">
                Retry
              </Button>
            )}
          </>
        )}
        {result && (
          <Button onClick={() => onComplete && onComplete(result)} color="primary">
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};