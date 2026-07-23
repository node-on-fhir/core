// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/social-determinants/client/SocialDeterminantsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  LinearProgress,
  Stack,
  Divider,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  LocalHospital as HealthIcon,
  School as EducationIcon,
  Restaurant as FoodIcon,
  DirectionsCar as TransportIcon,
  Security as SafetyIcon,
  AccountBalance as FinanceIcon,
  Groups as SocialIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';

function SocialDeterminantsPage() {
  // State management
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('sdoh-hunger');
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);

  // Patient context
  const selectedPatientId = useTracker(() => {
    return Session.get('selectedPatientId');
  }, []);

  // SDOH Screening Questionnaires (Gravity Project value sets)
  const questionnaires = {
    'sdoh-hunger': {
      title: 'Food Insecurity',
      icon: <FoodIcon />,
      category: 'food-insecurity',
      items: [
        {
          linkId: '88122-7',
          text: 'Within the past 12 months, you worried that your food would run out before you got money to buy more.',
          answerOption: [
            { valueCoding: { system: 'http://loinc.org', code: 'LA28397-0', display: 'Often true' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA6729-3', display: 'Sometimes true' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA28398-8', display: 'Never true' }}
          ]
        },
        {
          linkId: '88123-5',
          text: 'Within the past 12 months, the food you bought just didn\'t last and you didn\'t have money to get more.',
          answerOption: [
            { valueCoding: { system: 'http://loinc.org', code: 'LA28397-0', display: 'Often true' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA6729-3', display: 'Sometimes true' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA28398-8', display: 'Never true' }}
          ]
        }
      ]
    },
    'sdoh-housing': {
      title: 'Housing Stability',
      icon: <HomeIcon />,
      category: 'housing-instability',
      items: [
        {
          linkId: '71802-3',
          text: 'What is your housing situation today?',
          answerOption: [
            { valueCoding: { system: 'http://loinc.org', code: 'LA30189-7', display: 'I have a steady place to live' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA30190-5', display: 'I have a place to live today, but I am worried about losing it in the future' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA30191-3', display: 'I do not have a steady place to live' }}
          ]
        }
      ]
    },
    'sdoh-transport': {
      title: 'Transportation',
      icon: <TransportIcon />,
      category: 'transportation-insecurity',
      items: [
        {
          linkId: '68516-4',
          text: 'Has lack of transportation kept you from medical appointments, meetings, work, or from getting things needed for daily living?',
          answerOption: [
            { valueCoding: { system: 'http://loinc.org', code: 'LA32-8', display: 'No' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA33-6', display: 'Yes' }}
          ]
        }
      ]
    },
    'sdoh-finance': {
      title: 'Financial Resource',
      icon: <FinanceIcon />,
      category: 'financial-insecurity', 
      items: [
        {
          linkId: '76437-3',
          text: 'How hard is it for you to pay for the very basics like food, housing, medical care, and heating?',
          answerOption: [
            { valueCoding: { system: 'http://loinc.org', code: 'LA6111-4', display: 'Not hard at all' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA6112-2', display: 'Somewhat hard' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA6113-0', display: 'Very hard' }}
          ]
        }
      ]
    },
    'sdoh-social': {
      title: 'Social Connection',
      icon: <SocialIcon />,
      category: 'social-connection',
      items: [
        {
          linkId: '76501-6',
          text: 'How often do you feel lonely or socially isolated?',
          answerOption: [
            { valueCoding: { system: 'http://loinc.org', code: 'LA6270-8', display: 'Never' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA13863-8', display: 'Rarely' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA6729-3', display: 'Sometimes' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA13909-9', display: 'Usually' }},
            { valueCoding: { system: 'http://loinc.org', code: 'LA13902-4', display: 'Always' }}
          ]
        }
      ]
    }
  };

  // Risk scoring and analysis
  const analyzeRisk = (responses) => {
    const riskScores = {};
    let totalRisk = 0;
    
    Object.keys(questionnaires).forEach(qKey => {
      const questionnaire = questionnaires[qKey];
      let categoryRisk = 0;
      
      questionnaire.items.forEach(item => {
        const response = responses[item.linkId];
        if (response) {
          // Simple risk scoring based on response codes
          const riskValue = getRiskValue(response.valueCoding.code);
          categoryRisk += riskValue;
        }
      });
      
      riskScores[questionnaire.category] = {
        score: categoryRisk,
        level: categoryRisk >= 2 ? 'high' : categoryRisk >= 1 ? 'moderate' : 'low',
        title: questionnaire.title
      };
      totalRisk += categoryRisk;
    });
    
    return { categoryRisks: riskScores, totalRisk };
  };

  const getRiskValue = (code) => {
    const highRiskCodes = ['LA28397-0', 'LA30191-3', 'LA33-6', 'LA6113-0', 'LA13902-4'];
    const moderateRiskCodes = ['LA6729-3', 'LA30190-5', 'LA6112-2', 'LA13909-9'];
    
    if (highRiskCodes.includes(code)) return 2;
    if (moderateRiskCodes.includes(code)) return 1;
    return 0;
  };

  // Handle response changes
  const handleResponseChange = (linkId, answer) => {
    setResponses(prev => ({
      ...prev,
      [linkId]: answer
    }));
  };

  // Submit screening
  const handleSubmit = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient first');
      return;
    }

    setIsSubmitting(true);
    try {
      const responseArray = Object.keys(responses).map(linkId => ({
        linkId,
        answer: [responses[linkId]]
      }));

      const result = await Meteor.rpc('socialDeterminants.screening.submit', {
        screeningData: {
          patientId: selectedPatientId,
          questionnaireId: `${selectedQuestionnaire}-screening`,
          responses: responseArray
        }
      });

      setLastSubmission(result);
      
      // Analyze current responses
      const analysis = analyzeRisk(responses);
      setRiskAnalysis(analysis);
      
      // Clear responses
      setResponses({});
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit screening');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load existing risk analysis on mount
  useEffect(() => {
    if (selectedPatientId) {
      (async () => {
        try {
          const result = await Meteor.rpc('socialDeterminants.assessment.getRiskFactors', { patientId: selectedPatientId });
          if (result) {
            // Transform server result to client format for display
            const categoryRisks = {};
            result.forEach(factor => {
              categoryRisks[factor.category] = {
                score: factor.count,
                level: factor.riskLevel,
                title: factor.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
              };
            });
            setRiskAnalysis({ categoryRisks, totalRisk: result.length });
          }
        } catch (error) {
          // no-op: original only acted on success
        }
      })();
    }
  }, [selectedPatientId]);

  // Questionnaire component with Tufte-inspired compact design
  const QuestionnaireItem = ({ item, value, onChange }) => (
    <Paper sx={{ p: 2, mb: 1, bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'background.paper' }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel 
          component="legend" 
          sx={{ 
            fontSize: '0.9rem', 
            fontWeight: 500, 
            mb: 1,
            color: 'text.primary' 
          }}
        >
          {item.text}
        </FormLabel>
        <RadioGroup
          value={value?.valueCoding?.code || ''}
          onChange={(e) => {
            const selectedOption = item.answerOption.find(opt => 
              opt.valueCoding.code === e.target.value
            );
            if (selectedOption) {
              onChange(selectedOption);
            }
          }}
        >
          {item.answerOption.map((option, idx) => (
            <FormControlLabel
              key={idx}
              value={option.valueCoding.code}
              control={<Radio size="small" />}
              label={
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  {option.valueCoding.display}
                </Typography>
              }
              sx={{ ml: 0, mr: 2 }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Paper>
  );

  // Risk visualization component
  const RiskIndicator = ({ category, risk }) => {
    const getColor = (level) => {
      switch(level) {
        case 'high': return 'error';
        case 'moderate': return 'warning';
        default: return 'success';
      }
    };

    return (
      <Paper sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" display="block" gutterBottom>
          {risk.title}
        </Typography>
        <Chip 
          label={risk.level.toUpperCase()} 
          color={getColor(risk.level)}
          size="small"
          sx={{ minWidth: 70 }}
        />
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          Score: {risk.score}
        </Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      p: 2
    }}>
      {/* Compact header with key information */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="primary" />
          Social Determinants of Health
          <Chip label="ONC §170.315(a)(15)" size="small" variant="outlined" sx={{ ml: 1 }} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          SDOH screening and risk assessment based on Gravity Project standards
          {selectedPatientId && ` • Patient: ${selectedPatientId}`}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Left column: Screening tools */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="SDOH Screening Assessment"
              subheader="Evidence-based screening instruments"
              action={
                <Stack direction="row" spacing={1}>
                  {Object.entries(questionnaires).map(([key, q]) => (
                    <Tooltip key={key} title={q.title}>
                      <IconButton
                        size="small"
                        color={selectedQuestionnaire === key ? 'primary' : 'default'}
                        onClick={() => setSelectedQuestionnaire(key)}
                      >
                        {q.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Stack>
              }
            />
            <CardContent>
              {/* Current questionnaire */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {questionnaires[selectedQuestionnaire].icon}
                  {questionnaires[selectedQuestionnaire].title}
                </Typography>
                
                {questionnaires[selectedQuestionnaire].items.map((item) => (
                  <QuestionnaireItem
                    key={item.linkId}
                    item={item}
                    value={responses[item.linkId]}
                    onChange={(answer) => handleResponseChange(item.linkId, answer)}
                  />
                ))}
              </Box>

              {/* Submit section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {Object.keys(responses).length} of {questionnaires[selectedQuestionnaire].items.length} questions answered
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedPatientId || Object.keys(responses).length === 0}
                  startIcon={isSubmitting ? <RefreshIcon /> : <CheckCircleIcon />}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                </Button>
              </Box>

              {lastSubmission && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Screening submitted successfully. Created {lastSubmission.observationIds.length} SDOH observations.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Risk analysis and summary */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Risk dashboard */}
            <Card>
              <CardHeader 
                title="Risk Assessment"
                subheader="Current SDOH risk profile"
                avatar={<AssessmentIcon color="primary" />}
              />
              <CardContent>
                {riskAnalysis ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Overall Risk Score
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {riskAnalysis.totalRisk}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(riskAnalysis.totalRisk * 10, 100)} 
                        color={riskAnalysis.totalRisk >= 6 ? 'error' : riskAnalysis.totalRisk >= 3 ? 'warning' : 'success'}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      Category Breakdown
                    </Typography>
                    <Grid container spacing={1}>
                      {Object.entries(riskAnalysis.categoryRisks).map(([category, risk]) => (
                        <Grid item xs={6} key={category}>
                          <RiskIndicator category={category} risk={risk} />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Complete screening to see risk analysis
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* FHIR compliance info */}
            <Card>
              <CardHeader title="Technical Implementation" />
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>FHIR Resources:</strong><br/>
                    • QuestionnaireResponse<br/>
                    • SDOH Observation<br/>
                    • Risk Assessment
                  </Typography>
                  <Typography variant="body2">
                    <strong>Value Sets:</strong><br/>
                    • Gravity Project SDOH<br/>
                    • LOINC codes<br/>
                    • SNOMED CT
                  </Typography>
                  <Typography variant="body2">
                    <strong>Profiles:</strong><br/>
                    • SDOHCC Observation<br/>
                    • SDOHCC Condition<br/>
                    • SDOHCC Goal
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Screening Coverage
              </Typography>
              <Grid container spacing={1} sx={{ fontSize: '0.8rem' }}>
                {Object.entries(questionnaires).map(([key, q]) => (
                  <Grid item xs={6} key={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {q.icon}
                      <Typography variant="caption">
                        {q.title}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SocialDeterminantsPage;