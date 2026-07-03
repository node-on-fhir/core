// /packages/pacio-core/client/pages/PatientTransitionOfCare.jsx

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
  ViewModule as CardsIcon
} from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import { TransitionOfCareTable } from '../components/transitionOfCare/TransitionOfCareTable';
import { TransitionOfCareCard } from '../components/transitionOfCare/TransitionOfCareCard';
import { PatientSyncButton } from '../components/shared/PatientSyncButton';
import { ResourceFilter } from '../components/shared/ResourceFilter';
import { StyledCard } from '/imports/ui-fhir/components/StyledCard';
import { PageCanvas } from '/imports/ui-fhir/layouts/PageCanvas';
// import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';

// Get collections from Meteor.Collections
let Compositions;
let Patients;

Meteor.startup(function() {
  Compositions = Meteor.Collections ? Meteor.Collections.Compositions : null;
  Patients = Meteor.Collections ? Meteor.Collections.Patients : null;
});

export function PatientTransitionOfCare() {
  const { id: patientId } = useParams();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: { start: null, end: null }
  });
  
  // Set patient context
  useEffect(function() {
    if (patientId) {
      Session.set('selectedPatientId', patientId);
    }
  }, [patientId]);
  
  const { compositions, loading, patient } = useTracker(function() {
    const sub = Meteor.subscribe('pacio.transitionOfCare', patientId);
    const patientSub = Meteor.subscribe('patients.one', patientId);
    
    let query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    // Filter for TOC documents
    query.$or = [
      { 'type.coding.code': 'transition-of-care' },
      { 'type.coding.code': 'continuity-of-care-document' },
      { 'type.coding.code': '18776-5' }, // C-CDA R2.1 Continuity of Care Document
      { 'type.coding.code': '34133-9' }  // Summarization of Episode Note
    ];
    
    // Apply filters
    if (filters.search) {
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { title: { $regex: filters.search, $options: 'i' } },
            { 'author.display': { $regex: filters.search, $options: 'i' } }
          ]
        }
      ];
      delete query.$or;
    }
    
    if (filters.status !== 'all') {
      query.status = filters.status;
    }
    
    if (filters.dateRange.start || filters.dateRange.end) {
      query.date = {};
      if (filters.dateRange.start) {
        query.date.$gte = filters.dateRange.start.toDate();
      }
      if (filters.dateRange.end) {
        query.date.$lte = filters.dateRange.end.toDate();
      }
    }
    
    return {
      compositions: Compositions ? Compositions.find(query, {
        sort: { date: -1 }
      }).fetch() : [],
      loading: !sub.ready() || !patientSub.ready(),
      patient: Patients ? Patients.findOne(patientId) : null
    };
  }, [patientId, filters]);
  
  function handleFilterChange(newFilters) {
    setFilters(newFilters);
  }
  
  function handleAddDocument() {
    Session.set('mainAppDialogJson', {
      title: 'Create Transition of Care Document',
      message: 'Create TOC document functionality coming soon'
    });
  }
  
  function renderHeader() {
    return (
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Transition of Care Documents
        </Typography>
        {patient && (
          <Typography variant="subtitle1" color="textSecondary">
            {get(patient, 'name[0].given[0]')} {get(patient, 'name[0].family')}
            {' - '}
            {compositions.length} {compositions.length === 1 ? 'document' : 'documents'}
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
              <ToggleButton value="table">
                <ListIcon />
                <Box ml={1}>Table</Box>
              </ToggleButton>
              <ToggleButton value="cards">
                <CardsIcon />
                <Box ml={1}>Cards</Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <PatientSyncButton
                patientId={patientId}
                resourceTypes={['Composition']}
                size="medium"
              />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddDocument}
              >
                Create TOC
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  function renderFilters() {
    const filterConfig = {
      search: { 
        enabled: true, 
        label: 'Search Documents',
        placeholder: 'Search by title or author...'
      },
      status: { 
        enabled: true, 
        label: 'Document Status',
        options: [
          { value: 'all', label: 'All' },
          { value: 'final', label: 'Final' },
          { value: 'preliminary', label: 'Preliminary' },
          { value: 'amended', label: 'Amended' }
        ]
      },
      dateRange: { 
        enabled: true, 
        label: 'Date Range'
      }
    };
    
    return (
      <Box mb={3}>
        <ResourceFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          filterConfig={filterConfig}
          showAdvanced={true}
          defaultExpanded={false}
        />
      </Box>
    );
  }
  
  function renderContent() {
    if (loading) {
      return (
        <StyledCard>
          <Box p={3} textAlign="center">
            <Typography>Loading transition of care documents...</Typography>
          </Box>
        </StyledCard>
      );
    }
    
    if (viewMode === 'cards') {
      return (
        <Grid container spacing={3}>
          {compositions.map(function(composition) {
            return (
              <Grid item xs={12} sm={6} md={4} key={get(composition, 'id')}>
                <TransitionOfCareCard
                  composition={composition}
                  showActions={true}
                  showSections={true}
                />
              </Grid>
            );
          })}
          {compositions.length === 0 && (
            <Grid item xs={12}>
              <StyledCard>
                <Box p={3} textAlign="center">
                  <Typography>No transition of care documents found</Typography>
                </Box>
              </StyledCard>
            </Grid>
          )}
        </Grid>
      );
    }
    
    return (
      <StyledCard>
        <TransitionOfCareTable
          compositions={compositions}
          showType={true}
          showAuthor={true}
          showCustodian={true}
          showSections={true}
          showActions={true}
        />
      </StyledCard>
    );
  }
  
  return (
    <PageCanvas id="patientTransitionOfCarePage" headerHeight={120}>
      <Container maxWidth="xl">
        {renderHeader()}
        {renderControls()}
        {renderFilters()}
        {renderContent()}
      </Container>
    </PageCanvas>
  );
}