// imports/ui-fhir/episodeOfCares/EpisodeOfCaresPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  TextField,
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

import EpisodeOfCaresTable from './EpisodeOfCaresTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

import { EpisodeOfCares } from '/imports/lib/schemas/SimpleSchemas/EpisodeOfCares';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedEpisodeOfCareId', false);
Session.setDefault('episodeOfCareSearchFilter', '');
Session.setDefault('EpisodeOfCaresPage.onePageLayout', true);
Session.setDefault('EpisodeOfCaresPage.defaultQuery', {});
Session.setDefault('EpisodeOfCaresTable.hideCheckbox', true);
Session.setDefault('EpisodeOfCaresTable.episodeOfCaresIndex', 0);


//=============================================================================================================================================
// MAIN COMPONENT

export function EpisodeOfCaresPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchParams] = useSearchParams();
  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  // Clean up debug flag on unmount
  useEffect(function() {
    return function() {
      Session.set('EpisodeOfCaresPage.debugLogged', false);
    };
  }, []);

  // Subscribe to episodeOfCares data
  const isLoading = useTracker(function() {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};

    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');

      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    if(searchFilter && searchFilter.length > 0) {
      query = {
        $and: [
          query,
          {
            $or: [
              {'_id': searchFilter},
              {'id': searchFilter},
              {'status': {$regex: searchFilter, $options: 'i'}},
              {'type.0.text': {$regex: searchFilter, $options: 'i'}},
              {'type.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
              {'patient.display': {$regex: searchFilter, $options: 'i'}},
              {'careManager.display': {$regex: searchFilter, $options: 'i'}},
              {'managingOrganization.display': {$regex: searchFilter, $options: 'i'}}
            ]
          }
        ]
      };
    }

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.EpisodeOfCares', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.EpisodeOfCares', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentEpisodeOfCareId: '',
    selectedEpisodeOfCare: null,
    episodeOfCares: [],
    onePageLayout: true,
    episodeOfCaresIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('EpisodeOfCaresPage.onePageLayout');
  }, []);
  data.selectedEpisodeOfCareId = useTracker(function(){
    return Session.get('selectedEpisodeOfCareId');
  }, []);
  data.episodeOfCares = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;

    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};

    if(!Session.get('EpisodeOfCaresPage.debugLogged')) {
      Session.set('EpisodeOfCaresPage.debugLogged', true);
      console.log('EpisodeOfCares data - query:', query);

      const allEpisodeOfCares = EpisodeOfCares.find().fetch();
      console.log('Total EpisodeOfCares in client collection:', allEpisodeOfCares.length);
    }

    const results = EpisodeOfCares.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, []);
  data.episodeOfCaresIndex = useTracker(function(){
    return Session.get('EpisodeOfCaresTable.episodeOfCaresIndex');
  }, []);


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  function handleAddEpisodeOfCare(){
    console.log('Add Episode of Care button clicked');
    navigate('/episode-of-cares/new');
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
              Episodes of Care
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.episodeOfCares.length} episodes found
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
                onChange={function(event, newFormats) {
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
                onClick={handleAddEpisodeOfCare}
              >
                Add Episode of Care
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="episodeOfCareSearchInput"
              fullWidth
              placeholder="Search by status, type, patient, care manager, or organization..."
              value={searchFilter}
              onChange={function(e) { setSearchFilter(e.target.value); }}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.episodeOfCares.length > 0){
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
        <EpisodeOfCaresTable
          id='episodeOfCaresTable'
          episodeOfCares={data.episodeOfCares}
          count={data.episodeOfCares.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={true}
          order={sortOrder}
          onRowClick={function(episodeOfCareId){
            console.log('EpisodeOfCaresPage.onRowClick', episodeOfCareId);
            navigate('/episode-of-cares/' + episodeOfCareId);
          }}
          onSetPage={function(index){
            Session.set('EpisodeOfCaresTable.episodeOfCaresIndex', index);
          }}
          page={data.episodeOfCaresIndex}
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
        className="no-data-card"
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
            onClick={handleAddEpisodeOfCare}
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
            Add Your First Episode of Care
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box
      id="episodeOfCaresPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.episodeOfCares.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default EpisodeOfCaresPage;
