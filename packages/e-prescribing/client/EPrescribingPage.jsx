// packages/e-prescribing/client/EPrescribingPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  AlertTitle,
  Badge,
  Tooltip,
  LinearProgress,
  Collapse,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

// Icons
import {
  Medication as MedicationIcon,
  LocalPharmacy as PharmacyIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assignment,
  Assignment as FormularyIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FactCheck as PriorAuthIcon,
  Autorenew as RenewalIcon
} from '@mui/icons-material';

// Sample drug database (would be from RxNorm/NDC in production)
const DRUG_DATABASE = [
  { 
    id: '1', 
    name: 'Lisinopril', 
    strengths: ['5mg', '10mg', '20mg', '40mg'],
    forms: ['Tablet', 'Solution'],
    ndc: '00006-0022-58',
    rxnorm: '29046',
    deaSchedule: null,
    formularyStatus: 'preferred',
    requiresPriorAuth: false
  },
  { 
    id: '2', 
    name: 'Metformin', 
    strengths: ['500mg', '850mg', '1000mg'],
    forms: ['Tablet', 'Extended Release Tablet'],
    ndc: '00378-7052-01',
    rxnorm: '6809',
    deaSchedule: null,
    formularyStatus: 'preferred',
    requiresPriorAuth: false
  },
  { 
    id: '3', 
    name: 'Oxycodone', 
    strengths: ['5mg', '10mg', '15mg', '20mg', '30mg'],
    forms: ['Tablet', 'Solution', 'Capsule'],
    ndc: '59011-0440-10',
    rxnorm: '7804',
    deaSchedule: 'II',
    formularyStatus: 'non-preferred',
    requiresPriorAuth: true
  },
  { 
    id: '4', 
    name: 'Adalimumab', 
    strengths: ['40mg/0.4mL', '40mg/0.8mL', '20mg/0.2mL'],
    forms: ['Injection', 'Pen Injector'],
    ndc: '00074-0554-02',
    rxnorm: '327361',
    deaSchedule: null,
    formularyStatus: 'non-formulary',
    requiresPriorAuth: true,
    specialtyDrug: true
  }
];

// Sample pharmacy directory
const PHARMACY_DIRECTORY = [
  {
    id: 'pharm1',
    name: 'CVS Pharmacy #2401',
    ncpdpId: '1234567',
    address: '123 Main St, Boston, MA 02134',
    phone: '617-555-0100',
    fax: '617-555-0101',
    hours: '8am-10pm Daily',
    mailOrder: false
  },
  {
    id: 'pharm2',
    name: 'Walgreens #8456',
    ncpdpId: '2345678',
    address: '456 Oak Ave, Boston, MA 02135',
    phone: '617-555-0200',
    fax: '617-555-0201',
    hours: '24 hours',
    mailOrder: false
  },
  {
    id: 'pharm3',
    name: 'Express Scripts Mail Order',
    ncpdpId: '3456789',
    address: 'PO Box 1234, St. Louis, MO 63118',
    phone: '800-555-1234',
    fax: '800-555-1235',
    hours: 'Mail Order Only',
    mailOrder: true
  }
];

