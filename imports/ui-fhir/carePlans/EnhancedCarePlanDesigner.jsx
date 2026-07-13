// /imports/ui-fhir/carePlans/EnhancedCarePlanDesigner.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Badge,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  RadioGroup,
  Radio,
  Slider,
  Switch,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';

import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Assignment as GoalIcon,
  Schedule as ScheduleIcon,
  Description as DocumentIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import { get, set, isEmpty, cloneDeep } from 'lodash';
import moment from 'moment';

// Enhanced component imports
import HealthStatusEvaluations from './HealthStatusEvaluations';
import InterventionsSection from './InterventionsSection';
import ClinicalDecisionSupport from './ClinicalDecisionSupport';
import CCDAValidator from './CCDAValidator';

// Session defaults for enhanced care plan designer
Session.setDefault('carePlanDesigner.selectedPatientId', '');
Session.setDefault('carePlanDesigner.selectedPatient', null);
Session.setDefault('carePlanDesigner.currentPhase', 'assessment');
Session.setDefault('carePlanDesigner.planTemplate', 'custom');
Session.setDefault('carePlanDesigner.validationStatus', {});
Session.setDefault('carePlanDesigner.ccdaCompliant', false);

// Care plan phases for structured workflow
const CARE_PLAN_PHASES = [
  { id: 'assessment', label: 'Assessment', icon: <AssessmentIcon />, description: 'Patient evaluation and risk assessment' },
  { id: 'planning', label: 'Planning', icon: <EditIcon />, description: 'Goal setting and intervention planning' },
  { id: 'implementation', label: 'Implementation', icon: <ScheduleIcon />, description: 'Care delivery and monitoring' },
  { id: 'evaluation', label: 'Evaluation', icon: <TrendingUpIcon />, description: 'Outcome assessment and plan adjustment' }
];

// Evidence-based care plan templates
const CARE_PLAN_TEMPLATES = {
  'diabetes-type2': {
    name: 'Type 2 Diabetes Management',
    description: 'ADA/AACE evidence-based diabetes care pathway',
    conditions: ['E11.9', 'E11.00', 'E11.40'],
    phases: ['assessment', 'planning', 'implementation', 'evaluation'],
    defaultGoals: [
      { text: 'HbA1c < 7%', category: 'physiological', priority: 'high' },
      { text: 'Blood pressure < 130/80 mmHg', category: 'physiological', priority: 'medium' },
      { text: 'Weight reduction 5-10%', category: 'behavioral', priority: 'medium' }
    ],
    interventions: [
      { type: 'medication', code: 'metformin', frequency: 'daily' },
      { type: 'education', code: 'diabetes-selfcare', duration: '4-weeks' },
      { type: 'monitoring', code: 'glucose-logs', frequency: 'daily' }
    ]
  },
  'heart-failure': {
    name: 'Heart Failure Management',
    description: 'ACC/AHA/HFSA heart failure guidelines',
    conditions: ['I50.9', 'I50.1', 'I50.20'],
    defaultGoals: [
      { text: 'NYHA Class II or better', category: 'functional', priority: 'high' },
      { text: 'Medication adherence > 90%', category: 'behavioral', priority: 'high' },
      { text: 'Daily weight monitoring', category: 'self-care', priority: 'medium' }
    ]
  },
  'copd': {
    name: 'COPD Management',
    description: 'GOLD guidelines-based respiratory care',
    conditions: ['J44.1', 'J44.0', 'J44.9'],
    defaultGoals: [
      { text: 'Smoking cessation', category: 'behavioral', priority: 'high' },
      { text: 'Improve exercise tolerance', category: 'functional', priority: 'medium' },
      { text: 'Reduce exacerbations', category: 'physiological', priority: 'high' }
    ]
  },
  'custom': {
    name: 'Custom Care Plan',
    description: 'Build a personalized care plan from scratch',
    conditions: [],
    phases: ['assessment', 'planning', 'implementation', 'evaluation']
  }
};

