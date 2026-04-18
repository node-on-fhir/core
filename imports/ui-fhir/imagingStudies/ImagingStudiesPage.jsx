// /imports/ui-fhir/imagingStudies/ImagingStudiesPage.jsx

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
  ToggleButtonGroup,
  TextField,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SendIcon from '@mui/icons-material/Send';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import LaunchIcon from '@mui/icons-material/Launch';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ImagingStudiesTable from './ImagingStudiesTable';
import LaunchAppsModal from '../../components/LaunchAppsModal.jsx';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';
import { FhirUtilities } from '../../lib/FhirUtilities';

// Direct imports to avoid timing issues
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedImagingStudyId', false);
Session.setDefault('ImagingStudiesPage.sortOrder', 'descending');
Session.setDefault('ImagingStudiesPage.searchFilter', '');
Session.setDefault('ImagingStudiesTable.hideCheckbox', true);
Session.setDefault('ImagingStudiesTable.imagingStudiesIndex', 0);
Session.setDefault('ImagingStudiesPage.debugLogged', false);

//=============================================================================================================================================
// MAIN COMPONENT

export function ImagingStudiesPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [showReferrer, setShowReferrer] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [launchImagingStudyId, setLaunchImagingStudyId] = useState(null);
  const [launchGridfsFileId, setLaunchGridfsFileId] = useState(null);

  let data = {
    currentImagingStudyId: '',
    selectedImagingStudy: null,
    imagingStudies: [],
    showSystemIds: false,
    showFhirIds: false,
    imagingStudiesIndex: 0
  };

  // Reset debug logging when component unmounts
  useEffect(function() {
    return function() {
      Session.set('ImagingStudiesPage.debugLogged', false);
    };
  }, []);

  data.hideCheckbox = useTracker(function(){
    return Session.get('ImagingStudiesTable.hideCheckbox');
  }, [])
  data.selectedImagingStudyId = useTracker(function(){
    return Session.get('selectedImagingStudyId');
  }, [])
  data.selectedImagingStudy = useTracker(function(){
    return ImagingStudies.findOne({_id: Session.get('selectedImagingStudyId')});
  }, [])
  data.imagingStudiesIndex = useTracker(function(){
    return Session.get('ImagingStudiesTable.imagingStudiesIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  // Subscribe to ImagingStudies with patient filtering
  const isLoading = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    let query = {};
    
    // Build patient filter query
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add search filter to query
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'modality.0.display': {$regex: searchFilter, $options: 'i'}},
          {'modality.0.code': {$regex: searchFilter, $options: 'i'}},
          {'description': {$regex: searchFilter, $options: 'i'}},
          {'procedureCode.0.text': {$regex: searchFilter, $options: 'i'}},
          {'procedureCode.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'referrer.display': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Merge with patient filter if exists
      if(Object.keys(query).length > 0) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.ImagingStudies', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.ImagingStudies', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  // Get the filtered data
  data.imagingStudies = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    // Debug logging (only once)
    if(!Session.get('ImagingStudiesPage.debugLogged')) {
      Session.set('ImagingStudiesPage.debugLogged', true);
      
      console.log('ImagingStudies data - MongoDB _id:', selectedPatientId);
      console.log('ImagingStudies data - FHIR id:', fhirId);
      console.log('ImagingStudies data - query:', query);
      console.log('ImagingStudies data - Total records:', ImagingStudies.find({}).count());
      console.log('ImagingStudies data - Filtered records:', ImagingStudies.find(query).count());
    }
    
    return ImagingStudies.find(query).fetch();
  }, [])

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  

  function handleAddImagingStudy(){
    console.log('Add Imaging Study button clicked');
    navigate('/imaging-studies/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
      Session.set('ImagingStudiesPage.sortOrder', newOrder);
    }
  }

  function handleToggleChange(event, newToggles) {
    setShowPatientName(newToggles.includes('patientName'));
    setShowPatientReference(newToggles.includes('patientReference'));
    setShowSystemId(newToggles.includes('systemId'));
    setShowIdentifier(newToggles.includes('identifier'));
    setShowReferrer(newToggles.includes('referrer'));
    setShowLocation(newToggles.includes('location'));
  }

  function handleLaunchClick(imagingStudyId){
    // Look up the full ImagingStudy to extract gridfsFileId
    const study = ImagingStudies.findOne({ _id: imagingStudyId });
    let firstFileId = null;

    // Extract first gridfsFileId from series/instances
    if (study && study.series) {
      for (let i = 0; i < study.series.length && !firstFileId; i++) {
        const instances = get(study, 'series.' + i + '.instance', []);
        for (let j = 0; j < instances.length && !firstFileId; j++) {
          const extensions = get(instances[j], 'extension', []);
          for (let k = 0; k < extensions.length; k++) {
            if (extensions[k].url === 'gridfsFileId' && extensions[k].valueString) {
              firstFileId = extensions[k].valueString;
              break;
            }
          }
        }
      }
    }

    setLaunchImagingStudyId(imagingStudyId);
    setLaunchGridfsFileId(firstFileId);
    setLaunchModalOpen(true);
  }

  function renderHeader() {
    const selectedPatient = Session.get('selectedPatient');
    const patientName = get(selectedPatient, 'name[0].text', '');
    
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Imaging Studies
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.imagingStudies.length} studies found
              {patientName && ` for ${patientName}`}
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={[
                  ...(showPatientName ? ['patientName'] : []),
                  ...(showPatientReference ? ['patientReference'] : []),
                  ...(showSystemId ? ['systemId'] : []),
                  ...(showIdentifier ? ['identifier'] : []),
                  ...(showReferrer ? ['referrer'] : []),
                  ...(showLocation ? ['location'] : [])
                ]}
                onChange={handleToggleChange}
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
                <ToggleButton value="identifier" aria-label="show identifier">
                  <FingerprintIcon />
                </ToggleButton>
                <ToggleButton value="referrer" aria-label="show referrer">
                  <SendIcon />
                </ToggleButton>
                <ToggleButton value="location" aria-label="show location">
                  <LocationOnIcon />
                </ToggleButton>
              </ToggleButtonGroup>
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
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddImagingStudy}
              >
                Add Study
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="imagingStudySearchInput"
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search imaging studies by ID, status, modality, description, procedure, or referrer..."
            value={searchFilter}
            onChange={function(e) { setSearchFilter(e.target.value); }}
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

  // Sort imaging studies
  let sortedImagingStudies = [...data.imagingStudies];
  sortedImagingStudies.sort(function(a, b) {
    let dateA = get(a, 'started', '');
    let dateB = get(b, 'started', '');
    
    if (sortOrder === 'ascending') {
      return dateA > dateB ? 1 : -1;
    } else {
      return dateA < dateB ? 1 : -1;
    }
  });

  let layoutContent;
  if(data.imagingStudies.length > 0){
    layoutContent = <Card
      id="imagingStudiesCard"
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
        <ImagingStudiesTable
          id='imagingStudiesTable'
          imagingStudies={sortedImagingStudies}
          count={sortedImagingStudies.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={true}
          hideCheckbox={true}
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideIdentifier={!showIdentifier}
          hideReferrer={!showReferrer}
          hideLocation={!showLocation}
          onActionButtonClick={function(selectedId){
            if(window.confirm('Are you sure you want to delete this imaging study?')){
              ImagingStudies._collection.remove({_id: selectedId})
            }
          }}
          onSetPage={function(index){
            Session.set('ImagingStudiesTable.imagingStudiesIndex', index)
          }}
          onRowClick={function(imagingStudyId){
            console.log('ImagingStudiesPage.onRowClick', imagingStudyId);
            navigate('/imaging-studies/' + imagingStudyId);
          }}
          onLaunchClick={handleLaunchClick}
          page={data.imagingStudiesIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="ImagingStudy"
      searchFilter={searchFilter}
      onAdd={handleAddImagingStudy}
    />
  }
  
  return (
    <Box 
      id="imagingStudiesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContent }
      <LaunchAppsModal
        open={launchModalOpen}
        onClose={function(){ setLaunchModalOpen(false); }}
        patient={Session.get('selectedPatient')}
        imagingStudyId={launchImagingStudyId}
        gridfsFileId={launchGridfsFileId}
      />
    </Box>
  );
}

export default ImagingStudiesPage;