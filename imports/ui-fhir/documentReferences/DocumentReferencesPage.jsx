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
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import DocumentReferenceDetail from './DocumentReferenceDetail';
import DocumentReferencesTable from './DocumentReferencesTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';
import { useSubscribe } from 'meteor/react-meteor-data';
import FhirUtilities from '../../lib/FhirUtilities';

 
//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  DocumentReferences = Meteor.Collections.DocumentReferences;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedDocumentReferenceId', false);


Session.setDefault('documentReferencePageTabIndex', 1); 
Session.setDefault('documentReferenceSearchFilter', ''); 
Session.setDefault('selectedDocumentReferenceId', false);
Session.setDefault('selectedDocumentReference', false)
Session.setDefault('DocumentReferencesPage.onePageLayout', true)
Session.setDefault('DocumentReferencesPage.defaultQuery', {})
Session.setDefault('DocumentReferencesTable.hideCheckbox', true)
Session.setDefault('DocumentReferencesTable.documentReferencesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function DocumentReferencesPage(props){
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showSubject, setShowSubject] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showType, setShowType] = useState(false);
  const [showStatus, setShowStatus] = useState(true);

  let data = {
    currentDocumentReferenceId: '',
    selectedDocumentReference: null,
    documentReferences: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    documentReferencesIndex: 0,
    selectedPatientId: '',
    selectedPatient: null
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('DocumentReferencesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('DocumentReferencesTable.hideCheckbox');
  }, [])
  data.selectedDocumentReferenceId = useTracker(function(){
    return Session.get('selectedDocumentReferenceId');
  }, [])
  data.selectedDocumentReference = useTracker(function(){
    return DocumentReferences.findOne({_id: Session.get('selectedDocumentReferenceId')});
  }, [])
  data.selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);
  data.selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, []);
  
  // Subscribe to document references with patient filter
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.DocumentReferences', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.DocumentReferences', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId')]);
  
  data.documentReferences = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    let query = {};
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    return DocumentReferences.find(query).fetch();
  }, [])
  data.documentReferencesIndex = useTracker(function(){
    return Session.get('DocumentReferencesTable.documentReferencesIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  // Filter document references based on search
  let filteredDocumentReferences = data.documentReferences;
  if (searchFilter && searchFilter.length > 0) {
    const filterLower = searchFilter.toLowerCase();
    filteredDocumentReferences = data.documentReferences.filter(documentReference => {
      // Search by ID
      if (documentReference._id && documentReference._id.toLowerCase().includes(filterLower)) return true;
      if (documentReference.id && documentReference.id.toLowerCase().includes(filterLower)) return true;
      
      // Search by type
      if (get(documentReference, 'type.coding[0].display', '').toLowerCase().includes(filterLower)) return true;
      if (get(documentReference, 'type.coding[0].code', '').toLowerCase().includes(filterLower)) return true;
      if (get(documentReference, 'type.text', '').toLowerCase().includes(filterLower)) return true;
      
      // Search by description
      if (get(documentReference, 'description', '').toLowerCase().includes(filterLower)) return true;
      
      // Search by patient name
      if (get(documentReference, 'subject.display', '').toLowerCase().includes(filterLower)) return true;
      
      // Search by content title
      if (get(documentReference, 'content[0].attachment.title', '').toLowerCase().includes(filterLower)) return true;
      
      return false;
    });
  }

  // Debug logging
  useEffect(() => {
    console.log('DocumentReferencesPage - Patient context:', {
      selectedPatientId: data.selectedPatientId,
      selectedPatient: data.selectedPatient,
      patientFhirId: get(data.selectedPatient, 'id'),
      totalDocuments: data.documentReferences.length,
      filteredDocuments: filteredDocumentReferences.length
    });
  }, [data.selectedPatientId, data.documentReferences.length]);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddDocumentReference(){
    console.log('Add DocumentReference button clicked');
    navigate('/document-references/new');
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
              Document References
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {filteredDocumentReferences.length} document references found
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
                  ...(showSystemId ? ['systemId'] : []),
                  ...(showSubject ? ['subject'] : []),
                  ...(showAuthor ? ['author'] : []),
                  ...(showType ? ['type'] : []),
                  ...(showStatus ? ['status'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowSystemId(newFormats.includes('systemId'));
                  setShowSubject(newFormats.includes('subject'));
                  setShowAuthor(newFormats.includes('author'));
                  setShowType(newFormats.includes('type'));
                  setShowStatus(newFormats.includes('status'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
                <ToggleButton value="subject" aria-label="show subject">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="author" aria-label="show author">
                  <EditIcon />
                </ToggleButton>
                <ToggleButton value="type" aria-label="show type">
                  <CategoryIcon />
                </ToggleButton>
                <ToggleButton value="status" aria-label="show status">
                  <CheckCircleOutlineIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddDocumentReference}
              >
                Add Document Reference
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="documentReferenceSearchInput"
            fullWidth
            placeholder="Search document references by ID, type, description, or patient name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(filteredDocumentReferences.length > 0){
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
        <DocumentReferencesTable
          id='documentReferencesTable'
          documentReferences={filteredDocumentReferences}
          count={filteredDocumentReferences.length}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.DocumentReferences.hideRemoveButtonOnTable', true)}
          hideBarcode={!showSystemId}
          hideSubjectDisplay={!showSubject}
          hideAuthor={!showAuthor}
          hideTypeDisplay={!showType}
          hideStatus={!showStatus}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            DocumentReferences._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setDocumentReferencesPageIndex(index)
          }}
          page={data.documentReferencesIndex}
          onRowClick={function(documentReferenceId){
            console.log('DocumentReferencesPage.onRowClick', documentReferenceId);
            navigate('/document-references/' + documentReferenceId);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="DocumentReference"
      searchFilter={searchFilter}
      onAdd={handleAddDocumentReference}
    />
  }
  
  return (
    <Box 
      id="documentReferencesPage" 
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



export default DocumentReferencesPage;