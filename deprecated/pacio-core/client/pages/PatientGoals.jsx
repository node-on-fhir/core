// /packages/pacio-core/client/pages/PatientGoals.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button,
  Box,
  Grid,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  Add as AddIcon,
  ViewList as ListIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import { GoalsTable } from '/imports/ui-fhir/Goals/GoalsTable';
import { GoalDetail } from '/imports/ui-fhir/Goals/GoalDetail';
import { GoalTargetDisplay } from '../components/goals/GoalTargetDisplay';
import { GoalAchievementIndicator } from '../components/goals/GoalAchievementIndicator';
import { PatientSyncButton } from '../components/shared/PatientSyncButton';
import { ResourceFilter } from '../components/shared/ResourceFilter';
import { StyledCard } from '/imports/ui-fhir/components/StyledCard';
import { PageCanvas } from '/imports/ui-fhir/layouts/PageCanvas';
// import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';

// Get collections from Meteor.Collections
let Goals;
let Patients;

Meteor.startup(function() {
  Goals = Meteor.Collections ? Meteor.Collections.Goals : null;
  Patients = Meteor.Collections ? Meteor.Collections.Patients : null;
});

export function PatientGoals() {
  const { id: patientId } = useParams();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'dashboard'
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    achievementStatus: 'all'
  });
  
  // Set patient context
  useEffect(function() {
    if (patientId) {
      Session.set('selectedPatientId', patientId);
    }
  }, [patientId]);
  
  const { goals, selectedGoal, loading, patient } = useTracker(function() {
    const sub = Meteor.subscribe('goals', { patient: patientId });
    const patientSub = Meteor.subscribe('patients.one', patientId);
    
    let query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    // Apply filters
    if (filters.search) {
      query.$or = [
        { 'description.text': { $regex: filters.search, $options: 'i' } },
        { 'category[0].coding[0].display': { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters.status !== 'all') {
      query.lifecycleStatus = filters.status;
    }
    
    return {
      goals: Goals ? Goals.find(query, {
        sort: { startDate: -1 }
      }).fetch() : [],
      selectedGoal: selectedGoalId && Goals ? Goals.findOne(selectedGoalId) : null,
      loading: !sub.ready() || !patientSub.ready(),
      patient: Patients ? Patients.findOne(patientId) : null
    };
  }, [patientId, filters, selectedGoalId]);
  
  function handleFilterChange(newFilters) {
    setFilters(newFilters);
  }
  
  function handleRowClick(goalId) {
    setSelectedGoalId(goalId);
  }
  
  function handleAddGoal() {
    Session.set('mainAppDialogJson', {
      title: 'Add Goal',
      message: 'Add goal functionality coming soon'
    });
  }
  
  function renderHeader() {
    return (
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Patient Goals (Enhanced)
        </Typography>
        {patient && (
          <Typography variant="subtitle1" color="textSecondary">
            {get(patient, 'name[0].given[0]')} {get(patient, 'name[0].family')}
            {' - '}
            {goals.length} goals
          </Typography>
        )}
      </Box>
    );
  }
  
  function renderControls() {
    return (
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={function(e, newMode) { if (newMode) setViewMode(newMode); }}
              size="small"
            >
              <ToggleButton value="list">
                <ListIcon />
                <Box ml={1}>List View</Box>
              </ToggleButton>
              <ToggleButton value="dashboard">
                <DashboardIcon />
                <Box ml={1}>Dashboard</Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <PatientSyncButton
                patientId={patientId}
                resourceTypes={['Goal']}
                size="medium"
              />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddGoal}
              >
                Add Goal
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  function renderFilters() {
    const filterConfig = {
      search: { enabled: true, label: 'Search Goals' },
      status: { 
        enabled: true, 
        label: 'Lifecycle Status',
        options: [
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'on-hold', label: 'On Hold' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      achievementStatus: {
        enabled: true,
        label: 'Achievement Status',
        options: [
          { value: 'all', label: 'All' },
          { value: 'achieved', label: 'Achieved' },
          { value: 'in-progress', label: 'In Progress' },
          { value: 'not-achieved', label: 'Not Achieved' }
        ]
      }
    };
    
    return (
      <Box mb={3}>
        <ResourceFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          filterConfig={filterConfig}
          showAdvanced={false}
        />
      </Box>
    );
  }
  
  function renderListView() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedGoal ? 7 : 12}>
          <StyledCard>
            <GoalsTable
              goals={goals}
              selectedGoalId={selectedGoalId}
              onRowClick={handleRowClick}
              showLifecycleStatus={true}
              showCategory={true}
              hideBarcode={true}
              hideActionIcons={true}
            />
          </StyledCard>
        </Grid>
        
        {selectedGoal && (
          <Grid item xs={12} md={5}>
            <StyledCard>
              <Box p={2}>
                <Typography variant="h6" gutterBottom>
                  Goal Details
                </Typography>
                <GoalDetail goal={selectedGoal} showHeader={false} />
                
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Targets & Progress
                  </Typography>
                  <GoalTargetDisplay
                    targets={get(selectedGoal, 'target', [])}
                    showProgress={true}
                    showDates={true}
                  />
                </Box>
                
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Achievement Status
                  </Typography>
                  <GoalAchievementIndicator
                    achievementStatus={get(selectedGoal, 'achievementStatus')}
                    lifecycleStatus={get(selectedGoal, 'lifecycleStatus')}
                    startDate={get(selectedGoal, 'startDate')}
                    targetDate={get(selectedGoal, 'target[0].dueDate')}
                    variant="detailed"
                    showTrend={true}
                  />
                </Box>
              </Box>
            </StyledCard>
          </Grid>
        )}
      </Grid>
    );
  }
  
  function renderDashboardView() {
    // Group goals by achievement status
    const achievedGoals = goals.filter(function(goal) {
      return get(goal, 'achievementStatus.coding[0].code') === 'achieved';
    });
    
    const inProgressGoals = goals.filter(function(goal) {
      const status = get(goal, 'achievementStatus.coding[0].code');
      return status === 'in-progress' || !status;
    });
    
    const notAchievedGoals = goals.filter(function(goal) {
      return get(goal, 'achievementStatus.coding[0].code') === 'not-achieved';
    });
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <Box p={2}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Achieved ({achievedGoals.length})
              </Typography>
              {achievedGoals.map(function(goal) {
                return (
                  <Box key={get(goal, 'id')} mb={2}>
                    <Typography variant="subtitle2">
                      {get(goal, 'description.text', 'Goal')}
                    </Typography>
                    <GoalAchievementIndicator
                      achievementStatus={get(goal, 'achievementStatus')}
                      lifecycleStatus={get(goal, 'lifecycleStatus')}
                      variant="chip"
                      size="small"
                    />
                  </Box>
                );
              })}
            </Box>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <StyledCard>
            <Box p={2}>
              <Typography variant="h6" color="primary.main" gutterBottom>
                In Progress ({inProgressGoals.length})
              </Typography>
              {inProgressGoals.map(function(goal) {
                return (
                  <Box key={get(goal, 'id')} mb={2}>
                    <Typography variant="subtitle2">
                      {get(goal, 'description.text', 'Goal')}
                    </Typography>
                    <GoalTargetDisplay
                      targets={get(goal, 'target', [])}
                      compact={true}
                      showProgress={true}
                    />
                  </Box>
                );
              })}
            </Box>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <StyledCard>
            <Box p={2}>
              <Typography variant="h6" color="error.main" gutterBottom>
                Not Achieved ({notAchievedGoals.length})
              </Typography>
              {notAchievedGoals.map(function(goal) {
                return (
                  <Box key={get(goal, 'id')} mb={2}>
                    <Typography variant="subtitle2">
                      {get(goal, 'description.text', 'Goal')}
                    </Typography>
                    <GoalAchievementIndicator
                      achievementStatus={get(goal, 'achievementStatus')}
                      lifecycleStatus={get(goal, 'lifecycleStatus')}
                      variant="chip"
                      size="small"
                    />
                  </Box>
                );
              })}
            </Box>
          </StyledCard>
        </Grid>
      </Grid>
    );
  }
  
  if (loading) {
    return (
      <PageCanvas id="patientGoalsPage">
        <Container maxWidth="xl">
          <Box p={3} textAlign="center">
            <Typography>Loading goals...</Typography>
          </Box>
        </Container>
      </PageCanvas>
    );
  }
  
  return (
    <PageCanvas id="patientGoalsPage" headerHeight={120}>
      <Container maxWidth="xl">
        {renderHeader()}
        {renderControls()}
        {renderFilters()}
        {viewMode === 'list' ? renderListView() : renderDashboardView()}
      </Container>
    </PageCanvas>
  );
}