// /imports/ui-fhir/communications/CommunicationsPage.jsx

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
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';
import CategoryIcon from '@mui/icons-material/Category'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import CommunicationsTable from './CommunicationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedCommunicationId', false);
Session.setDefault('selectedCommunication', false);
Session.setDefault('communicationPageTabIndex', 1); 
Session.setDefault('communicationSearchFilter', ''); 
Session.setDefault('CommunicationsPage.onePageLayout', true);
Session.setDefault('CommunicationsPage.defaultQuery', {});
Session.setDefault('CommunicationsTable.hideCheckbox', true);
Session.setDefault('CommunicationsTable.communicationsIndex', 0);


//=============================================================================================================================================
// MAIN COMPONENT

export function CommunicationsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchParams] = useSearchParams();
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('CommunicationsPage.debugLogged', false);
    };
  }, []);

  // Build query for subscription and data fetching
  const selectedPatientId = Session.get('selectedPatientId');
  const selectedPatient = Session.get('selectedPatient');
  
  let query = {};
  
  // If we have a patient selected, filter by that patient
  if(selectedPatient || selectedPatientId) {
    const fhirId = get(selectedPatient, 'id');
    
    if(fhirId) {
      query = FhirUtilities.addPatientFilterToQuery(fhirId);
    } else if(selectedPatientId) {
      query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
    }
  }
  
  // Add search filter if present
  if(searchFilter && searchFilter.length > 0) {
    const searchQuery = {
      $or: [
        {'_id': searchFilter},
        {'id': searchFilter},
        {'category.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
        {'category.0.coding.0.code': {$regex: searchFilter, $options: 'i'}},
        {'category.0.text': {$regex: searchFilter, $options: 'i'}},
        {'medium.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
        {'sender.display': {$regex: searchFilter, $options: 'i'}},
        {'recipient.0.display': {$regex: searchFilter, $options: 'i'}},
        {'status': {$regex: searchFilter, $options: 'i'}},
        {'priority': {$regex: searchFilter, $options: 'i'}}
      ]
    };
    
    if(query.$and) {
      query.$and.push(searchQuery);
    } else if(query.$or) {
      query = {$and: [{$or: query.$or}, searchQuery]};
    } else {
      query = searchQuery;
    }
  }
  
  // Add category filter if selected
  if(categoryFilter && categoryFilter !== 'all') {
    const categoryQuery = {
      $or: [
        {'category.0.text': categoryFilter},
        {'category.0.coding.0.display': categoryFilter}
      ]
    };
    
    if(query.$and) {
      query.$and.push(categoryQuery);
    } else if(query.$or) {
      query = {$and: [{$or: query.$or}, categoryQuery]};
    } else {
      query = categoryQuery;
    }
  }

  // Subscribe to communications data
  const isLoading = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    if(autoPublishEnabled){
      const handle = Meteor.subscribe('autopublish.Communications', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('communications.all');
      return !handle.ready();
    }
  }, [selectedPatientId, searchFilter, categoryFilter]); // Track these for reactive updates

  // Get communications data
  let data = {
    style: {
      opacity: Session.get('globalOpacity'),
      tab: {
        borderBottom: '1px solid lightgray',
        borderRight: 'none'
      }
    },
    state: {
      isLoading: false,
      onePageLayout: true
    },
    communications: []
  };

  // Track the actual communications data
  data.communications = useTracker(function(){
    let options = {
      sort: {}
    };

    options.sort = { 'sent': sortOrder === 'ascending' ? 1 : -1 };
    
    return Communications.find(query, options).fetch();
  }, [sortOrder, searchFilter, categoryFilter]); // Re-run when filters or sort order change
  
  // Get unique categories from all communications for the patient
  const uniqueCategories = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const baseQuery = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    const allCommunications = Communications.find(baseQuery).fetch();
    const categories = new Set();
    
    allCommunications.forEach(comm => {
      // Try to get category from different possible locations
      const categoryText = get(comm, 'category[0].text');
      const categoryDisplay = get(comm, 'category[0].coding[0].display');
      
      if (categoryText) categories.add(categoryText);
      else if (categoryDisplay) categories.add(categoryDisplay);
    });
    
    return Array.from(categories).sort();
  }, [selectedPatientId]);


  // Component functions
  function handleRowClick(communicationId){
    navigate('/communications/' + communicationId);
  }

  function handleAddCommunication(){
    navigate('/communications/new');
  }

  function handleToggleSortOrder(){
    if(sortOrder === 'ascending'){
      setSortOrder('descending');
    } else {
      setSortOrder('ascending');
    }
  }

  function handleToggleView(event, newViews) {
    if (newViews !== null) {
      // Handle individual toggles
      if (newViews.includes('patientName') !== showPatientName) {
        setShowPatientName(newViews.includes('patientName'));
      }
      if (newViews.includes('patientReference') !== showPatientReference) {
        setShowPatientReference(newViews.includes('patientReference'));
      }
      if (newViews.includes('systemId') !== showSystemId) {
        setShowSystemId(newViews.includes('systemId'));
      }
      if (newViews.includes('category') !== showCategory) {
        setShowCategory(newViews.includes('category'));
      }
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Communications
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.communications.length} communications found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCommunication}
            >
              Add Communication
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.communications.length > 0){
    layoutContent = <>
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              id="communicationSearchInput"
              fullWidth
              placeholder="Search communications by ID, status, sender..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                id="category-filter"
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {uniqueCategories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <ToggleButtonGroup
                value={[
                  ...(showPatientName ? ['patientName'] : []),
                  ...(showPatientReference ? ['patientReference'] : []),
                  ...(showSystemId ? ['systemId'] : []),
                  ...(showCategory ? ['category'] : [])
                ]}
                onChange={handleToggleView}
                aria-label="column visibility"
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
                <ToggleButton value="category" aria-label="show category">
                  <CategoryIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="outlined"
                onClick={handleToggleSortOrder}
                startIcon={sortOrder === 'ascending' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                size="small"
              >
                {sortOrder === 'ascending' ? 'Oldest First' : 'Newest First'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
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
          <CommunicationsTable
            id="communicationsTable"
            communications={data.communications}
            hideCheckbox={true}
            hideActionIcons={true}
            hidePatientDisplay={!showPatientName}
            hidePatientReference={!showPatientReference}
            hideBarcode={true}
            hideCategory={!showCategory}
            selectedCommunicationId={Session.get('selectedCommunicationId')}
            onRowClick={handleRowClick}
            query={query}
            showMinutes={true}
            dateFormat="YYYY-MM-DD hh:mm"
            formFactorLayout={LayoutHelpers.determineFormFactor()}
            page={page}
            onSetPage={setPage}
            rowsPerPage={rowsPerPage}
            onSetRowsPerPage={setRowsPerPage}
          />
        </CardContent>
      </Card>
    </>
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
            onClick={handleAddCommunication}
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
            Add Your First Communication
          </Button>
        </CardContent>
      </Card>
    </Box>
  }

  return (
    <Box 
      id="communicationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.communications.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default CommunicationsPage;