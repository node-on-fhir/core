import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { useSubscribe } from 'meteor/react-meteor-data';

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
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import CompositionDetail from './CompositionDetail';
import CompositionsTable from './CompositionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Compositions = Meteor.Collections.Compositions;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('compositionPageTabIndex', 0);
Session.setDefault('compositionSearchFilter', '');
Session.setDefault('selectedCompositionId', false);
Session.setDefault('selectedComposition', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('compositionsArray', []);

Session.setDefault('CompositionsPage.onePageLayout', true)
Session.setDefault('CompositionsPage.defaultQuery', {})
Session.setDefault('CompositionsTable.hideCheckbox', true)
Session.setDefault('CompositionsTable.compositionsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function CompositionsPage(props){
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  
  // Subscribe to compositions with search filter
  const isLoading = useTracker(() => {
    let query = {};
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'identifier.value': searchFilter},
          {'type.text': {$regex: searchFilter, $options: 'i'}},
          {'type.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'type.coding.0.code': searchFilter},
          {'subject.display': {$regex: searchFilter, $options: 'i'}},
          {'subject.reference': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    // Check if autopublish is enabled
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.Compositions', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('pacio.compositions', query);
      return !handle.ready();
    }
  }, [searchFilter]);

  let data = {
    currentCompositionId: '',
    selectedComposition: null,
    compositions: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    compositionsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('CompositionsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('CompositionsTable.hideCheckbox');
  }, [])
  data.selectedCompositionId = useTracker(function(){
    return Session.get('selectedCompositionId');
  }, [])
  data.selectedComposition = useTracker(function(){
    return Compositions.findOne({_id: Session.get('selectedCompositionId')});
  }, [])
  data.compositions = useTracker(function(){
    let query = {};
    
    // Apply same search filter as subscription
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'identifier.value': searchFilter},
          {'type.text': {$regex: searchFilter, $options: 'i'}},
          {'type.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'type.coding.0.code': searchFilter},
          {'subject.display': {$regex: searchFilter, $options: 'i'}},
          {'subject.reference': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    return Compositions.find(query).fetch();
  }, [searchFilter])
  data.compositionsIndex = useTracker(function(){
    return Session.get('CompositionsTable.compositionsIndex')
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

  function handleAddComposition(){
    console.log('Add Composition button clicked');
    navigate('/compositions/new');
  }

  function compositionRowClick(id){
    console.log('compositionRowClick', id)
    Session.set('selectedCompositionId', id)
  }

  function setCompositionsPageIndex(index){
    Session.set('CompositionsTable.compositionsIndex', index)
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Compositions
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.compositions.length} compositions found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddComposition}
            >
              Add Composition
            </Button>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="compositionSearchInput"
              fullWidth
              placeholder="Search compositions by ID, identifier, type display, type code, or subject..."
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
  if(data.compositions.length > 0){
    if(data.onePageLayout){
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
          <CompositionsTable 
            id='compositionsTable'
            compositions={data.compositions}
            count={data.compositions.length}  
            formFactorLayout={formFactor}
            rowsPerPage={LayoutHelpers.calcTableRows()} 
            actionButtonLabel="Remove"
            hideActionButton={get(Meteor, 'settings.public.modules.fhir.Compositions.hideRemoveButtonOnTable', true)}
            onActionButtonClick={function(selectedId){
              Compositions._collection.remove({_id: selectedId})
            }}
            onSetPage={function(index){
              setCompositionsPageIndex(index)
            }}        
            page={data.compositionsIndex}
          />
        </CardContent>
      </Card>
    } else {
      // Two-column layout with detail view
      let sectionCards = [];
      let componentSections = get(data.selectedComposition, 'section', []);
      if(Array.isArray(componentSections)){
        componentSections.forEach(function(section){
          sectionCards.push(<Card key={section.title} sx={{ mb: 2, borderRadius: 2 }}>
            <CardHeader title={get(section, 'title', '')} />
            <CardContent style={{maxHeight: '200px', overflow: 'auto'}} >
              <div className="dangerouslySetInnerHTML" dangerouslySetInnerHTML={{__html: get(section, 'text.div', '')}} style={{width: '100%'}}></div>
            </CardContent>      
          </Card>)
        })
      }
  
      layoutContent = <Grid container spacing={3}>
        <Grid item md={8}>
          <Card 
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
              <CompositionsTable 
                compositions={data.compositions}
                count={data.compositions.length}
                formFactorLayout={formFactor}
                rowsPerPage={LayoutHelpers.calcTableRows()}
                hideBarcode={true}
                hideIdentifier={true}
                hideSubjectReference={true}
                onRowClick={compositionRowClick.bind(this)}
                onSetPage={function(index){
                  setCompositionsPageIndex(index)
                }}        
                page={data.compositionsIndex}
              />            
            </CardContent>
          </Card>
        </Grid>
        <Grid item md={4}>
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" component="h2" className="barcode barcodes">
                {data.selectedCompositionId}
              </Typography>
            </CardContent>
          </Card>
  
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardHeader title="Metadata" />
            <CardContent style={{maxHeight: '200px', paddingBottom: '20px'}}>
              <CompositionDetail 
                composition={data.selectedComposition}
              />
            </CardContent>      
          </Card>
          
          { sectionCards }
        </Grid>
      </Grid> 
    }
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
            onClick={handleAddComposition}
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
            Add Your First Composition
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="compositionsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.compositions.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}


export default CompositionsPage;