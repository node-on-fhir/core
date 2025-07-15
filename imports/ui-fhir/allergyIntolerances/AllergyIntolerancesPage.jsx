// /imports/ui-fhir/allergyIntolerances/AllergyIntolerancesPage.jsx

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

// import AllergyIntoleranceDetail from './AllergyIntoleranceDetail';
import AllergyIntolerancesTable from './AllergyIntolerancesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  AllergyIntolerances = Meteor.Collections.AllergyIntolerances;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedAllergyIntoleranceId', false);


Session.setDefault('allergyIntolerancePageTabIndex', 1); 
Session.setDefault('allergyIntoleranceSearchFilter', ''); 
Session.setDefault('selectedAllergyIntoleranceId', false);
Session.setDefault('selectedAllergyIntolerance', false)
Session.setDefault('AllergyIntolerancesPage.onePageLayout', true)
Session.setDefault('AllergyIntolerancesPage.defaultQuery', {})
Session.setDefault('AllergyIntolerancesTable.hideCheckbox', true)
Session.setDefault('AllergyIntolerancesTable.allergyIntolerancesIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function AllergyIntolerancesPage(props){
  const navigate = useNavigate();

  let data = {
    currentAllergyIntoleranceId: '',
    selectedAllergyIntolerance: null,
    allergyIntolerances: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    allergyIntolerancesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('AllergyIntolerancesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('AllergyIntolerancesTable.hideCheckbox');
  }, [])
  data.selectedAllergyIntoleranceId = useTracker(function(){
    return Session.get('selectedAllergyIntoleranceId');
  }, [])
  data.selectedAllergyIntolerance = useTracker(function(){
    return AllergyIntolerances.findOne({_id: Session.get('selectedAllergyIntoleranceId')});
  }, [])
  data.allergyIntolerances = useTracker(function(){
    return AllergyIntolerances.find().fetch();
  }, [])
  data.allergyIntolerancesIndex = useTracker(function(){
    return Session.get('AllergyIntolerancesTable.allergyIntolerancesIndex')
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

  function handleAddAllergyIntolerance(){
    console.log('Add Allergy Intolerance button clicked');
    navigate('/allergy-intolerances/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Allergy Intolerances
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.allergyIntolerances.length} allergy intolerances found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddAllergyIntolerance}
            >
              Add Allergy
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.allergyIntolerances.length > 0){
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
        <AllergyIntolerancesTable 
          id='allergyIntolerancesTable'
          allergyIntolerances={data.allergyIntolerances}
          count={data.allergyIntolerances.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.AllergyIntolerances.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            AllergyIntolerances._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('AllergyIntolerancesTable.allergyIntolerancesIndex', index)
          }}        
          page={data.allergyIntolerancesIndex}
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
            onClick={handleAddAllergyIntolerance}
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
            Add Your First Allergy
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="allergyIntolerancesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.allergyIntolerances.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default AllergyIntolerancesPage;