// imports/ui-fhir/carePlans/InterventionsSection.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Chip, 
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  LinearProgress,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  Stack,
  Badge
} from '@mui/material';
import {
  Medication as MedicationIcon,
  LocalHospital as ProcedureIcon,
  Psychology as TherapyIcon,
  School as EducationIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  AccountBalance as EvidenceIcon,
  Star as RecommendedIcon
} from '@mui/icons-material';
import { get, set } from 'lodash';
import moment from 'moment';

// ONC 170.315(b)(9) compliant Interventions Section V2
export default function InterventionsSection({ 
  patientId, 
  carePlanId, 
  carePlanData,
  onInterventionChange,
  readOnly = false 
}) {
  const [interventions, setInterventions] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [evidenceBase, setEvidenceBase] = useState([]);
  const [clinicalGuidelines, setClinicalGuidelines] = useState([]);

  // Intervention categories per ONC requirements
  const interventionCategories = {
    medication: {
      label: 'Medications',
      icon: <MedicationIcon />,
      color: 'primary',
      description: 'Pharmacological interventions including prescriptions, over-the-counter medications, and supplements'
    },
    procedure: {
      label: 'Procedures',
      icon: <ProcedureIcon />,
      color: 'secondary', 
      description: 'Medical procedures, surgeries, diagnostic tests, and therapeutic interventions'
    },
    therapy: {
      label: 'Therapies',
      icon: <TherapyIcon />,
      color: 'success',
      description: 'Physical therapy, occupational therapy, speech therapy, and behavioral interventions'
    },
    education: {
      label: 'Patient Education',
      icon: <EducationIcon />,
      color: 'info',
      description: 'Educational interventions, counseling, and self-management support'
    },
    lifestyle: {
      label: 'Lifestyle Modifications',
      icon: <AssessmentIcon />,
      color: 'warning',
      description: 'Diet modifications, exercise programs, smoking cessation, and behavioral changes'
    }
  };

  // Load interventions and evidence base
  useEffect(() => {
    async function loadInterventions() {
      if (!patientId || !carePlanId) return;
      
      setLoading(true);
      try {
        // Load existing interventions from care plan
        const planInterventions = await Meteor.callAsync('getCarePlanInterventions', carePlanId);
        
        // Load evidence-based recommendations
        const recommendations = await Meteor.callAsync('getEvidenceBasedInterventions', {
          patientId,
          conditions: get(carePlanData, 'addresses', []),
          goals: get(carePlanData, 'goal', [])
        });
        
        // Load clinical guidelines
        const guidelines = await Meteor.callAsync('getClinicalGuidelines', {
          conditions: get(carePlanData, 'addresses', [])
        });
        
        setInterventions(planInterventions || []);
        setEvidenceBase(recommendations || []);
        setClinicalGuidelines(guidelines || []);
      } catch (error) {
        console.error('Error loading interventions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInterventions();
  }, [patientId, carePlanId, carePlanData]);

  // Process interventions by category
  const interventionsByCategory = interventions.reduce((groups, intervention) => {
    const category = intervention.category || 'procedure';
    if (!groups[category]) groups[category] = [];
    groups[category].push(intervention);
    return groups;
  }, {});

  // Calculate intervention statistics
  const interventionStats = {
    total: interventions.length,
    active: interventions.filter(i => i.status === 'active').length,
    completed: interventions.filter(i => i.status === 'completed').length,
    cancelled: interventions.filter(i => i.status === 'cancelled').length,
    evidenceBased: interventions.filter(i => i.evidenceGrade).length
  };

  // Handle adding new intervention
  async function handleAddIntervention(category = 'procedure') {
    if (readOnly) return;
    
    const newIntervention = {
      id: `intervention-${Date.now()}`,
      category: category,
      description: '',
      status: 'draft',
      intent: 'plan',
      priority: 'routine',
      scheduledTiming: {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'day'
        }
      },
      performer: [],
      reasonCode: [],
      evidenceGrade: null,
      outcomeGoals: [],
      created: new Date().toISOString()
    };
    
    setEditingIntervention(newIntervention);
  }

  // Save intervention
  async function handleSaveIntervention(intervention) {
    try {
      if (intervention.id.startsWith('intervention-')) {
        // New intervention
        const newId = await Meteor.callAsync('addCarePlanIntervention', {
          carePlanId,
          intervention
        });
        intervention.id = newId;
      } else {
        // Update existing
        await Meteor.callAsync('updateCarePlanIntervention', intervention.id, intervention);
      }
      
      // Update local state
      setInterventions(prev => {
        const existing = prev.find(i => i.id === intervention.id);
        if (existing) {
          return prev.map(i => i.id === intervention.id ? intervention : i);
        } else {
          return [...prev, intervention];
        }
      });
      
      setEditingIntervention(null);
      onInterventionChange?.(intervention);
    } catch (error) {
      console.error('Error saving intervention:', error);
    }
  }

  // Delete intervention
  async function handleDeleteIntervention(interventionId) {
    if (readOnly) return;
    
    try {
      await Meteor.callAsync('removeCarePlanIntervention', interventionId);
      setInterventions(prev => prev.filter(i => i.id !== interventionId));
      onInterventionChange?.({ deleted: interventionId });
    } catch (error) {
      console.error('Error deleting intervention:', error);
    }
  }

  // Add evidence-based intervention
  async function handleAddEvidenceIntervention(recommendation) {
    if (readOnly) return;
    
    const evidenceIntervention = {
      id: `intervention-${Date.now()}`,
      category: recommendation.category,
      description: recommendation.description,
      status: 'draft',
      intent: 'plan',
      priority: recommendation.priority || 'routine',
      evidenceGrade: recommendation.evidenceGrade,
      evidenceSource: recommendation.source,
      reasonCode: recommendation.reasonCode,
      outcomeGoals: recommendation.expectedOutcomes,
      scheduledTiming: recommendation.recommendedTiming,
      created: new Date().toISOString()
    };
    
    setEditingIntervention(evidenceIntervention);
  }

  // Get status icon
  function getStatusIcon(status) {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'active':
      case 'in-progress':
        return <ScheduleIcon color="primary" fontSize="small" />;
      case 'cancelled':
      case 'stopped':
        return <WarningIcon color="error" fontSize="small" />;
      default:
        return <PendingIcon color="action" fontSize="small" />;
    }
  }

  // Get evidence grade color
  function getEvidenceGradeColor(grade) {
    switch (grade) {
      case 'A':
        return 'success';
      case 'B':
        return 'info';
      case 'C':
        return 'warning';
      case 'D':
        return 'error';
      default:
        return 'default';
    }
  }

  // Format timing display
  function formatTiming(timing) {
    if (!timing || !timing.repeat) return 'As needed';
    
    const { frequency, period, periodUnit } = timing.repeat;
    return `${frequency} time${frequency > 1 ? 's' : ''} per ${period} ${periodUnit}${period > 1 ? 's' : ''}`;
  }

  // Render intervention card
  function renderInterventionCard(intervention) {
    const category = interventionCategories[intervention.category] || interventionCategories.procedure;
    
    return (
      <Card key={intervention.id} sx={{ mb: 2, border: `1px solid ${category.color}.main` }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {category.icon}
              <Typography variant="h6" component="div">
                {intervention.description}
              </Typography>
              {intervention.evidenceGrade && (
                <Chip
                  label={`Grade ${intervention.evidenceGrade}`}
                  size="small"
                  color={getEvidenceGradeColor(intervention.evidenceGrade)}
                  icon={<EvidenceIcon />}
                />
              )}
            </Box>
            <Box display="flex" gap={1}>
              {getStatusIcon(intervention.status)}
              <Chip
                label={intervention.status}
                size="small"
                color={intervention.status === 'active' ? 'primary' : 'default'}
                variant="outlined"
              />
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Schedule:</strong> {formatTiming(intervention.scheduledTiming)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Priority:</strong> {intervention.priority}
              </Typography>
              {intervention.performer && intervention.performer.length > 0 && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Performer:</strong> {intervention.performer.map(p => p.display).join(', ')}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {intervention.outcomeGoals && intervention.outcomeGoals.length > 0 && (
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">
                    Expected Outcomes:
                  </Typography>
                  <List dense>
                    {intervention.outcomeGoals.map((goal, idx) => (
                      <ListItem key={idx} sx={{ py: 0, px: 0 }}>
                        <ListItemText
                          primary={goal.description}
                          secondary={goal.target ? `Target: ${goal.target}` : null}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>
          </Grid>

          {intervention.evidenceSource && (
            <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="caption" color="text.secondary">
                <strong>Evidence Source:</strong> {intervention.evidenceSource}
              </Typography>
            </Box>
          )}

          {!readOnly && (
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <IconButton size="small" onClick={() => setEditingIntervention(intervention)} aria-label="Edit">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleDeleteIntervention(intervention.id)} aria-label="Delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">Interventions Section V2</Typography>
          </Box>
          <Box mt={2}>
            <LinearProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">Interventions Section V2</Typography>
            <Chip 
              label={`${interventionStats.total} interventions`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          {!readOnly && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleAddIntervention()}
              size="small"
            >
              Add Intervention
            </Button>
          )}
        </Box>

        {/* ONC Compliance Note */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>ONC 170.315(b)(9) Interventions Section V2:</strong> This section captures structured 
            intervention data including medications, procedures, therapies, education, and lifestyle 
            modifications with evidence grades and outcome tracking as required for certification.
          </Typography>
        </Alert>

        {/* Intervention Statistics - Tufte-inspired dashboard */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {interventionStats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {interventionStats.active}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {interventionStats.completed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {interventionStats.evidenceBased}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Evidence-Based
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {interventionStats.cancelled}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cancelled
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabbed view by category */}
        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="All Interventions" />
          {Object.entries(interventionCategories).map(([key, category]) => (
            <Tab 
              key={key}
              label={
                <Badge 
                  badgeContent={interventionsByCategory[key]?.length || 0} 
                  color="primary"
                  variant="dot"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    {category.icon}
                    {category.label}
                  </Box>
                </Badge>
              }
            />
          ))}
        </Tabs>

        {/* Evidence-Based Recommendations */}
        {selectedTab === 0 && evidenceBase.length > 0 && !readOnly && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <RecommendedIcon color="warning" />
                <Typography variant="subtitle1">
                  Evidence-Based Recommendations ({evidenceBase.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {evidenceBase.map((recommendation, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Paper sx={{ p: 2, border: '1px dashed', borderColor: 'warning.main' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle2">
                          {recommendation.description}
                        </Typography>
                        <Chip
                          label={`Grade ${recommendation.evidenceGrade}`}
                          size="small"
                          color={getEvidenceGradeColor(recommendation.evidenceGrade)}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {recommendation.rationale}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {recommendation.source}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAddEvidenceIntervention(recommendation)}
                        >
                          Add
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Interventions Display */}
        {selectedTab === 0 ? (
          // All interventions
          <Box>
            {interventions.length > 0 ? (
              interventions.map(intervention => renderInterventionCard(intervention))
            ) : (
              <Box textAlign="center" py={4}>
                <TimelineIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Interventions Defined
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Add interventions to track medications, procedures, therapies, and other treatment activities.
                </Typography>
                {!readOnly && (
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => handleAddIntervention()}
                  >
                    Add First Intervention
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ) : (
          // Category-specific interventions
          <Box>
            {(() => {
              const categoryKey = Object.keys(interventionCategories)[selectedTab - 1];
              const categoryInterventions = interventionsByCategory[categoryKey] || [];
              const category = interventionCategories[categoryKey];
              
              return (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color={`${category.color}.main`}>
                      {category.label}
                    </Typography>
                    {!readOnly && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddIntervention(categoryKey)}
                        size="small"
                        color={category.color}
                      >
                        Add {category.label.slice(0, -1)}
                      </Button>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {category.description}
                  </Typography>
                  
                  {categoryInterventions.length > 0 ? (
                    categoryInterventions.map(intervention => renderInterventionCard(intervention))
                  ) : (
                    <Box textAlign="center" py={4}>
                      {category.icon}
                      <Typography variant="body1" color="text.secondary" mt={1}>
                        No {category.label.toLowerCase()} defined yet.
                      </Typography>
                      {!readOnly && (
                        <Button 
                          variant="outlined" 
                          startIcon={<AddIcon />}
                          onClick={() => handleAddIntervention(categoryKey)}
                          sx={{ mt: 2 }}
                          color={category.color}
                        >
                          Add {category.label.slice(0, -1)}
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })()}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}