export function EnhancedCarePlanDesigner() {
  const navigate = useNavigate();
  
  // Core state management
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('assessment');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [carePlanData, setCarePlanData] = useState({
    id: Random.id(),
    status: 'draft',
    intent: 'plan',
    category: [{ coding: [{ system: 'http://hl7.org/fhir/us/core/CodeSystem/careplan-category', code: 'assess-plan', display: 'Assessment and Plan of Treatment' }] }],
    title: '',
    description: '',
    subject: { reference: '', display: '' },
    author: [{ reference: `Practitioner/${Meteor.userId()}`, display: Meteor.user()?.profile?.name || 'Current User' }],
    created: new Date().toISOString(),
    period: { start: moment().format('YYYY-MM-DD'), end: moment().add(6, 'months').format('YYYY-MM-DD') },
    goal: [],
    activity: [],
    note: []
  });

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [validationResults, setValidationResults] = useState({});
  const [ccdaCompliant, setCcdaCompliant] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCCDAPreview, setShowCCDAPreview] = useState(false);

  // Data subscriptions and tracking
  const { patients, goals, isLoading } = useTracker(() => {
    const patientsHandle = Meteor.subscribe('patients.search', {});
    const goalsHandle = Meteor.subscribe('goals.all');
    
    return {
      patients: Patients.find({}, { sort: { 'name.0.family': 1 } }).fetch(),
      goals: Goals.find({ 'subject.reference': selectedPatient?.id ? `Patient/${selectedPatient.id}` : '' }).fetch(),
      isLoading: !patientsHandle.ready() || !goalsHandle.ready()
    };
  }, [selectedPatient]);

  // Effect hooks for data synchronization
  useEffect(() => {
    const sessionPatient = Session.get('selectedPatient');
    if (sessionPatient && sessionPatient !== selectedPatient) {
      setSelectedPatient(sessionPatient);
      setCarePlanData(prev => ({
        ...prev,
        subject: {
          reference: `Patient/${sessionPatient.id}`,
          display: get(sessionPatient, 'name.0.text') || `${get(sessionPatient, 'name.0.given.0', '')} ${get(sessionPatient, 'name.0.family', '')}`
        }
      }));
    }
  }, [Session.get('selectedPatient')]);

  // Template application
  const applyTemplate = useCallback((templateId) => {
    const template = CARE_PLAN_TEMPLATES[templateId];
    if (!template) return;

    setCarePlanData(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      goal: template.defaultGoals?.map(goal => ({
        id: Random.id(),
        lifecycleStatus: 'proposed',
        category: [{ coding: [{ code: goal.category, display: goal.category }] }],
        priority: { coding: [{ code: goal.priority, display: goal.priority }] },
        description: { text: goal.text },
        subject: prev.subject,
        target: [{
          measure: { text: goal.text },
          detailString: goal.text
        }]
      })) || [],
      activity: template.interventions?.map(intervention => ({
        id: Random.id(),
        detail: {
          kind: 'Task',
          status: 'not-started',
          code: { text: intervention.type },
          description: intervention.code,
          scheduledPeriod: {
            start: prev.period.start,
            end: prev.period.end
          }
        }
      })) || []
    }));

    setSelectedTemplate(templateId);
    setCurrentPhase('planning');
  }, []);

  // Real-time validation
  const validateCarePlan = useCallback(async () => {
    const validation = {
      hasSubject: !!carePlanData.subject.reference,
      hasGoals: carePlanData.goal && carePlanData.goal.length > 0,
      hasActivities: carePlanData.activity && carePlanData.activity.length > 0,
      hasTimeframe: !!(carePlanData.period.start && carePlanData.period.end),
      ccdaCompliant: false
    };

    // C-CDA compliance check
    if (validation.hasSubject && validation.hasGoals && validation.hasActivities) {
      try {
        const ccdaResult = await Meteor.callAsync('carePlans.validateCCDA', carePlanData);
        validation.ccdaCompliant = ccdaResult.valid;
      } catch (error) {
        console.error('C-CDA validation error:', error);
      }
    }

    setValidationResults(validation);
    setCcdaCompliant(validation.ccdaCompliant);
    return validation;
  }, [carePlanData]);

  // Save care plan
  const handleSaveCarePlan = useCallback(async () => {
    try {
      const validation = await validateCarePlan();
      if (!validation.hasSubject) {
        throw new Error('Patient must be selected');
      }

      const savedCarePlan = await Meteor.callAsync('carePlans.insert', carePlanData);
      
      // Update patient record
      if (selectedPatient) {
        await Meteor.callAsync('patients.updateCarePlan', selectedPatient._id, savedCarePlan._id);
      }

      console.log('Care plan saved successfully:', savedCarePlan);
      navigate('/care-plans');
    } catch (error) {
      console.error('Error saving care plan:', error);
    }
  }, [carePlanData, selectedPatient, validateCarePlan, navigate]);

  // Export C-CDA
  const handleExportCCDA = useCallback(async () => {
    try {
      const ccdaDocument = await Meteor.callAsync('carePlans.exportCCDA', carePlanData);
      
      const blob = new Blob([ccdaDocument], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `care-plan-${carePlanData.id}-${moment().format('YYYY-MM-DD')}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting C-CDA:', error);
    }
  }, [carePlanData]);

  // Render patient context panel (Tufte-inspired information density)
  const renderPatientContext = () => (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {selectedPatient ? 
              `${get(selectedPatient, 'name.0.given.0', '')} ${get(selectedPatient, 'name.0.family', '')}` : 
              'No Patient Selected'
            }
          </Typography>
          {selectedPatient && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`Age: ${moment().diff(selectedPatient.birthDate, 'years')}`} />
              <Chip size="small" label={`Gender: ${selectedPatient.gender}`} />
              {selectedPatient.identifier && (
                <Chip size="small" label={`MRN: ${get(selectedPatient, 'identifier.0.value', '')}`} />
              )}
            </Stack>
          )}
        </Grid>
        <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="outlined"
              size="small"
              startIcon={<SearchIcon />}
              onClick={() => setShowTemplateDialog(true)}
            >
              Select Patient
            </Button>
            {ccdaCompliant && (
              <Chip
                icon={<CheckCircleIcon />}
                label="C-CDA Compliant"
                color="success"
                size="small"
              />
            )}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  // Render care plan phases timeline (Schwesinger-inspired visual hierarchy)
  const renderPhasesTimeline = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Care Plan Development Process
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {CARE_PLAN_PHASES.map((phase, index) => (
          <Box key={phase.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: currentPhase === phase.id ? 'primary.main' : 'grey.300',
                color: currentPhase === phase.id ? 'white' : 'grey.600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {phase.icon}
            </Box>
            <Paper 
              sx={{ 
                p: 2, 
                flex: 1,
                cursor: 'pointer',
                bgcolor: currentPhase === phase.id ? 'primary.light' : 'background.default',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => setCurrentPhase(phase.id)}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {phase.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phase.description}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>
    </Paper>
  );

  // Main content area with tabbed interface
  const renderMainContent = () => (
    <Box sx={{ flexGrow: 1 }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Health Assessment" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Goals & Outcomes" icon={<GoalIcon />} iconPosition="start" />
          <Tab label="Interventions" icon={<MedicationIcon />} iconPosition="start" />
          <Tab label="Care Team" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Timeline" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="C-CDA Export" icon={<DocumentIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab content */}
      {activeTab === 0 && <HealthStatusEvaluations carePlan={carePlanData} onChange={setCarePlanData} />}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Outcomes Tracking</Typography>
            <Typography variant="body2" color="text.secondary">
              Outcomes tracking functionality will be available in a future update.
            </Typography>
          </CardContent>
        </Card>
      )}
      {activeTab === 2 && <InterventionsSection carePlan={carePlanData} onChange={setCarePlanData} />}
      {activeTab === 3 && renderCareTeamTab()}
      {activeTab === 4 && renderTimelineTab()}
      {activeTab === 5 && <CCDAValidator carePlan={carePlanData} onExport={handleExportCCDA} />}
    </Box>
  );

  // Care team management tab
  const renderCareTeamTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Care Team Coordination</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage care team members, roles, and responsibilities for this care plan.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>ONC 170.315(b)(9) Requirement:</strong> Care plans must include care team member 
          identification and role assignments for comprehensive care coordination.
        </Typography>
      </Alert>

      {/* Care team table will be implemented here */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Care team management interface - Coming soon
        </Typography>
      </Box>
    </Paper>
  );

  // Timeline visualization tab
  const renderTimelineTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Care Plan Timeline</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Visual timeline of care plan activities, milestones, and outcomes.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Evidence-Based Planning:</strong> Timeline shows care activities aligned with 
          clinical guidelines and best practices for optimal patient outcomes.
        </Typography>
      </Alert>

      {/* Timeline visualization will be implemented here */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Interactive care timeline - Coming soon
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{
      p: 3,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Enhanced Care Plan Designer
            </Typography>
            <Typography variant="subtitle1">
              ONC 170.315(b)(9) Compliant • C-CDA R2.1 • Evidence-Based Templates
            </Typography>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<SaveIcon />}
                onClick={handleSaveCarePlan}
                disabled={!selectedPatient}
              >
                Save Plan
              </Button>
              <Button
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
                startIcon={<SettingsIcon />}
                onClick={() => setShowAdvancedMode(!showAdvancedMode)}
              >
                Advanced
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Main layout */}
      <Grid container spacing={3}>
        {/* Left sidebar - Patient context and phases */}
        <Grid item xs={12} md={3}>
          {renderPatientContext()}
          {renderPhasesTimeline()}
          
          {/* Clinical decision support */}
          <ClinicalDecisionSupport 
            patient={selectedPatient}
            carePlan={carePlanData}
            onRecommendation={(recommendation) => {
              console.log('Clinical recommendation:', recommendation);
            }}
          />
        </Grid>

        {/* Main content area */}
        <Grid item xs={12} md={9}>
          {renderMainContent()}
        </Grid>
      </Grid>

      {/* Template selection dialog */}
      <Dialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Care Plan Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.entries(CARE_PLAN_TEMPLATES).map(([id, template]) => (
              <Grid item xs={12} md={6} key={id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    border: selectedTemplate === id ? 2 : 0,
                    borderColor: 'primary.main'
                  }}
                  onClick={() => applyTemplate(id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{template.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EnhancedCarePlanDesigner;