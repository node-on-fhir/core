// /imports/ui-fhir/practitionerRoles/PractitionerRolesPage.jsx

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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PractitionerRolesTable from './PractitionerRolesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';
import { PractitionerRoles } from '/imports/lib/schemas/SimpleSchemas/PractitionerRoles';

import { get } from 'lodash';


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedPractitionerRoleId', false);
Session.setDefault('practitionerRoleSearchFilter', '');
Session.setDefault('selectedPractitionerRole', false);
Session.setDefault('PractitionerRolesPage.onePageLayout', true);
Session.setDefault('PractitionerRolesPage.defaultQuery', {});
Session.setDefault('PractitionerRolesTable.hideCheckbox', true);
Session.setDefault('PractitionerRolesTable.practitionerRolesIndex', 0);


//=============================================================================================================================================
// MAIN COMPONENT

export function PractitionerRolesPage(props){
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);

  let data = {
    currentPractitionerRoleId: '',
    selectedPractitionerRole: null,
    practitionerRoles: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    practitionerRolesIndex: 0
  };

  // Subscribe to practitioner roles
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.PractitionerRoles', {}, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.PractitionerRoles', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, []);

  data.onePageLayout = useTracker(function(){
    return Session.get('PractitionerRolesPage.onePageLayout');
  }, []);
  data.hideCheckbox = useTracker(function(){
    return Session.get('PractitionerRolesTable.hideCheckbox');
  }, []);
  data.selectedPractitionerRoleId = useTracker(function(){
    return Session.get('selectedPractitionerRoleId');
  }, []);
  data.selectedPractitionerRole = useTracker(function(){
    if(PractitionerRoles){
      return PractitionerRoles.findOne({_id: Session.get('selectedPractitionerRoleId')});
    }
    return null;
  }, []);
  data.practitionerRoles = useTracker(function(){
    if(PractitionerRoles){
      return PractitionerRoles.find().fetch();
    }
    return [];
  }, []);

  // Filter practitioner roles based on search
  const filteredPractitionerRoles = data.practitionerRoles.filter(practitionerRole => {
    if (!searchFilter) return true;

    const searchLower = searchFilter.toLowerCase();

    // Search in practitioner reference/display
    const practitionerDisplay = String(get(practitionerRole, 'practitioner.display', '')).toLowerCase();
    if (practitionerDisplay.includes(searchLower)) return true;

    // Search in organization reference/display
    const organizationDisplay = String(get(practitionerRole, 'organization.display', '')).toLowerCase();
    if (organizationDisplay.includes(searchLower)) return true;

    // Search in role code
    const roleCode = String(get(practitionerRole, 'code[0].coding[0].code', '')).toLowerCase();
    const roleDisplay = String(get(practitionerRole, 'code[0].text', get(practitionerRole, 'code[0].coding[0].display', ''))).toLowerCase();
    if (roleCode.includes(searchLower) || roleDisplay.includes(searchLower)) return true;

    // Search in specialty
    const specialtyCode = String(get(practitionerRole, 'specialty[0].coding[0].code', '')).toLowerCase();
    const specialtyDisplay = String(get(practitionerRole, 'specialty[0].text', get(practitionerRole, 'specialty[0].coding[0].display', ''))).toLowerCase();
    if (specialtyCode.includes(searchLower) || specialtyDisplay.includes(searchLower)) return true;

    // Search in ID (handle both string and ObjectID)
    if (practitionerRole._id) {
      const idString = typeof practitionerRole._id === 'object' && practitionerRole._id._str
        ? practitionerRole._id._str
        : String(practitionerRole._id);
      if (idString.toLowerCase().includes(searchLower)) return true;
    }
    if (practitionerRole.id && practitionerRole.id.toLowerCase().includes(searchLower)) return true;

    return false;
  });

  data.practitionerRolesIndex = useTracker(function(){
    return Session.get('PractitionerRolesTable.practitionerRolesIndex');
  }, []);
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, []);
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, []);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function handleAddPractitionerRole(){
    console.log('Add PractitionerRole button clicked');
    navigate('/practitioner-roles/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Practitioner Roles
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {filteredPractitionerRoles.length} of {data.practitionerRoles.length} practitioner roles
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
                id="newPractitionerRoleButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddPractitionerRole}
              >
                Add Practitioner Role
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="practitionerRoleSearchInput"
            fullWidth
            placeholder="Search practitioner roles by ID, practitioner, organization, role, specialty..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(filteredPractitionerRoles.length > 0){
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
        <PractitionerRolesTable
          id='practitionerRolesTable'
          practitionerRoles={filteredPractitionerRoles}
          count={filteredPractitionerRoles.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.PractitionerRoles.hideRemoveButtonOnTable', true)}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            PractitionerRoles._collection.remove({_id: selectedId});
          }}
          onSetPage={function(index){
            Session.set('PractitionerRolesTable.practitionerRolesIndex', index);
          }}
          page={data.practitionerRolesIndex}
          onRowClick={function(practitionerRoleId){
            console.log('PractitionerRolesPage.onRowClick', practitionerRoleId);
            navigate('/practitioner-roles/' + practitionerRoleId);
          }}
        />
      </CardContent>
    </Card>;
  } else {
    layoutContent = <Box
      id="noPractitionerRolesMessage"
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
            onClick={handleAddPractitionerRole}
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
            Add Your First Practitioner Role
          </Button>
        </CardContent>
      </Card>
    </Box>;
  }

  return (
    <Box
      id="practitionerRolesPage"
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

export default PractitionerRolesPage;
