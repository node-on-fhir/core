// /imports/ui-fhir/organizations/OrganizationsPage.jsx

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
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import OrganizationsTable from './OrganizationsTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Direct import - avoid Meteor.startup timing issues
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedOrganizationId', false);
Session.setDefault('organizationPageTabIndex', 1);
Session.setDefault('organizationSearchFilter', '');
Session.setDefault('selectedOrganization', false)
Session.setDefault('OrganizationsPage.onePageLayout', true)
Session.setDefault('OrganizationsPage.defaultQuery', {})
Session.setDefault('OrganizationsTable.hideCheckbox', true)
Session.setDefault('OrganizationsTable.organizationsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function OrganizationsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    currentOrganizationId: '',
    selectedOrganization: null,
    organizations: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    organizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('OrganizationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('OrganizationsTable.hideCheckbox');
  }, [])
  data.selectedOrganizationId = useTracker(function(){
    return Session.get('selectedOrganizationId');
  }, [])
  data.selectedOrganization = useTracker(function(){
    return Organizations.findOne({_id: Session.get('selectedOrganizationId')});
  }, [])

  // Subscribe to organizations data with search filter
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
          {'type.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'type.0.coding.0.code': {$regex: searchFilter, $options: 'i'}},
          {'address.0.city': {$regex: searchFilter, $options: 'i'}},
          {'address.0.state': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Organizations', query, { limit: 100 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Organizations', Session.get('selectedPatientId'), { limit: 100 });
      return !handle.ready();
    }
  }, [searchFilter]);

  data.organizations = useTracker(function(){
    return Organizations.find({}).fetch();
  }, [])
  data.organizationsIndex = useTracker(function(){
    return Session.get('OrganizationsTable.organizationsIndex')
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

  function handleAddOrganization(){
    console.log('Add Organization button clicked');
    navigate('/organizations/new');
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
              Organizations
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.organizations.length} organizations found
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
                  ...(showAddress ? ['address'] : []),
                  ...(showSystemId ? ['systemId'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowAddress(newFormats.includes('address'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="address" aria-label="show address columns">
                  <LocationOnIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddOrganization}
              >
                Add Organization
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="organizationSearchInput"
            fullWidth
            placeholder="Search organizations by ID, name, type, city, or state..."
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
      <Typography>Loading organizations...</Typography>
    </Box>
  } else if(data.organizations.length > 0){
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
        <OrganizationsTable
          id='organizationsTable'
          organizations={data.organizations}
          count={data.organizations.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hideAddressLine={!showAddress}
          hideCity={!showAddress}
          hideState={!showAddress}
          hidePostalCode={!showAddress}
          hideCountry={!showAddress}
          order={sortOrder}
          onSetPage={function(index){
            Session.set('OrganizationsTable.organizationsIndex', index);
          }}
          page={data.organizationsIndex}
          onRowClick={function(organizationId){
            // Handle MongoDB ObjectID objects (which have _str property)
            const idString = typeof organizationId === 'object' && organizationId._str
              ? organizationId._str
              : String(organizationId);
            console.log('OrganizationsPage: Row clicked with ID:', idString);
            navigate('/organizations/' + idString);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="Organization"
      searchFilter={searchFilter}
      onAdd={handleAddOrganization}
      onClearSearch={function() { setSearchFilter(''); }}
    />
  }

  return (
    <Box
      id="organizationsPage"
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



export default OrganizationsPage;
