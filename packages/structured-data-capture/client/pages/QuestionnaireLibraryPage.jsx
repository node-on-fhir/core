// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/pages/QuestionnaireLibraryPage.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  GetApp as DownloadIcon,
  FileCopy as CopyIcon,
  PlayArrow as UseIcon
} from '@mui/icons-material';

// Use Meteor.useNavigate and Meteor.useTheme patterns per project requirements
let useNavigate;
let useAppTheme;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
  useAppTheme = Meteor.useTheme;
});

// Example library of questionnaires
const questionnaireLibrary = [
  {
    id: 'phq9',
    title: 'PHQ-9 Depression Screening',
    description: 'Patient Health Questionnaire for depression screening',
    category: 'Mental Health',
    questions: 9,
    estimatedTime: '5 minutes',
    version: '2.0',
    status: 'active',
    usage: 1523
  },
  {
    id: 'gad7',
    title: 'GAD-7 Anxiety Assessment',
    description: 'Generalized Anxiety Disorder 7-item scale',
    category: 'Mental Health',
    questions: 7,
    estimatedTime: '3 minutes',
    version: '1.0',
    status: 'active',
    usage: 1102
  },
  {
    id: 'audit',
    title: 'AUDIT Alcohol Screening',
    description: 'Alcohol Use Disorders Identification Test',
    category: 'Substance Use',
    questions: 10,
    estimatedTime: '5 minutes',
    version: '1.0',
    status: 'active',
    usage: 876
  },
  {
    id: 'pain-scale',
    title: 'Brief Pain Inventory',
    description: 'Assessment of pain severity and impact on daily functions',
    category: 'Pain Management',
    questions: 15,
    estimatedTime: '10 minutes',
    version: '1.2',
    status: 'active',
    usage: 2341
  },
  {
    id: 'fall-risk',
    title: 'Fall Risk Assessment',
    description: 'Morse Fall Scale for evaluating patient fall risk',
    category: 'Safety',
    questions: 6,
    estimatedTime: '3 minutes',
    version: '2.1',
    status: 'active',
    usage: 3102
  },
  {
    id: 'nutrition-screen',
    title: 'Malnutrition Screening Tool',
    description: 'MST for identifying patients at risk of malnutrition',
    category: 'Nutrition',
    questions: 5,
    estimatedTime: '2 minutes',
    version: '1.0',
    status: 'active',
    usage: 567
  },
  {
    id: 'medication-adherence',
    title: 'Medication Adherence Questionnaire',
    description: 'Morisky Medication Adherence Scale (MMAS-8)',
    category: 'Medication',
    questions: 8,
    estimatedTime: '5 minutes',
    version: '1.0',
    status: 'active',
    usage: 890
  },
  {
    id: 'covid-screen',
    title: 'COVID-19 Screening',
    description: 'Standard COVID-19 symptoms and exposure screening',
    category: 'Infectious Disease',
    questions: 12,
    estimatedTime: '3 minutes',
    version: '3.2',
    status: 'active',
    usage: 5432
  },
  {
    id: 'diabetic-foot',
    title: 'Diabetic Foot Exam',
    description: 'Comprehensive diabetic foot assessment form',
    category: 'Diabetes',
    questions: 20,
    estimatedTime: '15 minutes',
    version: '1.1',
    status: 'active',
    usage: 432
  },
  {
    id: 'surgery-consent',
    title: 'Surgical Consent Form',
    description: 'Standard surgical procedure informed consent',
    category: 'Consent',
    questions: 15,
    estimatedTime: '10 minutes',
    version: '2.0',
    status: 'active',
    usage: 2876
  }
];

const categories = ['All', 'Mental Health', 'Substance Use', 'Pain Management', 'Safety', 'Nutrition', 'Medication', 'Infectious Disease', 'Diabetes', 'Consent'];

export function QuestionnaireLibraryPage() {
  const navigate = useNavigate ? useNavigate() : function() {};
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');

  // Dark mode theming using Honeycomb's theme system
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const pageBgColor = isDark ? '#121212' : '#f5f5f5';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const paperBgColor = isDark ? '#2a2a2a' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)';

  const filteredQuestionnaires = questionnaireLibrary.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseQuestionnaire = function(questionnaire) {
    navigate(`/structured-data-capture?form=${questionnaire.id}`);
  };

  const handleCopyQuestionnaire = function(questionnaire) {
    navigate(`/questionnaire-builder?template=${questionnaire.id}`);
  };

  const handleDownloadQuestionnaire = function(questionnaire) {
    // In a real app, this would download the FHIR JSON
    console.log('Downloading questionnaire:', questionnaire);
    alert(`Downloading ${questionnaire.title} as FHIR JSON...`);
  };

  return (
    <Box sx={{
      bgcolor: pageBgColor,
      minHeight: '100vh'
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: cardTextColor }}>
          Questionnaire Library
        </Typography>
        
        <Paper sx={{
          p: 3, mb: 3, bgcolor: paperBgColor, color: cardTextColor,
          '& .MuiInputLabel-root': { color: cardTextColor },
          '& .MuiInputBase-root': { color: cardTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
          '& .MuiChip-root.MuiChip-colorDefault': { color: cardTextColor, borderColor: borderColor },
          '& .MuiToggleButton-root': { color: cardTextColor, borderColor: borderColor },
          '& .MuiInputAdornment-root': { color: cardTextColor },
        }}>
          <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search questionnaires..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  clickable
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              fullWidth
            >
              <ToggleButton value="grid">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ListViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="body1" color="textSecondary" gutterBottom>
        {filteredQuestionnaires.length} questionnaires found
      </Typography>

      <Grid container spacing={3}>
        {filteredQuestionnaires.map(questionnaire => (
          <Grid item xs={12} md={viewMode === 'grid' ? 4 : 12} key={questionnaire.id}>
            <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiChip-outlined': { color: cardTextColor, borderColor: borderColor }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {questionnaire.title}
                  </Typography>
                  <Chip 
                    label={questionnaire.category} 
                    size="small" 
                    color="primary"
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }} paragraph>
                  {questionnaire.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip 
                    label={`${questionnaire.questions} questions`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={questionnaire.estimatedTime} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`v${questionnaire.version}`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${questionnaire.usage} uses`} 
                    size="small" 
                    variant="outlined"
                    color="success"
                  />
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  startIcon={<UseIcon />}
                  onClick={() => handleUseQuestionnaire(questionnaire)}
                >
                  Use
                </Button>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopyQuestionnaire(questionnaire)}
                >
                  Copy & Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadQuestionnaire(questionnaire)}
                >
                  Download
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredQuestionnaires.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary">
            No questionnaires found matching your criteria
          </Typography>
        </Box>
      )}
      </Container>
    </Box>
  );
}