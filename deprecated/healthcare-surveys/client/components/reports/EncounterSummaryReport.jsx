// packages/healthcare-surveys/client/components/reports/EncounterSummaryReport.jsx

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';

export default function EncounterSummaryReport(props) {
  const { encounter, patient, conditions = [], procedures = [], medications = [] } = props;
  
  if (!encounter) {
    return (
      <Typography variant="body1" color="textSecondary">
        No encounter data available
      </Typography>
    );
  }
  
  const getEncounterStatus = function() {
    const status = get(encounter, 'status', 'unknown');
    const statusColors = {
      'planned': 'info',
      'in-progress': 'warning',
      'finished': 'success',
      'cancelled': 'error',
      'unknown': 'default'
    };
    return { status, color: statusColors[status] || 'default' };
  };
  
  const { status, color } = getEncounterStatus();
  
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Encounter Summary"
          action={
            <Chip label={status} color={color} />
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Patient</Typography>
              <Typography variant="body1">
                {patient ? 
                  `${get(patient, 'name[0].given[0]', '')} ${get(patient, 'name[0].family', '')}` : 
                  get(encounter, 'subject.display', 'Unknown')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Type</Typography>
              <Typography variant="body1">
                {get(encounter, 'type[0].coding[0].display', get(encounter, 'class.display', 'Unknown'))}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Period</Typography>
              <Typography variant="body1">
                {moment(get(encounter, 'period.start')).format('MMM D, YYYY HH:mm')}
                {get(encounter, 'period.end') && 
                  ` - ${moment(get(encounter, 'period.end')).format('MMM D, YYYY HH:mm')}`}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Location</Typography>
              <Typography variant="body1">
                {get(encounter, 'location[0].location.display', 'Not specified')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Service Provider</Typography>
              <Typography variant="body1">
                {get(encounter, 'serviceProvider.display', 'Not specified')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Primary Performer</Typography>
              <Typography variant="body1">
                {get(encounter, 'participant[0].individual.display', 'Not specified')}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {conditions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title={`Conditions (${conditions.length})`} />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Condition</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Onset</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conditions.map((condition, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {get(condition, 'code.coding[0].display', 'Unknown')}
                      </TableCell>
                      <TableCell>
                        {get(condition, 'category[0].coding[0].display', 
                          get(condition, 'category[0].coding[0].code', '-'))}
                      </TableCell>
                      <TableCell>
                        {get(condition, 'clinicalStatus.coding[0].code', '-')}
                      </TableCell>
                      <TableCell>
                        {get(condition, 'onsetDateTime') ? 
                          moment(condition.onsetDateTime).format('MMM D, YYYY') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      
      {procedures.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title={`Procedures (${procedures.length})`} />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Procedure</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Performed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {procedures.map((procedure, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {get(procedure, 'code.coding[0].display', 'Unknown')}
                      </TableCell>
                      <TableCell>
                        {get(procedure, 'status', '-')}
                      </TableCell>
                      <TableCell>
                        {get(procedure, 'performedDateTime') ? 
                          moment(procedure.performedDateTime).format('MMM D, YYYY HH:mm') : 
                          get(procedure, 'performedPeriod.start') ?
                            moment(procedure.performedPeriod.start).format('MMM D, YYYY') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      
      {medications.length > 0 && (
        <Card>
          <CardHeader title={`Medications (${medications.length})`} />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medication</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medications.map((medication, index) => {
                    const resourceType = get(medication, 'resourceType', '');
                    const isRequest = resourceType === 'MedicationRequest';
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {get(medication, 'medicationCodeableConcept.coding[0].display',
                            get(medication, 'medicationReference.display', 'Unknown'))}
                        </TableCell>
                        <TableCell>
                          {isRequest ? 'Request' : 'Administration'}
                        </TableCell>
                        <TableCell>
                          {get(medication, 'status', '-')}
                        </TableCell>
                        <TableCell>
                          {isRequest ?
                            moment(get(medication, 'authoredOn')).format('MMM D, YYYY HH:mm') :
                            moment(get(medication, 'effectiveDateTime')).format('MMM D, YYYY HH:mm')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}