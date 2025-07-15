// /packages/pacio-core/client/pages/PatientNutritionOrders.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button,
  Box,
  Grid
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import { NutritionOrdersTable } from '/imports/ui-fhir/NutritionOrders/NutritionOrdersTable';
import { NutritionOrderDetail } from '/imports/ui-fhir/NutritionOrders/NutritionOrderDetail';
import { PatientSyncButton } from '../components/shared/PatientSyncButton';
import { StyledCard, PatientCard } from '/imports/ui-fhir/components/StyledCard';
import { PageCanvas } from '/imports/ui-fhir/layouts/PageCanvas';
// import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';

// Get collections from Meteor.Collections
let NutritionOrders;
let Patients;

Meteor.startup(function() {
  NutritionOrders = Meteor.Collections ? Meteor.Collections.NutritionOrders : null;
  Patients = Meteor.Collections ? Meteor.Collections.Patients : null;
});

export function PatientNutritionOrders() {
  const { id: patientId } = useParams();
  const [selectedOrderId, setSelectedOrderId] = useState('');
  
  // Set patient context
  useEffect(function() {
    if (patientId) {
      Session.set('selectedPatientId', patientId);
    }
  }, [patientId]);
  
  const { nutritionOrders, selectedOrder, loading, patient } = useTracker(function() {
    const sub = Meteor.subscribe('nutritionOrders', { patient: patientId });
    const patientSub = Meteor.subscribe('patients.one', patientId);
    
    let query = {};
    if (patientId) {
      query['patient.reference'] = `Patient/${patientId}`;
    }
    
    return {
      nutritionOrders: NutritionOrders ? NutritionOrders.find(query, {
        sort: { dateTime: -1 }
      }).fetch() : [],
      selectedOrder: selectedOrderId && NutritionOrders ? NutritionOrders.findOne(selectedOrderId) : null,
      loading: !sub.ready() || !patientSub.ready(),
      patient: Patients ? Patients.findOne(patientId) : null
    };
  }, [patientId, selectedOrderId]);
  
  function handleRowClick(orderId) {
    setSelectedOrderId(orderId);
  }
  
  function handleAddOrder() {
    Session.set('mainAppDialogJson', {
      title: 'Add Nutrition Order',
      message: 'Add nutrition order functionality coming soon'
    });
  }
  
  function renderHeader() {
    return (
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Nutrition Orders
        </Typography>
        {patient && (
          <Typography variant="subtitle1" color="textSecondary">
            {get(patient, 'name[0].given[0]')} {get(patient, 'name[0].family')}
            {' - '}
            {nutritionOrders.length} {nutritionOrders.length === 1 ? 'order' : 'orders'}
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
              resourceTypes={['NutritionOrder']}
              size="medium"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddOrder}
            >
              Add Nutrition Order
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
            <Typography>Loading nutrition orders...</Typography>
          </Box>
        </StyledCard>
      );
    }
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedOrder ? 6 : 12}>
          <StyledCard>
            <NutritionOrdersTable
              nutritionOrders={nutritionOrders}
              selectedOrderId={selectedOrderId}
              onRowClick={handleRowClick}
              showStatus={true}
              showOrderer={true}
              tableRowSize="medium"
            />
          </StyledCard>
        </Grid>
        
        {selectedOrder && (
          <Grid item xs={12} md={6}>
            <PatientCard>
              <NutritionOrderDetail
                nutritionOrder={selectedOrder}
                showHeader={true}
                showPatientCard={false}
              />
            </PatientCard>
          </Grid>
        )}
      </Grid>
    );
  }
  
  return (
    <PageCanvas id="patientNutritionOrdersPage" headerHeight={120}>
      <Container maxWidth="xl">
        {renderHeader()}
        {renderControls()}
        {renderContent()}
      </Container>
    </PageCanvas>
  );
}