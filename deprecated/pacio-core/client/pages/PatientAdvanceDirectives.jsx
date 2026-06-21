// /packages/pacio-core/client/pages/PatientAdvanceDirectives.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button,
  Box,
  Grid,
  Fab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import { AdvanceDirectiveStatusFilter } from '../components/advanceDirectives/AdvanceDirectiveStatusFilter';
import { AdvanceDirectiveCard } from '../components/advanceDirectives/AdvanceDirectiveCard';
import { PatientSyncButton } from '../components/shared/PatientSyncButton';
import { Card } from '@mui/material';
// import { AdvanceDirectives } from '/imports/lib/schemas/SimpleSchemas/AdvanceDirectives';

// Get collections and components from global
let DocumentReferences;
let Patients;
let DocumentReferencesTable;

Meteor.startup(function() {
  DocumentReferences = Meteor.Collections.DocumentReferences;
  Patients = Meteor.Collections.Patients;
  DocumentReferencesTable = Meteor.Tables ? Meteor.Tables.DocumentReferencesTable : null;
});

export function PatientAdvanceDirectives() {
  const { id: patientId } = useParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
  // Set patient context
  useEffect(function() {
    if (patientId) {
      Session.set('selectedPatientId', patientId);
    }
  }, [patientId]);
  
  const { advanceDirectives, loading, patient } = useTracker(function() {
    const sub = Meteor.subscribe('pacio.advanceDirectives', patientId);
    const patientSub = Meteor.subscribe('patients.one', patientId);
    
    let query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    // Filter for advance directive type documents
    query['type.coding.code'] = { $in: ['42348-3', 'advance-directive'] };
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'current') {
        query.status = { $in: ['current', 'final'] };
      } else if (statusFilter === 'superseded') {
        query.status = 'superseded';
      } else if (statusFilter === 'entered-in-error') {
        query.status = 'entered-in-error';
      }
    }
    
    return {
      advanceDirectives: DocumentReferences ? DocumentReferences.find(query, {
        sort: { date: -1 }
      }).fetch() : [],
      loading: !sub.ready() || !patientSub.ready(),
      patient: Patients ? Patients.findOne(patientId) : null
    };
  }, [patientId, statusFilter]);
  
  function handleStatusFilterChange(newStatus) {
    setStatusFilter(newStatus);
  }
  
  function handleAddDirective() {
    Session.set('mainAppDialogJson', {
      title: 'Add Advance Directive',
      message: 'Add advance directive functionality coming soon'
    });
  }
  
  function handleSyncSuccess(result) {
    console.log('Sync completed:', result);
  }
  
  // Calculate status counts
  const statusCounts = {
    all: advanceDirectives.length,
    current: 0,
    superseded: 0,
    'entered-in-error': 0,
    draft: 0
  };
  
  advanceDirectives.forEach(function(directive) {
    const status = get(directive, 'status');
    if (status === 'active' || status === 'completed') {
      statusCounts.current++;
    } else if (status === 'superseded') {
      statusCounts.superseded++;
    } else if (status === 'entered-in-error') {
      statusCounts['entered-in-error']++;
    } else if (status === 'draft') {
      statusCounts.draft++;
    }
  });
  
  function renderHeader() {
    return (
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Advance Directives
        </Typography>
        {patient && (
          <Typography variant="subtitle1" color="textSecondary">
            {get(patient, 'name[0].given[0]')} {get(patient, 'name[0].family')}
            {' - '}
            MRN: {get(patient, 'identifier[0].value', 'Unknown')}
          </Typography>
        )}
      </Box>
    );
  }
  
  function renderControls() {
    return (
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <AdvanceDirectiveStatusFilter
              value={statusFilter}
              onChange={handleStatusFilterChange}
              showCounts={true}
              counts={statusCounts}
            />
          </Grid>
          
          <Grid item xs>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <PatientSyncButton
                patientId={patientId}
                resourceTypes={['DocumentReference', 'Composition']}
                onSuccess={handleSyncSuccess}
                size="medium"
              />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddDirective}
              >
                Add Directive
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  function renderContent() {
    if (loading) {
      return (
        <StyledCard>
          <Box p={3} textAlign="center">
            <Typography>Loading advance directives...</Typography>
          </Box>
        </StyledCard>
      );
    }
    
    if (viewMode === 'cards') {
      return (
        <Grid container spacing={3}>
          {advanceDirectives.map(function(directive) {
            return (
              <Grid item xs={12} sm={6} md={4} key={get(directive, 'id')}>
                <AdvanceDirectiveCard
                  advanceDirective={directive}
                />
              </Grid>
            );
          })}
          {advanceDirectives.length === 0 && (
            <Grid item xs={12}>
              <StyledCard>
                <Box p={3} textAlign="center">
                  <Typography>No advance directives found</Typography>
                </Box>
              </StyledCard>
            </Grid>
          )}
        </Grid>
      );
    }
    
    return (
      <Card>
        {DocumentReferencesTable ? (
          <DocumentReferencesTable
            documentReferences={advanceDirectives}
            showStatus={true}
            showActions={true}
            hideCheckbox={true}
          />
        ) : (
          <Box p={3}>
            <Typography>DocumentReferencesTable not available</Typography>
          </Box>
        )}
      </Card>
    );
  }
  
  return (
    <div id="patientAdvanceDirectivesPage" style={{ paddingTop: '120px' }}>
      <Container maxWidth="xl">
        {renderHeader()}
        {renderControls()}
        {renderContent()}
        
        {/* Floating Action Button for mobile */}
        {window.innerWidth < 768 && (
          <Fab
            color="primary"
            aria-label="add"
            style={{
              position: 'fixed',
              bottom: 16,
              right: 16
            }}
            onClick={handleAddDirective}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </div>
  );
}