export default function EPrescribingPage() {
  // State management
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [messageType, setMessageType] = useState('NewRx');
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient: '',
    medication: null,
    strength: '',
    form: '',
    sig: '',
    quantity: '',
    refills: '0',
    substitution: 'allowed',
    pharmacy: null,
    notes: '',
    priorAuth: false,
    diagnosis: ''
  });
  const [activeRequests, setActiveRequests] = useState([]);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');

  // Mock active prescriptions
  useEffect(() => {
    setPrescriptionHistory([
      {
        id: 'rx001',
        patient: 'John Doe',
        medication: 'Lisinopril 10mg',
        sig: 'Take 1 tablet by mouth daily',
        quantity: '30',
        refills: '5',
        prescriber: 'Dr. Smith',
        date: '2024-01-10',
        status: 'active',
        pharmacy: 'CVS #2401',
        fillHistory: [
          { date: '2024-01-10', quantity: '30', status: 'dispensed' },
          { date: '2024-02-10', quantity: '30', status: 'dispensed' }
        ]
      },
      {
        id: 'rx002',
        patient: 'Jane Smith',
        medication: 'Metformin 1000mg',
        sig: 'Take 1 tablet by mouth twice daily',
        quantity: '60',
        refills: '11',
        prescriber: 'Dr. Jones',
        date: '2024-01-05',
        status: 'active',
        pharmacy: 'Walgreens #8456',
        fillHistory: [
          { date: '2024-01-05', quantity: '60', status: 'dispensed' }
        ]
      }
    ]);

    setActiveRequests([
      {
        id: 'req001',
        type: 'RxRenewalRequest',
        patient: 'Bob Johnson',
        medication: 'Atorvastatin 20mg',
        pharmacy: 'CVS #2401',
        requestDate: '2024-01-15',
        status: 'pending'
      },
      {
        id: 'req002',
        type: 'RxChangeRequest',
        patient: 'Alice Brown',
        medication: 'Gabapentin 300mg',
        requestedChange: 'Increase to 600mg TID',
        pharmacy: 'Walgreens #8456',
        requestDate: '2024-01-14',
        status: 'pending'
      }
    ]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    const messageData = {
      messageType,
      prescription: prescriptionForm,
      timestamp: new Date().toISOString()
    };

    try {
      const result = await Meteor.callAsync('ePrescribing.sendMessage', messageData);
      console.log('Message sent:', result);
      
      // Show success dialog
      setDialogType('success');
      setDialogOpen(true);
      
      // Reset form
      setPrescriptionForm({
        patient: '',
        medication: null,
        strength: '',
        form: '',
        sig: '',
        quantity: '',
        refills: '0',
        substitution: 'allowed',
        pharmacy: null,
        notes: '',
        priorAuth: false,
        diagnosis: ''
      });
    } catch (error) {
      console.error('Error sending prescription:', error);
      setDialogType('error');
      setDialogOpen(true);
    }
  }, [messageType, prescriptionForm]);

  const getFormularyBadge = (status) => {
    const colors = {
      'preferred': 'success',
      'non-preferred': 'warning',
      'non-formulary': 'error'
    };
    return <Chip label={status.toUpperCase()} size="small" color={colors[status] || 'default'} />;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <CheckCircleIcon color="success" />;
      case 'pending': return <ScheduleIcon color="warning" />;
      case 'cancelled': return <CancelIcon color="error" />;
      default: return null;
    }
  };

  return (
    <Box sx={{ 
      p: 2,
      minHeight: '100vh',
      bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'background.default'
    }}>
      {/* Header with NCPDP SCRIPT Message Type Selector */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Electronic Prescribing (NCPDP SCRIPT 2017071)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ONC §170.315(b)(3) Compliant
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <ToggleButtonGroup
              value={messageType}
              exclusive
              onChange={(e, val) => val && setMessageType(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value="NewRx">
                <Tooltip title="New Prescription"><SendIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="RxChangeRequest">
                <Tooltip title="Change Request"><EditIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="CancelRx">
                <Tooltip title="Cancel Prescription"><CancelIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="RxFill">
                <Tooltip title="Fill Status"><RefreshIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="RxRenewalRequest">
                <Tooltip title="Renewal Request"><RenewalIcon /></Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Badge badgeContent={activeRequests.length} color="error">
                <Button startIcon={<Assignment />} variant="outlined" size="small">
                  Pending Requests
                </Button>
              </Badge>
              <Button startIcon={<FormularyIcon />} variant="outlined" size="small">
                Formulary
              </Button>
              <Button startIcon={<PriorAuthIcon />} variant="outlined" size="small">
                Prior Auth
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Area */}
      <Grid container spacing={2}>
        {/* Left Panel - Prescription Form */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader 
              title={`${messageType} Message`}
              subheader="NCPDP SCRIPT Format"
              action={
                <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
                  <ScheduleIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {/* Patient Selection */}
                <TextField
                  fullWidth
                  label="Patient"
                  value={prescriptionForm.patient}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, patient: e.target.value})}
                  placeholder="Search patient..."
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />

                {/* Medication Selection with Formulary Status */}
                <Autocomplete
                  options={DRUG_DATABASE}
                  getOptionLabel={(option) => option.name}
                  value={prescriptionForm.medication}
                  onChange={(e, val) => setPrescriptionForm({...prescriptionForm, medication: val})}
                  renderOption={(props, option) => (
                    <ListItem {...props}>
                      <ListItemText 
                        primary={option.name}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption">NDC: {option.ndc}</Typography>
                            {getFormularyBadge(option.formularyStatus)}
                            {option.deaSchedule && (
                              <Chip label={`DEA ${option.deaSchedule}`} size="small" color="error" />
                            )}
                            {option.requiresPriorAuth && (
                              <Chip label="PA" size="small" color="warning" />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  )}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Medication" 
                      placeholder="Search drug name or NDC..."
                    />
                  )}
                />

                {/* Strength and Form */}
                {prescriptionForm.medication && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Strength</InputLabel>
                        <Select
                          value={prescriptionForm.strength}
                          onChange={(e) => setPrescriptionForm({...prescriptionForm, strength: e.target.value})}
                        >
                          {prescriptionForm.medication.strengths.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Form</InputLabel>
                        <Select
                          value={prescriptionForm.form}
                          onChange={(e) => setPrescriptionForm({...prescriptionForm, form: e.target.value})}
                        >
                          {prescriptionForm.medication.forms.map(f => (
                            <MenuItem key={f} value={f}>{f}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}

                {/* Sig (Directions) */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Sig (Directions)"
                  value={prescriptionForm.sig}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, sig: e.target.value})}
                  placeholder="e.g., Take 1 tablet by mouth daily"
                />

                {/* Quantity and Refills */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      value={prescriptionForm.quantity}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, quantity: e.target.value})}
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Refills"
                      value={prescriptionForm.refills}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, refills: e.target.value})}
                      type="number"
                      inputProps={{ min: 0, max: 11 }}
                    />
                  </Grid>
                </Grid>

                {/* Substitution */}
                <FormControl>
                  <RadioGroup
                    row
                    value={prescriptionForm.substitution}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, substitution: e.target.value})}
                  >
                    <FormControlLabel value="allowed" control={<Radio />} label="Substitution Allowed" />
                    <FormControlLabel value="not-allowed" control={<Radio />} label="Dispense as Written" />
                  </RadioGroup>
                </FormControl>

                {/* Pharmacy Selection */}
                <Autocomplete
                  options={PHARMACY_DIRECTORY}
                  getOptionLabel={(option) => option.name}
                  value={prescriptionForm.pharmacy}
                  onChange={(e, val) => setPrescriptionForm({...prescriptionForm, pharmacy: val})}
                  renderOption={(props, option) => (
                    <ListItem {...props}>
                      <ListItemIcon>
                        <PharmacyIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={option.name}
                        secondary={`${option.address} • NCPDP: ${option.ncpdpId}`}
                      />
                    </ListItem>
                  )}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Pharmacy" 
                      placeholder="Select pharmacy..."
                    />
                  )}
                />

                {/* Advanced Options */}
                <Collapse in={showAdvanced}>
                  <Stack spacing={2}>
                    <Divider>Advanced Options</Divider>
                    <TextField
                      fullWidth
                      label="Diagnosis (ICD-10)"
                      value={prescriptionForm.diagnosis}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                      placeholder="e.g., I10 - Essential hypertension"
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes to Pharmacist"
                      value={prescriptionForm.notes}
                      onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={prescriptionForm.priorAuth}
                          onChange={(e) => setPrescriptionForm({...prescriptionForm, priorAuth: e.target.checked})}
                        />
                      }
                      label="Prior Authorization Required"
                    />
                  </Stack>
                </Collapse>

                {/* Send Button */}
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!prescriptionForm.patient || !prescriptionForm.medication || !prescriptionForm.pharmacy}
                >
                  Send {messageType}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Middle Panel - Active Requests & History */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Pending Requests */}
            <Card>
              <CardHeader 
                title="Pending Requests"
                subheader={`${activeRequests.length} awaiting response`}
                avatar={<Badge badgeContent={activeRequests.length} color="error"><Assignment /></Badge>}
              />
              <CardContent sx={{ p: 0 }}>
                <List dense>
                  {activeRequests.map((request) => (
                    <ListItem key={request.id} divider>
                      <ListItemIcon>
                        {request.type === 'RxRenewalRequest' ? <RenewalIcon /> : <EditIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={request.patient}
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {request.medication}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.type} • {request.requestDate}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" color="success">
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <CancelIcon />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Recent Prescriptions */}
            <Card>
              <CardHeader 
                title="Recent Prescriptions"
                subheader="Last 30 days"
                avatar={<HistoryIcon />}
              />
              <CardContent sx={{ p: 0 }}>
                <List dense>
                  {prescriptionHistory.map((rx) => (
                    <ListItem 
                      key={rx.id} 
                      divider
                      button
                      onClick={() => setSelectedPrescription(rx)}
                      selected={selectedPrescription?.id === rx.id}
                    >
                      <ListItemIcon>
                        {getStatusIcon(rx.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={rx.medication}
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {rx.patient} • {rx.sig}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {rx.date} • Refills: {rx.refills}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Panel - Message Log & Details */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader 
              title="NCPDP SCRIPT Log"
              subheader="Message audit trail"
              avatar={<VerifiedIcon />}
            />
            <Tabs value={selectedTab} onChange={(e, val) => setSelectedTab(val)}>
              <Tab label="Sent" />
              <Tab label="Received" />
              <Tab label="Errors" />
            </Tabs>
            <CardContent>
              {selectedTab === 0 && (
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="NewRx: Lisinopril 10mg"
                      secondary="Sent to CVS #2401 • 2024-01-15 10:30 AM"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="RxChangeResponse: Approved"
                      secondary="Metformin dose change • 2024-01-14 3:45 PM"
                    />
                  </ListItem>
                </List>
              )}
              {selectedTab === 1 && (
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="RxFill: Dispensed"
                      secondary="Lisinopril 10mg #30 • 2024-01-15 11:00 AM"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="RxRenewalRequest"
                      secondary="Atorvastatin 20mg • 2024-01-15 9:00 AM"
                    />
                  </ListItem>
                </List>
              )}
              {selectedTab === 2 && (
                <Alert severity="info">
                  No errors in the last 30 days
                </Alert>
              )}
              
              {/* Selected Prescription Details */}
              {selectedPrescription && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }}>Fill History</Divider>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPrescription.fillHistory.map((fill, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{fill.date}</TableCell>
                            <TableCell>{fill.quantity}</TableCell>
                            <TableCell>
                              <Chip label={fill.status} size="small" color="success" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success/Error Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogType === 'success' ? 'Prescription Sent' : 'Error'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'success' ? (
            <Alert severity="success">
              Your {messageType} message has been successfully transmitted via NCPDP SCRIPT.
            </Alert>
          ) : (
            <Alert severity="error">
              Failed to send prescription. Please check your connection and try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}