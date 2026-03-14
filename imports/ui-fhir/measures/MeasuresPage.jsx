// /imports/ui-fhir/measures/MeasuresPage.jsx

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
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';

import MeasuresTable from './MeasuresTable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';
import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';


//=============================================================================================================================================
// DATA CURSORS


//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedMeasureId', false);


Session.setDefault('measurePageTabIndex', 1); 
Session.setDefault('measureSearchFilter', ''); 
Session.setDefault('selectedMeasureId', false);
Session.setDefault('selectedMeasure', false)
Session.setDefault('MeasuresPage.onePageLayout', true)
Session.setDefault('MeasuresPage.defaultQuery', {})
Session.setDefault('MeasuresTable.hideCheckbox', true)
Session.setDefault('MeasuresTable.measuresIndex', 0)



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

export function MeasuresPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showAuthorDisplay, setShowAuthorDisplay] = useState(false);
  const [showAuthorReference, setShowAuthorReference] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    selectedMeasureId: '',
    selectedMeasure: false,
    measures: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    measuresIndex: 0
  };
  
  // Subscribe to measures data with search filter
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    // Build query for subscription
    let query = {};
    
    // Add search filter
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'identifier.0.value': {$regex: searchFilter, $options: 'i'}},
          {'name': {$regex: searchFilter, $options: 'i'}},
          {'title': {$regex: searchFilter, $options: 'i'}},
          {'version': {$regex: searchFilter, $options: 'i'}},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'description': {$regex: searchFilter, $options: 'i'}},
          {'purpose': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Measures', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Measures', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [searchFilter]);


  data.selectedMeasureId = useTracker(function(){
    return Session.get('selectedMeasureId');
  }, [])
  data.selectedMeasure = useTracker(function(){
    return Measures.findOne(Session.get('selectedMeasureId'));
  }, [])
  data.measures = useTracker(function(){
    // No patient filtering for Measures - it's a definition resource
    return Measures.find({}).fetch();
  }, [])
  data.measuresIndex = useTracker(function(){
    return Session.get('MeasuresTable.measuresIndex')
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

  function handleAddMeasure(){
    console.log('Add Measure button clicked');
    navigate('/measures/new');
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
              Measures
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.measures.length} measures found
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
                  ...(showSystemId ? ['systemId'] : []),
                  ...(showAuthorDisplay ? ['authorDisplay'] : []),
                  ...(showAuthorReference ? ['authorReference'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowSystemId(newFormats.includes('systemId'));
                  setShowAuthorDisplay(newFormats.includes('authorDisplay'));
                  setShowAuthorReference(newFormats.includes('authorReference'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
                <ToggleButton value="authorDisplay" aria-label="show author display">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="authorReference" aria-label="show author reference">
                  <CodeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMeasure}
              >
                Add Measure
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="measureSearchInput"
            fullWidth
            placeholder="Search measures by ID, identifier, name, title, status, or description..."
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
  if(data.measures.length > 0){
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
        <MeasuresTable 
          id='measuresTable'
          measures={data.measures}
          count={data.measures.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hideAuthorDisplay={!showAuthorDisplay}
          hideAuthorReference={!showAuthorReference}
          order={sortOrder}
          onRowClick={function(measureId){
            console.log('MeasuresPage.onRowClick', measureId);
            navigate('/measures/' + measureId);
          }}
          onSetPage={function(index){
            Session.set('MeasuresTable.measuresIndex', index);
          }}                
          page={data.measuresIndex}
        />
      </CardContent>
    </Card>
  } else {
    // Show empty state with "Add Your First Measure" button
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
          {searchFilter ? `No measures found matching "${searchFilter}"` : 'No measures found'}
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
            onClick={handleAddMeasure}
          >
            Add Your First Measure
          </Button>
        )}
      </CardContent>
    </Card>
  }

  return (
    <Box 
      id="measuresPage" 
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


export default MeasuresPage;