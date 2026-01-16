// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/locations/LocationsPage.jsx

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

// import LocationDetail from './LocationDetail';
import LocationsTable from './LocationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Locations = Meteor.Collections.Locations;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedLocationId', false);


Session.setDefault('locationPageTabIndex', 1); 
Session.setDefault('locationSearchFilter', ''); 
Session.setDefault('selectedLocationId', false);
Session.setDefault('selectedLocation', false)
Session.setDefault('LocationsPage.onePageLayout', true)
Session.setDefault('LocationsPage.defaultQuery', {})
Session.setDefault('LocationsTable.hideCheckbox', true)
Session.setDefault('LocationsTable.locationsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function LocationsPage(props){
  const navigate = useNavigate();

  let data = {
    currentLocationId: '',
    selectedLocation: null,
    locations: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    locationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('LocationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('LocationsTable.hideCheckbox');
  }, [])
  data.selectedLocationId = useTracker(function(){
    return Session.get('selectedLocationId');
  }, [])
  data.selectedLocation = useTracker(function(){
    return Locations.findOne({_id: Session.get('selectedLocationId')});
  }, [])
  // Subscribe to locations data
  const isLoading = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.Locations', {}, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('locations.all');
      return !handle.ready();
    }
  }, []);
  
  data.locations = useTracker(function(){
    return Locations.find().fetch();
  }, [])
  data.locationsIndex = useTracker(function(){
    return Session.get('LocationsTable.locationsIndex')
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

  function handleAddLocation(){
    console.log('Add Location button clicked');
    navigate('/locations/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Locations
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.locations.length} locations found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddLocation}
            >
              Add Location
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.locations.length > 0){
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
        <LocationsTable 
          id='locationsTable'
          locations={data.locations}
          count={data.locations.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Locations.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Locations._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setLocationsPageIndex(index)
          }}        
          page={data.locationsIndex}
          onRowClick={function(locationId){
            console.log('LocationsPage: Row clicked with ID:', locationId);
            navigate('/locations/' + locationId);
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
            onClick={handleAddLocation}
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
            Add Your First Location
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="locationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.locations.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default LocationsPage;