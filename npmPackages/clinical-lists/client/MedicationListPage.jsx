// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-lists/client/MedicationListPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Grid,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Avatar
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Medication as MedicationIcon,
  LocalPharmacy as PharmacyIcon,
  Schedule as ScheduleIcon,
  CheckCircle,
  CheckCircle as ActiveIcon,
  Pause as OnHoldIcon,
  Stop as StoppedIcon
} from '@mui/icons-material';

import moment from 'moment';

// ONC 170.315(a)(8) Medication List
// Tufte-inspired information density with sparkline-like timeline
function MedicationListPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [medicationForm, setMedicationForm] = useState({
    medication: '',
    medicationCode: '',
    dosage: '',
    dosageUnit: 'mg',
    frequency: 'daily',
    route: 'oral',
    status: 'active',
    startDate: '',
    endDate: '',
    prescriber: '',
    indication: '',
    note: ''
  });

  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  
  const { medications, isLoading } = useTracker(() => {
    const noDataAvailable = { medications: [], isLoading: true };
    
    if (!selectedPatientId) {
      return noDataAvailable;
    }

    const handle = Meteor.subscribe('medicationStatements.byPatient', selectedPatientId);
    if (!handle.ready()) {
      return noDataAvailable;
    }

    const MedicationStatements = global.Collections?.MedicationStatements;
    if (!MedicationStatements) {
      return noDataAvailable;
    }

    const query = { 'subject.reference': `Patient/${selectedPatientId}` };
    if (filterStatus !== 'all') {
      query.status = filterStatus;
    }

    const medicationList = MedicationStatements.find(query, {
      sort: { effectiveDateTime: -1 }
    }).fetch();

    return {
      medications: medicationList,
      isLoading: false
    };
  }, [selectedPatientId, filterStatus]);

  const filteredMedications = medications.filter(medication => {
    if (!searchTerm) return true;
    const medName = get(medication, 'medicationCodeableConcept.text', '') || 
                    get(medication, 'medicationCodeableConcept.coding[0].display', '');
    return medName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSaveMedication = async () => {
    const medicationData = {
      resourceType: 'MedicationStatement',
      status: medicationForm.status,
      subject: {
        reference: `Patient/${selectedPatientId}`
      },
      medicationCodeableConcept: {
        coding: [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: medicationForm.medicationCode,
          display: medicationForm.medication
        }],
        text: medicationForm.medication
      },
      effectiveDateTime: medicationForm.startDate,
      effectivePeriod: medicationForm.endDate ? {
        start: medicationForm.startDate,
        end: medicationForm.endDate
      } : undefined,
      dosage: [{
        text: `${medicationForm.dosage} ${medicationForm.dosageUnit} ${medicationForm.frequency}`,
        doseAndRate: [{
          doseQuantity: {
            value: parseFloat(medicationForm.dosage),
            unit: medicationForm.dosageUnit
          }
        }],
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            display: medicationForm.route
          }]
        },
        timing: {
          repeat: {
            frequency: medicationForm.frequency === 'daily' ? 1 : 
                      medicationForm.frequency === 'twice daily' ? 2 : 
                      medicationForm.frequency === 'three times daily' ? 3 : 4,
            period: 1,
            periodUnit: 'd'
          }
        }
      }],
      informationSource: medicationForm.prescriber ? {
        display: medicationForm.prescriber
      } : undefined,
      reasonCode: medicationForm.indication ? [{
        text: medicationForm.indication
      }] : [],
      note: medicationForm.note ? [{ text: medicationForm.note }] : [],
      dateAsserted: new Date().toISOString()
    };

    try {
      if (editingMedication) {
        await Meteor.rpc('clinicalLists.medicationStatements.update', { medicationId: editingMedication._id, medicationData: medicationData });
      } else {
        await Meteor.rpc('clinicalLists.medicationStatements.insert', { medicationData: medicationData });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMedication(null);
    setMedicationForm({
      medication: '',
      medicationCode: '',
      dosage: '',
      dosageUnit: 'mg',
      frequency: 'daily',
      route: 'oral',
      status: 'active',
      startDate: '',
      endDate: '',
      prescriber: '',
      indication: '',
      note: ''
    });
  };

  const handleDeleteMedication = async (medicationId) => {
    if (confirm('Are you sure you want to remove this medication from the list?')) {
      try {
        await Meteor.rpc('clinicalLists.medicationStatements.remove', { medicationId: medicationId });
      } catch (error) {
        console.error('Error deleting medication:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <ActiveIcon color="success" fontSize="small" />;
      case 'on-hold': return <OnHoldIcon color="warning" fontSize="small" />;
      case 'stopped': return <StoppedIcon color="error" fontSize="small" />;
      case 'completed': return <CheckCircle color="disabled" fontSize="small" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'on-hold': return 'warning';
      case 'stopped': return 'error';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  // Calculate medication duration for timeline visualization
  const getMedicationDuration = (med) => {
    if (!med.effectiveDateTime) return null;
    const start = moment(med.effectiveDateTime);
    const end = med.effectivePeriod?.end ? moment(med.effectivePeriod.end) : moment();
    return end.diff(start, 'days');
  };

  // Summary statistics
  const activeMeds = medications.filter(m => m.status === 'active').length;
  const onHoldMeds = medications.filter(m => m.status === 'on-hold').length;
  const stoppedMeds = medications.filter(m => m.status === 'stopped').length;

  if (!selectedPatientId) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Please select a patient to view their medication list</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderLeft: 4, borderColor: 'success.main' }}>
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs>
                  <Typography variant="h5" gutterBottom>
                    Medication List
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      ONC §170.315(a)(8) Compliant
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        icon={<ActiveIcon />}
                        label={`${activeMeds} Active`}
                        color="success"
                        size="small"
                      />
                      {onHoldMeds > 0 && (
                        <Chip 
                          icon={<OnHoldIcon />}
                          label={`${onHoldMeds} On Hold`}
                          color="warning"
                          size="small"
                        />
                      )}
                      {stoppedMeds > 0 && (
                        <Chip 
                          icon={<StoppedIcon />}
                          label={`${stoppedMeds} Stopped`}
                          color="error"
                          size="small"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Add Medication
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            size="small"
            label="Search medications"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter medication name..."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="all">All Medications</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="on-hold">On Hold</MenuItem>
              <MenuItem value="stopped">Stopped</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Medication List Table - Tufte-inspired dense information display */}
      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme => theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600, width: 40 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Medication</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Dosage</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Indication</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Prescriber</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMedications.map((medication) => {
              const duration = getMedicationDuration(medication);
              return (
                <TableRow 
                  key={medication._id}
                  sx={{ 
                    '&:hover': { backgroundColor: theme => theme.palette.action.hover },
                    opacity: medication.status === 'stopped' ? 0.6 : 1
                  }}
                >
                  <TableCell>
                    {getStatusIcon(medication.status)}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light' }}>
                        <MedicationIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {get(medication, 'medicationCodeableConcept.text') || 
                           get(medication, 'medicationCodeableConcept.coding[0].display', 'Unknown')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          RxNorm: {get(medication, 'medicationCodeableConcept.coding[0].code', 'N/A')}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {get(medication, 'dosage[0].doseAndRate[0].doseQuantity.value', '')}
                      {' '}
                      {get(medication, 'dosage[0].doseAndRate[0].doseQuantity.unit', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {get(medication, 'dosage[0].text', '-').split(' ').slice(-1)[0]}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {get(medication, 'dosage[0].route.coding[0].display', 'oral')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {medication.effectiveDateTime 
                        ? moment(medication.effectiveDateTime).format('MM/DD/YYYY')
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {duration !== null && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Box 
                          sx={{ 
                            width: Math.min(duration, 100), 
                            height: 4, 
                            bgcolor: getStatusColor(medication.status) + '.main',
                            borderRadius: 2
                          }} 
                        />
                        <Typography variant="caption" color="text.secondary">
                          {duration}d
                        </Typography>
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {get(medication, 'reasonCode[0].text', '-')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {get(medication, 'informationSource.display', '-')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setEditingMedication(medication);
                        const dosageText = get(medication, 'dosage[0].text', '');
                        const dosageParts = dosageText.split(' ');
                        setMedicationForm({
                          medication: get(medication, 'medicationCodeableConcept.text', ''),
                          medicationCode: get(medication, 'medicationCodeableConcept.coding[0].code', ''),
                          dosage: get(medication, 'dosage[0].doseAndRate[0].doseQuantity.value', '').toString(),
                          dosageUnit: get(medication, 'dosage[0].doseAndRate[0].doseQuantity.unit', 'mg'),
                          frequency: dosageParts[dosageParts.length - 1] || 'daily',
                          route: get(medication, 'dosage[0].route.coding[0].display', 'oral'),
                          status: medication.status || 'active',
                          startDate: medication.effectiveDateTime ? moment(medication.effectiveDateTime).format('YYYY-MM-DD') : '',
                          endDate: medication.effectivePeriod?.end ? moment(medication.effectivePeriod.end).format('YYYY-MM-DD') : '',
                          prescriber: get(medication, 'informationSource.display', ''),
                          indication: get(medication, 'reasonCode[0].text', ''),
                          note: get(medication, 'note[0].text', '')
                        });
                        setOpenDialog(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteMedication(medication._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredMedications.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No medications found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMedication ? 'Edit Medication' : 'Add Medication'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Medication Name"
                value={medicationForm.medication}
                onChange={(e) => setMedicationForm({ ...medicationForm, medication: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="RxNorm Code"
                value={medicationForm.medicationCode}
                onChange={(e) => setMedicationForm({ ...medicationForm, medicationCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Dosage"
                type="number"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={medicationForm.dosageUnit}
                  onChange={(e) => setMedicationForm({ ...medicationForm, dosageUnit: e.target.value })}
                  label="Unit"
                >
                  <MenuItem value="mg">mg</MenuItem>
                  <MenuItem value="mcg">mcg</MenuItem>
                  <MenuItem value="g">g</MenuItem>
                  <MenuItem value="mL">mL</MenuItem>
                  <MenuItem value="units">units</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={medicationForm.frequency}
                  onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                  label="Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="twice daily">Twice Daily</MenuItem>
                  <MenuItem value="three times daily">Three Times Daily</MenuItem>
                  <MenuItem value="four times daily">Four Times Daily</MenuItem>
                  <MenuItem value="as needed">As Needed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Route</InputLabel>
                <Select
                  value={medicationForm.route}
                  onChange={(e) => setMedicationForm({ ...medicationForm, route: e.target.value })}
                  label="Route"
                >
                  <MenuItem value="oral">Oral</MenuItem>
                  <MenuItem value="intravenous">Intravenous</MenuItem>
                  <MenuItem value="intramuscular">Intramuscular</MenuItem>
                  <MenuItem value="subcutaneous">Subcutaneous</MenuItem>
                  <MenuItem value="topical">Topical</MenuItem>
                  <MenuItem value="inhalation">Inhalation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={medicationForm.status}
                  onChange={(e) => setMedicationForm({ ...medicationForm, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="on-hold">On Hold</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={medicationForm.startDate}
                onChange={(e) => setMedicationForm({ ...medicationForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={medicationForm.endDate}
                onChange={(e) => setMedicationForm({ ...medicationForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Prescriber"
                value={medicationForm.prescriber}
                onChange={(e) => setMedicationForm({ ...medicationForm, prescriber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Indication/Reason"
                value={medicationForm.indication}
                onChange={(e) => setMedicationForm({ ...medicationForm, indication: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={medicationForm.note}
                onChange={(e) => setMedicationForm({ ...medicationForm, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveMedication} variant="contained" color="success">
            {editingMedication ? 'Update' : 'Add'} Medication
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MedicationListPage;