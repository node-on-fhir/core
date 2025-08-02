import React, { useState } from 'react';
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
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import CareTeamDetail from './CareTeamDetail';
import CareTeamsTable from './CareTeamsTable';

import FhirDehydrator from '../../lib/FhirDehydrator';


import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, cloneDeep } from 'lodash';
import { CareTeams } from '../../lib/schemas/SimpleSchemas/CareTeams';
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



//=============================================================================================================================================
// COMPONENT

function CareTeamsPage(props){
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  
  let cardWidth = window.innerWidth - paddingWidth;

  // Subscribe to CareTeams data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    // Build query to filter by patient
    const query = selectedPatientId ? {
      $or: [
        {"patient.reference": "Patient/" + selectedPatientId},
        {"subject.reference": "Patient/" + selectedPatientId},
        {"patient.reference": { $regex: ".*Patient/" + selectedPatientId}}, 
        {"subject.reference": { $regex: ".*Patient/" + selectedPatientId}}
      ]
    } : {};
    
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.CareTeams', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('careteams.all');
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId')]);

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
    const query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
    return CareTeams.find(query).fetch();
  }, [])
  data.careTeamsIndex = useTracker(function(){
    return Session.get('CareTeamsTable.careTeamsIndex', 0)
  }, [])

  function handleRowClick(careTeamId){
    console.log('CareTeamsPage.handleRowClick', careTeamId)
    let careTeam = CareTeams.findOne({id: careTeamId});

    if(careTeam){
      Session.set('selectedCareTeamId', get(careTeam, 'id'));
      Session.set('selectedCareTeam', careTeam);
      Session.set('CareTeam.Current', careTeam);
      
      let showModals = true;
      if(showModals){
        Session.set('mainAppDialogOpen', true);
        Session.set('mainAppDialogComponent', "CareTeamDetail");
        Session.set('mainAppDialogMaxWidth', "sm");
        if(Meteor.currentUserId()){
          Session.set('mainAppDialogTitle', "Edit Team");
        } else {
          Session.set('mainAppDialogTitle', "View Team");
        }
      }      
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