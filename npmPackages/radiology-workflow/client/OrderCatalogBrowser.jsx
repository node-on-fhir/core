// npmPackages/radiology-workflow/client/OrderCatalogBrowser.jsx

import React, { useState, useMemo } from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  InputAdornment,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SearchIcon from '@mui/icons-material/Search';

import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import PatientSearchDialog from '/imports/components/PatientSearchDialog.jsx';

import {
  RADIOLOGY_CATALOG,
  MODALITY_CODES
} from '@node-on-fhir/order-catalog/lib/RadiologyCatalog';

const log = (Meteor.Logger ? Meteor.Logger.for('OrderCatalogBrowser') : console);

// =============================================================================
// ORDER CATALOG BROWSER
// =============================================================================
//
// Displayed when no patient is selected. Allows techs to browse imaging exams
// by modality and body region before selecting a patient.
// =============================================================================

function OrderCatalogBrowser() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const [selectedModality, setSelectedModality] = useState(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [modalitySearch, setModalitySearch] = useState('');
  const [procedureSearch, setProcedureSearch] = useState('');
  const [bodyPartSearch, setBodyPartSearch] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const modalityCodes = Object.keys(MODALITY_CODES);

  const filteredModalities = useMemo(function() {
    if (!modalitySearch) {
      return modalityCodes;
    }
    const search = modalitySearch.toLowerCase();
    return modalityCodes.filter(function(code) {
      return code.toLowerCase().includes(search) ||
        MODALITY_CODES[code].display.toLowerCase().includes(search);
    });
  }, [modalitySearch]);

  const filteredProcedures = useMemo(function() {
    let filtered = RADIOLOGY_CATALOG;

    if (selectedModality) {
      filtered = filtered.filter(function(proc) {
        return proc.modality === selectedModality;
      });
    }

    if (selectedBodyPart) {
      filtered = filtered.filter(function(proc) {
        return proc.bodyPart === selectedBodyPart;
      });
    }

    if (procedureSearch) {
      const search = procedureSearch.toLowerCase();
      filtered = filtered.filter(function(proc) {
        return proc.display.toLowerCase().includes(search) ||
          proc.longName.toLowerCase().includes(search);
      });
    }

    return filtered;
  }, [selectedModality, selectedBodyPart, procedureSearch]);

  const uniqueBodyParts = useMemo(function() {
    // If a modality is selected, only show body parts that have procedures for that modality
    let catalog = RADIOLOGY_CATALOG;
    if (selectedModality) {
      catalog = catalog.filter(function(proc) {
        return proc.modality === selectedModality;
      });
    }

    const parts = [...new Set(catalog.map(function(proc) { return proc.bodyPart; }))].sort();

    if (!bodyPartSearch) {
      return parts;
    }

    const search = bodyPartSearch.toLowerCase();
    return parts.filter(function(bp) {
      return bp.toLowerCase().includes(search);
    });
  }, [selectedModality, bodyPartSearch]);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  function handleModalityClick(code) {
    if (selectedModality === code) {
      setSelectedModality(null);
    } else {
      setSelectedModality(code);
    }
    // Clear body part selection when modality changes to avoid empty state
    setSelectedBodyPart(null);
    setSelectedProcedure(null);
  }

  function handleBodyPartClick(bodyPart) {
    if (selectedBodyPart === bodyPart) {
      setSelectedBodyPart(null);
    } else {
      setSelectedBodyPart(bodyPart);
    }
    setSelectedProcedure(null);
  }

  function handleProcedureSelect(proc) {
    setSelectedProcedure(proc);
    setOrderError(null);
  }

  async function createOrderForPatient(patient, procedure) {
    if (!procedure) {
      console.warn('[OrderCatalogBrowser] No procedure selected, setting patient without order'); // phi-audit: ok
      Session.set('selectedPatient', patient);
      Session.set('selectedPatientId', get(patient, 'id'));
      setPatientDialogOpen(false);
      return;
    }

    setIsCreatingOrder(true);
    setOrderError(null);

    try {
      const modalityInfo = MODALITY_CODES[procedure.modality] || {};

      await Meteor.callAsync('radiology.createImagingOrder', {
        patientId: get(patient, 'id'),
        modality: procedure.modality,
        modalityDisplay: get(modalityInfo, 'display', procedure.modality),
        procedureCode: procedure.code,
        procedureDisplay: procedure.display,
        priority: 'routine'
      });

      log.debug('Order created for patient:', { patientId: get(patient, 'id'), procedure: procedure.display });

      // Set Session after order creation so Order History sees the order immediately
      Session.set('selectedPatient', patient);
      Session.set('selectedPatientId', get(patient, 'id'));
      setPatientDialogOpen(false);
      navigate('/radiology/order-history');
    } catch (error) {
      console.error('[OrderCatalogBrowser] Failed to create order:', error);
      setOrderError(get(error, 'reason', 'Failed to create imaging order. Please try again.'));
    } finally {
      setIsCreatingOrder(false);
    }
  }

  function handleSelectPatient(patientId, patient) {
    createOrderForPatient(patient, selectedProcedure);
  }

  function handleAnonymousPatient() {
    const anonymousPatient = {
      resourceType: 'Patient',
      _id: Random.id(),
      id: Random.id(),
      name: [{ text: 'Anonymous Patient', family: 'Anonymous', given: ['Patient'] }],
      active: true
    };
    createOrderForPatient(anonymousPatient, selectedProcedure);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} id="orderCatalogBrowserPage">
      {/* Header */}
      <Card sx={{ boxShadow: 3, mb: 3 }}>
        <CardHeader
          avatar={<LocalHospitalIcon />}
          title="Order Entry - Browse Catalog"
          subheader={selectedProcedure
            ? `Selected: ${selectedProcedure.display}`
            : 'Select a modality and procedure, then choose a patient'
          }
          sx={{
            backgroundColor: 'background.paper',
            color: 'text.primary',
            '& .MuiCardHeader-subheader': {
              color: 'text.secondary'
            },
            '& .MuiCardHeader-action': {
              alignSelf: 'center'
            }
          }}
          action={!selectedPatient ? (
            <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
              <Button
                variant="contained"
                size="small"
                disabled={isCreatingOrder}
                onClick={() => setPatientDialogOpen(true)}
              >
                SELECT PATIENT
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={isCreatingOrder}
                onClick={handleAnonymousPatient}
              >
                {isCreatingOrder ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                Anonymous
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              size="small"
              disabled={!selectedProcedure || isCreatingOrder}
              onClick={function() { createOrderForPatient(selectedPatient, selectedProcedure); }}
              sx={{ mr: 1 }}
            >
              {isCreatingOrder ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              REQUEST SERVICE
            </Button>
          )}
        />
      </Card>

      {orderError ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setOrderError(null)}>
          {orderError}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        {/* Left Column - Modality Tiles */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Modalities"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <TextField
                fullWidth
                size="small"
                placeholder="Search modalities..."
                value={modalitySearch}
                onChange={(e) => setModalitySearch(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredModalities.map(function(code) {
                  const isSelected = selectedModality === code;
                  return (
                    <Card
                      key={code}
                      onClick={() => handleModalityClick(code)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: 4 },
                        boxShadow: isSelected ? 6 : 1,
                        border: isSelected ? 2 : 0,
                        borderColor: 'primary.main'
                      }}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'text.primary',
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {code}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {MODALITY_CODES[code].display}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Center Column - Procedure List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={`Radiology Exams (${filteredProcedures.length})`}
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <TextField
                fullWidth
                size="small"
                placeholder="Search procedures..."
                value={procedureSearch}
                onChange={(e) => setProcedureSearch(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />

              {filteredProcedures.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No procedures match the current filters.
                </Typography>
              ) : (
                <List disablePadding sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                  {filteredProcedures.map(function(proc) {
                    const isSelected = selectedProcedure && selectedProcedure.id === proc.id;
                    return (
                      <ListItem
                        key={proc.id}
                        button
                        divider
                        selected={isSelected}
                        onClick={() => handleProcedureSelect(proc)}
                        sx={{
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <ListItemText
                          primary={proc.display}
                          secondary={proc.longName}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
                          <Chip label={proc.bodyPart} size="small" variant="outlined" />
                          {proc.contrast && (
                            <Chip label={proc.contrast} size="small" color="warning" variant="outlined" />
                          )}
                          {proc.turnaround && (
                            <Chip label={proc.turnaround} size="small" variant="outlined" sx={{ color: 'text.secondary' }} />
                          )}
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Body Region */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Body Region"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <TextField
                fullWidth
                size="small"
                placeholder="Search body parts..."
                value={bodyPartSearch}
                onChange={(e) => setBodyPartSearch(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />

              {uniqueBodyParts.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No body regions match.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {uniqueBodyParts.map(function(bp) {
                    const isSelected = selectedBodyPart === bp;
                    return (
                      <Chip
                        key={bp}
                        label={bp}
                        onClick={() => handleBodyPartClick(bp)}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patient Search Dialog */}
      <Dialog
        open={patientDialogOpen}
        onClose={isCreatingOrder ? undefined : () => setPatientDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isCreatingOrder ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              Creating order...
            </Box>
          ) : 'Select Patient'}
        </DialogTitle>
        <PatientSearchDialog
          onSelect={handleSelectPatient}
          hideFhirBarcode={true}
        />
      </Dialog>
    </Container>
  );
}

export default OrderCatalogBrowser;
