// /imports/ui-fhir/insurancePlans/InsurancePlansPage.jsx

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Grid,
  Card,
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
import LayersIcon from '@mui/icons-material/Layers';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import InsurancePlansTable from './InsurancePlansTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Direct import - avoid Meteor.startup timing issues
import { InsurancePlans } from '/imports/lib/schemas/SimpleSchemas/InsurancePlans';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedInsurancePlanId', false);
Session.setDefault('insurancePlanPageTabIndex', 1);
Session.setDefault('insurancePlanSearchFilter', '');
Session.setDefault('selectedInsurancePlan', false)
Session.setDefault('InsurancePlansPage.onePageLayout', true)
Session.setDefault('InsurancePlansPage.defaultQuery', {})
Session.setDefault('InsurancePlansTable.hideCheckbox', true)
Session.setDefault('InsurancePlansTable.insurancePlansIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function InsurancePlansPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    currentInsurancePlanId: '',
    selectedInsurancePlan: null,
    insurancePlans: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    insurancePlansIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('InsurancePlansPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('InsurancePlansTable.hideCheckbox');
  }, [])
  data.selectedInsurancePlanId = useTracker(function(){
    return Session.get('selectedInsurancePlanId');
  }, [])
  data.selectedInsurancePlan = useTracker(function(){
    return InsurancePlans.findOne({_id: Session.get('selectedInsurancePlanId')});
  }, [])

  // Subscribe to insurance plans data with search filter
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    // Build query for subscription
    let query = {};
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'name': {$regex: searchFilter, $options: 'i'}},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'type.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'type.0.text': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.InsurancePlans', query, { limit: 100 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.InsurancePlans', Session.get('selectedPatientId'), { limit: 100 });
      return !handle.ready();
    }
  }, [searchFilter]);

  data.insurancePlans = useTracker(function(){
    return InsurancePlans.find({}).fetch();
  }, [])
  data.insurancePlansIndex = useTracker(function(){
    return Session.get('InsurancePlansTable.insurancePlansIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  let formFactor = LayoutHelpers.determineFormFactor();

  function handleAddInsurancePlan(){
    console.log('Add InsurancePlan button clicked');
    navigate('/insurance-plans/new');
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
              Insurance Plans
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.insurancePlans.length} insurance plans found
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
                  ...(showCoverage ? ['coverage'] : []),
                  ...(showSystemId ? ['systemId'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowCoverage(newFormats.includes('coverage'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="coverage" aria-label="show coverage columns">
                  <LayersIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddInsurancePlan}
              >
                Add Insurance Plan
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="insurancePlanSearchInput"
            fullWidth
            placeholder="Search insurance plans by ID, name, status, or type..."
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
  if(data.insurancePlans.length > 0){
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
        <InsurancePlansTable
          id='insurancePlansTable'
          insurancePlans={data.insurancePlans}
          count={data.insurancePlans.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hideCoverageArea={!showCoverage}
          hideCoverageType={!showCoverage}
          hideCoverageBenefitType={!showCoverage}
          order={sortOrder}
          onSetPage={function(index){
            Session.set('InsurancePlansTable.insurancePlansIndex', index);
          }}
          page={data.insurancePlansIndex}
          onRowClick={function(insurancePlanId){
            // Handle MongoDB ObjectID objects (which have _str property)
            const idString = typeof insurancePlanId === 'object' && insurancePlanId._str
              ? insurancePlanId._str
              : String(insurancePlanId);
            console.log('InsurancePlansPage: Row clicked with ID:', idString);
            navigate('/insurance-plans/' + idString);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="InsurancePlan"
      searchFilter={searchFilter}
      onAdd={handleAddInsurancePlan}
      onClearSearch={function() { setSearchFilter(''); }}
    />
  }

  return (
    <Box
      id="insurancePlansPage"
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



export default InsurancePlansPage;
