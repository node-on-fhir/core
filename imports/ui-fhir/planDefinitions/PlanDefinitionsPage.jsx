// /imports/ui-fhir/planDefinitions/PlanDefinitionsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';

import PlanDefinitionsTable from './PlanDefinitionsTable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';
import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';


//=============================================================================================================================================
// DATA CURSORS

//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedPlanDefinitionId', false);


Session.setDefault('planDefinitionPageTabIndex', 1); 
Session.setDefault('planDefinitionSearchFilter', ''); 
Session.setDefault('selectedPlanDefinitionId', false);
Session.setDefault('selectedPlanDefinition', false)
Session.setDefault('PlanDefinitionsPage.onePageLayout', true)
Session.setDefault('PlanDefinitionsPage.defaultQuery', {})
Session.setDefault('PlanDefinitionsTable.hideCheckbox', true)
Session.setDefault('PlanDefinitionsTable.planDefinitionsIndex', 0)



//=============================================================================================================================================
// GLOBAL THEMING

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(177, 128, 13)",
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
  background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}


//=============================================================================================================================================
// COMPONENTS

export function PlanDefinitionsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    selectedPlanDefinitionId: '',
    selectedPlanDefinition: false,
    planDefinitions: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    planDefinitionsIndex: 0
  };
  
  // Subscribe to plan definitions data with search filter
  const isLoading = useTracker(() => {
    // Try the hermes-tooling publication which we know exists
    const handle = Meteor.subscribe('planDefinitions');
    
    console.log('PlanDefinitionsPage - Subscription status:', handle.ready());
    
    // Return loading state - handle might be undefined in test environment
    return handle ? !handle.ready() : false;
  }, []);


  data.selectedPlanDefinitionId = useTracker(function(){
    return Session.get('selectedPlanDefinitionId');
  }, [])
  data.selectedPlanDefinition = useTracker(function(){
    return PlanDefinitions.findOne(Session.get('selectedPlanDefinitionId'));
  }, [])
  data.planDefinitions = useTracker(function(){
    // No patient filtering for PlanDefinitions - it's a definition resource
    const results = PlanDefinitions.find({}).fetch();
    console.log('PlanDefinitionsPage - Found', results.length, 'PlanDefinitions in collection');
    return results;
  }, [])
  data.planDefinitionsIndex = useTracker(function(){
    return Session.get('PlanDefinitionsTable.planDefinitionsIndex')
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

  function handleAddPlanDefinition(){
    console.log('Add Plan Definition button clicked');
    navigate('/plan-definitions/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Plan Definitions
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.planDefinitions.length} plan definitions found
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={handleSortOrderChange}
                aria-label="sort order"
                size="small"
              >
                <ToggleButton value="ascending" aria-label="ascending order">
                  <ArrowUpwardIcon />
                </ToggleButton>
                <ToggleButton value="descending" aria-label="descending order">
                  <ArrowDownwardIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <ToggleButtonGroup
                value={[
                  ...(showSystemId ? ['systemId'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddPlanDefinition}
              >
                Add Plan Definition
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="planDefinitionSearchInput"
            fullWidth
            placeholder="Search plan definitions by ID, URL, name, title, status, or publisher..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>
    );
  }
  
  let layoutContent;
  if(isLoading) {
    layoutContent = <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography>Loading plan definitions...</Typography>
    </Box>
  } else if(data.planDefinitions.length > 0){
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
        <PlanDefinitionsTable 
          id='planDefinitionsTable'
          planDefinitions={data.planDefinitions}
          count={data.planDefinitions.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onRowClick={function(planDefinitionId){
            console.log('PlanDefinitionsPage.onRowClick', planDefinitionId);
            navigate('/plan-definitions/' + planDefinitionId);
          }}
          onSetPage={function(index){
            Session.set('PlanDefinitionsTable.planDefinitionsIndex', index);
          }}                
          page={data.planDefinitionsIndex}
        />
      </CardContent>
    </Card>
  } else {
    // Show empty state with "Add Your First Plan Definition" button
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {searchFilter ? `No plan definitions found matching "${searchFilter}"` : 'No plan definitions found'}
        </Typography>
        {searchFilter ? (
          <Button
            variant="outlined"
            onClick={() => setSearchFilter('')}
          >
            Clear Search
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddPlanDefinition}
          >
            Add Your First Plan Definition
          </Button>
        )}
      </CardContent>
    </Card>
  }

  return (
    <Box 
      id="planDefinitionsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContent }
    </Box>
  );
}


export default PlanDefinitionsPage;
