// /packages/pacio-core/client/components/advanceDirectives/AdvanceDirectiveRevoke.jsx

import React, { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { 
  Warning as WarningIcon 
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import moment from 'moment';

export function AdvanceDirectiveRevoke(props) {
  const {
    open,
    onClose,
    advanceDirective,
    onSuccess,
    requireReason = true
  } = props;
  
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  if (!advanceDirective) {
    return null;
  }
  
  function handleReasonChange(event) {
    setReason(event.target.value);
    setError('');
  }
  
  function handleCancel() {
    setReason('');
    setError('');
    setLoading(false);
    if (onClose) {
      onClose();
    }
  }
  
  function handleRevoke() {
    if (requireReason && !reason.trim()) {
      setError('Please provide a reason for revoking this directive');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const directiveId = get(advanceDirective, 'id');
    
    Meteor.call('pacio.revokeAdvanceDirective', directiveId, reason, function(error, result) {
      setLoading(false);
      
      if (error) {
        console.error('Error revoking advance directive:', error);
        setError(error.message || 'Failed to revoke advance directive');
      } else {
        Session.set('mainAppDialogJson', {
          title: 'Success',
          message: 'The advance directive has been successfully revoked.'
        });
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        handleCancel();
      }
    });
  }
  
  const isAlreadyRevoked = get(advanceDirective, 'status') === 'entered-in-error';
  
  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Revoke Advance Directive</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {isAlreadyRevoked ? (
          <Alert severity="info">
            This advance directive has already been revoked.
          </Alert>
        ) : (
          <>
            <DialogContentText>
              You are about to revoke the following advance directive:
            </DialogContentText>
            
            <Box my={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">
                <strong>Type:</strong> {get(advanceDirective, 'type.coding[0].display', 'Unknown')}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {moment(get(advanceDirective, 'date')).format('MMMM D, YYYY')}
              </Typography>
              <Typography variant="body2">
                <strong>Author:</strong> {get(advanceDirective, 'author[0].display', 'Unknown')}
              </Typography>
            </Box>
            
            <Alert severity="warning" style={{ marginBottom: 16 }}>
              <strong>Warning:</strong> This action cannot be undone. The directive will be marked as 
              entered-in-error and any associated documents will be watermarked as "REVOKED".
            </Alert>
            
            {requireReason && (
              <TextField
                autoFocus
                margin="dense"
                label="Reason for Revocation"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={reason}
                onChange={handleReasonChange}
                error={!!error}
                helperText={error || 'Please provide a detailed reason for revoking this directive'}
                disabled={loading}
              />
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        {!isAlreadyRevoked && (
          <Button 
            onClick={handleRevoke}
            color="error"
            variant="contained"
            disabled={loading || (requireReason && !reason.trim())}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Revoking...' : 'Revoke Directive'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}