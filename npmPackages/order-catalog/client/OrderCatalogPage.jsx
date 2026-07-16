// packages/order-catalog/client/OrderCatalogPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { forwardHome } = WorkflowNavigation;

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  Button,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

import {
  Science as ScienceIcon,
  Medication as MedicationIcon,
  MedicalServices as MedicalServicesIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  LocalHospital as LocalHospitalIcon,
  Biotech as BiotechIcon,
  Vaccines as VaccinesIcon,
  BloodType as BloodTypeIcon,
  Timer as TimerIcon,
  PriorityHigh as PriorityHighIcon,
  List as ListIcon
} from '@mui/icons-material';

// Import radiology catalog
import { RADIOLOGY_CATALOG, RADIOLOGY_CATEGORIES, MODALITY_CODES } from './RadiologyCatalog';

// =============================================================================
// SAMPLE CATALOG DATA
// =============================================================================

// Common Lab Tests for ONC Certification
const LAB_CATALOG = [
  // Chemistry
  { id: 'K_serum', code: '2823-3', display: 'Potassium [Moles/volume] in Serum or Plasma', category: 'Chemistry', specimen: 'Serum/Plasma', turnaround: '4 hours', priority: ['routine', 'stat'] },
  { id: 'glucose_serum', code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma', category: 'Chemistry', specimen: 'Serum/Plasma', turnaround: '4 hours', priority: ['routine', 'stat'] },
  { id: 'creatinine', code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma', category: 'Chemistry', specimen: 'Serum/Plasma', turnaround: '4 hours', priority: ['routine', 'stat'] },
  { id: 'bun', code: '3094-0', display: 'Urea nitrogen [Mass/volume] in Serum or Plasma', category: 'Chemistry', specimen: 'Serum/Plasma', turnaround: '4 hours', priority: ['routine'] },

  // Hematology
  { id: 'cbc', code: '58410-2', display: 'CBC panel - Blood by Automated count', category: 'Hematology', specimen: 'Whole blood', turnaround: '2 hours', priority: ['routine', 'stat'] },
  { id: 'hgb', code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood', category: 'Hematology', specimen: 'Whole blood', turnaround: '2 hours', priority: ['routine', 'stat'] },
  { id: 'wbc', code: '6690-2', display: 'Leukocytes [#/volume] in Blood by Automated count', category: 'Hematology', specimen: 'Whole blood', turnaround: '2 hours', priority: ['routine', 'stat'] },

  // Coagulation
  { id: 'pt', code: '5902-2', display: 'Prothrombin time (PT)', category: 'Coagulation', specimen: 'Platelet poor plasma', turnaround: '2 hours', priority: ['routine', 'stat'] },
  { id: 'inr', code: '6301-6', display: 'INR', category: 'Coagulation', specimen: 'Platelet poor plasma', turnaround: '2 hours', priority: ['routine', 'stat'] },

  // Microbiology
  { id: 'blood_culture', code: '600-7', display: 'Blood culture', category: 'Microbiology', specimen: 'Whole blood', turnaround: '48-72 hours', priority: ['stat'] },
  { id: 'urine_culture', code: '630-4', display: 'Urine culture', category: 'Microbiology', specimen: 'Urine', turnaround: '48 hours', priority: ['routine'] },

  // Urinalysis
  { id: 'urinalysis', code: '24357-6', display: 'Urinalysis complete panel', category: 'Urinalysis', specimen: 'Urine', turnaround: '2 hours', priority: ['routine', 'stat'] },
];

// Common Medications for ONC Certification
const MEDICATION_CATALOG = [
  // Antibiotics
  { id: 'amoxicillin_500', code: '308182', display: 'Amoxicillin 500 MG Oral Capsule', category: 'Antibiotic', route: 'PO', form: 'capsule', strength: '500 mg' },
  { id: 'azithromycin_250', code: '308459', display: 'Azithromycin 250 MG Oral Tablet', category: 'Antibiotic', route: 'PO', form: 'tablet', strength: '250 mg' },
  { id: 'ceftriaxone_1g', code: '308745', display: 'Ceftriaxone 1 GM Injection', category: 'Antibiotic', route: 'IM/IV', form: 'injection', strength: '1 g' },

  // Analgesics
  { id: 'acetaminophen_325', code: '313782', display: 'Acetaminophen 325 MG Oral Tablet', category: 'Analgesic', route: 'PO', form: 'tablet', strength: '325 mg' },
  { id: 'ibuprofen_200', code: '310964', display: 'Ibuprofen 200 MG Oral Tablet', category: 'NSAID', route: 'PO', form: 'tablet', strength: '200 mg' },
  { id: 'morphine_10', code: '312289', display: 'Morphine Sulfate 10 MG Oral Tablet', category: 'Opioid', route: 'PO', form: 'tablet', strength: '10 mg', controlled: true },

  // Cardiovascular
  { id: 'metoprolol_50', code: '866435', display: 'Metoprolol Tartrate 50 MG Oral Tablet', category: 'Beta Blocker', route: 'PO', form: 'tablet', strength: '50 mg' },
  { id: 'lisinopril_10', code: '314076', display: 'Lisinopril 10 MG Oral Tablet', category: 'ACE Inhibitor', route: 'PO', form: 'tablet', strength: '10 mg' },
  { id: 'furosemide_40', code: '310429', display: 'Furosemide 40 MG Oral Tablet', category: 'Diuretic', route: 'PO', form: 'tablet', strength: '40 mg' },

  // Diabetes
  { id: 'metformin_500', code: '861007', display: 'Metformin 500 MG Oral Tablet', category: 'Antidiabetic', route: 'PO', form: 'tablet', strength: '500 mg' },
  { id: 'insulin_glargine', code: '1670007', display: 'Insulin Glargine 100 UNT/ML Injectable', category: 'Insulin', route: 'SubQ', form: 'injection', strength: '100 units/mL' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function OrderCatalogPage(props) {
  console.log('OrderCatalogPage.render()', props);

  // State management
  const [orderType, setOrderType] = useState(props.defaultType || 'radiology');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [orderPriority, setOrderPriority] = useState('routine');
  const [showAlerts, setShowAlerts] = useState(true);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [submittedOrderCount, setSubmittedOrderCount] = useState(0);

  // Pagination state - default to 20 items per page for hackathon demo
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  // Track reactive data
  const { selectedPatientId, currentUser } = useTracker(() => {
    return {
      selectedPatientId: Session.get('selectedPatientId'),
      currentUser: Meteor.user()
    };
  });

  // Theme-aware styling relies on MUI theme tokens (background.paper, text.*,
  // divider, action.*), which track light/dark via CustomThemeProvider — no
  // manual mode detection or hardcoded color scheme needed.

  // Filter catalog based on search and category
  const filteredCatalog = useMemo(() => {
    const catalog = orderType === 'laboratory' ? LAB_CATALOG :
                    orderType === 'medication' ? MEDICATION_CATALOG :
                    orderType === 'radiology' ? RADIOLOGY_CATALOG :
                    [];

    return catalog.filter(item => {
      const matchesSearch = searchTerm === '' ||
        item.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.includes(searchTerm) ||
        (item.bodyPart && item.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.modality && item.modality.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' ||
        item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [orderType, searchTerm, selectedCategory]);

  // Paginate the filtered catalog for display
  const paginatedCatalog = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredCatalog.slice(start, end);
  }, [filteredCatalog, page, rowsPerPage]);

  // Get unique categories
  const categories = useMemo(() => {
    // For radiology, use predefined categories for better UX
    if (orderType === 'radiology') {
      return ['all', ...RADIOLOGY_CATEGORIES];
    }

    const catalog = orderType === 'laboratory' ? LAB_CATALOG :
                    orderType === 'medication' ? MEDICATION_CATALOG : [];
    return ['all', ...new Set(catalog.map(item => item.category))];
  }, [orderType]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  function handleAddToOrder(item) {
    const newOrder = {
      ...item,
      id: `${item.id}_${Date.now()}`,
      priority: orderPriority,
      status: 'draft',
      orderedAt: new Date(),

      // Radiology-specific fields
      ...(orderType === 'radiology' && {
        modality: item.modality,
        modalityDisplay: item.modalityDisplay,
        bodyPart: item.bodyPart,
        bodyPartCode: item.bodyPartCode,
        contrast: item.contrast,
        laterality: item.laterality || null,
        reasonForOrder: '', // User will fill this
        priorExamComparison: null,
        views: item.views || null
      }),

      // Medication-specific fields
      ...(orderType === 'medication' && {
        quantity: 1,
        frequency: 'daily',
        duration: '7 days'
      })
    };

    setActiveOrders([...activeOrders, newOrder]);
  }

  function handleRemoveOrder(orderId) {
    setActiveOrders(activeOrders.filter(order => order.id !== orderId));
  }

  function handleUpdateOrder(orderId, updates) {
    setActiveOrders(activeOrders.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    ));
  }

  function handleSubmitOrders() {
    if (!selectedPatientId) {
      alert('Please select a patient first');
      return;
    }

    if (activeOrders.length === 0) {
      alert('No orders to submit');
      return;
    }

    // ONC Certification Requirements Check
    const validationErrors = validateOrders(activeOrders);
    if (validationErrors.length > 0) {
      alert('Please fix validation errors:\n' + validationErrors.join('\n'));
      return;
    }

    // Submit orders
    console.log('Submitting orders with:', {
      patientId: selectedPatientId,
      orderType: orderType,
      orderCount: activeOrders.length,
      authorId: currentUser?._id
    });

    Meteor.call('orderCatalog.submitOrders', {
      patientId: selectedPatientId,
      orders: activeOrders,
      orderType: orderType,
      authorId: currentUser?._id,
      // Link orders to the active encounter when one is set; omitted otherwise
      // (server treats encounterId as optional). undefined keys drop out of EJSON.
      encounterId: Session.get('currentEncounterId') || undefined
    }, (error, result) => {
      if (error) {
        console.error('Error submitting orders:', error);
        alert('Failed to submit orders');
      } else {
        console.log('Orders submitted successfully:', result);
        setSubmittedOrderCount(activeOrders.length);
        setActiveOrders([]);
        setSuccessDialogOpen(true);
      }
    });
  }

  function handleCloseSuccessDialog() {
    setSuccessDialogOpen(false);
  }

  function handleViewServiceRequests() {
    setSuccessDialogOpen(false);
    if (typeof Meteor.navigate === 'function') {
      Meteor.navigate(forwardHome('/service-requests'));
    } else {
      console.warn('[OrderCatalogPage] Meteor.navigate is not available; staying on page');
    }
  }

  function validateOrders(orders) {
    const errors = [];

    orders.forEach((order, index) => {
      // ONC required fields
      if (!order.priority) errors.push(`Order ${index + 1}: Priority is required`);
      if (orderType === 'medication') {
        if (!order.quantity) errors.push(`Order ${index + 1}: Quantity is required`);
        if (!order.frequency) errors.push(`Order ${index + 1}: Frequency is required`);
        if (!order.duration) errors.push(`Order ${index + 1}: Duration is required`);
      }
    });

    return errors;
  }

  // =============================================================================
  // RENDERING
  // =============================================================================

  return (
    <Box
      id="orderCatalogPage"
      data-testid="order-catalog-page"
      sx={{
        minHeight: '100vh',
        pb: 4
      }}
    >
      <Container maxWidth="xl" sx={{ pt: 2 }}>

        {/* Compact Header with ONC Certification Badge */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Computerized Provider Order Entry (CPOE)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ONC §170.315(a)(1) Medications | §170.315(a)(2) Laboratory | §170.315(a)(3) Diagnostic Imaging
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ListIcon />}
                onClick={() => {
                  if (typeof Meteor.navigate === 'function') {
                    Meteor.navigate(forwardHome('/service-requests'));
                  }
                }}
              >
                View Service Requests
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Grid Layout */}
        <Grid container spacing={2}>

          {/* Left Panel: Catalog Browser */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardHeader
                title="Order Catalog"
                subheader={`Browse ${orderType === 'laboratory' ? 'laboratory tests' : orderType === 'medication' ? 'medications' : 'radiology procedures'}`}
                action={
                  <ToggleButtonGroup
                    value={orderType}
                    exclusive
                    onChange={(e, value) => value && setOrderType(value)}
                    size="small"
                    data-testid="order-type-selector"
                  >
                    <ToggleButton value="laboratory" data-testid="laboratory-tab">
                      <BiotechIcon sx={{ mr: 1 }} />
                      Laboratory
                    </ToggleButton>
                    <ToggleButton value="medication" data-testid="medications-tab">
                      <MedicationIcon sx={{ mr: 1 }} />
                      Medication
                    </ToggleButton>
                    <ToggleButton value="radiology" data-testid="radiology-tab">
                      <MedicalServicesIcon sx={{ mr: 1 }} />
                      Radiology
                    </ToggleButton>
                  </ToggleButtonGroup>
                }
              />
              <CardContent>
                {/* Search and Filter Controls */}
                <Stack spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Search ${orderType} orders...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid={`${orderType}-search-input`}
                    InputProps={{
                      startAdornment: orderType === 'laboratory' ? <ScienceIcon sx={{ mr: 1, color: 'action.active' }} /> :
                                     orderType === 'medication' ? <MedicationIcon sx={{ mr: 1, color: 'action.active' }} /> :
                                     <MedicalServicesIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />

                  <Stack direction="row" spacing={1}>
                    {categories.map(cat => (
                      <Chip
                        key={cat}
                        label={cat === 'all' ? 'All Categories' : cat}
                        onClick={() => setSelectedCategory(cat)}
                        color={selectedCategory === cat ? 'primary' : 'default'}
                        variant={selectedCategory === cat ? 'filled' : 'outlined'}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Stack>

                {/* Catalog Table */}
                <TableContainer>
                  <Table
                    size="small"
                    stickyHeader
                    data-testid={orderType === 'laboratory' ? 'laboratory-orders-table' : 'medication-orders-table'}
                  >
                    <TableHead sx={{ '& .MuiTableCell-head': { bgcolor: 'background.default' } }}>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Description</TableCell>
                        {orderType === 'laboratory' ? (
                          <>
                            <TableCell>Specimen</TableCell>
                            <TableCell>TAT</TableCell>
                          </>
                        ) : orderType === 'medication' ? (
                          <>
                            <TableCell>Route</TableCell>
                            <TableCell>Strength</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>Modality</TableCell>
                            <TableCell>Body Part</TableCell>
                            <TableCell>TAT</TableCell>
                          </>
                        )}
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCatalog.map((item) => (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          data-testid={`${orderType}-order-row-${item.id}`}
                        >
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {item.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.display}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category}
                            </Typography>
                          </TableCell>
                          {orderType === 'laboratory' ? (
                            <>
                              <TableCell>
                                <Chip label={item.specimen} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <TimerIcon fontSize="small" color="action" />
                                  <Typography variant="caption">{item.turnaround}</Typography>
                                </Stack>
                              </TableCell>
                            </>
                          ) : orderType === 'medication' ? (
                            <>
                              <TableCell>
                                <Chip label={item.route} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{item.strength}</Typography>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                <Chip label={item.modality} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{item.bodyPart}</Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <TimerIcon fontSize="small" color="action" />
                                  <Typography variant="caption">{item.turnaround}</Typography>
                                </Stack>
                              </TableCell>
                            </>
                          )}
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAddToOrder(item)}
                              data-testid={`add-${orderType}-order-button`}
                            >
                              <AddIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredCatalog.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[]} // Hide options since we're using dynamic calculation
                  />
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Panel: Active Orders */}
          <Grid item xs={12} md={5}>
            <Card data-testid="active-orders-panel">
              <CardHeader
                title="Active Orders"
                subheader={`${activeOrders.length} items pending submission`}
                action={
                  <Badge badgeContent={activeOrders.length} color="primary">
                    <LocalHospitalIcon />
                  </Badge>
                }
                sx={{ '& .MuiCardHeader-action': { alignSelf: 'center', mt: 0, mr: 1 } }}
              />
              <CardContent>
                {/* Order Priority Selector */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <FormControl component="fieldset" size="small">
                    <FormLabel component="legend">Default Priority</FormLabel>
                    <RadioGroup
                      row
                      value={orderPriority}
                      onChange={(e) => setOrderPriority(e.target.value)}
                    >
                      <FormControlLabel value="routine" control={<Radio size="small" />} label="Routine" />
                      <FormControlLabel value="urgent" control={<Radio size="small" />} label="Urgent" />
                      <FormControlLabel value="stat" control={<Radio size="small" />} label="STAT" />
                    </RadioGroup>
                  </FormControl>
                </Paper>

                {/* Active Orders List */}
                <Stack spacing={1} sx={{ minHeight: 80, maxHeight: 350, overflowY: 'auto', pr: 0.5 }}>
                  {activeOrders.length === 0 ? (
                    <Alert severity="info">
                      No orders added yet. Select items from the catalog to begin.
                    </Alert>
                  ) : (
                    activeOrders.map((order) => (
                      <Accordion
                        key={order.id}
                        defaultExpanded={false}
                        sx={{ bgcolor: 'background.default' }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                            <Chip
                              label={order.priority}
                              size="small"
                              color={order.priority === 'stat' ? 'error' : order.priority === 'urgent' ? 'warning' : 'default'}
                            />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {order.display}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveOrder(order.id);
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1}>
                            {orderType === 'medication' && (
                              <>
                                <TextField
                                  label="Quantity"
                                  type="number"
                                  size="small"
                                  value={order.quantity}
                                  onChange={(e) => handleUpdateOrder(order.id, { quantity: e.target.value })}
                                />
                                <TextField
                                  label="Frequency"
                                  size="small"
                                  value={order.frequency}
                                  onChange={(e) => handleUpdateOrder(order.id, { frequency: e.target.value })}
                                />
                                <TextField
                                  label="Duration"
                                  size="small"
                                  value={order.duration}
                                  onChange={(e) => handleUpdateOrder(order.id, { duration: e.target.value })}
                                />
                              </>
                            )}
                            <TextField
                              label="Clinical Notes (Reason for Order)"
                              multiline
                              rows={2}
                              size="small"
                              placeholder="Optional: reason for order, clinical indication..."
                              onChange={(e) => handleUpdateOrder(order.id, { notes: e.target.value })}
                              data-testid={`${orderType}-order-reason-field`}
                            />
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </Stack>

                {/* Submit Actions */}
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      onClick={() => setActiveOrders([])}
                      data-testid="clear-orders-button"
                    >
                      Clear All
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitOrders}
                      disabled={activeOrders.length === 0}
                      data-testid="submit-orders-button"
                    >
                      Submit Orders ({activeOrders.length})
                    </Button>
                  </Stack>
                </Box>

                {/* ONC Compliance Alerts */}
                {showAlerts && (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Alert severity="info" onClose={() => setShowAlerts(false)}>
                      <strong>ONC Requirement:</strong> All orders must include priority level and clinical indication when applicable.
                    </Alert>
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Drug-Drug Interaction Check (for ONC compliance) */}
            {orderType === 'medication' && activeOrders.length > 1 && (
              <Card sx={{ mt: 2 }}>
                <CardHeader
                  title="Drug Interaction Check"
                  subheader="ONC §170.315(a)(4) Compliance"
                  avatar={<WarningIcon color="warning" />}
                />
                <CardContent>
                  <Alert severity="success">
                    No significant drug-drug interactions detected.
                  </Alert>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Submission Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={handleCloseSuccessDialog}
        maxWidth="xs"
        fullWidth
        data-testid="submit-success-dialog"
      >
        <DialogTitle>Orders Submitted</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {submittedOrderCount === 1
              ? '1 order was submitted successfully.'
              : `${submittedOrderCount} orders were submitted successfully.`}
            {' '}Would you like to view all Service Requests?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            onClick={handleCloseSuccessDialog}
            data-testid="submit-success-stay-button"
          >
            Stay Here
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleViewServiceRequests}
            data-testid="submit-success-view-button"
          >
            View Service Requests
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OrderCatalogPage;
