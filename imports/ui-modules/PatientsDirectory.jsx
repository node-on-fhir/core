// /imports/ui-modules/PatientsDirectory.jsx

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid,
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientsTable from '../ui-tables/PatientsTable';
import LayoutHelpers from '../lib/LayoutHelpers';

import { get, has, set } from 'lodash';



let defaultPatient = {
  index: 2,
  id: '',
  username: '',
  email: '',
  given: '',
  family: '',
  gender: ''
};



//===========================================================================

Meteor.startup(function(){
  Patients = Meteor.Collections.Patients;
})

//===========================================================================
// SESSION VARIABLES

Session.setDefault('patientFormData', defaultPatient);
Session.setDefault('patientSearchFilter', '');
Session.setDefault('selectedPatientId', null);
Session.setDefault('selectedPatient', null);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('patientPageTabIndex', 0)
Session.setDefault('PatientsDirectory.onePageLayout', true)
Session.setDefault('PatientsDirectory.defaultQuery', {})
Session.setDefault('PatientsTable.hideCheckbox', true)
Session.setDefault('PatientsTable.patientsIndex', 0)


//===========================================================================
// MAIN COMPONENT  

export function PatientsDirectory(props){

  let data = {
    selectedPatientId: '',
    selectedPatient: null,
    patients: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    organizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('PatientsDirectory.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('PatientsTable.hideCheckbox');
  }, [])
  data.selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, [])
  data.selectedPatient = useTracker(function(){
    return Patients.findOne({_id: Session.get('selectedPatientId')});
  }, [])
  data.patients = useTracker(function(){
    return Patients.find().fetch();
  }, [])
  data.patientsIndex = useTracker(function(){
    return Session.get('PatientsTable.patientsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  // let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  // let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddPatient(){
    console.log('Add Patient button clicked');
    // Add logic for adding a new patient
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Patients
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.patients.length} patients found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddPatient}
            >
              Add Patient
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.patients.length > 0){
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <PatientsTable 
          id='patientsTable'
          patients={data.patients}
          count={data.patients.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Patients.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Patients._collection.remove({_id: selectedId})
          }}
          rowClickMode="id"
          onRowClick={function(patientId){
            console.log('onTableRowClick', patientId);

            Session.set('selectedPatientId', patientId);
            Session.set('selectedPatient', Patients.findOne({id: patientId}));

            console.log('openUrlOnRowClick', get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', ''))
            if(get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick')){
              // Navigate to patient chart when View Chart is clicked
              window.location.href = get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', '/patient-chart');
            }
          }}
          onFhirOperations={function(patientId){
            console.log('FHIR Operations for patient:', patientId);
            // Navigate to FHIR operations page
            window.location.href = `/patient/${patientId}/fhir`;
          }}
          onSetPage={function(index){
            Session.set('PatientsTable.patientsIndex', index)
          }}        
          page={data.patientsIndex}
          logger={window.logger ? window.logger : null}
          size="medium"
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card 
        sx={{ 
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                mb: 2
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddPatient}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Add Your First Patient
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="patientsDirectory" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      <Box sx={{ width: '100%' }}>
        { data.patients.length > 0 && renderHeader() }
        { layoutContent }
      </Box>
    </Box>
  );
}


export default PatientsDirectory;


