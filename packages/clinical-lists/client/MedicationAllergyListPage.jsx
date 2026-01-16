// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-lists/client/MedicationAllergyListPage.jsx

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
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  Stack
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ReportProblem as CriticalIcon
} from '@mui/icons-material';

import moment from 'moment';

// ONC 170.315(a)(7) Medication Allergy List
function MedicationAllergyListPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriticality, setFilterCriticality] = useState('all');
  
  const [allergyForm, setAllergyForm] = useState({
    substance: '',
    substanceCode: '',
    type: 'allergy',
    category: 'medication',
    criticality: 'high',
    clinicalStatus: 'active',
    verificationStatus: 'confirmed',
    manifestation: '',
    onset: '',
    lastOccurrence: '',
    note: ''
  });

  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  
  const { allergies, isLoading } = useTracker(() => {
    const noDataAvailable = { allergies: [], isLoading: true };
    
    if (!selectedPatientId) {
      return noDataAvailable;
    }

    const handle = Meteor.subscribe('allergyIntolerances.byPatient', selectedPatientId);
    if (!handle.ready()) {
      return noDataAvailable;
    }

    const AllergyIntolerances = global.Collections?.AllergyIntolerances;
    if (!AllergyIntolerances) {
      return noDataAvailable;
    }

    const query = { 
      'patient.reference': `Patient/${selectedPatientId}`,
      'category': 'medication'  // Filter for medication allergies only
    };
    
    if (filterCriticality !== 'all') {
      query.criticality = filterCriticality;
    }

    const allergyList = AllergyIntolerances.find(query, {
      sort: { recordedDate: -1 }
    }).fetch();

    return {
      allergies: allergyList,
      isLoading: false
    };
  }, [selectedPatientId, filterCriticality]);

  const filteredAllergies = allergies.filter(allergy => {
    if (!searchTerm) return true;
    const substance = get(allergy, 'code.text', '') || get(allergy, 'code.coding[0].display', '');
    return substance.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSaveAllergy = async () => {
    const allergyData = {
      resourceType: 'AllergyIntolerance',
      patient: {
        reference: `Patient/${selectedPatientId}`
      },
      type: allergyForm.type,
      category: ['medication'],
      criticality: allergyForm.criticality,
      code: {
        coding: [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: allergyForm.substanceCode,
          display: allergyForm.substance
        }],
        text: allergyForm.substance
      },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: allergyForm.clinicalStatus
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: allergyForm.verificationStatus
        }]
      },
      recordedDate: new Date().toISOString(),
      reaction: allergyForm.manifestation ? [{
        manifestation: [{
          coding: [{
            system: 'http://snomed.info/sct',
            display: allergyForm.manifestation
          }],
          text: allergyForm.manifestation
        }]
      }] : [],
      onsetDateTime: allergyForm.onset,
      lastOccurrence: allergyForm.lastOccurrence,
      note: allergyForm.note ? [{ text: allergyForm.note }] : []
    };

    try {
      if (editingAllergy) {
        await Meteor.callAsync('clinicalLists.allergyIntolerances.update', editingAllergy._id, allergyData);
      } else {
        await Meteor.callAsync('clinicalLists.allergyIntolerances.insert', allergyData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving allergy:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAllergy(null);
    setAllergyForm({
      substance: '',
      substanceCode: '',
      type: 'allergy',
      category: 'medication',
      criticality: 'high',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      manifestation: '',
      onset: '',
      lastOccurrence: '',
      note: ''
    });
  };

  const handleDeleteAllergy = async (allergyId) => {
    if (confirm('Are you sure you want to remove this allergy from the list?')) {
      try {
        await Meteor.callAsync('clinicalLists.allergyIntolerances.remove', allergyId);
      } catch (error) {
        console.error('Error deleting allergy:', error);
      }
    }
  };

  const getCriticalityIcon = (criticality) => {
    switch (criticality) {
      case 'high': return <CriticalIcon color="error" fontSize="small" />;
      case 'low': return <InfoIcon color="info" fontSize="small" />;
      case 'unable-to-assess': return <WarningIcon color="warning" fontSize="small" />;
      default: return null;
    }
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'high': return 'error';
      case 'low': return 'info';
      case 'unable-to-assess': return 'warning';
      default: return 'default';
    }
  };

  // Critical allergies alert banner
  const criticalAllergies = allergies.filter(a => a.criticality === 'high' && get(a, 'clinicalStatus.coding[0].code') === 'active');

  if (!selectedPatientId) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Please select a patient to view their medication allergy list</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Critical Allergies Alert */}
      {criticalAllergies.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Critical Medication Allergies</AlertTitle>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {criticalAllergies.map((allergy) => (
              <Chip
                key={allergy._id}
                label={get(allergy, 'code.text') || get(allergy, 'code.coding[0].display')}
                color="error"
                size="small"
                icon={<CriticalIcon />}
              />
            ))}
          </Stack>
        </Alert>
      )}

      {/* Header */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs>
                  <Typography variant="h5" gutterBottom>
                    Medication Allergy List
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ONC §170.315(a)(7) Compliant • {filteredAllergies.length} documented allergies • {criticalAllergies.length} critical
                  </Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Add Allergy
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Search medications"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Criticality Filter</InputLabel>
            <Select
              value={filterCriticality}
              onChange={(e) => setFilterCriticality(e.target.value)}
              label="Criticality Filter"
            >
              <MenuItem value="all">All Criticalities</MenuItem>
              <MenuItem value="high">High Risk</MenuItem>
              <MenuItem value="low">Low Risk</MenuItem>
              <MenuItem value="unable-to-assess">Unable to Assess</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`Active: ${allergies.filter(a => get(a, 'clinicalStatus.coding[0].code') === 'active').length}`}
              color="error"
              size="small"
            />
            <Chip 
              label={`Inactive: ${allergies.filter(a => get(a, 'clinicalStatus.coding[0].code') === 'inactive').length}`}
              size="small"
            />
          </Stack>
        </Grid>
      </Grid>

      {/* Allergy List Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme => theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600 }}>Criticality</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Medication/Substance</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>RxNorm</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Reaction</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Onset</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Reaction</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAllergies.map((allergy) => (
              <TableRow 
                key={allergy._id}
                sx={{ 
                  '&:hover': { backgroundColor: theme => theme.palette.action.hover },
                  backgroundColor: allergy.criticality === 'high' ? theme => theme.functions?.alpha(theme.palette.error.main, 0.05) : 'inherit'
                }}
              >
                <TableCell>
                  {getCriticalityIcon(allergy.criticality)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {get(allergy, 'code.text') || get(allergy, 'code.coding[0].display', 'Unknown')}
                  </Typography>
                  {allergy.note?.[0]?.text && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {allergy.note[0].text}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {get(allergy, 'code.coding[0].code', 'N/A')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {allergy.type || 'allergy'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {allergy.reaction?.[0]?.manifestation?.[0]?.text ? (
                    <Chip 
                      label={allergy.reaction[0].manifestation[0].text}
                      size="small"
                      variant="outlined"
                    />
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={get(allergy, 'clinicalStatus.coding[0].code', 'unknown')}
                    color={get(allergy, 'clinicalStatus.coding[0].code') === 'active' ? 'error' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {allergy.onsetDateTime 
                      ? moment(allergy.onsetDateTime).format('MM/DD/YYYY')
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {allergy.lastOccurrence 
                      ? moment(allergy.lastOccurrence).format('MM/DD/YYYY')
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setEditingAllergy(allergy);
                      setAllergyForm({
                        substance: get(allergy, 'code.text', ''),
                        substanceCode: get(allergy, 'code.coding[0].code', ''),
                        type: allergy.type || 'allergy',
                        category: 'medication',
                        criticality: allergy.criticality || 'high',
                        clinicalStatus: get(allergy, 'clinicalStatus.coding[0].code', 'active'),
                        verificationStatus: get(allergy, 'verificationStatus.coding[0].code', 'confirmed'),
                        manifestation: get(allergy, 'reaction[0].manifestation[0].text', ''),
                        onset: allergy.onsetDateTime || '',
                        lastOccurrence: allergy.lastOccurrence || '',
                        note: get(allergy, 'note[0].text', '')
                      });
                      setOpenDialog(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteAllergy(allergy._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredAllergies.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No medication allergies documented
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
          {editingAllergy ? 'Edit Medication Allergy' : 'Add Medication Allergy'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Medication/Substance"
                value={allergyForm.substance}
                onChange={(e) => setAllergyForm({ ...allergyForm, substance: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="RxNorm Code"
                value={allergyForm.substanceCode}
                onChange={(e) => setAllergyForm({ ...allergyForm, substanceCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={allergyForm.type}
                  onChange={(e) => setAllergyForm({ ...allergyForm, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="allergy">Allergy</MenuItem>
                  <MenuItem value="intolerance">Intolerance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Criticality</InputLabel>
                <Select
                  value={allergyForm.criticality}
                  onChange={(e) => setAllergyForm({ ...allergyForm, criticality: e.target.value })}
                  label="Criticality"
                >
                  <MenuItem value="high">High Risk</MenuItem>
                  <MenuItem value="low">Low Risk</MenuItem>
                  <MenuItem value="unable-to-assess">Unable to Assess</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Clinical Status</InputLabel>
                <Select
                  value={allergyForm.clinicalStatus}
                  onChange={(e) => setAllergyForm({ ...allergyForm, clinicalStatus: e.target.value })}
                  label="Clinical Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Verification</InputLabel>
                <Select
                  value={allergyForm.verificationStatus}
                  onChange={(e) => setAllergyForm({ ...allergyForm, verificationStatus: e.target.value })}
                  label="Verification"
                >
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="unconfirmed">Unconfirmed</MenuItem>
                  <MenuItem value="refuted">Refuted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reaction/Manifestation"
                value={allergyForm.manifestation}
                onChange={(e) => setAllergyForm({ ...allergyForm, manifestation: e.target.value })}
                placeholder="e.g., Rash, Anaphylaxis, Nausea"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Onset Date"
                type="date"
                value={allergyForm.onset}
                onChange={(e) => setAllergyForm({ ...allergyForm, onset: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Reaction Date"
                type="date"
                value={allergyForm.lastOccurrence}
                onChange={(e) => setAllergyForm({ ...allergyForm, lastOccurrence: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={allergyForm.note}
                onChange={(e) => setAllergyForm({ ...allergyForm, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveAllergy} variant="contained" color="error">
            {editingAllergy ? 'Update' : 'Add'} Allergy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MedicationAllergyListPage;