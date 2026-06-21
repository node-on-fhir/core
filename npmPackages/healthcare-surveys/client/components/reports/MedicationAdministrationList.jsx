// packages/healthcare-surveys/client/components/reports/MedicationAdministrationList.jsx

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import { get } from 'lodash';
import moment from 'moment';

function Row(props) {
  const { row, index } = props;
  const [open, setOpen] = useState(false);
  
  const getMedicationDisplay = function() {
    return get(row, 'medicationCodeableConcept.coding[0].display',
           get(row, 'medicationReference.display', 'Unknown Medication'));
  };
  
  const getStatusColor = function() {
    const status = get(row, 'status', '');
    const statusColors = {
      'completed': 'success',
      'in-progress': 'warning',
      'not-done': 'error',
      'on-hold': 'default',
      'stopped': 'error',
      'unknown': 'default'
    };
    return statusColors[status] || 'default';
  };
  
  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{getMedicationDisplay()}</TableCell>
        <TableCell>
          <Chip 
            label={get(row, 'status', 'unknown')} 
            color={getStatusColor()} 
            size="small" 
          />
        </TableCell>
        <TableCell>
          {moment(get(row, 'effectiveDateTime', 
                  get(row, 'effectivePeriod.start'))).format('MMM D, YYYY HH:mm')}
        </TableCell>
        <TableCell>{get(row, 'subject.display', 'Unknown')}</TableCell>
        <TableCell>
          {get(row, 'performer[0].actor.display', 
           get(row, 'performer[0].function.coding[0].display', '-'))}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Administration Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Dosage
                  </Typography>
                  <Typography variant="body1">
                    {get(row, 'dosage.text', 
                     `${get(row, 'dosage.dose.value', '')} ${get(row, 'dosage.dose.unit', '')}`)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Route
                  </Typography>
                  <Typography variant="body1">
                    {get(row, 'dosage.route.coding[0].display', 'Not specified')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Context (Encounter)
                  </Typography>
                  <Typography variant="body1">
                    {get(row, 'context.display', get(row, 'context.reference', 'Not specified'))}
                  </Typography>
                </Grid>
                
                {get(row, 'statusReason') && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Status Reason
                    </Typography>
                    <Typography variant="body1">
                      {get(row, 'statusReason.coding[0].display', 
                       get(row, 'statusReason.text', ''))}
                    </Typography>
                  </Grid>
                )}
                
                {get(row, 'note[0].text') && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {get(row, 'note[0].text')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function MedicationAdministrationList(props) {
  const { medications = [], title = "Medication Administrations" } = props;
  const [orderBy, setOrderBy] = useState('effectiveDateTime');
  const [order, setOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSort = function(property) {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const filteredMedications = medications.filter(med => {
    if (!searchTerm) return true;
    
    const medicationName = get(med, 'medicationCodeableConcept.coding[0].display',
                              get(med, 'medicationReference.display', '')).toLowerCase();
    const patientName = get(med, 'subject.display', '').toLowerCase();
    const status = get(med, 'status', '').toLowerCase();
    
    return medicationName.includes(searchTerm.toLowerCase()) ||
           patientName.includes(searchTerm.toLowerCase()) ||
           status.includes(searchTerm.toLowerCase());
  });
  
  const sortedMedications = filteredMedications.sort((a, b) => {
    let aValue = get(a, orderBy, '');
    let bValue = get(b, orderBy, '');
    
    if (orderBy === 'effectiveDateTime') {
      aValue = moment(aValue || get(a, 'effectivePeriod.start', ''));
      bValue = moment(bValue || get(b, 'effectivePeriod.start', ''));
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        <TextField
          size="small"
          placeholder="Search medications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Medication</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'effectiveDateTime'}
                  direction={orderBy === 'effectiveDateTime' ? order : 'asc'}
                  onClick={() => handleSort('effectiveDateTime')}
                >
                  Date/Time
                </TableSortLabel>
              </TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Performer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedMedications.length > 0 ? (
              sortedMedications.map((medication, index) => (
                <Row key={get(medication, 'id', index)} row={medication} index={index} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No medication administrations found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}