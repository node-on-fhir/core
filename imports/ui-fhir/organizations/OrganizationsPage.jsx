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
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import OrganizationsTable from './OrganizationsTable';
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
  // Subscribe to organizations data
  const isLoading = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);

    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.Organizations', {}, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('organizations.all');
      return !handle.ready();
    }
  }, []);

  data.organizations = useTracker(function(){
    return Organizations.find().fetch();
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

  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");
  let noDataCardStyle = {};

  function handleAddOrganization(){
    console.log('Add Organization button clicked');
    navigate('/organizations/new');
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
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddOrganization}
            >
              Add Organization
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.organizations.length > 0){
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
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Organizations.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Organizations._collection.remove({_id: selectedId})
          }}
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
            onClick={handleAddOrganization}
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
            Add Your First Organization
          </Button>
        </CardContent>
      </Card>
    </Box>
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
      { data.organizations.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default OrganizationsPage;
