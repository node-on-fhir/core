// /imports/ui-fhir/carePlans/CarePlansPage.jsx

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

// import CarePlanDetail from './CarePlanDetail';
import CarePlansTable from './CarePlansTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  CarePlans = Meteor.Collections.CarePlans;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('carePlanPageTabIndex', 1); 
Session.setDefault('carePlanSearchFilter', ''); 
Session.setDefault('selectedCarePlanId', false);
Session.setDefault('selectedCarePlan', false)
Session.setDefault('CarePlansPage.onePageLayout', true)
Session.setDefault('CarePlansPage.defaultQuery', {})
Session.setDefault('CarePlansTable.hideCheckbox', true)
Session.setDefault('CarePlansTable.carePlansIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function CarePlansPage(props){
  const navigate = useNavigate();

  let data = {
    currentCarePlanId: '',
    selectedCarePlan: null,
    carePlans: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    carePlansIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('CarePlansPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('CarePlansTable.hideCheckbox');
  }, [])
  data.selectedCarePlanId = useTracker(function(){
    return Session.get('selectedCarePlanId');
  }, [])
  data.selectedCarePlan = useTracker(function(){
    return CarePlans.findOne({_id: Session.get('selectedCarePlanId')});
  }, [])
  data.carePlans = useTracker(function(){
    return CarePlans.find().fetch();
  }, [])
  data.carePlansIndex = useTracker(function(){
    return Session.get('CarePlansTable.carePlansIndex')
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

  function handleAddCarePlan(){
    console.log('Add Care Plan button clicked');
    navigate('/care-plans/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Care Plans
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.carePlans.length} care plans found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCarePlan}
            >
              Add Care Plan
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.carePlans.length > 0){
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
        <CarePlansTable 
          id='carePlansTable'
          carePlans={data.carePlans}
          count={data.carePlans.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.CarePlans.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            CarePlans._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('CarePlansTable.carePlansIndex', index)
          }}        
          page={data.carePlansIndex}
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
            onClick={handleAddCarePlan}
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
            Add Your First Care Plan
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="carePlansPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.carePlans.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default CarePlansPage;