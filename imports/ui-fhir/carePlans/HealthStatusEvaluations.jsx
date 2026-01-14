// imports/ui-fhir/carePlans/HealthStatusEvaluations.jsx

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
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Sparkline } from '../visualizations/Sparkline';
import { MiniChart } from '../visualizations/MiniChart';
import { get } from 'lodash';
import moment from 'moment';

// ONC 170.315(b)(9) compliant Health Status Evaluations and Outcomes section
export default function HealthStatusEvaluations({ 
  patientId, 
  carePlanId, 
  onEvaluationChange,
  readOnly = false 
}) {
  const [evaluations, setEvaluations] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);

  // Fetch evaluations and observations for patient
  useEffect(() => {
    async function fetchHealthData() {
      if (!patientId) return;
      
      setLoading(true);
      try {
        // Fetch relevant observations, assessments, and diagnostic reports
        const observations = await Meteor.callAsync('getPatientObservations', patientId);
        const assessments = await Meteor.callAsync('getPatientAssessments', patientId);
        const diagnosticReports = await Meteor.callAsync('getPatientDiagnosticReports', patientId);
        
        // Process into evaluation format
        const processedEvaluations = processHealthData(observations, assessments, diagnosticReports);
        setEvaluations(processedEvaluations);
      } catch (error) {
        console.error('Error fetching health data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHealthData();
  }, [patientId]);

  // Process raw FHIR data into evaluation structure
  function processHealthData(observations, assessments, diagnosticReports) {
    const evaluationMap = new Map();

    // Process observations into evaluation metrics
    observations.forEach(obs => {
      const code = get(obs, 'code.coding[0].code');
      const display = get(obs, 'code.coding[0].display') || get(obs, 'code.text');
      const value = extractObservationValue(obs);
      const date = moment(get(obs, 'effectiveDateTime') || get(obs, 'effectiveInstant'));

      if (!evaluationMap.has(code)) {
        evaluationMap.set(code, {
          id: code,
          name: display,
          category: categorizeObservation(obs),
          unit: get(obs, 'valueQuantity.unit'),
          referenceRange: extractReferenceRange(obs),
          values: [],
          status: 'active',
          interpretation: get(obs, 'interpretation[0].text'),
          priority: calculatePriority(obs)
        });
      }

      const evaluation = evaluationMap.get(code);
      evaluation.values.push({
        value: value,
        date: date.toISOString(),
        status: get(obs, 'status'),
        note: get(obs, 'note[0].text')
      });
    });

    // Sort values by date and calculate trends
    evaluationMap.forEach(evaluation => {
      evaluation.values.sort((a, b) => moment(a.date).diff(moment(b.date)));
      evaluation.trend = calculateTrend(evaluation.values);
      evaluation.currentValue = evaluation.values[evaluation.values.length - 1]?.value;
      evaluation.lastUpdated = evaluation.values[evaluation.values.length - 1]?.date;
      evaluation.changePercent = calculateChangePercent(evaluation.values);
    });

    return Array.from(evaluationMap.values());
  }

  function extractObservationValue(observation) {
    if (get(observation, 'valueQuantity.value')) {
      return get(observation, 'valueQuantity.value');
    } else if (get(observation, 'valueString')) {
      return get(observation, 'valueString');
    } else if (get(observation, 'valueBoolean') !== undefined) {
      return get(observation, 'valueBoolean') ? 'Positive' : 'Negative';
    } else if (get(observation, 'valueCodeableConcept.text')) {
      return get(observation, 'valueCodeableConcept.text');
    }
    return null;
  }

  function categorizeObservation(observation) {
    const category = get(observation, 'category[0].coding[0].code');
    const code = get(observation, 'code.coding[0].code');
    
    // Map to clinical categories
    if (['vital-signs', '8867-4'].includes(category) || ['8310-5', '8462-4', '8480-6'].includes(code)) {
      return 'vital-signs';
    } else if (['laboratory', '26436-6'].includes(category) || code?.startsWith('33747-0')) {
      return 'laboratory';
    } else if (['imaging', '18748-4'].includes(category)) {
      return 'imaging';
    } else if (['procedure', '67504-6'].includes(category)) {
      return 'procedure';
    } else if (['therapy', '18776-5'].includes(category)) {
      return 'therapy';
    }
    return 'assessment';
  }

  function extractReferenceRange(observation) {
    const referenceRange = get(observation, 'referenceRange[0]');
    if (!referenceRange) return null;
    
    return {
      low: get(referenceRange, 'low.value'),
      high: get(referenceRange, 'high.value'),
      text: get(referenceRange, 'text')
    };
  }

  function calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3); // Look at last 3 values
    let upward = 0, downward = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = parseFloat(recent[i-1].value);
      const curr = parseFloat(recent[i].value);
      
      if (!isNaN(prev) && !isNaN(curr)) {
        if (curr > prev) upward++;
        else if (curr < prev) downward++;
      }
    }
    
    if (upward > downward) return 'increasing';
    if (downward > upward) return 'decreasing';
    return 'stable';
  }

  function calculateChangePercent(values) {
    if (values.length < 2) return 0;
    
    const first = parseFloat(values[0].value);
    const last = parseFloat(values[values.length - 1].value);
    
    if (isNaN(first) || isNaN(last) || first === 0) return 0;
    
    return Math.round(((last - first) / first) * 100);
  }

  function calculatePriority(observation) {
    // Use interpretation codes to determine priority
    const interpretation = get(observation, 'interpretation[0].coding[0].code');
    
    switch (interpretation) {
      case 'H': // High
      case 'HH': // Critical high
      case 'L': // Low  
      case 'LL': // Critical low
      case 'A': // Abnormal
        return 'high';
      case 'AA': // Critical abnormal
        return 'critical';
      case 'N': // Normal
        return 'low';
      default:
        return 'medium';
    }
  }

  function getTrendIcon(trend) {
    switch (trend) {
      case 'increasing':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'decreasing':
        return <TrendingDownIcon color="error" fontSize="small" />;
      default:
        return <TrendingFlatIcon color="action" fontSize="small" />;
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  }

  function formatValue(value, unit) {
    if (typeof value === 'number') {
      return `${value.toFixed(1)} ${unit || ''}`.trim();
    }
    return value;
  }

  // Create sparkline data for evaluation
  function createSparklineData(evaluation) {
    return evaluation.values
      .filter(v => !isNaN(parseFloat(v.value)))
      .map(v => parseFloat(v.value));
  }

  // Handle evaluation selection
  function handleEvaluationClick(evaluation) {
    setSelectedMetric(evaluation);
  }

  // Handle adding new evaluation
  async function handleAddEvaluation() {
    if (readOnly) return;
    
    // Create new evaluation template
    const newEvaluation = {
      id: `evaluation-${Date.now()}`,
      name: 'New Health Status Evaluation',
      category: 'assessment',
      values: [],
      status: 'draft',
      priority: 'medium'
    };
    
    setEditingEvaluation(newEvaluation);
  }

  // Save evaluation changes
  async function handleSaveEvaluation(evaluation) {
    try {
      if (evaluation.id.startsWith('evaluation-')) {
        // New evaluation - create observation
        await Meteor.callAsync('createHealthStatusEvaluation', {
          patientId,
          carePlanId,
          evaluation
        });
      } else {
        // Update existing
        await Meteor.callAsync('updateHealthStatusEvaluation', evaluation.id, evaluation);
      }
      
      setEditingEvaluation(null);
      onEvaluationChange?.(evaluation);
    } catch (error) {
      console.error('Error saving evaluation:', error);
    }
  }

  // Group evaluations by category
  const evaluationsByCategory = evaluations.reduce((groups, evaluation) => {
    const category = evaluation.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(evaluation);
    return groups;
  }, {});

  const categoryLabels = {
    'vital-signs': 'Vital Signs',
    'laboratory': 'Laboratory Results',
    'imaging': 'Imaging Studies', 
    'procedure': 'Procedures',
    'therapy': 'Therapies',
    'assessment': 'Assessments'
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <AssessmentIcon color="primary" />
            <Typography variant="h6">Health Status Evaluations</Typography>
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
            <AssessmentIcon color="primary" />
            <Typography variant="h6">Health Status Evaluations & Outcomes</Typography>
            <Chip 
              label={`${evaluations.length} metrics`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          {!readOnly && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddEvaluation}
              size="small"
            >
              Add Evaluation
            </Button>
          )}
        </Box>

        {/* ONC Compliance Note */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>ONC 170.315(b)(9) Compliance:</strong> This section includes Health Status Evaluations 
            and Outcomes as required for care plan certification. All evaluations are tracked with 
            structured data, trends, and outcome measures.
          </Typography>
        </Alert>

        {/* Category Overview Cards - Tufte-inspired small multiples */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(evaluationsByCategory).map(([category, categoryEvaluations]) => (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <Paper 
                sx={{ 
                  p: 2, 
                  height: 120,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    boxShadow: 3,
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {categoryLabels[category]}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h5" component="span">
                    {categoryEvaluations.length}
                  </Typography>
                  <Box display="flex" gap={0.5}>
                    {categoryEvaluations.filter(e => e.priority === 'critical').length > 0 && (
                      <WarningIcon color="error" fontSize="small" />
                    )}
                    {categoryEvaluations.filter(e => e.trend === 'increasing').length > 0 && (
                      <TrendingUpIcon color="success" fontSize="small" />
                    )}
                  </Box>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {categoryEvaluations.slice(0, 3).map(evaluation => (
                    <Chip
                      key={evaluation.id}
                      label={evaluation.name.substring(0, 8) + '...'}
                      size="small"
                      color={getPriorityColor(evaluation.priority)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Detailed Evaluations Table */}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Health Metric</TableCell>
              <TableCell>Current Value</TableCell>
              <TableCell>Trend</TableCell>
              <TableCell>Change</TableCell>
              <TableCell>Reference Range</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluations.map(evaluation => (
              <TableRow 
                key={evaluation.id}
                hover
                onClick={() => handleEvaluationClick(evaluation)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {evaluation.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {categoryLabels[evaluation.category]}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={getPriorityColor(evaluation.priority)}
                      label={evaluation.priority}
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {formatValue(evaluation.currentValue, evaluation.unit)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getTrendIcon(evaluation.trend)}
                    <Typography variant="caption">
                      {evaluation.trend}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    color={evaluation.changePercent > 0 ? 'success.main' : evaluation.changePercent < 0 ? 'error.main' : 'text.secondary'}
                  >
                    {evaluation.changePercent > 0 ? '+' : ''}{evaluation.changePercent}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {evaluation.referenceRange ? 
                      `${evaluation.referenceRange.low || ''}-${evaluation.referenceRange.high || ''}` :
                      'Not specified'
                    }
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {evaluation.lastUpdated ? moment(evaluation.lastUpdated).format('MMM D') : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {/* Tufte-inspired sparkline */}
                    <Box width={60} height={20} mr={1}>
                      <Sparkline 
                        data={createSparklineData(evaluation)}
                        width={60}
                        height={20}
                        color={evaluation.trend === 'increasing' ? '#4caf50' : evaluation.trend === 'decreasing' ? '#f44336' : '#9e9e9e'}
                      />
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {evaluations.length === 0 && (
          <Box textAlign="center" py={4}>
            <AssessmentIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Health Status Evaluations
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Health status evaluations will appear here as observations and assessments are recorded.
            </Typography>
            {!readOnly && (
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={handleAddEvaluation}
              >
                Add Manual Evaluation
              </Button>
            )}
          </Box>
        )}

        {/* Detailed metric view */}
        {selectedMetric && (
          <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="h6" gutterBottom>
              {selectedMetric.name} - Detailed Timeline
            </Typography>
            <Box height={200}>
              <MiniChart
                data={selectedMetric.values.map(v => ({
                  x: moment(v.date).format('MMM D'),
                  y: parseFloat(v.value)
                }))}
                type="line"
                showGrid={true}
                referenceRange={selectedMetric.referenceRange}
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}