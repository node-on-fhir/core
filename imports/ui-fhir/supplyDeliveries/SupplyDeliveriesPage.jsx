// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/supplyDeliveries/SupplyDeliveriesPage.jsx
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

import SupplyDeliveriesTable from './SupplyDeliveriesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedSupplyDeliveryId', false);

Session.setDefault('supplyDeliveryPageTabIndex', 1); 
Session.setDefault('supplyDeliverySearchFilter', ''); 
Session.setDefault('selectedSupplyDeliveryId', false);
Session.setDefault('selectedSupplyDelivery', false)
Session.setDefault('SupplyDeliveriesPage.onePageLayout', true)
Session.setDefault('SupplyDeliveriesPage.defaultQuery', {})
Session.setDefault('SupplyDeliveriesTable.hideCheckbox', true)
Session.setDefault('SupplyDeliveriesTable.supplyDeliveriesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function SupplyDeliveriesPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchParams] = useSearchParams();
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('SupplyDeliveriesPage.debugLogged', false);
    };
  }, []);

  // Subscribe to supply deliveries data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    // Use FhirUtilities to build the query - it handles all reference formats
    let query = {};
    
    // If we have a patient selected, filter by that patient
    // FHIR resources reference patients by their FHIR id, not MongoDB _id
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        // Use the FHIR id as primary search
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        // Fallback to MongoDB _id if no FHIR id available
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    console.log('SupplyDeliveries subscription - selectedPatientId:', selectedPatientId);
    console.log('SupplyDeliveries subscription - FHIR id:', get(selectedPatient, 'id'));
    console.log('SupplyDeliveries subscription query:', query);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.SupplyDeliveries', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('supplyDeliveries.all');
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId')]);

  let data = {
    currentSupplyDeliveryId: '',
    selectedSupplyDelivery: null,
    supplyDeliveries: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    supplyDeliveriesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('SupplyDeliveriesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('SupplyDeliveriesTable.hideCheckbox');
  }, [])
  data.selectedSupplyDeliveryId = useTracker(function(){
    return Session.get('selectedSupplyDeliveryId');
  }, [])
  data.selectedSupplyDelivery = useTracker(function(){
    return SupplyDeliveries.findOne({_id: Session.get('selectedSupplyDeliveryId')});
  }, [])
  data.supplyDeliveries = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering, as that's what FHIR resources reference
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    // Only do debug logging once when component mounts
    if(!Session.get('SupplyDeliveriesPage.debugLogged')) {
      Session.set('SupplyDeliveriesPage.debugLogged', true);
      
      console.log('SupplyDeliveries data - MongoDB _id:', selectedPatientId);
      console.log('SupplyDeliveries data - FHIR id:', fhirId);
      console.log('SupplyDeliveries data - Using ID for query:', patientIdToUse);
      console.log('SupplyDeliveries data - query:', query);
      
      // First check all supply deliveries
      const allSupplyDeliveries = SupplyDeliveries.find().fetch();
      console.log('Total SupplyDeliveries in client collection:', allSupplyDeliveries.length);
      
      // Log first few supply deliveries to see their structure
      if(allSupplyDeliveries.length > 0) {
        console.log('Sample SupplyDelivery structure:', allSupplyDeliveries[0]);
        console.log('First 3 patient references:');
        allSupplyDeliveries.slice(0, 3).forEach(s => {
          console.log('- _id:', s._id, 'patient:', get(s, 'patient'), 'subject:', get(s, 'subject'));
        });
      }
    }
    
    // Sort by _id descending to get newest first
    // MongoDB ObjectIDs contain timestamp, so sorting by _id gives chronological order
    const results = SupplyDeliveries.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, [])
  data.supplyDeliveriesIndex = useTracker(function(){
    return Session.get('SupplyDeliveriesTable.supplyDeliveriesIndex')
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

  function handleAddSupplyDelivery(){
    console.log('Add Supply Delivery button clicked');
    navigate('/supply-deliveries/new');
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
              Supply Deliveries
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.supplyDeliveries.length} supply deliveries found
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
                onClick={handleAddSupplyDelivery}
                data-testid="add-supply-delivery-button"
                id="addSupplyDeliveryButton"
                title="Add Supply Delivery"
              >
                Add Supply Delivery
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.supplyDeliveries.length > 0){
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
        <SupplyDeliveriesTable 
          id='supplyDeliveriesTable'
          supplyDeliveries={data.supplyDeliveries}
          count={data.supplyDeliveries.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideStatus={false}
          hideType={false}
          hideSupplier={false}
          hideDestination={false}
          hideReceiver={false}
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.SupplyDeliveries.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            SupplyDeliveries.remove({_id: selectedId})
          }}
          onRowClick={function(supplyDeliveryId){
            console.log('SupplyDeliveriesPage.onRowClick', supplyDeliveryId);
            navigate('/supply-deliveries/' + supplyDeliveryId);
          }}
          onSetPage={function(index){
            Session.set('SupplyDeliveriesTable.supplyDeliveriesIndex', index)
          }}        
          page={data.supplyDeliveriesIndex}
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
        data-testid="no-supply-deliveries"
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
            onClick={handleAddSupplyDelivery}
            data-testid="add-supply-delivery-button"
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
            Add Your First Supply Delivery
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="supplyDeliveriesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.supplyDeliveries.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default SupplyDeliveriesPage;