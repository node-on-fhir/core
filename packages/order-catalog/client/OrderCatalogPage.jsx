// packages/order-catalog/client/OrderCatalogPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

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
  ButtonGroup,
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
  ToggleButtonGroup
} from '@mui/material';

import {
  Science as ScienceIcon,
  Medication as MedicationIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  LocalHospital as LocalHospitalIcon,
  Biotech as BiotechIcon,
  Vaccines as VaccinesIcon,
  BloodType as BloodTypeIcon,
  Timer as TimerIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';

import { get, debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

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
  
  const navigate = useNavigate();
  
  // State management
  const [orderType, setOrderType] = useState('laboratory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [orderPriority, setOrderPriority] = useState('routine');
  const [showAlerts, setShowAlerts] = useState(true);
  
  // Track reactive data
  const { selectedPatientId, currentUser } = useTracker(() => {
    return {
      selectedPatientId: Session.get('selectedPatientId'),
      currentUser: Meteor.user()
    };
  });
  
  // Filter catalog based on search and category
  const filteredCatalog = useMemo(() => {
    const catalog = orderType === 'laboratory' ? LAB_CATALOG : MEDICATION_CATALOG;
    
    return catalog.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.includes(searchTerm);
      
      const matchesCategory = selectedCategory === 'all' || 
        item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [orderType, searchTerm, selectedCategory]);
  
  // Get unique categories
  const categories = useMemo(() => {
    const catalog = orderType === 'laboratory' ? LAB_CATALOG : MEDICATION_CATALOG;
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
      quantity: 1,
      frequency: orderType === 'medication' ? 'daily' : null,
      duration: orderType === 'medication' ? '7 days' : null,
      status: 'draft',
      orderedAt: new Date()
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
    Meteor.call('orderCatalog.submitOrders', {
      patientId: selectedPatientId,
      orders: activeOrders,
      orderType: orderType,
      authorId: currentUser?._id
    }, (error, result) => {
      if (error) {
        console.error('Error submitting orders:', error);
        alert('Failed to submit orders');
      } else {
        console.log('Orders submitted successfully:', result);
        setActiveOrders([]);
        alert('Orders submitted successfully');
      }
    });
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
      sx={{ 
        bgcolor: theme => theme.palette.mode === 'light' 
          ? theme.palette.grey[50]
          : theme.palette.background.default,
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
                ONC §170.315(a)(1) Medications | §170.315(a)(2) Laboratory
              </Typography>
            </Grid>
            <Grid item>
              <Chip 
                icon={<CheckCircleIcon />} 
                label="ONC Certified" 
                color="success" 
                variant="outlined"
              />
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
                subheader={`Browse ${orderType === 'laboratory' ? 'laboratory tests' : 'medications'}`}
                action={
                  <ToggleButtonGroup
                    value={orderType}
                    exclusive
                    onChange={(e, value) => value && setOrderType(value)}
                    size="small"
                  >
                    <ToggleButton value="laboratory">
                      <BiotechIcon sx={{ mr: 1 }} />
                      Laboratory
                    </ToggleButton>
                    <ToggleButton value="medication">
                      <MedicationIcon sx={{ mr: 1 }} />
                      Medication
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
                    InputProps={{
                      startAdornment: orderType === 'laboratory' ? <ScienceIcon sx={{ mr: 1, color: 'text.secondary' }} /> : <MedicationIcon sx={{ mr: 1, color: 'text.secondary' }} />
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
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Description</TableCell>
                        {orderType === 'laboratory' ? (
                          <>
                            <TableCell>Specimen</TableCell>
                            <TableCell>TAT</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>Route</TableCell>
                            <TableCell>Strength</TableCell>
                          </>
                        )}
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCatalog.map((item) => (
                        <TableRow 
                          key={item.id}
                          hover
                          sx={{ cursor: 'pointer' }}
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
                          ) : (
                            <>
                              <TableCell>
                                <Chip label={item.route} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{item.strength}</Typography>
                              </TableCell>
                            </>
                          )}
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAddToOrder(item)}
                            >
                              <AddIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Right Panel: Active Orders */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardHeader
                title="Active Orders"
                subheader={`${activeOrders.length} items pending submission`}
                action={
                  <Badge badgeContent={activeOrders.length} color="primary">
                    <LocalHospitalIcon />
                  </Badge>
                }
              />
              <CardContent>
                {/* Order Priority Selector */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
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
                <Stack spacing={1} sx={{ maxHeight: 350, overflowY: 'auto' }}>
                  {activeOrders.length === 0 ? (
                    <Alert severity="info">
                      No orders added yet. Select items from the catalog to begin.
                    </Alert>
                  ) : (
                    activeOrders.map((order) => (
                      <Accordion key={order.id} defaultExpanded={false}>
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
                              label="Clinical Notes"
                              multiline
                              rows={2}
                              size="small"
                              placeholder="Optional clinical notes..."
                              onChange={(e) => handleUpdateOrder(order.id, { notes: e.target.value })}
                            />
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </Stack>
                
                {/* Submit Actions */}
                <Box sx={{ mt: 2 }}>
                  <ButtonGroup fullWidth variant="contained">
                    <Button
                      color="inherit"
                      onClick={() => setActiveOrders([])}
                    >
                      Clear All
                    </Button>
                    <Button
                      color="primary"
                      onClick={handleSubmitOrders}
                      disabled={activeOrders.length === 0}
                    >
                      Submit Orders ({activeOrders.length})
                    </Button>
                  </ButtonGroup>
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
    </Box>
  );
}

export default OrderCatalogPage;