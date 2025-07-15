// /packages/pacio-core/client/pages/PatientMedicationLists.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button,
  Box,
  Grid,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import { MedicationListsTable } from '/imports/ui-fhir/Lists/MedicationListsTable';
import { ListDetail } from '/imports/ui-fhir/Lists/ListDetail';
import { PatientSyncButton } from '../components/shared/PatientSyncButton';
import { StyledCard } from '/imports/ui-fhir/components/StyledCard';
import { PageCanvas } from '/imports/ui-fhir/layouts/PageCanvas';
// import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';

// Get collections from Meteor.Collections
let Lists;
let Patients;

Meteor.startup(function() {
  Lists = Meteor.Collections ? Meteor.Collections.Lists : null;
  Patients = Meteor.Collections ? Meteor.Collections.Patients : null;
});

export function PatientMedicationLists() {
  const { id: patientId } = useParams();
  const [selectedListId, setSelectedListId] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Set patient context
  useEffect(function() {
    if (patientId) {
      Session.set('selectedPatientId', patientId);
    }
  }, [patientId]);
  
  const { medicationLists, selectedList, loading, patient } = useTracker(function() {
    const sub = Meteor.subscribe('lists', { patient: patientId });
    const patientSub = Meteor.subscribe('patients.one', patientId);
    
    let query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    // Filter for medication lists
    query.$or = [
      { 'code.coding.code': 'medications' },
      { 'code.coding.code': '10160-0' }, // History of medication use
      { 'code.coding.code': '29549-3' }  // Medication list
    ];
    
    return {
      medicationLists: Lists ? Lists.find(query, {
        sort: { date: -1 }
      }).fetch() : [],
      selectedList: selectedListId && Lists ? Lists.findOne(selectedListId) : null,
      loading: !sub.ready() || !patientSub.ready(),
      patient: Patients ? Patients.findOne(patientId) : null
    };
  }, [patientId, selectedListId]);
  
  function handleRowClick(listId) {
    setSelectedListId(listId);
    setDetailsDialogOpen(true);
  }
  
  function handleCloseDetails() {
    setDetailsDialogOpen(false);
    setSelectedListId('');
  }
  
  function handleAddList() {
    Session.set('mainAppDialogJson', {
      title: 'Add Medication List',
      message: 'Add medication list functionality coming soon'
    });
  }
  
  function renderHeader() {
    return (
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Medication Lists
        </Typography>
        {patient && (
          <Typography variant="subtitle1" color="textSecondary">
            {get(patient, 'name[0].given[0]')} {get(patient, 'name[0].family')}
            {' - '}
            {medicationLists.length} medication {medicationLists.length === 1 ? 'list' : 'lists'}
          </Typography>
        )}
      </Box>
    );
  }
  
  function renderControls() {
    return (
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center" justifyContent="flex-end">
          <Grid item>
            <PatientSyncButton
              patientId={patientId}
              resourceTypes={['List', 'MedicationStatement']}
              size="medium"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddList}
            >
              Add Medication List
            </Button>
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
            <Typography>Loading medication lists...</Typography>
          </Box>
        </StyledCard>
      );
    }
    
    return (
      <StyledCard>
        <MedicationListsTable
          lists={medicationLists}
          selectedListId={selectedListId}
          onRowClick={handleRowClick}
          showStatus={true}
        />
      </StyledCard>
    );
  }
  
  function renderDetailsDialog() {
    return (
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {get(selectedList, 'title', 'Medication List Details')}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseDetails}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedList ? (
            <ListDetail
              list={selectedList}
              showHeader={false}
            />
          ) : (
            <Typography>No list selected</Typography>
          )}
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <PageCanvas id="patientMedicationListsPage" headerHeight={120}>
      <Container maxWidth="xl">
        {renderHeader()}
        {renderControls()}
        {renderContent()}
        {renderDetailsDialog()}
      </Container>
    </PageCanvas>
  );
}