// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/careTeams/CareTeamsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { 
  Grid,
  Card,
  CardHeader,
  CardContent,
  Container,
  Box,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import CareTeamDetail from './CareTeamDetail';
import CareTeamsTable from './CareTeamsTable';

import FhirDehydrator from '../../lib/FhirDehydrator';


import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, cloneDeep } from 'lodash';
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { FhirUtilities } from '/imports/lib/FhirUtilities';


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



//---------------------------------------------------------------
// Session Variables


Session.setDefault('careTeamPageTabIndex', 0);
Session.setDefault('careTeamSearchFilter', '');
Session.setDefault('selectedCareTeamId', '');
Session.setDefault('selectedCareTeam', false);
Session.setDefault('CareTeamsPage.onePageLayout', true)
Session.setDefault('CareTeamsTable.hideCheckbox', true)
Session.setDefault('CareTeamsTable.careTeamsIndex', 0)



//=============================================================================================================================================
// COMPONENT

function CareTeamsPage(props){
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('CareTeamsPage.debugLogged', false);
    };
  }, []);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  
  let cardWidth = window.innerWidth - paddingWidth;

  // Subscribe to CareTeams data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    // Build search and patient filter query
    let query = {};
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'name': {$regex: searchFilter, $options: 'i'}},
          {'category.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'category.0.text': {$regex: searchFilter, $options: 'i'}},
          {'participant.0.member.display': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    // Apply patient filter if a patient is selected
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      const patientQuery = FhirUtilities.addPatientFilterToQuery(fhirId || selectedPatientId);
      
      // Combine search and patient queries
      if(query.$or) {
        query = {
          $and: [
            query,
            patientQuery
          ]
        };
      } else {
        query = patientQuery;
      }
    }
    
    console.log('CareTeams subscription - selectedPatientId:', selectedPatientId);
    console.log('CareTeams subscription - FHIR id:', get(selectedPatient, 'id'));
    console.log('CareTeams subscription query:', query);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.CareTeams', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('careteams.all');
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {    
    selectedCareTeam: null,
    selectedCareTeamId: '',
    onePageLayout: true,
    hideCheckbox: true,
    careTeams: [],
    careTeamsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('CareTeamsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('CareTeamsTable.hideCheckbox');
  }, [])

  data.selectedCareTeam = useTracker(function(){
    return CareTeams.findOne({id: Session.get('selectedCareTeamId')});
  }, [])
  data.selectedCareTeamId = useTracker(function(){
    return Session.get('selectedCareTeamId');
  }, [])
  data.careTeams = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering, as that's what FHIR resources reference
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    let query = {};
    
    // Apply patient filter if needed
    if(patientIdToUse) {
      query = FhirUtilities.addPatientFilterToQuery(patientIdToUse);
    }
    
    // Apply search filter on client side if not using autopublish
    let filteredTeams = CareTeams.find(query, {sort: {_id: sortOrder === 'ascending' ? 1 : -1}}).fetch();
    
    if(searchFilter && searchFilter.length > 0 && !get(Meteor, 'settings.public.defaults.autoSubscribe', false)) {
      filteredTeams = filteredTeams.filter(team => {
        const searchLower = searchFilter.toLowerCase();
        return (
          (team._id && team._id.includes(searchFilter)) ||
          (team.id && team.id.includes(searchFilter)) ||
          (team.name && team.name.toLowerCase().includes(searchLower)) ||
          (get(team, 'category[0].text', '').toLowerCase().includes(searchLower)) ||
          (get(team, 'category[0].coding[0].display', '').toLowerCase().includes(searchLower)) ||
          (get(team, 'participant[0].member.display', '').toLowerCase().includes(searchLower)) ||
          (get(team, 'subject.display', '').toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Only do debug logging once when component mounts
    if(!Session.get('CareTeamsPage.debugLogged')) {
      Session.set('CareTeamsPage.debugLogged', true);
      
      console.log('CareTeams data - MongoDB _id:', selectedPatientId);
      console.log('CareTeams data - FHIR id:', fhirId);
      console.log('CareTeams data - Using ID for query:', patientIdToUse);
      console.log('CareTeams data - query:', query);
      console.log('CareTeams data - Total found:', filteredTeams.length);
    }
    
    return filteredTeams;
  }, [searchFilter, sortOrder])
  data.careTeamsIndex = useTracker(function(){
    return Session.get('CareTeamsTable.careTeamsIndex', 0)
  }, [])

  function handleRowClick(careTeamId){
    console.log('CareTeamsPage.handleRowClick', careTeamId)
    let careTeam = CareTeams.findOne({id: careTeamId});
    
    if(!careTeam) {
      // Try finding by _id as fallback
      careTeam = CareTeams.findOne({_id: careTeamId});
    }

    if(careTeam){
      Session.set('selectedCareTeamId', get(careTeam, 'id'));
      Session.set('selectedCareTeam', careTeam);
      Session.set('CareTeam.Current', careTeam);
      
      // Navigate to detail page
      navigate('/care-teams/' + get(careTeam, 'id', careTeamId));
    } else {
      console.log('No careteam found...')
    }
  }

  function handleAddCareTeam(){
    console.log('CareTeamsPage.handleAddCareTeam');
    navigate('/care-teams/new');
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
              Care Teams
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.careTeams.length} care teams found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="careTeamSearchInput"
              fullWidth
              placeholder="Search care teams by name, category, participant..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
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
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
                ].filter(Boolean)}
                onChange={(event, newFormats) => {
                  setShowPatientName(newFormats.includes('patientName'));
                  setShowPatientReference(newFormats.includes('patientReference'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
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
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddCareTeam}
              >
                Add Care Team
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.careTeams.length > 0){
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
        <CareTeamsTable 
          id='careTeamsTable'
          careTeams={ data.careTeams}
          count={ data.careTeams.length}
          hideCheckbox={data.hideCheckbox}
          formFactorLayout={formFactor}
          hideSubject={!showPatientName}
          hideSubjectReference={!showPatientReference}
          hideBarcode={!showSystemId}
          rowsPerPage={ LayoutHelpers.calcTableRows() }
          onRowClick={ handleRowClick.bind(this) }
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.CareTeams.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            CareTeams._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('CareTeamsTable.careTeamsIndex', index)
          }}        
          page={data.careTeamsIndex}
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
            onClick={handleAddCareTeam}
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
            Add Your First Care Team
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box 
      id="careTeamsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.careTeams.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}


export default CareTeamsPage;