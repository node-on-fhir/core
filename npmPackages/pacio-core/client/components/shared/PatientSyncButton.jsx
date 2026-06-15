// /packages/pacio-core/client/components/shared/PatientSyncButton.jsx

import React, { useState } from 'react';
import { 
  Button, 
  CircularProgress, 
  Snackbar,
  Alert,
  Box,
  Typography,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Sync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import moment from 'moment';

export function PatientSyncButton(props) {
  const {
    patientId,
    onSuccess,
    onError,
    showDetails = true,
    variant = 'contained',
    size = 'medium',
    fullWidth = false,
    resourceTypes = [
      'DocumentReference',
      'Composition', 
      'List',
      'Goal',
      'NutritionOrder',
      'ServiceRequest',
      'QuestionnaireResponse',
      'Observation',
      'Condition',
      'Procedure'
    ]
  } = props;
  
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  
  const effectivePatientId = patientId || Session.get('selectedPatientId');
  
  function handleSync() {
    if (!effectivePatientId) {
      setMessage('No patient selected');
      setSeverity('error');
      return;
    }
    
    setSyncing(true);
    setProgress(0);
    setSyncResults(null);
    
    // Simulate progress updates
    const progressInterval = setInterval(function() {
      setProgress(function(prev) {
        return Math.min(prev + 10, 90);
      });
    }, 500);
    
    Meteor.call('pacio.syncPatientRecord', effectivePatientId, resourceTypes, function(error, result) {
      clearInterval(progressInterval);
      setProgress(100);
      setSyncing(false);
      
      if (error) {
        console.error('Sync error:', error);
        setMessage(`Sync failed: ${error.message}`);
        setSeverity('error');
        
        if (onError) {
          onError(error);
        }
      } else {
        setSyncResults(result);
        setMessage(`Successfully synced ${get(result, 'totalResourcesUpdated', 0)} resources`);
        setSeverity('success');
        
        if (showDetails && get(result, 'totalResourcesUpdated', 0) > 0) {
          setShowDetailsDialog(true);
        }
        
        if (onSuccess) {
          onSuccess(result);
        }
      }
      
      // Reset progress after a delay
      setTimeout(function() {
        setProgress(0);
      }, 2000);
    });
  }
  
  function handleCloseSnackbar() {
    setMessage('');
  }
  
  function handleCloseDetails() {
    setShowDetailsDialog(false);
  }
  
  function renderSyncDetails() {
    if (!syncResults) return null;
    
    const resourceCounts = get(syncResults, 'resourceCounts', {});
    const errors = get(syncResults, 'errors', []);
    const timestamp = get(syncResults, 'timestamp');
    
    return (
      <>
        <Typography variant="body2" gutterBottom>
          Sync completed at {moment(timestamp).format('h:mm:ss A')}
        </Typography>
        
        <List dense>
          {Object.entries(resourceCounts).map(function([resourceType, count]) {
            if (count === 0) return null;
            
            return (
              <ListItem key={resourceType}>
                <ListItemIcon>
                  <SuccessIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={resourceType}
                  secondary={`${count} resources updated`}
                />
                <Chip label={count} size="small" color="primary" />
              </ListItem>
            );
          })}
        </List>
        
        {errors.length > 0 && (
          <>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Errors ({errors.length})
            </Typography>
            <List dense>
              {errors.map(function(error, index) {
                return (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={get(error, 'resourceType', 'Unknown')}
                      secondary={get(error, 'message')}
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </>
    );
  }
  
  return (
    <>
      <Box position="relative" display="inline-flex">
        <Button
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
          onClick={handleSync}
          disabled={syncing || !effectivePatientId}
        >
          {syncing ? 'Syncing...' : 'Sync Patient Record'}
        </Button>
        
        {syncing && progress > 0 && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height={3}
          >
            <LinearProgress 
              variant="determinate" 
              value={progress}
              style={{ borderRadius: '0 0 4px 4px' }}
            />
          </Box>
        )}
      </Box>
      
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={severity}
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
      
      <Dialog
        open={showDetailsDialog}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SuccessIcon color="success" />
            <Typography variant="h6">Sync Complete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderSyncDetails()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}