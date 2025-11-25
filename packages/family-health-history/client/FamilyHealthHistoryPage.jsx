// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/family-health-history/client/FamilyHealthHistoryPage.jsx

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
  Tooltip,
  Avatar,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  FamilyRestroom as FamilyIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  QuestionMark as UnknownIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';

export function FamilyHealthHistoryPage() {
  // Use Meteor's navigation pattern instead of React Router's useNavigate
  // to avoid Router context issues during package initialization
  const navigate = (path) => {
    if (typeof Meteor.navigate === 'function') {
      Meteor.navigate(path);
    } else {
      console.warn('Meteor.navigate not available, falling back to window.location');
      window.location.href = path;
    }
  };
  
  // State
  const [familyTreeData, setFamilyTreeData] = useState(null);
  const [healthPatterns, setHealthPatterns] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample family tree data structure (Tufte-inspired small multiples)
  const sampleFamilyData = {
    generations: {
      '-2': [ // Great-grandparents
        { id: 'ggf1', name: 'Great-Grandfather (P)', relationship: 'great-grandfather-paternal', sex: 'male', deceased: true, age: 89, conditions: ['Heart Disease'] },
        { id: 'ggm1', name: 'Great-Grandmother (P)', relationship: 'great-grandmother-paternal', sex: 'female', deceased: true, age: 84, conditions: ['Diabetes'] }
      ],
      '-1': [ // Grandparents
        { id: 'gf1', name: 'Grandfather (P)', relationship: 'grandfather-paternal', sex: 'male', deceased: true, age: 76, conditions: ['Heart Disease', 'High Cholesterol'] },
        { id: 'gm1', name: 'Grandmother (P)', relationship: 'grandmother-paternal', sex: 'female', age: 82, conditions: ['Arthritis'] },
        { id: 'gf2', name: 'Grandfather (M)', relationship: 'grandfather-maternal', sex: 'male', deceased: true, age: 71, conditions: ['Diabetes', 'Stroke'] },
        { id: 'gm2', name: 'Grandmother (M)', relationship: 'grandmother-maternal', sex: 'female', age: 78, conditions: ['Hypertension', 'Osteoporosis'] }
      ],
      '0': [ // Parent generation
        { id: 'father', name: 'Father', relationship: 'father', sex: 'male', age: 58, conditions: ['High Cholesterol', 'Hypertension'] },
        { id: 'mother', name: 'Mother', relationship: 'mother', sex: 'female', age: 55, conditions: ['Diabetes', 'Migraine'] },
        { id: 'uncle1', name: 'Uncle (P)', relationship: 'uncle-paternal', sex: 'male', age: 62, conditions: ['Heart Disease'] },
        { id: 'aunt1', name: 'Aunt (M)', relationship: 'aunt-maternal', sex: 'female', age: 53, conditions: ['Breast Cancer'] }
      ],
      '1': [ // Patient generation
        { id: 'patient', name: 'Patient', relationship: 'self', sex: 'female', age: 32, conditions: ['Migraine'], isPatient: true },
        { id: 'brother', name: 'Brother', relationship: 'brother', sex: 'male', age: 29, conditions: [] },
        { id: 'sister', name: 'Sister', relationship: 'sister', sex: 'female', age: 35, conditions: ['Anxiety'] }
      ],
      '2': [ // Children
        { id: 'child1', name: 'Daughter', relationship: 'daughter', sex: 'female', age: 8, conditions: [] },
        { id: 'nephew1', name: 'Nephew', relationship: 'nephew', sex: 'male', age: 12, conditions: ['Asthma'] }
      ]
    }
  };

  // Health pattern analysis
  const healthAnalysis = {
    riskFactors: [
      { condition: 'Diabetes', count: 3, risk: 'high', inheritance: 'maternal', color: 'error' },
      { condition: 'Heart Disease', count: 3, risk: 'high', inheritance: 'paternal', color: 'error' },
      { condition: 'Hypertension', count: 2, risk: 'moderate', inheritance: 'mixed', color: 'warning' },
      { condition: 'Migraine', count: 2, risk: 'moderate', inheritance: 'maternal', color: 'warning' },
      { condition: 'High Cholesterol', count: 2, risk: 'moderate', inheritance: 'paternal', color: 'info' }
    ],
    recommendations: [
      'Annual cardiac screening recommended due to paternal heart disease history',
      'Diabetes screening every 6 months due to maternal diabetes pattern',
      'Consider genetic counseling for cancer predisposition',
      'Lifestyle modifications for cardiovascular risk reduction'
    ]
  };

  // Condition color mapping for visual consistency
  const conditionColors = {
    'Heart Disease': '#f44336',
    'Diabetes': '#ff9800', 
    'Hypertension': '#2196f3',
    'High Cholesterol': '#9c27b0',
    'Migraine': '#4caf50',
    'Breast Cancer': '#e91e63',
    'Arthritis': '#795548',
    'Stroke': '#607d8b',
    'Osteoporosis': '#ff5722',
    'Anxiety': '#3f51b5',
    'Asthma': '#00bcd4'
  };

  // Gender icon helper
  const getGenderIcon = (sex, deceased = false) => {
    const iconProps = { 
      fontSize: 'small', 
      color: deceased ? 'disabled' : 'inherit',
      sx: { opacity: deceased ? 0.5 : 1 }
    };
    
    switch(sex) {
      case 'male': return <MaleIcon {...iconProps} />;
      case 'female': return <FemaleIcon {...iconProps} />;
      default: return <UnknownIcon {...iconProps} />;
    }
  };

  // Family member card component (small multiple pattern)
  const FamilyMemberCard = ({ member }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        minHeight: 120,
        border: member.isPatient ? 2 : 1,
        borderColor: member.isPatient ? 'primary.main' : 'divider',
        '&:hover': { boxShadow: 3 }
      }}
      onClick={() => setSelectedMember(member)}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {getGenderIcon(member.sex, member.deceased)}
          <Typography variant="caption" sx={{ ml: 0.5, fontWeight: member.isPatient ? 'bold' : 'normal' }}>
            {member.name}
          </Typography>
          {member.deceased && (
            <Chip label="†" size="small" sx={{ ml: 'auto', minWidth: 24, height: 18 }} />
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary" display="block">
          Age: {member.age}
        </Typography>
        
        <Box sx={{ mt: 1 }}>
          {member.conditions.slice(0, 2).map((condition, idx) => (
            <Chip
              key={idx}
              label={condition}
              size="small"
              sx={{ 
                fontSize: '0.6rem',
                height: 16,
                mr: 0.5,
                mb: 0.5,
                bgcolor: conditionColors[condition] || 'grey.300',
                color: 'white'
              }}
            />
          ))}
          {member.conditions.length > 2 && (
            <Chip
              label={`+${member.conditions.length - 2}`}
              size="small"
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );

  // Generation row component
  const GenerationRow = ({ generation, title, members }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>
        {title}
      </Typography>
      <Grid container spacing={1}>
        {members.map((member) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={member.id}>
            <FamilyMemberCard member={member} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      minHeight: '100vh',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FamilyIcon color="primary" />
          Family Health History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive family health visualization and risk analysis for ONC §170.315(a)(12) compliance
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Family Tree Visualization */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader 
              title="Family Tree"
              subheader="Multi-generational health history visualization"
              action={
                <Stack direction="row" spacing={1}>
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/family-member-histories/new')}
                  >
                    Add Family Member
                  </Button>
                  <Button size="small" startIcon={<DownloadIcon />}>
                    Export
                  </Button>
                </Stack>
              }
            />
            <CardContent>
              {/* Great-grandparents */}
              <GenerationRow 
                generation="-2" 
                title="Great-Grandparents" 
                members={sampleFamilyData.generations['-2']} 
              />
              
              {/* Grandparents */}
              <GenerationRow 
                generation="-1" 
                title="Grandparents" 
                members={sampleFamilyData.generations['-1']} 
              />
              
              {/* Parents */}
              <GenerationRow 
                generation="0" 
                title="Parents & Aunts/Uncles" 
                members={sampleFamilyData.generations['0']} 
              />
              
              {/* Patient generation */}
              <GenerationRow 
                generation="1" 
                title="Siblings & Patient" 
                members={sampleFamilyData.generations['1']} 
              />
              
              {/* Children */}
              <GenerationRow 
                generation="2" 
                title="Children & Nieces/Nephews" 
                members={sampleFamilyData.generations['2']} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Health Pattern Analysis */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Risk Factors */}
            <Card>
              <CardHeader 
                title="Genetic Risk Factors"
                subheader="Inherited health patterns"
                avatar={<AnalyticsIcon color="primary" />}
              />
              <CardContent>
                {healthAnalysis.riskFactors.map((factor, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {factor.condition}
                      </Typography>
                      <Badge badgeContent={factor.count} color={factor.color}>
                        <Chip 
                          label={factor.risk} 
                          size="small" 
                          color={factor.color}
                        />
                      </Badge>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {factor.inheritance} inheritance pattern
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={factor.count * 20} 
                      color={factor.color}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader 
                title="Clinical Recommendations"
                subheader="Based on family history analysis"
                avatar={<CheckCircleIcon color="success" />}
              />
              <CardContent>
                {healthAnalysis.recommendations.map((rec, index) => (
                  <Alert 
                    key={index} 
                    severity="info" 
                    icon={<CheckCircleIcon />}
                    sx={{ mb: 1, fontSize: '0.8rem' }}
                  >
                    {rec}
                  </Alert>
                ))}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader title="Condition Legend" />
              <CardContent>
                <Grid container spacing={1}>
                  {Object.entries(conditionColors).map(([condition, color]) => (
                    <Grid item xs={12} key={condition}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: color, 
                            borderRadius: 0.5 
                          }} 
                        />
                        <Typography variant="caption">
                          {condition}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Selected Member Details */}
        {selectedMember && (
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title={`${selectedMember.name} - Detailed Information`}
                action={
                  <Button 
                    onClick={() => navigate(`/family-member-histories/${selectedMember.id}`)}
                    startIcon={<PersonIcon />}
                  >
                    Edit Details
                  </Button>
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Basic Information</Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Relationship:</Typography>
                        <Typography variant="body1">{selectedMember.relationship}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Age:</Typography>
                        <Typography variant="body1">
                          {selectedMember.age} years
                          {selectedMember.deceased && ' (deceased)'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Sex:</Typography>
                        <Typography variant="body1">{selectedMember.sex}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Health Conditions</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {selectedMember.conditions.length > 0 ? (
                        selectedMember.conditions.map((condition, idx) => (
                          <Chip
                            key={idx}
                            label={condition}
                            sx={{ 
                              bgcolor: conditionColors[condition] || 'grey.300',
                              color: 'white',
                              mb: 0.5
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No conditions recorded
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default FamilyHealthHistoryPage;