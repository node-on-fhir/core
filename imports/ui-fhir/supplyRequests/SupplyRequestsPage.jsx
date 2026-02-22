// imports/ui-fhir/supplyRequests/SupplyRequestsPage.jsx

import React, { useState, useEffect } from 'react';
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
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import SupplyRequestsTable from './SupplyRequestsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedSupplyRequestId', false);

Session.setDefault('supplyRequestPageTabIndex', 1);
Session.setDefault('supplyRequestSearchFilter', '');
Session.setDefault('selectedSupplyRequest', false)
Session.setDefault('SupplyRequestsPage.onePageLayout', true)
Session.setDefault('SupplyRequestsPage.defaultQuery', {})
Session.setDefault('SupplyRequestsTable.hideCheckbox', true)
Session.setDefault('SupplyRequestsTable.supplyRequestsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function SupplyRequestsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);

  let data = {
    currentSupplyRequestId: '',
    selectedSupplyRequest: null,
    supplyRequests: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    supplyRequestsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('SupplyRequestsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('SupplyRequestsTable.hideCheckbox');
  }, [])
  data.selectedSupplyRequestId = useTracker(function(){
    return Session.get('selectedSupplyRequestId');
  }, [])
  data.selectedSupplyRequest = useTracker(function(){
    return SupplyRequests.findOne({_id: Session.get('selectedSupplyRequestId')});
  }, [])

  // Subscribe to supply requests data (patient-agnostic)
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.SupplyRequests', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('supplyRequests.all');
      return !handle.ready();
    }
  }, []);

  data.supplyRequests = useTracker(function(){
    // Sort by _id descending to get newest first
    return SupplyRequests.find({}, { sort: { _id: -1 } }).fetch();
  }, [])
  data.supplyRequestsIndex = useTracker(function(){
    return Session.get('SupplyRequestsTable.supplyRequestsIndex')
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

  function handleAddSupplyRequest(){
    console.log('Add Supply Request button clicked');
    navigate('/supply-requests/new');
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
              Supply Requests
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.supplyRequests.length} supply requests found
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
                value={showSystemId ? ['systemId'] : []}
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
                onClick={handleAddSupplyRequest}
                data-testid="add-supply-request-button"
                id="addSupplyRequestButton"
                title="Add Supply Request"
              >
                Add Supply Request
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.supplyRequests.length > 0){
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
        <SupplyRequestsTable
          id='supplyRequestsTable'
          supplyRequests={data.supplyRequests}
          count={data.supplyRequests.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideStatus={false}
          hidePriority={false}
          hideQuantity={false}
          hideItemCodeableConcept={false}
          hideAuthoredOn={false}
          hideBarcode={!showSystemId}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.SupplyRequests.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            SupplyRequests.remove({_id: selectedId})
          }}
          onRowClick={function(supplyRequestId){
            console.log('SupplyRequestsPage.onRowClick', supplyRequestId);
            navigate('/supply-requests/' + supplyRequestId);
          }}
          onSetPage={function(index){
            Session.set('SupplyRequestsTable.supplyRequestsIndex', index)
          }}
          page={data.supplyRequestsIndex}
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
        data-testid="no-supply-requests"
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
            onClick={handleAddSupplyRequest}
            data-testid="add-supply-request-button"
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
            Add Your First Supply Request
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box
      id="supplyRequestsPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.supplyRequests.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default SupplyRequestsPage;
