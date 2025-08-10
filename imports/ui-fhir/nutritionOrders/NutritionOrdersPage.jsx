// /imports/ui-fhir/nutritionOrders/NutritionOrdersPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
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
  Box,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';

import NutritionOrdersTable from './NutritionOrdersTable';

import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import FhirDehydrator from '../../lib/FhirDehydrator';

import { get, set } from 'lodash';

// Direct imports - avoid timing issues
import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

//=============================================================================================================================================
// GLOBAL THEMING

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(108, 183, 110)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(108, 183, 110)",
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
  background: "linear-gradient(45deg, rgb(108, 183, 110) 30%, rgb(150, 202, 144) 90%)",

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
Session.setDefault('NutritionOrdersTable.sortAscending', true)
Session.setDefault('NutritionOrdersPage.debugLogged', false)

//=============================================================================================================================================
// MAIN COMPONENT

export function NutritionOrdersPage(props){
  const navigate = useNavigate();

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  

  let [nutritionOrdersPageIndex, setNutritionOrdersPageIndex] = useState(0);
  let [searchFilter, setSearchFilter] = useState('');
  let [showPatientName, setShowPatientName] = useState(false);
  let [showPatientReference, setShowPatientReference] = useState(false);
  let [showSystemId, setShowSystemId] = useState(false);
  let [page, setPage] = useState(0);
  let [rowsPerPage, setRowsPerPage] = useState(10);

  let data = {
    nutritionOrders: [],
    selectedNutritionOrderId: '',
    selectedNutritionOrder: null
  };

  // Subscribe to nutrition orders with patient filtering
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    let query = {};
    
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'oralDiet.type.0.text': {$regex: searchFilter, $options: 'i'}},
          {'oralDiet.instruction': {$regex: searchFilter, $options: 'i'}},
          {'patient.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      // Combine with patient filter if it exists
      if(query.$or) {
        query = {
          $and: [
            query,
            searchQuery
          ]
        };
      } else {
        query = searchQuery;
      }
    }
    
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.NutritionOrders', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('nutritionorders.all');
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  // Data tracker for nutrition orders
  data.nutritionOrders = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'oralDiet.type.0.text': {$regex: searchFilter, $options: 'i'}},
          {'oralDiet.instruction': {$regex: searchFilter, $options: 'i'}},
          {'patient.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      // Combine with patient filter if it exists
      if(query.$or) {
        return NutritionOrders.find({
          $and: [
            query,
            searchQuery
          ]
        }).fetch();
      } else {
        return NutritionOrders.find(searchQuery).fetch();
      }
    }
    
    return NutritionOrders.find(query).fetch();
  }, [searchFilter]);

  data.selectedNutritionOrderId = useTracker(function(){
    return Session.get('selectedNutritionOrderId');
  }, []);

  data.selectedNutritionOrder = useTracker(function(){
    return NutritionOrders.findOne({_id: Session.get('selectedNutritionOrderId')});
  }, []);

  // Debug logging
  useEffect(() => {
    return () => {
      Session.set('NutritionOrdersPage.debugLogged', false);
    };
  }, []);

  if(!Session.get('NutritionOrdersPage.debugLogged')) {
    Session.set('NutritionOrdersPage.debugLogged', true);
    
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    const fhirId = get(selectedPatient, 'id');
    
    console.log('NutritionOrders data - MongoDB _id:', selectedPatientId);
    console.log('NutritionOrders data - FHIR id:', fhirId);
    console.log('NutritionOrders data - count:', data.nutritionOrders.length);
  }

  function handleAddNutritionOrder(){
    console.log('Add Nutrition Order button clicked');
    navigate('/nutrition-orders/new');
  }

  function handleToggleColumn(event, newFormats) {
    console.log('Toggle columns', newFormats);
    setShowPatientName(newFormats.includes('patientName'));
    setShowPatientReference(newFormats.includes('patientReference'));
    setShowSystemId(newFormats.includes('systemId'));
  }

  function handleSortChange() {
    const currentSort = Session.get('NutritionOrdersTable.sortAscending');
    Session.set('NutritionOrdersTable.sortAscending', !currentSort);
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
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
              <TextField
                id="nutritionOrderSearchInput"
                size="small"
                placeholder="Search nutrition orders..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200 }}
              />
              <ToggleButtonGroup
                value={[
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
                ].filter(Boolean)}
                onChange={handleToggleColumn}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="patientName" aria-label="show patient name">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="patientReference" aria-label="show patient reference">
                  <CodeIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <IconButton onClick={handleSortChange} size="small">
                <SortIcon />
              </IconButton>
              <Button
                id="addNutritionOrderButton"
                data-testid="add-nutrition-order-button"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNutritionOrder}
              >
                Add Nutrition Order
              </Button>
            </Box>
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
          id="nutritionOrdersTable"
          nutritionOrders={data.nutritionOrders}
          hideCheckbox={true} 
          hideActionIcons={true}
          hideIdentifier={true}
          hideStatus={false}
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideDateTime={false}
          hideOrderer={false}
          hideDietType={false}
          hideSupplement={false}
          hideInstructions={false}
          hideBarcode={!showSystemId}
          dateFormat="YYYY-MM-DD HH:mm"
          count={data.nutritionOrders.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onSetPage={setPage}
          onSetRowsPerPage={setRowsPerPage}
          onRowClick={function(nutritionOrderId){
            console.log('NutritionOrdersPage.onRowClick', nutritionOrderId);
            navigate('/nutrition-orders/' + nutritionOrderId);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <Box 
      data-testid="no-nutrition-orders"
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
            id="addNutritionOrderButton"
            data-testid="add-nutrition-order-button"
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