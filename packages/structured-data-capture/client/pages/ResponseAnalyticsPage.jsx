// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/pages/ResponseAnalyticsPage.jsx

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  CheckCircle as CompleteIcon,
  Cancel as IncompleteIcon,
  GetApp as ExportIcon,
  Visibility as ViewIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';

// Sample analytics data
const analyticsData = {
  summary: {
    totalResponses: 1523,
    completedResponses: 1398,
    averageCompletionTime: '8:32',
    completionRate: 91.8,
    todayResponses: 47,
    weekGrowth: 12.5
  },
  questionnaireStats: [
    {
      id: 'phq9',
      title: 'PHQ-9 Depression Screening',
      responses: 523,
      completed: 498,
      avgTime: '5:12',
      completionRate: 95.2,
      lastResponse: '2 hours ago'
    },
    {
      id: 'fall-risk',
      title: 'Fall Risk Assessment',
      responses: 412,
      completed: 401,
      avgTime: '3:45',
      completionRate: 97.3,
      lastResponse: '30 minutes ago'
    },
    {
      id: 'pain-scale',
      title: 'Brief Pain Inventory',
      responses: 234,
      completed: 198,
      avgTime: '12:10',
      completionRate: 84.6,
      lastResponse: '1 hour ago'
    },
    {
      id: 'covid-screen',
      title: 'COVID-19 Screening',
      responses: 189,
      completed: 187,
      avgTime: '2:30',
      completionRate: 98.9,
      lastResponse: '15 minutes ago'
    },
    {
      id: 'surgery-consent',
      title: 'Surgical Consent Form',
      responses: 165,
      completed: 114,
      avgTime: '15:45',
      completionRate: 69.1,
      lastResponse: '4 hours ago'
    }
  ],
  questionMetrics: {
    'phq9': {
      'interest': { answered: 520, skipped: 3, avgScore: 1.8 },
      'depressed': { answered: 518, skipped: 5, avgScore: 1.6 },
      'sleep': { answered: 519, skipped: 4, avgScore: 2.1 }
    }
  }
};

function StatCard({ title, value, subtitle, icon, trend }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: 'primary.main' }}>
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
            <Typography variant="body2" color="success.main">
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function ResponseAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('all');

  const handleExport = function() {
    console.log('Exporting analytics data...');
    alert('Exporting analytics report as CSV...');
  };

  const handleViewResponses = function(questionnaireId) {
    console.log('Viewing responses for:', questionnaireId);
    // Navigate to responses page with filter
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Response Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Responses"
            value={analyticsData.summary.totalResponses}
            subtitle={`${analyticsData.summary.todayResponses} today`}
            icon={<ChartIcon />}
            trend={`+${analyticsData.summary.weekGrowth}% this week`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={analyticsData.summary.completedResponses}
            subtitle={`${analyticsData.summary.completionRate}% completion rate`}
            icon={<CompleteIcon />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Time"
            value={analyticsData.summary.averageCompletionTime}
            subtitle="Per response"
            icon={<TimeIcon />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Forms"
            value={analyticsData.questionnaireStats.length}
            subtitle="In use"
            icon={<ChartIcon />}
          />
        </Grid>
      </Grid>

      {/* Questionnaire Performance Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Questionnaire Performance
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Questionnaire</TableCell>
                <TableCell align="right">Responses</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">Completion Rate</TableCell>
                <TableCell align="right">Avg. Time</TableCell>
                <TableCell align="right">Last Response</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.questionnaireStats.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell>{stat.title}</TableCell>
                  <TableCell align="right">{stat.responses}</TableCell>
                  <TableCell align="right">{stat.completed}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 60, mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={stat.completionRate} 
                          color={stat.completionRate > 90 ? 'success' : stat.completionRate > 70 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Typography variant="body2">
                        {stat.completionRate}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{stat.avgTime}</TableCell>
                  <TableCell align="right">
                    <Chip label={stat.lastResponse} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewResponses(stat.id)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Question-Level Metrics */}
      {selectedQuestionnaire !== 'all' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Question-Level Metrics
          </Typography>
          
          <Grid container spacing={3}>
            {Object.entries(analyticsData.questionMetrics.phq9).map(([questionId, metrics]) => (
              <Grid item xs={12} md={4} key={questionId}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Question: {questionId}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2">
                        Answered: {metrics.answered}
                      </Typography>
                      <Typography variant="body2" color="error">
                        Skipped: {metrics.skipped}
                      </Typography>
                    </Box>
                    {metrics.avgScore && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Average Score: {metrics.avgScore}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
}