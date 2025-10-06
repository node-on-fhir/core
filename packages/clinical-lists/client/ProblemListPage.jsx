// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-lists/client/ProblemListPage.jsx

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
  Tooltip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

import moment from 'moment';

// ONC 170.315(a)(6) Problem List
// Problem-Oriented Medical Record (POMR) implementation
function ProblemListPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state for new/edit problem
  const [problemForm, setProblemForm] = useState({
    code: '',
    display: '',
    clinicalStatus: 'active',
    verificationStatus: 'confirmed',
    severity: 'moderate',
    onsetDateTime: '',
    abatementDateTime: '',
    note: ''
  });

  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  
  const { conditions, isLoading } = useTracker(() => {
    const noDataAvailable = { conditions: [], isLoading: true };
    
    if (!selectedPatientId) {
      return noDataAvailable;
    }

    const handle = Meteor.subscribe('conditions.byPatient', selectedPatientId);
    if (!handle.ready()) {
      return noDataAvailable;
    }

    const Conditions = global.Collections?.Conditions;
    if (!Conditions) {
      return noDataAvailable;
    }

    const query = { 'subject.reference': `Patient/${selectedPatientId}` };
    if (filterStatus !== 'all') {
      query['clinicalStatus.coding.0.code'] = filterStatus;
    }

    const conditionsList = Conditions.find(query, {
      sort: { recordedDate: -1 }
    }).fetch();

    return {
      conditions: conditionsList,
      isLoading: false
    };
  }, [selectedPatientId, filterStatus]);

  const filteredConditions = conditions.filter(condition => {
    if (!searchTerm) return true;
    const display = get(condition, 'code.text', '') || get(condition, 'code.coding[0].display', '');
    return display.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSaveProblem = async () => {
    const problemData = {
      resourceType: 'Condition',
      subject: {
        reference: `Patient/${selectedPatientId}`
      },
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: problemForm.code,
          display: problemForm.display
        }],
        text: problemForm.display
      },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: problemForm.clinicalStatus
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: problemForm.verificationStatus
        }]
      },
      severity: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: problemForm.severity
        }]
      },
      onsetDateTime: problemForm.onsetDateTime,
      abatementDateTime: problemForm.abatementDateTime,
      recordedDate: new Date().toISOString(),
      note: problemForm.note ? [{ text: problemForm.note }] : []
    };

    try {
      if (editingProblem) {
        await Meteor.callAsync('clinicalLists.conditions.update', editingProblem._id, problemData);
      } else {
        await Meteor.callAsync('clinicalLists.conditions.insert', problemData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving problem:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProblem(null);
    setProblemForm({
      code: '',
      display: '',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      severity: 'moderate',
      onsetDateTime: '',
      abatementDateTime: '',
      note: ''
    });
  };

  const handleDeleteProblem = async (conditionId) => {
    if (confirm('Are you sure you want to remove this problem from the list?')) {
      try {
        await Meteor.callAsync('clinicalLists.conditions.remove', conditionId);
      } catch (error) {
        console.error('Error deleting problem:', error);
      }
    }
  };

  const getSeverityColor = (severity) => {
    const severityCode = get(severity, 'coding[0].code', 'moderate');
    switch (severityCode) {
      case 'severe': return 'error';
      case 'moderate': return 'warning';
      case 'mild': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    const statusCode = get(status, 'coding[0].code', 'active');
    switch (statusCode) {
      case 'active': return <ActiveIcon color="error" fontSize="small" />;
      case 'resolved': return <CheckCircle color="success" fontSize="small" />;
      case 'inactive': return <InactiveIcon color="disabled" fontSize="small" />;
      default: return null;
    }
  };

  if (!selectedPatientId) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Please select a patient to view their problem list</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Tufte-style information density */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs>
                  <Typography variant="h5" gutterBottom>
                    Problem List
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ONC §170.315(a)(6) Compliant • POMR Standard • {filteredConditions.length} problems
                  </Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Add Problem
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Bar */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Search problems"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="all">All Problems</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`Active: ${conditions.filter(c => get(c, 'clinicalStatus.coding[0].code') === 'active').length}`}
              color="error"
              size="small"
            />
            <Chip 
              label={`Resolved: ${conditions.filter(c => get(c, 'clinicalStatus.coding[0].code') === 'resolved').length}`}
              color="success"
              size="small"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Problem List Table - Information-dense design */}
      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        {isLoading && <LinearProgress />}
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme => theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Problem/Diagnosis</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ICD-10/SNOMED</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Onset</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Resolution</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Verification</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredConditions.map((condition) => (
              <TableRow 
                key={condition._id}
                sx={{ 
                  '&:hover': { backgroundColor: theme => theme.palette.action.hover },
                  opacity: get(condition, 'clinicalStatus.coding[0].code') === 'resolved' ? 0.7 : 1
                }}
              >
                <TableCell>
                  <Tooltip title={get(condition, 'clinicalStatus.coding[0].code', 'unknown')}>
                    {getStatusIcon(condition.clinicalStatus)}
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {get(condition, 'code.text') || get(condition, 'code.coding[0].display', 'Unknown')}
                  </Typography>
                  {condition.note?.[0]?.text && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {condition.note[0].text}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {get(condition, 'code.coding[0].code', 'N/A')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={get(condition, 'severity.coding[0].code', 'unknown')}
                    color={getSeverityColor(condition.severity)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {condition.onsetDateTime 
                      ? moment(condition.onsetDateTime).format('MM/DD/YYYY')
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {condition.abatementDateTime 
                      ? moment(condition.abatementDateTime).format('MM/DD/YYYY')
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {get(condition, 'verificationStatus.coding[0].code', 'unconfirmed')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setEditingProblem(condition);
                      setProblemForm({
                        code: get(condition, 'code.coding[0].code', ''),
                        display: get(condition, 'code.coding[0].display', ''),
                        clinicalStatus: get(condition, 'clinicalStatus.coding[0].code', 'active'),
                        verificationStatus: get(condition, 'verificationStatus.coding[0].code', 'confirmed'),
                        severity: get(condition, 'severity.coding[0].code', 'moderate'),
                        onsetDateTime: condition.onsetDateTime || '',
                        abatementDateTime: condition.abatementDateTime || '',
                        note: get(condition, 'note[0].text', '')
                      });
                      setOpenDialog(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteProblem(condition._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredConditions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No problems found
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
          {editingProblem ? 'Edit Problem' : 'Add New Problem'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Problem Description"
                value={problemForm.display}
                onChange={(e) => setProblemForm({ ...problemForm, display: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ICD-10/SNOMED Code"
                value={problemForm.code}
                onChange={(e) => setProblemForm({ ...problemForm, code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Clinical Status</InputLabel>
                <Select
                  value={problemForm.clinicalStatus}
                  onChange={(e) => setProblemForm({ ...problemForm, clinicalStatus: e.target.value })}
                  label="Clinical Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Verification</InputLabel>
                <Select
                  value={problemForm.verificationStatus}
                  onChange={(e) => setProblemForm({ ...problemForm, verificationStatus: e.target.value })}
                  label="Verification"
                >
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="provisional">Provisional</MenuItem>
                  <MenuItem value="differential">Differential</MenuItem>
                  <MenuItem value="refuted">Refuted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={problemForm.severity}
                  onChange={(e) => setProblemForm({ ...problemForm, severity: e.target.value })}
                  label="Severity"
                >
                  <MenuItem value="mild">Mild</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="severe">Severe</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Onset Date"
                type="date"
                value={problemForm.onsetDateTime}
                onChange={(e) => setProblemForm({ ...problemForm, onsetDateTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Resolution Date"
                type="date"
                value={problemForm.abatementDateTime}
                onChange={(e) => setProblemForm({ ...problemForm, abatementDateTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={problemForm.note}
                onChange={(e) => setProblemForm({ ...problemForm, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveProblem} variant="contained">
            {editingProblem ? 'Update' : 'Add'} Problem
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProblemListPage;