// packages/vital-signs/client/VitalSignsPageWrapper.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import { VitalSignsTable } from './VitalSignsTable';

const log = (Meteor.Logger ? Meteor.Logger.for('VitalSignsPageWrapper') : console);

export function VitalSignsPageWrapper() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  
  // Get selected patient from Session
  const { selectedPatient, selectedPatientId, observations } = useTracker(() => {
    // First try URL param, then Session
    const currentPatientId = patientId || Session.get('selectedPatientId');
    const patient = Session.get('selectedPatient');
    
    log.debug('VitalSignsPageWrapper - patientId from URL:', { patientId });
    log.debug('VitalSignsPageWrapper - selectedPatientId from Session:', { selectedPatientId: Session.get('selectedPatientId') });
    log.phi('VitalSignsPageWrapper - selectedPatient from Session', patient, { action: 'read' });
    
    // Subscribe to observations if we have a patient
    let observationSub;
    let observationsData = [];
    
    if (currentPatientId && Meteor.subscribe) {
      observationSub = Meteor.subscribe('observations.byPatient', currentPatientId);
      
      // Access Observations collection - try multiple ways
      let ObservationsCollection = null;
      if (Meteor.Collections && Meteor.Collections.Observations) {
        ObservationsCollection = Meteor.Collections.Observations;
        console.log('VitalSignsPageWrapper - Using Meteor.Collections.Observations');
      } else if (window.Observations) {
        ObservationsCollection = window.Observations;
        console.log('VitalSignsPageWrapper - Using window.Observations');
      }
      
      if (ObservationsCollection) {
        observationsData = ObservationsCollection.find({
          'subject.reference': { $regex: `Patient/${currentPatientId}` }
        }).fetch();
        console.log('VitalSignsPageWrapper - Found observations:', observationsData.length);
      } else {
        console.log('VitalSignsPageWrapper - No Observations collection found');
      }
    }
    
    return {
      selectedPatient: patient,
      selectedPatientId: currentPatientId,
      observations: observationsData
    };
  });
  
  const patientName = get(selectedPatient, 'name[0].text', 'No patient selected');

  return (
    <Box sx={{
      minHeight: '100vh',
      pt: 4,
      pb: 4
    }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Vital Signs Module
        </Typography>
      
      {selectedPatientId ? (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected Patient
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                {patientName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Patient ID: {selectedPatientId}
              </Typography>
              {selectedPatient && (
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={`DOB: ${get(selectedPatient, 'birthDate', 'Unknown')}`} 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={`Gender: ${get(selectedPatient, 'gender', 'Unknown')}`} 
                    size="small" 
                  />
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small"
                onClick={() => navigate(`/take-vital-signs`)}
                variant="contained"
              >
                Take New Vital Signs
              </Button>
              <Button 
                size="small"
                onClick={() => navigate('/patients')}
              >
                Change Patient
              </Button>
            </CardActions>
          </Card>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vital Signs History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {observations && observations.length > 0 ? (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Found {observations.length} vital sign observations
                </Typography>
                <VitalSignsTable observations={observations} />
              </Box>
            ) : (
              <Alert severity="warning">
                No vital signs recorded for this patient yet.
              </Alert>
            )}
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>No Patient Selected</AlertTitle>
            Please select a patient to view their vital signs history.
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/patients')}
              size="large"
            >
              Go to Patient Directory
            </Button>
          </Box>
        </Paper>
      )}
      </Container>
    </Box>
  );
}