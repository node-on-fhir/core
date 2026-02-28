// /imports/ui-fhir/practitioners/PractitionersPage.jsx

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
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WcIcon from '@mui/icons-material/Wc';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import PractitionerDetail from './PractitionerDetail';
import PractitionersTable from './PractitionersTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '../../lib/LayoutHelpers';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedPractitionerId', false);


Session.setDefault('practitionerPageTabIndex', 1); 
Session.setDefault('practitionerSearchFilter', ''); 
Session.setDefault('selectedPractitionerId', false);
Session.setDefault('selectedPractitioner', false)
Session.setDefault('PractitionersPage.onePageLayout', true)
Session.setDefault('PractitionersPage.defaultQuery', {})
Session.setDefault('PractitionersTable.hideCheckbox', true)
Session.setDefault('PractitionersTable.practitionersIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function PractitionersPage(props){
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');

  // Column visibility toggles
  const [showQualification, setShowQualification] = useState(true);
  const [showTelecom, setShowTelecom] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showGender, setShowGender] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  // Sort order
  const [sortOrder, setSortOrder] = useState('ascending');

  let data = {
    currentPractitionerId: '',
    selectedPractitioner: null,
    practitioners: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    practitionersIndex: 0
  };
  
  // Subscribe to practitioners
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Practitioners', {}, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Practitioners', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, []);

  data.onePageLayout = useTracker(function(){
    return Session.get('PractitionersPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('PractitionersTable.hideCheckbox');
  }, [])
  data.selectedPractitionerId = useTracker(function(){
    return Session.get('selectedPractitionerId');
  }, [])
  data.selectedPractitioner = useTracker(function(){
    if(Practitioners){
      return Practitioners.findOne({_id: Session.get('selectedPractitionerId')});
    }
    return null;
  }, [])
  data.practitioners = useTracker(function(){
    if(Practitioners){
      return Practitioners.find().fetch();
    }
    return [];
  }, [])
  
  // Filter practitioners based on search
  let filteredPractitioners = data.practitioners.filter(function(practitioner) {
    if (!searchFilter) return true;

    const searchLower = searchFilter.toLowerCase();

    // Search in name
    const name = get(practitioner, 'name[0]', {});
    const fullName = `${get(name, 'given[0]', '')} ${get(name, 'family', '')}`.toLowerCase();
    if (fullName.includes(searchLower)) return true;

    // Search in NPI
    const npi = String(get(practitioner, 'identifier[0].value', '')).toLowerCase();
    if (npi.includes(searchLower)) return true;

    // Search in email
    const telecom = get(practitioner, 'telecom', []);
    const emailEntry = telecom.find(function(t) { return t.system === 'email'; });
    const email = String(get(emailEntry, 'value', '')).toLowerCase();
    if (email.includes(searchLower)) return true;

    // Search in specialty
    const specialty = String(get(practitioner, 'practitionerRole[0].specialty[0].coding[0].display', '')).toLowerCase();
    if (specialty.includes(searchLower)) return true;

    // Search in ID (handle both string and ObjectID)
    if (practitioner._id) {
      const idString = typeof practitioner._id === 'object' && practitioner._id._str
        ? practitioner._id._str
        : String(practitioner._id);
      if (idString.toLowerCase().includes(searchLower)) return true;
    }

    return false;
  });

  // Sort practitioners
  filteredPractitioners = filteredPractitioners.sort(function(a, b) {
    const nameA = `${get(a, 'name[0].given[0]', '')} ${get(a, 'name[0].family', '')}`.toLowerCase();
    const nameB = `${get(b, 'name[0].given[0]', '')} ${get(b, 'name[0].family', '')}`.toLowerCase();
    if (sortOrder === 'ascending') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
  data.practitionersIndex = useTracker(function(){
    return Session.get('PractitionersTable.practitionersIndex')
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

  function handleAddPractitioner(){
    console.log('Add Practitioner button clicked');
    navigate('/practitioners/new');
  }

  function handleToggleChange(event, newToggles) {
    setShowQualification(newToggles.includes('qualification'));
    setShowTelecom(newToggles.includes('telecom'));
    setShowAddress(newToggles.includes('address'));
    setShowGender(newToggles.includes('gender'));
    setShowBarcode(newToggles.includes('barcode'));
  }

  function handleSortOrderChange(event, newSortOrder) {
    if (newSortOrder !== null) {
      setSortOrder(newSortOrder);
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={4}>
            <Typography variant="h4">
              Practitioners
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {filteredPractitioners.length} of {data.practitioners.length} practitioners
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <ToggleButtonGroup
                value={[
                  ...(showQualification ? ['qualification'] : []),
                  ...(showTelecom ? ['telecom'] : []),
                  ...(showAddress ? ['address'] : []),
                  ...(showGender ? ['gender'] : []),
                  ...(showBarcode ? ['barcode'] : [])
                ]}
                onChange={handleToggleChange}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="qualification" aria-label="show qualification">
                  <SchoolIcon />
                </ToggleButton>
                <ToggleButton value="telecom" aria-label="show telecom">
                  <PhoneIcon />
                </ToggleButton>
                <ToggleButton value="address" aria-label="show address">
                  <LocationOnIcon />
                </ToggleButton>
                <ToggleButton value="gender" aria-label="show gender">
                  <WcIcon />
                </ToggleButton>
                <ToggleButton value="barcode" aria-label="show barcode">
                  <QrCode2Icon />
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
                onClick={handleAddPractitioner}
              >
                Add Practitioner
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="practitionerSearchInput"
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search practitioners by ID, name, NPI, email, specialty..."
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

  let layoutContent;
  if(filteredPractitioners.length > 0){
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
        <PractitionersTable
          id='practitionersTable'
          practitioners={filteredPractitioners}
          count={filteredPractitioners.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Practitioners.hideRemoveButtonOnTable', true)}
          hideQualification={!showQualification}
          hideTelecom={!showTelecom}
          hideAddress={!showAddress}
          hideGender={!showGender}
          hideBarcode={!showBarcode}
          onActionButtonClick={function(selectedId){
            Practitioners._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('PractitionersTable.practitionersIndex', index);
          }}
          page={data.practitionersIndex}
          onRowClick={function(practitionerId){
            console.log('PractitionersPage.onRowClick', practitionerId);
            navigate('/practitioners/' + practitionerId);
          }}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="Practitioner"
      searchFilter={searchFilter}
      onAdd={handleAddPractitioner}
    />
  }
  
  return (
    <Box 
      id="practitionersPage" 
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



export default PractitionersPage;