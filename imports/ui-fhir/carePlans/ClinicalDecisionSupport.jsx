// imports/ui-fhir/carePlans/ClinicalDecisionSupport.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Chip, 
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Psychology as CdsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Lightbulb as RecommendationIcon,
  Analytics as AnalyticsIcon,
  Science as EvidenceIcon,
  Security as SafetyIcon,
  TrendingUp as ImprovementIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  Assessment as RiskIcon,
  Medication as DrugIcon,
  LocalHospital as InteractionIcon,
  Schedule as TimingIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';

// Clinical Decision Support component with evidence-based recommendations
export default function ClinicalDecisionSupport({ 
  patientId, 
  carePlanId, 
  carePlanData,
  onRecommendationAccept,
  onAlertAcknowledge,
  readOnly = false 
}) {
  const [cdsAlerts, setCdsAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [drugInteractions, setDrugInteractions] = useState([]);
  const [qualityMeasures, setQualityMeasures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  // CDS Alert severity levels
  const alertLevels = {
    'high': {
      color: 'error',
      icon: <ErrorIcon />,
      label: 'High Priority',
      description: 'Requires immediate attention'
    },
    'medium': {
      color: 'warning', 
      icon: <WarningIcon />,
      label: 'Medium Priority',
      description: 'Should be addressed'
    },
    'low': {
      color: 'info',
      icon: <InfoIcon />,
      label: 'Information',
      description: 'For consideration'
    }
  };

  // Load CDS data
  useEffect(() => {
    async function loadCdsData() {
      if (!patientId) return;
      
      setLoading(true);
      try {
        // Parallel loading of CDS components
        const [alerts, recs, interactions, measures] = await Promise.all([
          // rpc-migration: ddp-straggler
          Meteor.callAsync('getCdsAlerts', { patientId, carePlanId }),
          // rpc-migration: ddp-straggler
          Meteor.callAsync('getCdsRecommendations', {
            patientId,
            conditions: get(carePlanData, 'addresses', []),
            medications: get(carePlanData, 'activity', []).filter(a => a.detail?.productCodeableConcept),
            goals: get(carePlanData, 'goal', [])
          }),
          // rpc-migration: ddp-straggler
          Meteor.callAsync('checkDrugInteractions', {
            patientId,
            medications: get(carePlanData, 'activity', []).filter(a => a.detail?.productCodeableConcept)
          }),
          // rpc-migration: ddp-straggler
          Meteor.callAsync('getQualityMeasureGaps', { patientId })
        ]);

        setCdsAlerts(alerts || []);
        setRecommendations(recs || []);
        setDrugInteractions(interactions || []);
        setQualityMeasures(measures || []);
      } catch (error) {
        console.error('Error loading CDS data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCdsData();
  }, [patientId, carePlanId, carePlanData]);

  // Handle alert acknowledgment
  async function handleAcknowledgeAlert(alertId, action = 'acknowledged') {
    try {
      // rpc-migration: ddp-straggler
      await Meteor.callAsync('acknowledgeCdsAlert', alertId, action);
      
      setCdsAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: action, acknowledgedAt: new Date().toISOString() }
          : alert
      ));
      
      setAlertDialogOpen(false);
      onAlertAcknowledge?.(alertId, action);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  // Handle recommendation acceptance
  async function handleAcceptRecommendation(recommendation) {
    try {
      if (recommendation.type === 'medication') {
        // Add medication to care plan
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('addCarePlanMedication', {
          carePlanId,
          medication: recommendation.medication
        });
      } else if (recommendation.type === 'procedure') {
        // Add procedure activity
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('addCarePlanActivity', {
          carePlanId,
          activity: recommendation.activity
        });
      } else if (recommendation.type === 'goal') {
        // Add goal to care plan
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('addCarePlanGoal', {
          carePlanId,
          goal: recommendation.goal
        });
      }
      
      // Mark recommendation as accepted
      setRecommendations(prev => prev.map(rec => 
        rec.id === recommendation.id 
          ? { ...rec, status: 'accepted', acceptedAt: new Date().toISOString() }
          : rec
      ));
      
      onRecommendationAccept?.(recommendation);
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  }

  // Get severity statistics
  const alertStats = cdsAlerts.reduce((stats, alert) => {
    const severity = alert.severity || 'low';
    stats[severity] = (stats[severity] || 0) + 1;
    stats.total = (stats.total || 0) + 1;
    return stats;
  }, {});

  // Render CDS alert card
  function renderAlert(alert) {
    const level = alertLevels[alert.severity] || alertLevels.low;
    
    return (
      <Card 
        key={alert.id} 
        sx={{ 
          mb: 2, 
          border: `1px solid`,
          borderColor: `${level.color}.main`,
          bgcolor: alert.status === 'acknowledged' ? 'grey.50' : 'background.paper'
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box display="flex" alignItems="flex-start" gap={2} flex={1}>
              <Box color={`${level.color}.main`}>
                {level.icon}
              </Box>
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {alert.summary}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {alert.detail}
                </Typography>
                
                {alert.source && (
                  <Typography variant="caption" color="text.secondary">
                    <strong>Source:</strong> {alert.source}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
              <Chip
                label={level.label}
                color={level.color}
                size="small"
                variant={alert.status === 'acknowledged' ? 'outlined' : 'filled'}
              />
              
              {alert.status !== 'acknowledged' && !readOnly && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSelectedAlert(alert);
                    setAlertDialogOpen(true);
                  }}
                >
                  Review
                </Button>
              )}
              
              {alert.acknowledgedAt && (
                <Typography variant="caption" color="text.secondary">
                  Acknowledged {moment(alert.acknowledgedAt).format('MMM D, HH:mm')}
                </Typography>
              )}
            </Box>
          </Box>

          {alert.links && alert.links.length > 0 && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Related Resources:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {alert.links.map((link, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant="text"
                    endIcon={<LaunchIcon fontSize="small" />}
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    {link.display}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render recommendation card
  function renderRecommendation(recommendation) {
    return (
      <Card 
        key={recommendation.id} 
        sx={{ 
          mb: 2,
          border: '1px dashed',
          borderColor: recommendation.status === 'accepted' ? 'success.main' : 'primary.main',
          bgcolor: recommendation.status === 'accepted' ? 'success.50' : 'background.paper'
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box display="flex" alignItems="flex-start" gap={2} flex={1}>
              <RecommendationIcon color="primary" />
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {recommendation.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {recommendation.description}
                </Typography>
                
                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={`Evidence Grade: ${recommendation.evidenceGrade}`}
                    size="small"
                    color="info"
                    icon={<EvidenceIcon />}
                  />
                  <Chip
                    label={recommendation.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {recommendation.priority && (
                    <Chip
                      label={`Priority: ${recommendation.priority}`}
                      size="small"
                      color={recommendation.priority === 'high' ? 'error' : 'default'}
                      variant="outlined"
                    />
                  )}
                </Box>

                {recommendation.rationale && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    <strong>Rationale:</strong> {recommendation.rationale}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
              {recommendation.status !== 'accepted' && !readOnly && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAcceptRecommendation(recommendation)}
                >
                  Accept
                </Button>
              )}
              
              {recommendation.status === 'accepted' && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="success.main">
                    Accepted
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Render drug interaction
  function renderDrugInteraction(interaction) {
    const severityColor = {
      'high': 'error',
      'moderate': 'warning', 
      'low': 'info'
    }[interaction.severity] || 'info';

    return (
      <Card key={interaction.id} sx={{ mb: 2, border: `1px solid ${severityColor}.main` }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box display="flex" alignItems="flex-start" gap={2} flex={1}>
              <InteractionIcon color={severityColor} />
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  Drug Interaction: {interaction.severity} severity
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  <strong>Medications:</strong> {interaction.medications.join(' + ')}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {interaction.description}
                </Typography>
                
                {interaction.clinicalSignificance && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    <strong>Clinical Significance:</strong> {interaction.clinicalSignificance}
                  </Typography>
                )}

                {interaction.management && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Management:</strong> {interaction.management}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Chip
              label={interaction.severity}
              color={severityColor}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CdsIcon color="primary" />
            <Typography variant="h6">Clinical Decision Support</Typography>
          </Box>
          <Box mt={2}>
            <LinearProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <CdsIcon color="primary" />
              <Typography variant="h6">Clinical Decision Support</Typography>
              <Badge badgeContent={alertStats.total || 0} color="error">
                <Chip 
                  label="Active" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Badge>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              size="small"
            >
              Refresh
            </Button>
          </Box>

          {/* CDS Overview Dashboard */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                <Typography variant="h4" color="error.main">
                  {alertStats.high || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  High Priority Alerts
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                <Typography variant="h4" color="warning.main">
                  {alertStats.medium || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Medium Priority
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                <Typography variant="h4" color="info.main">
                  {recommendations.filter(r => r.status !== 'accepted').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending Recommendations
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                <Typography variant="h4" color="success.main">
                  {drugInteractions.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Drug Interactions
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* High Priority Alerts */}
          {cdsAlerts.filter(a => a.severity === 'high').length > 0 && (
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ErrorIcon color="error" />
                  <Typography variant="subtitle1" color="error.main">
                    High Priority Alerts ({cdsAlerts.filter(a => a.severity === 'high').length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {cdsAlerts.filter(a => a.severity === 'high').map(renderAlert)}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Drug Interactions */}
          {drugInteractions.length > 0 && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DrugIcon color="warning" />
                  <Typography variant="subtitle1">
                    Drug Interactions ({drugInteractions.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {drugInteractions.map(renderDrugInteraction)}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Evidence-Based Recommendations */}
          {recommendations.filter(r => r.status !== 'accepted').length > 0 && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <RecommendationIcon color="primary" />
                  <Typography variant="subtitle1">
                    Clinical Recommendations ({recommendations.filter(r => r.status !== 'accepted').length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {recommendations.filter(r => r.status !== 'accepted').map(renderRecommendation)}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Other Alerts */}
          {cdsAlerts.filter(a => a.severity !== 'high').length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <InfoIcon color="info" />
                  <Typography variant="subtitle1">
                    Other Alerts ({cdsAlerts.filter(a => a.severity !== 'high').length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {cdsAlerts.filter(a => a.severity !== 'high').map(renderAlert)}
              </AccordionDetails>
            </Accordion>
          )}

          {/* No CDS Data */}
          {cdsAlerts.length === 0 && recommendations.length === 0 && drugInteractions.length === 0 && (
            <Box textAlign="center" py={4}>
              <CdsIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Clinical Decision Support Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clinical decision support will provide evidence-based recommendations and safety alerts as care plan data is entered.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                {alertLevels[selectedAlert.severity]?.icon}
                <Typography variant="h6">{selectedAlert.summary}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" mb={2}>
                {selectedAlert.detail}
              </Typography>
              
              {selectedAlert.clinicalEvidence && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Clinical Evidence:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAlert.clinicalEvidence}
                  </Typography>
                </Box>
              )}

              {selectedAlert.recommendations && selectedAlert.recommendations.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {selectedAlert.recommendations.map((rec, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <RecommendationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAlertDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleAcknowledgeAlert(selectedAlert.id, 'override')}
                color="warning"
              >
                Override
              </Button>
              <Button 
                onClick={() => handleAcknowledgeAlert(selectedAlert.id, 'acknowledged')}
                variant="contained"
                autoFocus
              >
                Acknowledge
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}