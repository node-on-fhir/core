// /imports/ui-fhir/practitioners/PractitionersPage.jsx

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

// import PractitionerDetail from './PractitionerDetail';
import PractitionersTable from './PractitionersTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

let Practitioners;
Meteor.startup(async function(){
  if(Meteor.isClient){
    Practitioners = await global.Collections.Practitioners;
  }
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedPractitionerId', false);


Session.setDefault('practitionerPageTabIndex', 1); 
Session.setDefault('practitionerSearchFilter', ''); 
Session.setDefault('selectedPractitionerId', false);
Session.setDefault('selectedPractitioner', false)
Session.setDefault('PractitionersPage.onePageLayout', true)
Session.setDefault('PractitionersPage.defaultQuery', {})
Session.setDefault('PractitionersTable.hideCheckbox', true)
Session.setDefault('PractitionersTable.practitionersIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function PractitionersPage(props){
  const navigate = useNavigate();

  let data = {
    currentPractitionerId: '',
    selectedPractitioner: null,
    practitioners: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    practitionersIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('PractitionersPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('PractitionersTable.hideCheckbox');
  }, [])
  data.selectedPractitionerId = useTracker(function(){
    return Session.get('selectedPractitionerId');
  }, [])
  data.selectedPractitioner = useTracker(function(){
    if(Practitioners){
      return Practitioners.findOne({_id: Session.get('selectedPractitionerId')});
    }
    return null;
  }, [])
  data.practitioners = useTracker(function(){
    if(Practitioners){
      return Practitioners.find().fetch();
    }
    return [];
  }, [])
  data.practitionersIndex = useTracker(function(){
    return Session.get('PractitionersTable.practitionersIndex')
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

  function handleAddPractitioner(){
    console.log('Add Practitioner button clicked');
    navigate('/practitioners/new');
    // Add logic for adding a new practitioner
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Practitioners
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.practitioners.length} practitioners found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddPractitioner}
            >
              Add Practitioner
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.practitioners.length > 0){
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
        <PractitionersTable 
          id='practitionersTable'
          practitioners={data.practitioners}
          count={data.practitioners.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Practitioners.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Practitioners._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('PractitionersTable.practitionersIndex', index);
          }}        
          page={data.practitionersIndex}
          onRowClick={function(practitionerId){
            console.log('PractitionersPage.onRowClick', practitionerId);
            navigate('/practitioners/' + practitionerId);
          }}
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
            onClick={handleAddPractitioner}
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
            Add Your First Practitioner
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="practitionersPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.practitioners.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default PractitionersPage;