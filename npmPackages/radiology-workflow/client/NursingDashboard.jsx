// npmPackages/radiology-workflow/client/NursingDashboard.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { RADIOLOGY_CATALOG } from '@node-on-fhir/order-catalog/lib/RadiologyCatalog';

// =============================================================================
// NURSING DASHBOARD - ORDER ENTRY
// =============================================================================
//
// Phase 1 of radiology workflow:
// - View active imaging orders
// - Create new ServiceRequest (imaging order)
// - Review completed DiagnosticReports
// =============================================================================

// Imaging modality options
const MODALITY_OPTIONS = [
  { code: 'CT', display: 'CT (Computed Tomography)' },
  { code: 'MR', display: 'MRI (Magnetic Resonance)' },
  { code: 'CR', display: 'X-Ray (Computed Radiography)' },
  { code: 'US', display: 'Ultrasound' },
  { code: 'NM', display: 'Nuclear Medicine' },
  { code: 'PT', display: 'PET Scan' },
  { code: 'XA', display: 'Angiography' },
  { code: 'MG', display: 'Mammography' },
  { code: 'RF', display: 'Fluoroscopy' }
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'routine', label: 'Routine', color: 'default' },
  { value: 'urgent', label: 'Urgent', color: 'warning' },
  { value: 'asap', label: 'ASAP', color: 'error' },
  { value: 'stat', label: 'STAT', color: 'error' }
];

