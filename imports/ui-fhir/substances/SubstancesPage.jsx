// /imports/ui-fhir/substances/SubstancesPage.jsx

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

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

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Direct import - no Meteor.startup needed
import { Substances } from '/imports/lib/schemas/SimpleSchemas/Substances';

import SubstancesTable from './SubstancesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Use Meteor.useNavigate pattern per project requirements
let useNavigate;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
});

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedSubstanceId', false);
Session.setDefault('substancePageTabIndex', 1);
Session.setDefault('substanceSearchFilter', '');
Session.setDefault('selectedSubstance', false)
Session.setDefault('SubstancesPage.onePageLayout', true)
Session.setDefault('SubstancesPage.defaultQuery', {})
Session.setDefault('SubstancesTable.hideCheckbox', true)
Session.setDefault('SubstancesTable.substancesIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function SubstancesPage(props){
  const navigate = useNavigate ? useNavigate() : function() {};
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('descending');

  // Subscribe to substances data
  const isLoading = useTracker(() => {
    const subscriptionLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

    // Build query based on search filter
    let query = {};

    if(searchFilter && searchFilter.length > 0) {
      const looksLikeId = /^[a-f0-9]{24}$/i.test(searchFilter);

      if (looksLikeId) {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter}
          ]
        };
        console.log('Substances subscription - ID query (optimized):', query);
      } else {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'code.text': {$regex: searchFilter, $options: 'i'}},
            {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
            {'description': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}}
          ]
        };
        console.log('Substances subscription - general query:', query);
      }
    }

    const handle = Meteor.subscribe('autopublish.Substances', query, {
      limit: subscriptionLimit,
      sort: { '_id': -1 }
    });
    return !handle.ready();
  }, [searchFilter]);

  let data = {
    currentSubstanceId: '',
    selectedSubstance: null,
    substances: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    substancesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('SubstancesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('SubstancesTable.hideCheckbox');
  }, [])
  data.selectedSubstanceId = useTracker(function(){
    return Session.get('selectedSubstanceId');
  }, [])
  data.selectedSubstance = useTracker(function(){
    return Substances.findOne({_id: Session.get('selectedSubstanceId')});
  }, [])
  data.substances = useTracker(function(){
    let query = {};

    if(searchFilter && searchFilter.length > 0) {
      const looksLikeId = /^[a-f0-9]{24}$/i.test(searchFilter);

      if (looksLikeId) {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter}
          ]
        };
      } else {
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'code.text': {$regex: searchFilter, $options: 'i'}},
            {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
            {'description': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}}
          ]
        };
      }
    }

    const substances = Substances.find(query, {
      sort: {
        '_id': -1
      }
    }).fetch();

    console.log('[SubstancesPage] Fetched', substances.length, 'substances from client collection');
    if (substances.length > 0) {
      console.log('[SubstancesPage] First 3 substances:', substances.slice(0, 3).map(sub => ({
        _id: sub._id,
        codeText: get(sub, 'code.text'),
        codeDisplay: get(sub, 'code.coding[0].display'),
        status: get(sub, 'status')
      })));
    }

    return substances;
  }, [searchFilter])
  data.substancesIndex = useTracker(function(){
    return Session.get('SubstancesTable.substancesIndex')
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

  function handleAddSubstance(){
    console.log('Add Substance button clicked');
    navigate('/substances/new');
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
              Substances
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.substances.length} substances found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
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

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddSubstance}
              >
                Add Substance
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              id="substanceSearchInput"
              fullWidth
              placeholder="Search substances by ID, code, description, status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.substances.length > 0){
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
        <SubstancesTable
          id='substancesTable'
          substances={data.substances}
          count={data.substances.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Substances.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Substances._collection.remove({_id: selectedId})
          }}
          onRowClick={function(substanceId){
            console.log('Substance row clicked:', substanceId);
            Session.set('selectedSubstanceId', substanceId);
            navigate('/substances/' + substanceId);
          }}
          onSetPage={function(index){
            Session.set('SubstancesTable.substancesIndex', index)
          }}
          page={data.substancesIndex}
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
            onClick={handleAddSubstance}
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
            Add Your First Substance
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box
      id="substancesPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.substances.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default SubstancesPage;
