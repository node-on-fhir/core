// /packages/pacio-core/client/components/beds/AssignToBedModal.jsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Alert,
  Box,
  Chip,
  Stack
} from '@mui/material';
import { Bed as BedIcon, Person as PersonIcon } from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Beds } from '../../../lib/collections/BedsCollection';
import { get } from 'lodash';
import moment from 'moment';

export function AssignToBedModal({ open, onClose, patient }) {
  const [selectedBed, setSelectedBed] = useState('');
  const [admissionDate, setAdmissionDate] = useState(moment().format('YYYY-MM-DD'));
  const [expectedDischargeDate, setExpectedDischargeDate] = useState('');
  const [attendingPhysician, setAttendingPhysician] = useState('');
  const [primaryNurse, setPrimaryNurse] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Subscribe to available beds
  const { availableBeds, loading } = useTracker(() => {
    const handle = Meteor.subscribe('pacio.beds', { status: 'available' });
    
    return {
      availableBeds: Beds.find({ status: 'available' }).fetch(),
      loading: !handle.ready()
    };
  });

  const handleAssign = async () => {
    setError('');
    setSuccess(false);

    if (!selectedBed) {
      setError('Please select a bed');
      return;
    }

    try {
      // Find the selected bed
      const bed = Beds.findOne({ _id: selectedBed });
      
      if (!bed) {
        setError('Selected bed not found');
        return;
      }

      // Extract the patient ID, handling both regular strings and ObjectIDs
      const patientId = get(patient, 'id') || get(patient, '_id');
      
      // Prepare additional info for bed assignment
      const additionalInfo = {
        admissionDate: new Date(admissionDate),
        attendingPhysician,
        primaryNurse
      };

      if (expectedDischargeDate) {
        additionalInfo.expectedDischargeDate = new Date(expectedDischargeDate);
      }

      // Call method to update bed assignment
      Meteor.call('pacio.assignPatientToBed', selectedBed, patientId, additionalInfo, (error, result) => {
        if (error) {
          console.error('Error assigning bed:', error);
          setError(error.message || 'Failed to assign bed');
        } else {
          setSuccess(true);
          // Close modal after short delay
          setTimeout(() => {
            onClose();
            // Reset form
            setSelectedBed('');
            setExpectedDischargeDate('');
            setAttendingPhysician('');
            setPrimaryNurse('');
            setSuccess(false);
          }, 1500);
        }
      });

    } catch (err) {
      console.error('Error in bed assignment:', err);
      setError('An unexpected error occurred');
    }
  };

  if (!patient) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <BedIcon />
          <Typography variant="h6">Assign Patient to Bed</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Patient Info */}
          <Alert severity="info" icon={<PersonIcon />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              Assigning bed for: <strong>{get(patient, 'name[0].text') || 'Unknown Patient'}</strong>
            </Typography>
            {get(patient, 'identifier[0].value') && (
              <Typography variant="caption">
                MRN: {get(patient, 'identifier[0].value')}
              </Typography>
            )}
          </Alert>

          <Grid container spacing={2}>
            {/* Bed Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Bed</InputLabel>
                <Select
                  value={selectedBed}
                  onChange={(e) => setSelectedBed(e.target.value)}
                  label="Select Bed"
                  disabled={loading}
                >
                  {availableBeds.map((bed) => (
                    <MenuItem key={bed._id} value={bed._id}>
                      <Stack direction="row" spacing={2} alignItems="center" width="100%">
                        <BedIcon fontSize="small" />
                        <Box flexGrow={1}>
                          <Typography variant="body2">
                            Room {bed.roomNumber} - Bed {bed.bedId}
                          </Typography>
                          {bed.ward && (
                            <Typography variant="caption" color="text.secondary">
                              {bed.ward} {bed.floor && `- Floor ${bed.floor}`}
                            </Typography>
                          )}
                        </Box>
                        <Chip 
                          label={bed.bedType} 
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {loading && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Loading available beds...
                  </Typography>
                )}
                {!loading && availableBeds.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    No available beds found
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Admission Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Admission Date"
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Expected Discharge Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Discharge Date"
                type="date"
                value={expectedDischargeDate}
                onChange={(e) => setExpectedDischargeDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: admissionDate }}
              />
            </Grid>

            {/* Attending Physician */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Attending Physician"
                value={attendingPhysician}
                onChange={(e) => setAttendingPhysician(e.target.value)}
              />
            </Grid>

            {/* Primary Nurse */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Nurse"
                value={primaryNurse}
                onChange={(e) => setPrimaryNurse(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Bed assigned successfully!
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleAssign} 
          variant="contained"
          disabled={!selectedBed || loading}
        >
          Assign Bed
        </Button>
      </DialogActions>
    </Dialog>
  );
}