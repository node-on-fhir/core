// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/pages/StructuredDataCapturePage.jsx

import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import { 
  Assignment as QuestionnaireIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { QuestionnaireForm } from '../components/QuestionnaireForm';

// Example questionnaires
const exampleQuestionnaires = [
  {
    id: 'phq9',
    title: 'PHQ-9 Depression Screening',
    description: 'Patient Health Questionnaire for depression screening',
    questions: 9,
    estimatedTime: '5 minutes',
    questionnaire: {
      resourceType: 'Questionnaire',
      id: 'phq9',
      title: 'Patient Health Questionnaire (PHQ-9)',
      status: 'active',
      item: [
        {
          linkId: 'intro',
          type: 'display',
          text: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?'
        },
        {
          linkId: 'interest',
          type: 'choice',
          text: 'Little interest or pleasure in doing things',
          required: true,
          answerOption: [
            { valueCoding: { code: '0', display: 'Not at all' } },
            { valueCoding: { code: '1', display: 'Several days' } },
            { valueCoding: { code: '2', display: 'More than half the days' } },
            { valueCoding: { code: '3', display: 'Nearly every day' } }
          ]
        },
        {
          linkId: 'depressed',
          type: 'choice',
          text: 'Feeling down, depressed, or hopeless',
          required: true,
          answerOption: [
            { valueCoding: { code: '0', display: 'Not at all' } },
            { valueCoding: { code: '1', display: 'Several days' } },
            { valueCoding: { code: '2', display: 'More than half the days' } },
            { valueCoding: { code: '3', display: 'Nearly every day' } }
          ]
        }
      ]
    }
  },
  {
    id: 'consent',
    title: 'Informed Consent Form',
    description: 'General medical procedure consent form',
    questions: 6,
    estimatedTime: '10 minutes',
    questionnaire: {
      resourceType: 'Questionnaire',
      id: 'consent',
      title: 'Informed Consent Form',
      status: 'active',
      item: [
        {
          linkId: 'patient-info',
          type: 'group',
          text: 'Patient Information',
          item: [
            {
              linkId: 'name',
              type: 'string',
              text: 'Full Name',
              required: true
            },
            {
              linkId: 'dob',
              type: 'date',
              text: 'Date of Birth',
              required: true
            }
          ]
        },
        {
          linkId: 'procedure',
          type: 'string',
          text: 'Procedure Name',
          required: true
        },
        {
          linkId: 'risks-understood',
          type: 'boolean',
          text: 'I understand the risks and benefits of this procedure',
          required: true
        },
        {
          linkId: 'questions-answered',
          type: 'boolean',
          text: 'All my questions have been answered to my satisfaction',
          required: true
        },
        {
          linkId: 'consent-given',
          type: 'boolean',
          text: 'I consent to the procedure',
          required: true
        }
      ]
    }
  },
  {
    id: 'intake',
    title: 'Patient Intake Form',
    description: 'New patient registration and medical history',
    questions: 15,
    estimatedTime: '15 minutes',
    questionnaire: {
      resourceType: 'Questionnaire',
      id: 'intake',
      title: 'Patient Intake Form',
      status: 'active',
      item: [
        {
          linkId: 'demographics',
          type: 'group',
          text: 'Demographics',
          item: [
            {
              linkId: 'fullname',
              type: 'string',
              text: 'Full Name',
              required: true
            },
            {
              linkId: 'email',
              type: 'string',
              text: 'Email Address',
              required: true
            },
            {
              linkId: 'phone',
              type: 'string',
              text: 'Phone Number',
              required: true
            }
          ]
        },
        {
          linkId: 'medical-history',
          type: 'group',
          text: 'Medical History',
          item: [
            {
              linkId: 'conditions',
              type: 'choice',
              text: 'Do you have any of the following conditions?',
              repeats: true,
              answerOption: [
                { valueCoding: { code: 'diabetes', display: 'Diabetes' } },
                { valueCoding: { code: 'hypertension', display: 'High Blood Pressure' } },
                { valueCoding: { code: 'asthma', display: 'Asthma' } },
                { valueCoding: { code: 'heart-disease', display: 'Heart Disease' } }
              ]
            },
            {
              linkId: 'medications',
              type: 'text',
              text: 'List all current medications',
              maxLength: 1000
            },
            {
              linkId: 'allergies',
              type: 'text',
              text: 'List any allergies',
              maxLength: 500
            }
          ]
        }
      ]
    }
  }
];

export default function StructuredDataCapturePage() {
  const navigate = useNavigate();
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);

  const handleQuestionnaireSelect = function(questionnaire) {
    setSelectedQuestionnaire(questionnaire);
  };

  const handleSubmit = async function(response, trackingData) {
    console.log('Questionnaire submitted:', response);
    console.log('Tracking data:', trackingData);
    
    // Here you would save to database
    alert('Questionnaire submitted successfully!');
    setSelectedQuestionnaire(null);
  };

  const handleCancel = function() {
    setSelectedQuestionnaire(null);
  };

  if (selectedQuestionnaire) {
    return (
      <Box sx={{ 
        bgcolor: theme => theme.palette.mode === 'light' 
          ? theme.palette.grey[50] 
          : theme.palette.background.default,
        minHeight: '100vh'
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <QuestionnaireForm
            questionnaire={selectedQuestionnaire.questionnaire}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            showProgress={true}
            showSidebar={true}
            enableTracking={true}
            thankYouPage={{
              show: true,
              message: `Thank you for completing the ${selectedQuestionnaire.title}`,
              redirectDelay: 3000
            }}
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      minHeight: '100vh'
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Structured Data Capture
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            FHIR Questionnaire Demo
          </Typography>
          <Typography variant="body1" color="textSecondary">
            This page demonstrates the clinical:structured-data-capture package capabilities. 
            Select a questionnaire below to see different question types, conditional logic, 
            validation, and progress tracking in action.
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {exampleQuestionnaires.map(function(example) {
            return (
              <Grid item xs={12} md={4} key={example.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <QuestionnaireIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="div">
                        {example.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {example.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${example.questions} questions`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={example.estimatedTime} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<StartIcon />}
                      onClick={() => handleQuestionnaireSelect(example)}
                    >
                      Start Questionnaire
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Features Demonstrated
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Question Types
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Text input (string, text)<br />
                • Numeric input (integer, decimal)<br />
                • Date/time pickers<br />
                • Boolean (yes/no)<br />
                • Single choice (radio buttons, dropdown)<br />
                • Multiple choice (checkboxes)<br />
                • File attachments<br />
                • Groups and nested questions
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Advanced Features
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Conditional logic (enableWhen)<br />
                • Required field validation<br />
                • Pattern validation (regex)<br />
                • Progress tracking<br />
                • Navigation sidebar<br />
                • Auto-save functionality<br />
                • Response tracking analytics<br />
                • Thank you page with redirect
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}