// /imports/ui-fhir/healthcareServices/HealthcareServicesPage.jsx

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
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import HealthcareServicesTable from './HealthcareServicesTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

// Direct import - avoid Meteor.startup timing issues
import { HealthcareServices } from '/imports/lib/schemas/SimpleSchemas/HealthcareServices';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedHealthcareServiceId', false);
Session.setDefault('healthcareServiceSearchFilter', '');
Session.setDefault('selectedHealthcareService', false)
Session.setDefault('HealthcareServicesPage.onePageLayout', true)
Session.setDefault('HealthcareServicesPage.defaultQuery', {})
Session.setDefault('HealthcareServicesTable.hideCheckbox', true)
Session.setDefault('HealthcareServicesTable.healthcareServicesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function HealthcareServicesPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  let data = {
    selectedHealthcareServiceId: '',
    selectedHealthcareService: null,
    healthcareServices: [],
    onePageLayout: true,
    healthcareServicesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('HealthcareServicesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('HealthcareServicesTable.hideCheckbox');
  }, [])
  data.selectedHealthcareServiceId = useTracker(function(){
    return Session.get('selectedHealthcareServiceId');
  }, [])
  data.selectedHealthcareService = useTracker(function(){
    return HealthcareServices.findOne({_id: Session.get('selectedHealthcareServiceId')});
  }, [])

  // Subscribe to healthcare services data with search filter
  const isLoading = useTracker(() => {
    // Build query for subscription
    let query = {};
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'name': {$regex: searchFilter, $options: 'i'}},
          {'type.0.text': {$regex: searchFilter, $options: 'i'}},
          {'category.0.text': {$regex: searchFilter, $options: 'i'}},
          {'location.display': {$regex: searchFilter, $options: 'i'}},
          {'providedBy.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }

    const handle = Meteor.subscribe('autopublish.HealthcareServices', query, { limit: 100 });
    return !handle.ready();
  }, [searchFilter]);

  data.healthcareServices = useTracker(function(){
    return HealthcareServices.find({}).fetch();
  }, [])
  data.healthcareServicesIndex = useTracker(function(){
    return Session.get('HealthcareServicesTable.healthcareServicesIndex')
  }, [])


  let formFactor = LayoutHelpers.determineFormFactor();

  function handleAddHealthcareService(){
    console.log('Add Healthcare Service button clicked');
    navigate('/healthcare-services/new');
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
              Healthcare Services
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.healthcareServices.length} healthcare services found
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
                  ...(showContact ? ['contact'] : []),
                  ...(showSystemId ? ['systemId'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowContact(newFormats.includes('contact'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="contact" aria-label="show contact columns">
                  <ContactPhoneIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddHealthcareService}
              >
                Add Healthcare Service
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="healthcareServiceSearchInput"
            fullWidth
            placeholder="Search healthcare services by ID, name, type, category, or location..."
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
  if(data.healthcareServices.length > 0){
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
        <HealthcareServicesTable
          id='healthcareServicesTable'
          healthcareServices={data.healthcareServices}
          count={data.healthcareServices.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hidePhone={!showContact}
          hideEmail={!showContact}
          order={sortOrder}
          onSetPage={function(index){
            Session.set('HealthcareServicesTable.healthcareServicesIndex', index);
          }}
          page={data.healthcareServicesIndex}
          onRowClick={function(healthcareServiceId){
            // Handle MongoDB ObjectID objects (which have _str property)
            const idString = typeof healthcareServiceId === 'object' && healthcareServiceId._str
              ? healthcareServiceId._str
              : String(healthcareServiceId);
            console.log('HealthcareServicesPage: Row clicked with ID:', idString);
            navigate('/healthcare-services/' + idString);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="HealthcareService"
      searchFilter={searchFilter}
      onAdd={handleAddHealthcareService}
      onClearSearch={function() { setSearchFilter(''); }}
    />
  }

  return (
    <Box
      id="healthcareServicesPage"
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

export default HealthcareServicesPage;
