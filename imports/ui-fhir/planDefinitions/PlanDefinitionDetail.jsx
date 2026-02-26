// /imports/ui-fhir/planDefinitions/PlanDefinitionDetail.jsx

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
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Alert,
  Fab,
  Badge,
  Avatar,
  Autocomplete,
  FormGroup,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import TargetIcon from '@mui/icons-material/GpsFixed';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GroupIcon from '@mui/icons-material/Group';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NoteIcon from '@mui/icons-material/Note';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import QrCodeIcon from '@mui/icons-material/QrCode';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Theme-aware styling
const sectionStyle = (theme) => ({
  mb: 3,
  '& .MuiAccordion-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.grey[900] 
      : theme.palette.grey[50],
    '&:before': {
      display: 'none',
    },
    boxShadow: theme.palette.mode === 'dark'
      ? '0 2px 4px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.1)',
  }
});

const arrayItemStyle = (theme) => ({
  p: 2,
  mb: 1,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  position: 'relative',
  '&:hover': {
    boxShadow: theme.shadows[2],
  }
});

function PlanDefinitionDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  
  // Tab state for organizing sections
  const [activeTab, setActiveTab] = useState(0);

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setActiveTab(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [expandedAccordions, setExpandedAccordions] = useState({});
  
  // Dialog states
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState(null);
  const [tempAction, setTempAction] = useState({});
  
  // Get current user from session
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to PlanDefinitions
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.PlanDefinitions', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('planDefinitions');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with comprehensive FHIR R4 structure
  const [planDefinition, setPlanDefinition] = useState({
    resourceType: "PlanDefinition",
    id: "",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/PlanDefinition"],
      versionId: "1",
      lastUpdated: moment().format()
    },
    url: "",
    identifier: [],
    version: "1.0.0",
    name: "",
    title: "",
    subtitle: "",
    type: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/plan-definition-type",
        code: "clinical-protocol",
        display: "Clinical Protocol"
      }]
    },
    status: "draft",
    experimental: false,
    subjectCodeableConcept: {
      coding: [{
        system: "http://hl7.org/fhir/resource-types",
        code: "Patient",
        display: "Patient"
      }]
    },
    date: moment().format('YYYY-MM-DD'),
    publisher: "",
    contact: [],
    description: "",
    useContext: [],
    jurisdiction: [],
    purpose: "",
    usage: "",
    copyright: "",
    approvalDate: "",
    lastReviewDate: "",
    effectivePeriod: {
      start: "",
      end: ""
    },
    topic: [],
    author: [],
    editor: [],
    reviewer: [],
    endorser: [],
    relatedArtifact: [],
    library: [],
    goal: [],
    action: [],
    note: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Set default values on component mount for new plan definitions
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new plan definitions
      setIsEditing(true);
      // Set current user as author
      if (currentUser) {
        const updatedPlan = { ...planDefinition };
        set(updatedPlan, 'author', [{
          name: get(currentUser, 'profile.name', currentUser.username || 'Unknown'),
          telecom: [{
            system: 'email',
            value: get(currentUser, 'emails[0].address', '')
          }]
        }]);
        set(updatedPlan, 'publisher', get(currentUser, 'profile.organization', 'Honeycomb Health'));
        setPlanDefinition(updatedPlan);
      }
    } else {
      // Viewing existing plan definition - start in read-only mode
      setIsEditing(false);
    }
  }, [id, currentUser]);

  // Load plan definition if editing
  useEffect(function() {
    if (id && id !== 'new') {
      const existingPlanDefinition = PlanDefinitions.findOne({_id: id}) || PlanDefinitions.findOne({id: id});
      if (existingPlanDefinition) {
        setPlanDefinition(existingPlanDefinition);
        setIsEditing(false);
      }
    }
  }, [id]);

  // Handle accordion expansion
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordions({
      ...expandedAccordions,
      [panel]: isExpanded
    });
  };

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    const updatedPlanDefinition = { ...planDefinition };
    set(updatedPlanDefinition, path, value);
    setPlanDefinition(updatedPlanDefinition);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedPlanDefinition);
    }
  }

  // Array field handlers
  function addArrayItem(path, defaultItem = {}) {
    const updatedPlanDefinition = { ...planDefinition };
    const currentArray = get(updatedPlanDefinition, path, []);
    currentArray.push(defaultItem);
    set(updatedPlanDefinition, path, currentArray);
    setPlanDefinition(updatedPlanDefinition);
  }

  function removeArrayItem(path, index) {
    const updatedPlanDefinition = { ...planDefinition };
    const currentArray = get(updatedPlanDefinition, path, []);
    currentArray.splice(index, 1);
    set(updatedPlanDefinition, path, currentArray);
    setPlanDefinition(updatedPlanDefinition);
  }

  function updateArrayItem(path, index, value) {
    const updatedPlanDefinition = { ...planDefinition };
    const currentArray = get(updatedPlanDefinition, path, []);
    currentArray[index] = value;
    set(updatedPlanDefinition, path, currentArray);
    setPlanDefinition(updatedPlanDefinition);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      // Add or update id field
      if (!planDefinition.id) {
        planDefinition.id = planDefinition.name || `plan-${Date.now()}`;
      }
      
      // Update meta
      planDefinition.meta.lastUpdated = moment().format();
      
      if (id && id !== 'new') {
        // Update existing plan definition
        await Meteor.callAsync('updatePlanDefinition', id, planDefinition);
        console.log('Plan definition updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new plan definition
        console.log('Creating plan definition with data:', JSON.stringify(planDefinition, null, 2));
        const newId = await Meteor.callAsync('createPlanDefinition', planDefinition);
        console.log('Plan definition created with ID:', newId);
        // Navigate to the detail page of the new plan definition
        navigate(`/plan-definitions/${newId}`);
      }
    } catch (err) {
      console.error('Error saving plan definition:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this plan definition?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removePlanDefinition', id);
        console.log('Plan definition deleted successfully');
        navigate('/plan-definitions');
      } catch (err) {
        console.error('Error deleting plan definition:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Action dialog handlers
  function openActionEditor(index = null) {
    if (index !== null) {
      setTempAction(cloneDeep(planDefinition.action[index]));
      setEditingActionIndex(index);
    } else {
      setTempAction({
        id: `action-${Date.now()}`,
        prefix: "",
        title: "",
        description: "",
        textEquivalent: "",
        priority: "routine",
        code: [],
        reason: [],
        documentation: [],
        goalId: [],
        subjectCodeableConcept: {
          coding: [{
            system: "http://hl7.org/fhir/resource-types",
            code: "Patient",
            display: "Patient"
          }]
        },
        trigger: [],
        condition: [],
        input: [],
        output: [],
        relatedAction: [],
        timing: {},
        participant: [],
        type: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/action-type",
            code: "",
            display: ""
          }]
        },
        groupingBehavior: "visual-group",
        selectionBehavior: "any",
        requiredBehavior: "must",
        precheckBehavior: "no",
        cardinalityBehavior: "single",
        definition: {},
        transform: "",
        dynamicValue: [],
        action: []
      });
      setEditingActionIndex(null);
    }
    setOpenActionDialog(true);
  }

  function saveAction() {
    const actions = [...(planDefinition.action || [])];
    if (editingActionIndex !== null) {
      actions[editingActionIndex] = tempAction;
    } else {
      actions.push(tempAction);
    }
    handleChange('action', actions);
    setOpenActionDialog(false);
    setTempAction({});
    setEditingActionIndex(null);
  }

  // Render complex array fields
  function renderIdentifiers() {
    const identifiers = get(planDefinition, 'identifier', []);
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">Identifiers</Typography>
          <IconButton 
            size="small" 
            onClick={() => addArrayItem('identifier', { system: '', value: '', use: 'official' })}
            disabled={!isEditing}
          >
            <AddIcon />
          </IconButton>
        </Box>
        {identifiers.map((identifier, index) => (
          <Paper key={index} sx={arrayItemStyle} elevation={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="System"
                  value={identifier.system || ''}
                  onChange={(e) => updateArrayItem('identifier', index, {...identifier, system: e.target.value})}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Value"
                  value={identifier.value || ''}
                  onChange={(e) => updateArrayItem('identifier', index, {...identifier, value: e.target.value})}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Use</InputLabel>
                  <Select
                    value={identifier.use || 'official'}
                    onChange={(e) => updateArrayItem('identifier', index, {...identifier, use: e.target.value})}
                    disabled={!isEditing}
                  >
                    <MenuItem value="usual">Usual</MenuItem>
                    <MenuItem value="official">Official</MenuItem>
                    <MenuItem value="temp">Temporary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton 
                  size="small" 
                  onClick={() => removeArrayItem('identifier', index)}
                  disabled={!isEditing}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>
    );
  }

  function renderGoals() {
    const goals = get(planDefinition, 'goal', []);
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TargetIcon color="primary" />
            Clinical Goals
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => addArrayItem('goal', {
              id: `goal-${Date.now()}`,
              category: { coding: [{ system: '', code: '', display: '' }] },
              description: { text: '' },
              priority: { coding: [{ system: '', code: 'medium-priority', display: 'Medium Priority' }] },
              start: { text: '' },
              addresses: [],
              documentation: [],
              target: []
            })}
            disabled={!isEditing}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Box>
        {goals.map((goal, index) => (
          <Accordion 
            key={index}
            expanded={expandedAccordions[`goal-${index}`] || false}
            onChange={handleAccordionChange(`goal-${index}`)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Chip 
                  label={`Goal ${index + 1}`}
                  color="primary" 
                  size="small"
                />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {get(goal, 'description.text', 'No description')}
                </Typography>
                {get(goal, 'priority.coding[0].code') && (
                  <Chip 
                    label={get(goal, 'priority.coding[0].display', get(goal, 'priority.coding[0].code'))}
                    size="small"
                    color={
                      get(goal, 'priority.coding[0].code') === 'high-priority' ? 'error' :
                      get(goal, 'priority.coding[0].code') === 'medium-priority' ? 'warning' : 'default'
                    }
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Goal ID"
                  value={goal.id || ''}
                  onChange={(e) => {
                    const updated = {...goal, id: e.target.value};
                    updateArrayItem('goal', index, updated);
                  }}
                  disabled={!isEditing}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={get(goal, 'description.text', '')}
                  onChange={(e) => {
                    const updated = {...goal};
                    set(updated, 'description.text', e.target.value);
                    updateArrayItem('goal', index, updated);
                  }}
                  disabled={!isEditing}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={get(goal, 'category.coding[0].code', '')}
                        onChange={(e) => {
                          const updated = {...goal};
                          set(updated, 'category.coding[0].code', e.target.value);
                          const categoryMap = {
                            'dietary': 'Dietary',
                            'safety': 'Safety',
                            'behavioral': 'Behavioral',
                            'nursing': 'Nursing',
                            'physiotherapy': 'Physiotherapy'
                          };
                          set(updated, 'category.coding[0].display', categoryMap[e.target.value] || e.target.value);
                          updateArrayItem('goal', index, updated);
                        }}
                        disabled={!isEditing}
                      >
                        <MenuItem value="dietary">Dietary</MenuItem>
                        <MenuItem value="safety">Safety</MenuItem>
                        <MenuItem value="behavioral">Behavioral</MenuItem>
                        <MenuItem value="nursing">Nursing</MenuItem>
                        <MenuItem value="physiotherapy">Physiotherapy</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={get(goal, 'priority.coding[0].code', 'medium-priority')}
                        onChange={(e) => {
                          const updated = {...goal};
                          set(updated, 'priority.coding[0].code', e.target.value);
                          const priorityMap = {
                            'high-priority': 'High Priority',
                            'medium-priority': 'Medium Priority',
                            'low-priority': 'Low Priority'
                          };
                          set(updated, 'priority.coding[0].display', priorityMap[e.target.value] || e.target.value);
                          updateArrayItem('goal', index, updated);
                        }}
                        disabled={!isEditing}
                      >
                        <MenuItem value="high-priority">High Priority</MenuItem>
                        <MenuItem value="medium-priority">Medium Priority</MenuItem>
                        <MenuItem value="low-priority">Low Priority</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  label="Start Condition"
                  value={get(goal, 'start.text', '')}
                  onChange={(e) => {
                    const updated = {...goal};
                    set(updated, 'start.text', e.target.value);
                    updateArrayItem('goal', index, updated);
                  }}
                  disabled={!isEditing}
                  placeholder="e.g., Within 24 hours of admission"
                />
                {isEditing && (
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={() => removeArrayItem('goal', index)}
                      color="error"
                      size="small"
                    >
                      Remove Goal
                    </Button>
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }

  function renderActions() {
    const actions = get(planDefinition, 'action', []);
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayCircleOutlineIcon color="primary" />
            Protocol Actions
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => openActionEditor()}
            disabled={!isEditing}
            variant="contained"
            size="small"
          >
            Add Action
          </Button>
        </Box>
        
        {actions.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
            <Typography color="text.secondary">
              No actions defined. Click "Add Action" to create protocol steps.
            </Typography>
          </Paper>
        ) : (
          <Timeline position="alternate">
            {actions.map((action, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent color="text.secondary">
                  {action.timing?.dateTime || `Step ${index + 1}`}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={
                    action.priority === 'stat' ? 'error' :
                    action.priority === 'asap' ? 'warning' :
                    action.priority === 'urgent' ? 'info' : 'primary'
                  }>
                    {index + 1}
                  </TimelineDot>
                  {index < actions.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" component="h3">
                          {action.title || `Action ${index + 1}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {action.description || 'No description provided'}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {action.priority && (
                            <Chip label={action.priority} size="small" />
                          )}
                          {action.type?.coding?.[0]?.display && (
                            <Chip label={action.type.coding[0].display} size="small" variant="outlined" />
                          )}
                          {action.goalId?.length > 0 && (
                            <Chip 
                              icon={<TargetIcon />} 
                              label={`Links to ${action.goalId.length} goal(s)`} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          )}
                        </Stack>
                      </Box>
                      {isEditing && (
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => openActionEditor(index)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => removeArrayItem('action', index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </Box>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Box>
    );
  }

  // Import missing Timeline components
  const Timeline = ({ children, position }) => (
    <Box sx={{ position: 'relative', pl: 2 }}>{children}</Box>
  );
  const TimelineItem = ({ children }) => (
    <Box sx={{ display: 'flex', mb: 3 }}>{children}</Box>
  );
  const TimelineOppositeContent = ({ children, ...props }) => (
    <Box sx={{ flex: 1, pr: 2, textAlign: 'right' }} {...props}>{children}</Box>
  );
  const TimelineSeparator = ({ children }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 2 }}>{children}</Box>
  );
  const TimelineDot = ({ children, color = 'primary' }) => (
    <Avatar sx={{ 
      width: 32, 
      height: 32, 
      bgcolor: color === 'error' ? 'error.main' :
              color === 'warning' ? 'warning.main' :
              color === 'info' ? 'info.main' : 'primary.main',
      fontSize: '0.875rem'
    }}>
      {children}
    </Avatar>
  );
  const TimelineConnector = () => (
    <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 1 }} />
  );
  const TimelineContent = ({ children }) => (
    <Box sx={{ flex: 2 }}>{children}</Box>
  );

  if (isEmbedded) {
    return (
      <>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab icon={<InfoIcon />} label="Basic Info" />
          <Tab icon={<TargetIcon />} label="Goals & Actions" />
          <Tab icon={<GroupIcon />} label="Contributors" />
          <Tab icon={<LibraryBooksIcon />} label="Resources" />
          <Tab icon={<SecurityIcon />} label="Governance" />
        </Tabs>

        {/* Tab 0: Basic Information */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            <Accordion
              expanded={expandedAccordions['identifiers'] !== false}
              onChange={handleAccordionChange('identifiers')}
              sx={sectionStyle}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Identifiers & Metadata</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  {renderIdentifiers()}
                  <Divider />
                  <TextField
                    id="urlInput"
                    fullWidth
                    label="Canonical URL"
                    value={get(planDefinition, 'url', '')}
                    onChange={(e) => handleChange('url', e.target.value)}
                    disabled={!isEditing}
                    helperText="Canonical identifier for this plan definition"
                  />
                  <Box display="flex" gap={2}>
                    <TextField
                      id="versionInput"
                      sx={{ flex: 1 }}
                      label="Version"
                      value={get(planDefinition, 'version', '')}
                      onChange={(e) => handleChange('version', e.target.value)}
                      disabled={!isEditing}
                      helperText="Business version"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={get(planDefinition, 'experimental', false)}
                          onChange={(e) => handleChange('experimental', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Experimental"
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion
              defaultExpanded
              expanded={expandedAccordions['basic'] !== false}
              onChange={handleAccordionChange('basic')}
              sx={sectionStyle}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Basic Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    id="nameInput"
                    fullWidth
                    label="Name (Computer Friendly)"
                    value={get(planDefinition, 'name', '')}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isEditing}
                    required
                    helperText="Computer-friendly name (no spaces)"
                  />
                  <TextField
                    id="titleInput"
                    fullWidth
                    label="Title (Human Friendly)"
                    value={get(planDefinition, 'title', '')}
                    onChange={(e) => handleChange('title', e.target.value)}
                    disabled={!isEditing}
                    required
                    helperText="Human-readable title"
                  />
                  <TextField
                    fullWidth
                    label="Subtitle"
                    value={get(planDefinition, 'subtitle', '')}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    disabled={!isEditing}
                    helperText="Subordinate title"
                  />
                  <Box display="flex" gap={2}>
                    <FormControl sx={{ flex: 1 }} required>
                      <InputLabel>Type</InputLabel>
                      <Select
                        id="typeSelect"
                        value={get(planDefinition, 'type.coding[0].code', 'clinical-protocol')}
                        onChange={(e) => {
                          const typeMap = {
                            'eca-rule': 'ECA Rule',
                            'clinical-protocol': 'Clinical Protocol',
                            'order-set': 'Order Set',
                            'workflow-definition': 'Workflow Definition'
                          };
                          handleChange('type.coding[0].code', e.target.value);
                          handleChange('type.coding[0].display', typeMap[e.target.value]);
                        }}
                        disabled={!isEditing}
                      >
                        <MenuItem value="clinical-protocol">Clinical Protocol</MenuItem>
                        <MenuItem value="eca-rule">ECA Rule</MenuItem>
                        <MenuItem value="order-set">Order Set</MenuItem>
                        <MenuItem value="workflow-definition">Workflow Definition</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl sx={{ flex: 1 }} required>
                      <InputLabel>Status</InputLabel>
                      <Select
                        id="statusSelect"
                        value={get(planDefinition, 'status', 'draft')}
                        onChange={(e) => handleChange('status', e.target.value)}
                        disabled={!isEditing}
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="retired">Retired</MenuItem>
                        <MenuItem value="unknown">Unknown</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <TextField
                    id="descriptionTextarea"
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={get(planDefinition, 'description', '')}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={!isEditing}
                    helperText="Natural language description"
                  />
                  <TextField
                    id="purposeTextarea"
                    fullWidth
                    multiline
                    rows={3}
                    label="Purpose"
                    value={get(planDefinition, 'purpose', '')}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    disabled={!isEditing}
                    helperText="Why this plan definition is defined"
                  />
                  <TextField
                    id="usageTextarea"
                    fullWidth
                    multiline
                    rows={3}
                    label="Usage"
                    value={get(planDefinition, 'usage', '')}
                    onChange={(e) => handleChange('usage', e.target.value)}
                    disabled={!isEditing}
                    helperText="Describes clinical usage"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={expandedAccordions['dates'] !== false}
              onChange={handleAccordionChange('dates')}
              sx={sectionStyle}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Important Dates</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      id="dateInput"
                      fullWidth
                      label="Publication Date"
                      type="date"
                      value={get(planDefinition, 'date', '')}
                      onChange={(e) => handleChange('date', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      id="approvalDateInput"
                      fullWidth
                      label="Approval Date"
                      type="date"
                      value={get(planDefinition, 'approvalDate', '')}
                      onChange={(e) => handleChange('approvalDate', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      id="lastReviewDateInput"
                      fullWidth
                      label="Last Review Date"
                      type="date"
                      value={get(planDefinition, 'lastReviewDate', '')}
                      onChange={(e) => handleChange('lastReviewDate', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Next Review Date"
                      type="date"
                      value={get(planDefinition, 'nextReviewDate', '')}
                      onChange={(e) => handleChange('nextReviewDate', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                      helperText="When next review is expected"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Effective Period</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      id="effectivePeriodStartInput"
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={get(planDefinition, 'effectivePeriod.start', '')}
                      onChange={(e) => handleChange('effectivePeriod.start', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      id="effectivePeriodEndInput"
                      fullWidth
                      label="End Date"
                      type="date"
                      value={get(planDefinition, 'effectivePeriod.end', '')}
                      onChange={(e) => handleChange('effectivePeriod.end', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}

        {/* Tab 1: Goals & Actions */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            {renderGoals()}
            <Divider />
            {renderActions()}
          </Stack>
        )}

        {/* Tab 2: Contributors */}
        {activeTab === 2 && (
          <Stack spacing={3}>
            <TextField
              id="publisherInput"
              fullWidth
              label="Publisher"
              value={get(planDefinition, 'publisher', '')}
              onChange={(e) => handleChange('publisher', e.target.value)}
              disabled={!isEditing}
            />

            {/* Authors */}
            <Box>
              <Typography variant="h6" gutterBottom>Authors</Typography>
              {get(planDefinition, 'author', []).map((author, index) => (
                <Paper key={index} sx={arrayItemStyle}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={author.name || ''}
                        onChange={(e) => {
                          const authors = [...get(planDefinition, 'author', [])];
                          authors[index] = {...author, name: e.target.value};
                          handleChange('author', authors);
                        }}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={get(author, 'telecom[0].value', '')}
                        onChange={(e) => {
                          const authors = [...get(planDefinition, 'author', [])];
                          set(authors[index], 'telecom[0]', {system: 'email', value: e.target.value});
                          handleChange('author', authors);
                        }}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      {isEditing && (
                        <IconButton onClick={() => removeArrayItem('author', index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {isEditing && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addArrayItem('author', {name: '', telecom: [{system: 'email', value: ''}]})}
                >
                  Add Author
                </Button>
              )}
            </Box>

            {showAdvanced && (
              <>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Additional contributor types (Editor, Reviewer, Endorser) available in advanced mode
                </Typography>
              </>
            )}
          </Stack>
        )}

        {/* Tab 3: Resources */}
        {activeTab === 3 && (
          <Stack spacing={3}>
            <Typography variant="h6">Related Artifacts</Typography>
            <Typography variant="h6">Libraries</Typography>
            <Typography variant="h6">Topics</Typography>
          </Stack>
        )}

        {/* Tab 4: Governance */}
        {activeTab === 4 && (
          <Stack spacing={3}>
            <TextField
              id="copyrightTextarea"
              fullWidth
              multiline
              rows={3}
              label="Copyright"
              value={get(planDefinition, 'copyright', '')}
              onChange={(e) => handleChange('copyright', e.target.value)}
              disabled={!isEditing}
            />
            <Typography variant="h6">Use Context</Typography>
            <Typography variant="h6">Jurisdiction</Typography>
          </Stack>
        )}
      </>
    );
  }

  return (
    <Container id="planDefinitionDetailPage" maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={2}>
              <LocalHospitalIcon />
              <Typography variant="h5">
                {id && id !== 'new' ? 'Plan Definition Builder' : 'New Plan Definition'}
              </Typography>
            </Box>
          }
          action={
            <Box display="flex" gap={1} alignItems="center">
              {(id && id !== 'new') && (
                <Box sx={{ textAlign: 'right' }}>
                  <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>
                </Box>
              )}
            </Box>
          }
          sx={{
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'primary.dark'
              : 'primary.main',
            color: 'primary.contrastText'
          }}
        />

        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab icon={<InfoIcon />} label="Basic Info" />
            <Tab icon={<TargetIcon />} label="Goals & Actions" />
            <Tab icon={<GroupIcon />} label="Contributors" />
            <Tab icon={<LibraryBooksIcon />} label="Resources" />
            <Tab icon={<SecurityIcon />} label="Governance" />
          </Tabs>

          {/* Tab 0: Basic Information */}
          {activeTab === 0 && (
            <Stack spacing={3}>
              {/* Identifiers Section */}
              <Accordion 
                expanded={expandedAccordions['identifiers'] !== false}
                onChange={handleAccordionChange('identifiers')}
                sx={sectionStyle}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Identifiers & Metadata</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={3}>
                    {renderIdentifiers()}
                    <Divider />
                    <TextField
                      id="urlInput"
                      fullWidth
                      label="Canonical URL"
                      value={get(planDefinition, 'url', '')}
                      onChange={(e) => handleChange('url', e.target.value)}
                      disabled={!isEditing}
                      helperText="Canonical identifier for this plan definition"
                    />
                    <Box display="flex" gap={2}>
                      <TextField
                        id="versionInput"
                        sx={{ flex: 1 }}
                        label="Version"
                        value={get(planDefinition, 'version', '')}
                        onChange={(e) => handleChange('version', e.target.value)}
                        disabled={!isEditing}
                        helperText="Business version"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={get(planDefinition, 'experimental', false)}
                            onChange={(e) => handleChange('experimental', e.target.checked)}
                            disabled={!isEditing}
                          />
                        }
                        label="Experimental"
                      />
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Basic Details */}
              <Accordion 
                defaultExpanded
                expanded={expandedAccordions['basic'] !== false}
                onChange={handleAccordionChange('basic')}
                sx={sectionStyle}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <TextField
                      id="nameInput"
                      fullWidth
                      label="Name (Computer Friendly)"
                      value={get(planDefinition, 'name', '')}
                      onChange={(e) => handleChange('name', e.target.value)}
                      disabled={!isEditing}
                      required
                      helperText="Computer-friendly name (no spaces)"
                    />
                    <TextField
                      id="titleInput"
                      fullWidth
                      label="Title (Human Friendly)"
                      value={get(planDefinition, 'title', '')}
                      onChange={(e) => handleChange('title', e.target.value)}
                      disabled={!isEditing}
                      required
                      helperText="Human-readable title"
                    />
                    <TextField
                      fullWidth
                      label="Subtitle"
                      value={get(planDefinition, 'subtitle', '')}
                      onChange={(e) => handleChange('subtitle', e.target.value)}
                      disabled={!isEditing}
                      helperText="Subordinate title"
                    />
                    <Box display="flex" gap={2}>
                      <FormControl sx={{ flex: 1 }} required>
                        <InputLabel>Type</InputLabel>
                        <Select
                          id="typeSelect"
                          value={get(planDefinition, 'type.coding[0].code', 'clinical-protocol')}
                          onChange={(e) => {
                            const typeMap = {
                              'eca-rule': 'ECA Rule',
                              'clinical-protocol': 'Clinical Protocol',
                              'order-set': 'Order Set',
                              'workflow-definition': 'Workflow Definition'
                            };
                            handleChange('type.coding[0].code', e.target.value);
                            handleChange('type.coding[0].display', typeMap[e.target.value]);
                          }}
                          disabled={!isEditing}
                        >
                          <MenuItem value="clinical-protocol">Clinical Protocol</MenuItem>
                          <MenuItem value="eca-rule">ECA Rule</MenuItem>
                          <MenuItem value="order-set">Order Set</MenuItem>
                          <MenuItem value="workflow-definition">Workflow Definition</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl sx={{ flex: 1 }} required>
                        <InputLabel>Status</InputLabel>
                        <Select
                          id="statusSelect"
                          value={get(planDefinition, 'status', 'draft')}
                          onChange={(e) => handleChange('status', e.target.value)}
                          disabled={!isEditing}
                        >
                          <MenuItem value="draft">Draft</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="retired">Retired</MenuItem>
                          <MenuItem value="unknown">Unknown</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <TextField
                      id="descriptionTextarea"
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      value={get(planDefinition, 'description', '')}
                      onChange={(e) => handleChange('description', e.target.value)}
                      disabled={!isEditing}
                      helperText="Natural language description"
                    />
                    <TextField
                      id="purposeTextarea"
                      fullWidth
                      multiline
                      rows={3}
                      label="Purpose"
                      value={get(planDefinition, 'purpose', '')}
                      onChange={(e) => handleChange('purpose', e.target.value)}
                      disabled={!isEditing}
                      helperText="Why this plan definition is defined"
                    />
                    <TextField
                      id="usageTextarea"
                      fullWidth
                      multiline
                      rows={3}
                      label="Usage"
                      value={get(planDefinition, 'usage', '')}
                      onChange={(e) => handleChange('usage', e.target.value)}
                      disabled={!isEditing}
                      helperText="Describes clinical usage"
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Dates */}
              <Accordion 
                expanded={expandedAccordions['dates'] !== false}
                onChange={handleAccordionChange('dates')}
                sx={sectionStyle}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Important Dates</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        id="dateInput"
                        fullWidth
                        label="Publication Date"
                        type="date"
                        value={get(planDefinition, 'date', '')}
                        onChange={(e) => handleChange('date', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        id="approvalDateInput"
                        fullWidth
                        label="Approval Date"
                        type="date"
                        value={get(planDefinition, 'approvalDate', '')}
                        onChange={(e) => handleChange('approvalDate', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        id="lastReviewDateInput"
                        fullWidth
                        label="Last Review Date"
                        type="date"
                        value={get(planDefinition, 'lastReviewDate', '')}
                        onChange={(e) => handleChange('lastReviewDate', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Next Review Date"
                        type="date"
                        value={get(planDefinition, 'nextReviewDate', '')}
                        onChange={(e) => handleChange('nextReviewDate', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                        helperText="When next review is expected"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Effective Period</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        id="effectivePeriodStartInput"
                        fullWidth
                        label="Start Date"
                        type="date"
                        value={get(planDefinition, 'effectivePeriod.start', '')}
                        onChange={(e) => handleChange('effectivePeriod.start', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        id="effectivePeriodEndInput"
                        fullWidth
                        label="End Date"
                        type="date"
                        value={get(planDefinition, 'effectivePeriod.end', '')}
                        onChange={(e) => handleChange('effectivePeriod.end', e.target.value)}
                        disabled={!isEditing}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Stack>
          )}

          {/* Tab 1: Goals & Actions */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              {renderGoals()}
              <Divider />
              {renderActions()}
            </Stack>
          )}

          {/* Tab 2: Contributors */}
          {activeTab === 2 && (
            <Stack spacing={3}>
              <TextField
                id="publisherInput"
                fullWidth
                label="Publisher"
                value={get(planDefinition, 'publisher', '')}
                onChange={(e) => handleChange('publisher', e.target.value)}
                disabled={!isEditing}
              />
              
              {/* Authors */}
              <Box>
                <Typography variant="h6" gutterBottom>Authors</Typography>
                {get(planDefinition, 'author', []).map((author, index) => (
                  <Paper key={index} sx={arrayItemStyle}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={author.name || ''}
                          onChange={(e) => {
                            const authors = [...get(planDefinition, 'author', [])];
                            authors[index] = {...author, name: e.target.value};
                            handleChange('author', authors);
                          }}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={get(author, 'telecom[0].value', '')}
                          onChange={(e) => {
                            const authors = [...get(planDefinition, 'author', [])];
                            set(authors[index], 'telecom[0]', {system: 'email', value: e.target.value});
                            handleChange('author', authors);
                          }}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        {isEditing && (
                          <IconButton onClick={() => removeArrayItem('author', index)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                {isEditing && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addArrayItem('author', {name: '', telecom: [{system: 'email', value: ''}]})}
                  >
                    Add Author
                  </Button>
                )}
              </Box>

              {/* Similar sections for Editor, Reviewer, Endorser */}
              {showAdvanced && (
                <>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    Additional contributor types (Editor, Reviewer, Endorser) available in advanced mode
                  </Typography>
                </>
              )}
            </Stack>
          )}

          {/* Tab 3: Resources */}
          {activeTab === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6">Related Artifacts</Typography>
              <Typography variant="h6">Libraries</Typography>
              <Typography variant="h6">Topics</Typography>
              {/* Implementation for resources tab */}
            </Stack>
          )}

          {/* Tab 4: Governance */}
          {activeTab === 4 && (
            <Stack spacing={3}>
              <TextField
                id="copyrightTextarea"
                fullWidth
                multiline
                rows={3}
                label="Copyright"
                value={get(planDefinition, 'copyright', '')}
                onChange={(e) => handleChange('copyright', e.target.value)}
                disabled={!isEditing}
              />
              <Typography variant="h6">Use Context</Typography>
              <Typography variant="h6">Jurisdiction</Typography>
              {/* Implementation for governance tab */}
            </Stack>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2, bgcolor: 'background.default' }}>
          <Box>
            {!isEditing && id && id !== 'new' && (
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                color="error"
                variant="outlined"
              >
                Delete
              </Button>
            )}
          </Box>
          <Box display="flex" gap={1}>
            {!isEditing ? (
              <>
                <Button 
                  onClick={() => navigate('/plan-definitions')}
                  variant="outlined"
                >
                  Back to List
                </Button>
                <Button 
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  variant="contained"
                  color="primary"
                >
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button 
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    if (id && id !== 'new') {
                      setIsEditing(false);
                      const existingPlanDefinition = PlanDefinitions.findOne({_id: id});
                      if (existingPlanDefinition) {
                        setPlanDefinition(existingPlanDefinition);
                      }
                    } else {
                      navigate('/plan-definitions');
                    }
                  }}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button 
                  id="savePlanDefinitionButton"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (id && id !== 'new' ? 'Update' : 'Create')}
                </Button>
              </>
            )}
          </Box>
        </CardActions>
      </Card>

      {/* Action Editor Dialog */}
      <Dialog
        open={openActionDialog}
        onClose={() => setOpenActionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingActionIndex !== null ? 'Edit Action' : 'Add New Action'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Action Title"
              value={tempAction.title || ''}
              onChange={(e) => setTempAction({...tempAction, title: e.target.value})}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={tempAction.description || ''}
              onChange={(e) => setTempAction({...tempAction, description: e.target.value})}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={tempAction.priority || 'routine'}
                onChange={(e) => setTempAction({...tempAction, priority: e.target.value})}
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="asap">ASAP</MenuItem>
                <MenuItem value="stat">STAT</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Prefix"
              value={tempAction.prefix || ''}
              onChange={(e) => setTempAction({...tempAction, prefix: e.target.value})}
              helperText="e.g., Step 1, 1.1"
            />
            <TextField
              fullWidth
              label="Text Equivalent"
              value={tempAction.textEquivalent || ''}
              onChange={(e) => setTempAction({...tempAction, textEquivalent: e.target.value})}
              helperText="Text summary of action"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)}>Cancel</Button>
          <Button onClick={saveAction} variant="contained">
            {editingActionIndex !== null ? 'Update' : 'Add'} Action
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PlanDefinitionDetail;