// /imports/ui-fhir/researchStudies/ResearchStudyDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Alert,
  Grid,
  Dialog
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import the collection directly - avoids timing issues
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';

function ResearchStudyDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  
  // Subscribe to research studies data
  const subscriptionReady = useTracker(() => {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.ResearchStudies', Session.get('selectedPatientId'), {});
      return handle.ready();
    } else {
      const handle = Meteor.subscribe('researchStudies.all');
      return handle.ready();
    }
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [researchStudy, setResearchStudy] = useState({
    resourceType: "ResearchStudy",
    identifier: [{
      system: "",
      value: ""
    }],
    title: "",
    status: "active",
    phase: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/research-study-phase",
        code: "phase-3",
        display: "Phase 3"
      }]
    },
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/research-study-prim-purp-type",
        code: "interventional",
        display: "Interventional"
      }]
    }],
    focus: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    }],
    description: "",
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    principalInvestigator: {
      reference: "",
      display: ""
    },
    enrollment: [{
      reference: "",
      display: ""
    }],
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setResearchStudy(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // onResourceChange: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(researchStudy);
    }
  }, [researchStudy]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded || !id || id === 'new');

  // Load existing research study if editing
  useEffect(() => {
    if (id && id !== 'new' && ResearchStudies) {
      setLoading(true);
      Meteor.call('researchStudies.get', id, (error, result) => {
        setLoading(false);
        if (error) {
          setError(error.reason);
          console.error('Error loading research study:', error);
        } else if (result) {
          console.log('Loaded research study:', result);
          setResearchStudy(result);
          setIsEditing(false);
        }
      });
    } else if (id === 'new') {
      // For new research studies, start in edit mode
      setIsEditing(true);
    }
  }, [id]);

  // Handle field changes
  const handleChange = (path, value) => {
    pendingUpdate.current = true;
    const newResearchStudy = { ...researchStudy };
    set(newResearchStudy, path, value);
    setResearchStudy(newResearchStudy);
  };

  // Handle save
  const handleSave = () => {
    setError(null);
    setLoading(true);
    
    const userId = Meteor.userId();
    if (!userId) {
      setError('You must be logged in to save research studies');
      setLoading(false);
      return;
    }
    
    // Prepare the data for save - ensure proper structure for CodeableConcepts
    const dataToSave = { ...researchStudy };
    
    // Ensure phase is properly structured if it exists
    if (dataToSave.phase && typeof dataToSave.phase === 'object' && dataToSave.phase.coding) {
      // Keep as is - already properly structured
    } else if (dataToSave.phase) {
      // Convert simple string to CodeableConcept
      const phaseMap = {
        'n-a': 'N/A',
        'early-phase-1': 'Early Phase 1',
        'phase-1': 'Phase 1',
        'phase-1-phase-2': 'Phase 1/Phase 2',
        'phase-2': 'Phase 2',
        'phase-2-phase-3': 'Phase 2/Phase 3',
        'phase-3': 'Phase 3',
        'phase-4': 'Phase 4'
      };
      dataToSave.phase = {
        coding: [{
          system: 'http://hl7.org/fhir/research-study-phase',
          code: dataToSave.phase,
          display: phaseMap[dataToSave.phase] || dataToSave.phase
        }],
        text: phaseMap[dataToSave.phase] || dataToSave.phase
      };
    }
    
    // Convert category to array of CodeableConcepts if needed
    if (dataToSave.category && !Array.isArray(dataToSave.category)) {
      dataToSave.category = [{
        coding: [{
          system: 'http://hl7.org/fhir/research-study-category',
          code: dataToSave.category,
          display: dataToSave.category.charAt(0).toUpperCase() + dataToSave.category.slice(1)
        }],
        text: dataToSave.category.charAt(0).toUpperCase() + dataToSave.category.slice(1)
      }];
    }
    
    // Convert focus to array of CodeableConcepts if needed
    if (dataToSave.focusType || dataToSave.focusCode || dataToSave.focusDisplay) {
      const focusObject = {
        coding: [{
          system: 'http://snomed.info/sct',
          code: dataToSave.focusCode || '',
          display: dataToSave.focusDisplay || ''
        }],
        text: dataToSave.focusDisplay || ''
      };
      dataToSave.focus = [focusObject];
      // Remove the separate fields
      delete dataToSave.focusType;
      delete dataToSave.focusCode;
      delete dataToSave.focusDisplay;
    }
    
    console.log('handleSave called with id:', id, 'id === "new":', id === 'new', 'typeof id:', typeof id);
    
    if (!id || id === 'new') {
      console.log('Creating new research study:', dataToSave);
      Meteor.call('researchStudies.create', dataToSave, (error, newId) => {
        setLoading(false);
        if (error) {
          setError(error.reason);
          console.error('Create error:', error);
        } else {
          console.log('Research study created with ID:', newId);
          navigate('/research-studies');
        }
      });
    } else {
      console.log('Updating research study:', id, dataToSave);
      Meteor.call('researchStudies.update', id, dataToSave, (error) => {
        setLoading(false);
        if (error) {
          setError(error.reason);
          console.error('Update error:', error);
        } else {
          console.log('Research study updated successfully');
          setIsEditing(false);
          navigate('/research-studies');
        }
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this research study?')) {
      setLoading(true);
      Meteor.call('researchStudies.remove', id, (error) => {
        setLoading(false);
        if (error) {
          setError(error.reason);
          console.error('Delete error:', error);
        } else {
          navigate('/research-studies');
        }
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!id || id === 'new') {
      navigate('/research-studies');
    } else {
      // Reload the original data
      setLoading(true);
      Meteor.call('researchStudies.get', id, (error, result) => {
        setLoading(false);
        if (error) {
          setError(error.reason);
        } else if (result) {
          setResearchStudy(result);
          setIsEditing(false);
        }
      });
    }
  };

  if (isEmbedded) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            id="title"
            label="Title"
            fullWidth
            value={get(researchStudy, 'title', '')}
            onChange={(e) => handleChange('title', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="principalInvestigatorDisplay"
            label="Principal Investigator"
            fullWidth
            value={get(researchStudy, 'principalInvestigator.display', '')}
            onChange={(e) => handleChange('principalInvestigator.display', e.target.value)}
            disabled={!isEditing}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for investigator">
                    <IconButton
                      edge="end"
                      disabled={!isEditing}
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={get(researchStudy, 'status', 'active')}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={!isEditing}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="administratively-completed">Administratively Completed</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="closed-to-accrual">Closed to Accrual</MenuItem>
              <MenuItem value="closed-to-accrual-and-intervention">Closed to Accrual and Intervention</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="disapproved">Disapproved</MenuItem>
              <MenuItem value="in-review">In Review</MenuItem>
              <MenuItem value="temporarily-closed-to-accrual">Temporarily Closed to Accrual</MenuItem>
              <MenuItem value="temporarily-closed-to-accrual-and-intervention">Temporarily Closed to Accrual and Intervention</MenuItem>
              <MenuItem value="withdrawn">Withdrawn</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="phase-label">Phase</InputLabel>
            <Select
              labelId="phase-label"
              id="phase"
              value={get(researchStudy, 'phase.coding[0].code', 'phase-3')}
              onChange={(e) => {
                const phaseMap = {
                  'n-a': 'N/A',
                  'early-phase-1': 'Early Phase 1',
                  'phase-1': 'Phase 1',
                  'phase-1-phase-2': 'Phase 1/Phase 2',
                  'phase-2': 'Phase 2',
                  'phase-2-phase-3': 'Phase 2/Phase 3',
                  'phase-3': 'Phase 3',
                  'phase-4': 'Phase 4'
                };
                handleChange('phase.coding[0].code', e.target.value);
                handleChange('phase.coding[0].display', phaseMap[e.target.value]);
              }}
              disabled={!isEditing}
              label="Phase"
            >
              <MenuItem value="n-a">N/A</MenuItem>
              <MenuItem value="early-phase-1">Early Phase 1</MenuItem>
              <MenuItem value="phase-1">Phase 1</MenuItem>
              <MenuItem value="phase-1-phase-2">Phase 1/Phase 2</MenuItem>
              <MenuItem value="phase-2">Phase 2</MenuItem>
              <MenuItem value="phase-2-phase-3">Phase 2/Phase 3</MenuItem>
              <MenuItem value="phase-3">Phase 3</MenuItem>
              <MenuItem value="phase-4">Phase 4</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              value={get(researchStudy, 'category[0].coding[0].code', 'interventional')}
              onChange={(e) => {
                const categoryMap = {
                  'interventional': 'Interventional',
                  'observational': 'Observational',
                  'expanded-access': 'Expanded Access'
                };
                handleChange('category[0].coding[0].code', e.target.value);
                handleChange('category[0].coding[0].display', categoryMap[e.target.value]);
              }}
              disabled={!isEditing}
              label="Category"
            >
              <MenuItem value="interventional">Interventional</MenuItem>
              <MenuItem value="observational">Observational</MenuItem>
              <MenuItem value="expanded-access">Expanded Access</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="focusType-label">Focus Type</InputLabel>
            <Select
              labelId="focusType-label"
              id="focusType"
              value={get(researchStudy, 'focus[0].coding[0].system', 'http://snomed.info/sct')}
              onChange={(e) => handleChange('focus[0].coding[0].system', e.target.value)}
              disabled={!isEditing}
              label="Focus Type"
            >
              <MenuItem value="http://snomed.info/sct">SNOMED CT</MenuItem>
              <MenuItem value="http://www.nlm.nih.gov/research/umls/rxnorm">RxNorm</MenuItem>
              <MenuItem value="http://loinc.org">LOINC</MenuItem>
              <MenuItem value="medication">Medication</MenuItem>
              <MenuItem value="device">Device</MenuItem>
              <MenuItem value="procedure">Procedure</MenuItem>
              <MenuItem value="condition">Condition</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="focusCode"
            label="Focus Code"
            fullWidth
            value={get(researchStudy, 'focus[0].coding[0].code', '')}
            onChange={(e) => handleChange('focus[0].coding[0].code', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="focusDisplay"
            label="Focus Display"
            fullWidth
            value={get(researchStudy, 'focus[0].coding[0].display', '')}
            onChange={(e) => handleChange('focus[0].coding[0].display', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="descriptionTextarea"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={get(researchStudy, 'description', '')}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="periodStart"
            label="Period Start"
            type="date"
            fullWidth
            value={get(researchStudy, 'period.start', '')}
            onChange={(e) => handleChange('period.start', e.target.value)}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="periodEnd"
            label="Period End"
            type="date"
            fullWidth
            value={get(researchStudy, 'period.end', '')}
            onChange={(e) => handleChange('period.end', e.target.value)}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="enrollmentTarget"
            label="Enrollment Target"
            fullWidth
            type="number"
            value={get(researchStudy, 'enrollment[0].display', '').split('/')[1] || ''}
            onChange={(e) => {
              const actual = get(researchStudy, 'enrollment[0].display', '').split('/')[0] || '0';
              handleChange('enrollment[0].display', `${actual}/${e.target.value}`);
            }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="enrollmentActual"
            label="Enrollment Actual"
            fullWidth
            type="number"
            value={get(researchStudy, 'enrollment[0].display', '').split('/')[0] || ''}
            onChange={(e) => {
              const target = get(researchStudy, 'enrollment[0].display', '').split('/')[1] || '0';
              handleChange('enrollment[0].display', `${e.target.value}/${target}`);
            }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="notesTextarea"
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={get(researchStudy, 'note[0].text', '')}
            onChange={(e) => handleChange('note[0].text', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <Container maxWidth="md" style={{ marginTop: '20px' }}>
      <Card id="researchStudyDetailPage">
        <CardHeader
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                {!id || id === 'new' ? 'New Research Study' : 'Research Study Details'}
              </Typography>
              <Box>
                <Tooltip title={isEditing ? "Lock to view mode" : "Unlock to edit"}>
                  <IconButton
                    onClick={() => setIsEditing(!isEditing)}
                    color="primary"
                    disabled={!id || id === 'new'}
                  >
                    {isEditing ? <LockOpenIcon /> : <LockIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="View barcode">
                  <IconButton color="primary">
                    <QrCodeIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          }
          subheader={
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                Last updated: {get(researchStudy, 'meta.lastUpdated') ? moment(researchStudy.meta.lastUpdated).format('YYYY-MM-DD HH:mm') : 'Never'}
              </Typography>
            </Box>
          }
        />
        
        <CardContent>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} style={{ marginBottom: '16px' }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                id="title"
                label="Title"
                fullWidth
                value={get(researchStudy, 'title', '')}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="principalInvestigatorDisplay"
                label="Principal Investigator"
                fullWidth
                value={get(researchStudy, 'principalInvestigator.display', '')}
                onChange={(e) => handleChange('principalInvestigator.display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for investigator">
                        <IconButton
                          edge="end"
                          disabled={!isEditing}
                        >
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={get(researchStudy, 'status', 'active')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="administratively-completed">Administratively Completed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="closed-to-accrual">Closed to Accrual</MenuItem>
                  <MenuItem value="closed-to-accrual-and-intervention">Closed to Accrual and Intervention</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="disapproved">Disapproved</MenuItem>
                  <MenuItem value="in-review">In Review</MenuItem>
                  <MenuItem value="temporarily-closed-to-accrual">Temporarily Closed to Accrual</MenuItem>
                  <MenuItem value="temporarily-closed-to-accrual-and-intervention">Temporarily Closed to Accrual and Intervention</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="phase-label">Phase</InputLabel>
                <Select
                  labelId="phase-label"
                  id="phase"
                  value={get(researchStudy, 'phase.coding[0].code', 'phase-3')}
                  onChange={(e) => {
                    const phaseMap = {
                      'n-a': 'N/A',
                      'early-phase-1': 'Early Phase 1',
                      'phase-1': 'Phase 1',
                      'phase-1-phase-2': 'Phase 1/Phase 2',
                      'phase-2': 'Phase 2',
                      'phase-2-phase-3': 'Phase 2/Phase 3',
                      'phase-3': 'Phase 3',
                      'phase-4': 'Phase 4'
                    };
                    handleChange('phase.coding[0].code', e.target.value);
                    handleChange('phase.coding[0].display', phaseMap[e.target.value]);
                  }}
                  disabled={!isEditing}
                  label="Phase"
                >
                  <MenuItem value="n-a">N/A</MenuItem>
                  <MenuItem value="early-phase-1">Early Phase 1</MenuItem>
                  <MenuItem value="phase-1">Phase 1</MenuItem>
                  <MenuItem value="phase-1-phase-2">Phase 1/Phase 2</MenuItem>
                  <MenuItem value="phase-2">Phase 2</MenuItem>
                  <MenuItem value="phase-2-phase-3">Phase 2/Phase 3</MenuItem>
                  <MenuItem value="phase-3">Phase 3</MenuItem>
                  <MenuItem value="phase-4">Phase 4</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={get(researchStudy, 'category[0].coding[0].code', 'interventional')}
                  onChange={(e) => {
                    const categoryMap = {
                      'interventional': 'Interventional',
                      'observational': 'Observational',
                      'expanded-access': 'Expanded Access'
                    };
                    handleChange('category[0].coding[0].code', e.target.value);
                    handleChange('category[0].coding[0].display', categoryMap[e.target.value]);
                  }}
                  disabled={!isEditing}
                  label="Category"
                >
                  <MenuItem value="interventional">Interventional</MenuItem>
                  <MenuItem value="observational">Observational</MenuItem>
                  <MenuItem value="expanded-access">Expanded Access</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="focusType-label">Focus Type</InputLabel>
                <Select
                  labelId="focusType-label"
                  id="focusType"
                  value={get(researchStudy, 'focus[0].coding[0].system', 'http://snomed.info/sct')}
                  onChange={(e) => handleChange('focus[0].coding[0].system', e.target.value)}
                  disabled={!isEditing}
                  label="Focus Type"
                >
                  <MenuItem value="http://snomed.info/sct">SNOMED CT</MenuItem>
                  <MenuItem value="http://www.nlm.nih.gov/research/umls/rxnorm">RxNorm</MenuItem>
                  <MenuItem value="http://loinc.org">LOINC</MenuItem>
                  <MenuItem value="medication">Medication</MenuItem>
                  <MenuItem value="device">Device</MenuItem>
                  <MenuItem value="procedure">Procedure</MenuItem>
                  <MenuItem value="condition">Condition</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="focusCode"
                label="Focus Code"
                fullWidth
                value={get(researchStudy, 'focus[0].coding[0].code', '')}
                onChange={(e) => handleChange('focus[0].coding[0].code', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="focusDisplay"
                label="Focus Display"
                fullWidth
                value={get(researchStudy, 'focus[0].coding[0].display', '')}
                onChange={(e) => handleChange('focus[0].coding[0].display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="descriptionTextarea"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={get(researchStudy, 'description', '')}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="periodStart"
                label="Period Start"
                type="date"
                fullWidth
                value={get(researchStudy, 'period.start', '')}
                onChange={(e) => handleChange('period.start', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="periodEnd"
                label="Period End"
                type="date"
                fullWidth
                value={get(researchStudy, 'period.end', '')}
                onChange={(e) => handleChange('period.end', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="enrollmentTarget"
                label="Enrollment Target"
                fullWidth
                type="number"
                value={get(researchStudy, 'enrollment[0].display', '').split('/')[1] || ''}
                onChange={(e) => {
                  const actual = get(researchStudy, 'enrollment[0].display', '').split('/')[0] || '0';
                  handleChange('enrollment[0].display', `${actual}/${e.target.value}`);
                }}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="enrollmentActual"
                label="Enrollment Actual"
                fullWidth
                type="number"
                value={get(researchStudy, 'enrollment[0].display', '').split('/')[0] || ''}
                onChange={(e) => {
                  const target = get(researchStudy, 'enrollment[0].display', '').split('/')[1] || '0';
                  handleChange('enrollment[0].display', `${e.target.value}/${target}`);
                }}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={get(researchStudy, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions style={{ justifyContent: 'flex-end', padding: '16px' }}>
          {isEditing ? (
            <>
              <Button onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                id="saveResearchStudyButton"
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                color="error"
                onClick={handleDelete}
                disabled={loading || id === 'new'}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                Edit
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default ResearchStudyDetail;