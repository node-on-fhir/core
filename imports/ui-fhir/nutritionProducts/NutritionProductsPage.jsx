// /imports/ui-fhir/nutritionProducts/NutritionProductsPage.jsx

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
import { NutritionProducts } from '/imports/lib/schemas/SimpleSchemas/NutritionProducts';

import NutritionProductsTable from './NutritionProductsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedNutritionProductId', false);
Session.setDefault('nutritionProductPageTabIndex', 1);
Session.setDefault('nutritionProductSearchFilter', '');
Session.setDefault('selectedNutritionProduct', false)
Session.setDefault('NutritionProductsPage.onePageLayout', true)
Session.setDefault('NutritionProductsPage.defaultQuery', {})
Session.setDefault('NutritionProductsTable.hideCheckbox', true)
Session.setDefault('NutritionProductsTable.nutritionProductsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function NutritionProductsPage(props){
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('descending');

  // Subscribe to nutrition products data
  const isLoading = useTracker(() => {
    // Request configured subscription limit to ensure newly created records appear
    const subscriptionLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

    // Build query based on search filter
    let query = {};

    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      // Check if searchFilter looks like an ID (24-char hex string)
      const looksLikeId = /^[a-f0-9]{24}$/i.test(searchFilter);

      if (looksLikeId) {
        // Exact ID match - much faster, no regex needed
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter}
          ]
        };
        console.log('NutritionProducts subscription - ID query (optimized):', query);
      } else {
        // General search with regex
        query = {
          $or: [
            {'_id': searchFilter},
            {'id': searchFilter},
            {'code.text': {$regex: searchFilter, $options: 'i'}},
            {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
            {'code.coding.0.code': {$regex: searchFilter, $options: 'i'}},
            {'manufacturer.0.display': {$regex: searchFilter, $options: 'i'}},
            {'category.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}}
          ]
        };
        console.log('NutritionProducts subscription - general query:', query);
      }
    }

    const handle = Meteor.subscribe('autopublish.NutritionProducts', query, {
      limit: subscriptionLimit,
      sort: { '_id': -1 } // Most recent first
    });
    return !handle.ready();
  }, [searchFilter]);

  let data = {
    currentNutritionProductId: '',
    selectedNutritionProduct: null,
    nutritionProducts: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    nutritionProductsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('NutritionProductsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('NutritionProductsTable.hideCheckbox');
  }, [])
  data.selectedNutritionProductId = useTracker(function(){
    return Session.get('selectedNutritionProductId');
  }, [])
  data.selectedNutritionProduct = useTracker(function(){
    return NutritionProducts.findOne({_id: Session.get('selectedNutritionProductId')});
  }, [])
  data.nutritionProducts = useTracker(function(){
    // Build same query as subscription for client-side filtering
    let query = {};

    // Add search filter if present
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
            {'code.coding.0.code': {$regex: searchFilter, $options: 'i'}},
            {'manufacturer.0.display': {$regex: searchFilter, $options: 'i'}},
            {'category.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
            {'status': {$regex: searchFilter, $options: 'i'}}
          ]
        };
      }
    }

    // Sort by most recent first
    const nutritionProducts = NutritionProducts.find(query, {
      sort: {
        '_id': -1
      }
    }).fetch();

    console.log('[NutritionProductsPage] Fetched', nutritionProducts.length, 'nutrition products from client collection');
    if (nutritionProducts.length > 0) {
      console.log('[NutritionProductsPage] First 3 nutrition products:', nutritionProducts.slice(0, 3).map(np => ({
        _id: np._id,
        codeText: get(np, 'code.text'),
        manufacturer: get(np, 'manufacturer.0.display')
      })));
    }

    return nutritionProducts;
  }, [searchFilter])
  data.nutritionProductsIndex = useTracker(function(){
    return Session.get('NutritionProductsTable.nutritionProductsIndex')
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

  function handleAddNutritionProduct(){
    console.log('Add Nutrition Product button clicked');
    navigate('/nutrition-products/new');
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
              Nutrition Products
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.nutritionProducts.length} nutrition products found
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
                id="newNutritionProductButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNutritionProduct}
              >
                Add Nutrition Product
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              id="nutritionProductSearchInput"
              fullWidth
              placeholder="Search nutrition products by ID, code, manufacturer, category, status..."
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
  if(data.nutritionProducts.length > 0){
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
        <NutritionProductsTable
          id='nutritionProductsTable'
          nutritionProducts={data.nutritionProducts}
          count={data.nutritionProducts.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.NutritionProducts.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            NutritionProducts._collection.remove({_id: selectedId})
          }}
          onRowClick={function(nutritionProductId){
            console.log('Nutrition Product row clicked:', nutritionProductId);
            Session.set('selectedNutritionProductId', nutritionProductId);
            navigate('/nutrition-products/' + nutritionProductId);
          }}
          onSetPage={function(index){
            Session.set('NutritionProductsTable.nutritionProductsIndex', index)
          }}
          page={data.nutritionProductsIndex}
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
            onClick={handleAddNutritionProduct}
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
            Add Your First Nutrition Product
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box
      id="nutritionProductsPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.nutritionProducts.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default NutritionProductsPage;