function NursingDashboard() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    modality: '',
    examType: '',
    priority: 'routine',
    reasonCode: '',
    reasonDisplay: '',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filter catalog by selected modality
  const MODALITY_CODE_MAP = { 'CR': 'XR' };
  const examOptions = useMemo(function() {
    if (!newOrder.modality) return [];
    const catalogModality = MODALITY_CODE_MAP[newOrder.modality] || newOrder.modality;
    return RADIOLOGY_CATALOG.filter(function(proc) {
      return proc.modality === catalogModality;
    });
  }, [newOrder.modality]);

  // ---------------------------------------------------------------------------
  // Data subscriptions
  // ---------------------------------------------------------------------------

  const {
    patient,
    patientId,
    orders,
    reports,
    isLoading
  } = useTracker(() => {
    const selectedPatient = Session.get('selectedPatient');
    const selectedPatientId = Session.get('selectedPatientId');

    if (!selectedPatientId) {
      return {
        patient: null,
        patientId: null,
        orders: [],
        reports: [],
        isLoading: false
      };
    }

    // Subscribe to imaging orders for this patient
    const ordersHandle = Meteor.subscribe('radiology.ServiceRequests', {
      'subject.reference': `Patient/${selectedPatientId}`,
      'category.coding.code': '363679005' // Imaging category
    }, { limit: 100 });

    // Subscribe to diagnostic reports for this patient
    const reportsHandle = Meteor.subscribe('radiology.DiagnosticReports', {
      'subject.reference': `Patient/${selectedPatientId}`,
      'category.coding.code': 'RAD'
    }, { limit: 100 });

    const ServiceRequests = Meteor.Collections?.ServiceRequests;
    const DiagnosticReports = Meteor.Collections?.DiagnosticReports;

    let patientOrders = [];
    let patientReports = [];

    if (ServiceRequests) {
      patientOrders = ServiceRequests.find({
        $and: [
          {
            $or: [
              { 'subject.reference': `Patient/${selectedPatientId}` },
              { 'subject.reference': selectedPatientId }
            ]
          },
          { 'category.coding.code': '363679005' }
        ]
      }, { sort: { authoredOn: -1 } }).fetch();
    }

    if (DiagnosticReports) {
      patientReports = DiagnosticReports.find({
        $or: [
          { 'subject.reference': `Patient/${selectedPatientId}` },
          { 'subject.reference': selectedPatientId }
        ],
        'category.coding.code': 'RAD'
      }, { sort: { issued: -1 } }).fetch();
    }

    return {
      patient: selectedPatient,
      patientId: selectedPatientId,
      orders: patientOrders,
      reports: patientReports,
      isLoading: !ordersHandle.ready() || !reportsHandle.ready()
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  async function handleCreateOrder() {
    if (!newOrder.modality) {
      setError('Please select a modality');
      return;
    }

    if (!newOrder.examType) {
      setError('Please select an exam type');
      return;
    }

    if (!patientId) {
      setError('No patient selected');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const modalityOption = MODALITY_OPTIONS.find(m => m.code === newOrder.modality);
      const selectedProcedure = RADIOLOGY_CATALOG.find(p => p.id === newOrder.examType);

      const result = await Meteor.callAsync('radiology.createImagingOrder', {
        patientId: patientId,
        modality: newOrder.modality,
        modalityDisplay: modalityOption?.display || newOrder.modality,
        procedureCode: selectedProcedure?.code || '',
        procedureDisplay: selectedProcedure?.display || '',
        priority: newOrder.priority,
        reasonCode: newOrder.reasonCode,
        reasonDisplay: newOrder.reasonDisplay || newOrder.reasonCode,
        note: newOrder.note
      });

      console.log('[NursingDashboard] Order created:', result);

      // Reset form and close dialog
      setNewOrder({
        modality: '',
        examType: '',
        priority: 'routine',
        reasonCode: '',
        reasonDisplay: '',
        note: ''
      });
      setOrderDialogOpen(false);

    } catch (err) {
      console.error('[NursingDashboard] Error creating order:', err);
      setError(err.reason || err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusChip(status) {
    const statusColors = {
      'active': 'primary',
      'completed': 'success',
      'cancelled': 'error',
      'draft': 'default',
      'on-hold': 'warning',
      'revoked': 'error'
    };

    return (
      <Chip
        label={status || 'unknown'}
        size="small"
        color={statusColors[status] || 'default'}
      />
    );
  }

  function getPriorityChip(priority) {
    const priorityOption = PRIORITY_OPTIONS.find(p => p.value === priority);
    return (
      <Chip
        label={priorityOption?.label || priority || 'routine'}
        size="small"
        color={priorityOption?.color || 'default'}
        variant={priority === 'stat' || priority === 'asap' ? 'filled' : 'outlined'}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!patient) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }} id="orderHistoryPage">
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} id="orderHistoryPage">
      {/* Header */}
      <Card sx={{ boxShadow: 3, mb: 3 }}>
        <CardHeader
          avatar={<AssignmentIcon />}
          title="Order History"
          subheader={`Patient: ${get(patient, 'name.0.text', get(patient, 'name.0.family', 'Unknown'))}`}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => window.location.reload()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOrderDialogOpen(true)}
              >
                New Order
              </Button>
            </Box>
          }
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiCardHeader-subheader': {
              color: 'primary.contrastText',
              opacity: 0.8
            }
          }}
        />
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Active Orders */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Active Imaging Orders"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : orders.filter(o => o.status === 'active').length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No active orders for this patient
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Modality</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Ordered</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.filter(o => o.status === 'active').map((order) => (
                        <TableRow
                          key={order._id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/service-requests/${order._id}`)}
                        >
                          <TableCell>
                            {get(order, 'code.text', get(order, 'code.coding.0.display', 'Unknown'))}
                          </TableCell>
                          <TableCell>{getPriorityChip(order.priority)}</TableCell>
                          <TableCell>
                            {order.authoredOn ? new Date(order.authoredOn).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>{getStatusChip(order.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Reports */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Completed Reports"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reports.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No radiology reports for this patient
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Report</TableCell>
                        <TableCell>Issued</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report._id} hover>
                          <TableCell>
                            {get(report, 'code.text', get(report, 'code.coding.0.display', 'Imaging Report'))}
                          </TableCell>
                          <TableCell>
                            {report.issued ? new Date(report.issued).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>{getStatusChip(report.status)}</TableCell>
                          <TableCell>
                            <Tooltip title="View Report">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/diagnostic-reports/${report._id}`)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order History */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Order History"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : orders.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No imaging orders for this patient
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Modality</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Ordered</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow
                          key={order._id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/radiology/tech?selected-patient=${patientId}`)}
                        >
                          <TableCell>
                            {get(order, 'code.text', get(order, 'code.coding.0.display', 'Unknown'))}
                          </TableCell>
                          <TableCell>{getPriorityChip(order.priority)}</TableCell>
                          <TableCell>
                            {get(order, 'reasonCode.0.text', get(order, 'reasonCode.0.coding.0.display', '-'))}
                          </TableCell>
                          <TableCell>
                            {order.authoredOn ? new Date(order.authoredOn).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>{getStatusChip(order.status)}</TableCell>
                          <TableCell>
                            <Tooltip title="View Order">
                              <IconButton
                                size="small"
                                onClick={function(e) {
                                  e.stopPropagation();
                                  navigate(`/service-requests/${order._id}`);
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Order Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Imaging Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="modality-label">Modality *</InputLabel>
              <Select
                labelId="modality-label"
                id="modalitySelect"
                value={newOrder.modality}
                onChange={(e) => setNewOrder({ ...newOrder, modality: e.target.value, examType: '' })}
                label="Modality *"
              >
                {MODALITY_OPTIONS.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!newOrder.modality}>
              <InputLabel id="exam-type-label">Exam Type *</InputLabel>
              <Select
                labelId="exam-type-label"
                id="examTypeSelect"
                value={newOrder.examType}
                onChange={(e) => setNewOrder({ ...newOrder, examType: e.target.value })}
                label="Exam Type *"
              >
                {examOptions.map((proc) => (
                  <MenuItem key={proc.id} value={proc.id}>
                    {proc.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="prioritySelect"
                value={newOrder.priority}
                onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                label="Priority"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              id="reasonInput"
              label="Clinical Indication"
              placeholder="e.g., Chest pain, rule out pneumonia"
              value={newOrder.reasonDisplay}
              onChange={(e) => setNewOrder({ ...newOrder, reasonDisplay: e.target.value })}
              fullWidth
            />

            <TextField
              id="noteInput"
              label="Additional Notes"
              placeholder="Any special instructions..."
              value={newOrder.note}
              onChange={(e) => setNewOrder({ ...newOrder, note: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateOrder}
            disabled={submitting || !newOrder.modality || !newOrder.examType}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default NursingDashboard;
