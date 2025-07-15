import React, { useState } from 'react';
import { useTracker, useSubscribe } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Grid, 
  Card,
  CardHeader,
  CardContent,
  Button,
  Tab, 
  Tabs,
  Typography,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import NutritionOrdersTable from './NutritionOrdersTable';

import LayoutHelpers from '../../lib/LayoutHelpers';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import FhirDehydrator from '../../lib/FhirDehydrator';

import { get, set } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  NutritionOrders = Meteor.Collections.NutritionOrders;
})

//=============================================================================================================================================
// GLOBAL THEMING

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(1177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(1177, 128, 13)",
  secondaryText: "rgba(255, 255, 255, 1) !important",

  cardColor: "rgba(255, 255, 255, 1) !important",
  cardTextColor: "rgba(0, 0, 0, 1) !important",

  errorColor: "rgb(128,20,60) !important",
  errorText: "#ffffff !important",

  appBarColor: "#f5f5f5 !important",
  appBarTextColor: "rgba(0, 0, 0, 1) !important",

  paperColor: "#f5f5f5 !important",
  paperTextColor: "rgba(0, 0, 0, 1) !important",

  backgroundCanvas: "rgba(255, 255, 255, 1) !important",
  background: "linear-gradient(45deg, rgb(1177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}

//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedNutritionOrderId', false);
Session.setDefault('selectedNutritionOrder', false);
Session.setDefault('nutritionOrderPageTabIndex', 1); 
Session.setDefault('nutritionOrderSearchFilter', ''); 
Session.setDefault('NutritionOrdersPage.onePageLayout', true)
Session.setDefault('NutritionOrdersPage.defaultQuery', {})
Session.setDefault('NutritionOrdersTable.hideCheckbox', true)
Session.setDefault('DevicesTable.nutritionOrdersIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function NutritionOrdersPage(props){
  const navigate = useNavigate();

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  

  let [nutritionOrdersPageIndex, setNutritionOrdersPageIndex] = useState(0);

  let data = {
    nutritionOrders: [],
    selectedNutritionOrderId: '',
    selectedNutritionOrder: null
  };

  // Subscribe to patient resources which includes NutritionOrders
  const patientId = Session.get('selectedPatientId');
  const isLoading = useSubscribe('pacio.patientResources', patientId);

  data.nutritionOrders = useTracker(function(){
    if (!NutritionOrders) {
      return [];
    }
    return NutritionOrders.find().fetch();
  }, []);
  data.selectedNutritionOrderId = useTracker(function(){
    return Session.get('selectedNutritionOrderId');
  }, []);
  data.selectedNutritionOrder = useTracker(function(){
    if (!NutritionOrders) {
      return null;
    }
    return NutritionOrders.findOne({_id: Session.get('selectedNutritionOrderId')});
  }, []);

  function handleAddNutritionOrder(){
    console.log('Add Nutrition Order button clicked');
    navigate('/nutritionOrders/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Nutrition Orders
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.nutritionOrders.length} nutrition orders found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddNutritionOrder}
            >
              Add Nutrition Order
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.nutritionOrders.length > 0){
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
        <NutritionOrdersTable 
          nutritionOrders={data.nutritionOrders}
          hideCheckbox={true} 
          hideActionIcons={true}
          hideIdentifier={true}
          hideStatus={false}
          hideName={false}
          paginationLimit={10}
          onRowClick={function(nutritionOrderId){
            console.log('NutritionOrdersPage.onRowClick', nutritionOrderId);
            navigate('/nutritionOrders/' + nutritionOrderId);
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
            onClick={handleAddNutritionOrder}
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
            Add Your First Nutrition Order
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box 
      id="nutritionOrdersPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.nutritionOrders.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default NutritionOrdersPage;