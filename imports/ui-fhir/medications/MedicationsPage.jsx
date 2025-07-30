import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

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

// import MedicationDetail from './MedicationDetail';
import MedicationsTable from './MedicationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Medications = Meteor.Collections.Medications;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedMedicationId', false);


Session.setDefault('medicationPageTabIndex', 1); 
Session.setDefault('medicationSearchFilter', ''); 
Session.setDefault('selectedMedicationId', false);
Session.setDefault('selectedMedication', false)
Session.setDefault('MedicationsPage.onePageLayout', true)
Session.setDefault('MedicationsPage.defaultQuery', {})
Session.setDefault('MedicationsTable.hideCheckbox', true)
Session.setDefault('MedicationsTable.medicationsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function MedicationsPage(props){
  const navigate = useNavigate();

  // Subscribe to medications data
  const isLoading = useTracker(() => {
    // Check if we should use autopublish (development mode)
    const handle = Meteor.subscribe('autopublish.Medications', {}, {});
    return !handle.ready();
  }, []);

  let data = {
    currentMedicationId: '',
    selectedMedication: null,
    medications: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    medicationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('MedicationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('MedicationsTable.hideCheckbox');
  }, [])
  data.selectedMedicationId = useTracker(function(){
    return Session.get('selectedMedicationId');
  }, [])
  data.selectedMedication = useTracker(function(){
    return Medications.findOne({_id: Session.get('selectedMedicationId')});
  }, [])
  data.medications = useTracker(function(){
    return Medications.find().fetch();
  }, [])
  data.medicationsIndex = useTracker(function(){
    return Session.get('MedicationsTable.medicationsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddMedication(){
    console.log('Add Medication button clicked');
    navigate('/medications/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Medications
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.medications.length} medications found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddMedication}
            >
              Add Medication
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.medications.length > 0){
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
        <MedicationsTable 
          id='medicationsTable'
          medications={data.medications}
          count={data.medications.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Medications.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Medications._collection.remove({_id: selectedId})
          }}
          onRowClick={function(medicationId){
            console.log('Medication row clicked:', medicationId);
            Session.set('selectedMedicationId', medicationId);
            navigate('/medications/' + medicationId);
          }}
          onSetPage={function(index){
            Session.set('MedicationsTable.medicationsIndex', index)
          }}        
          page={data.medicationsIndex}
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
            onClick={handleAddMedication}
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
            Add Your First Medication
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="medicationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.medications.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default MedicationsPage;