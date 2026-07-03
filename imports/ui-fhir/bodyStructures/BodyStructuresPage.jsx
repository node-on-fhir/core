// imports/ui-fhir/bodyStructures/BodyStructuresPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Grid,
  Container,
  Card,
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
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import BodyStructuresTable from './BodyStructuresTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

const log = (Meteor.Logger ? Meteor.Logger.for('BodyStructuresPage') : console);

// Session defaults
Session.setDefault('selectedBodyStructureId', false);
Session.setDefault('bodyStructureSearchFilter', '');
Session.setDefault('BodyStructuresPage.onePageLayout', true);
Session.setDefault('BodyStructuresPage.defaultQuery', {});
Session.setDefault('BodyStructuresTable.hideCheckbox', true);
Session.setDefault('BodyStructuresTable.bodyStructuresIndex', 0);

export function BodyStructuresPage(props) {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('BodyStructuresPage.debugLogged', false);
    };
  }, []);

  // Subscribe to body structures data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    // Build patient filter query
    let query = {};

    if (selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');

      if (fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if (selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add search filter if present
    if (searchFilter && searchFilter.length > 0) {
      query = {
        $and: [
          query,
          {
            $or: [
              {'_id': searchFilter},
              {'id': searchFilter},
              {'description': {$regex: searchFilter, $options: 'i'}},
              {'morphology.text': {$regex: searchFilter, $options: 'i'}},
              {'morphology.coding.0.display': {$regex: searchFilter, $options: 'i'}},
              {'includedStructure.0.structure.text': {$regex: searchFilter, $options: 'i'}},
              {'patient.display': {$regex: searchFilter, $options: 'i'}}
            ]
          }
        ]
      };
    }

    log.debug('BodyStructures subscription - selectedPatientId:', { selectedPatientId });
    console.log('BodyStructures subscription query:', query);

    if (autoSubscribeEnabled) {
      const handle = Meteor.subscribe('autopublish.BodyStructures', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.BodyStructures', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentBodyStructureId: '',
    selectedBodyStructure: null,
    bodyStructures: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    bodyStructuresIndex: 0
  };

  data.onePageLayout = useTracker(function() {
    return Session.get('BodyStructuresPage.onePageLayout');
  }, []);

  data.hideCheckbox = useTracker(function() {
    return Session.get('BodyStructuresTable.hideCheckbox');
  }, []);

  data.selectedBodyStructureId = useTracker(function() {
    return Session.get('selectedBodyStructureId');
  }, []);

  data.selectedBodyStructure = useTracker(function() {
    return BodyStructures.findOne({_id: Session.get('selectedBodyStructureId')});
  }, []);

  data.bodyStructures = useTracker(function() {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;

    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};

    if (!Session.get('BodyStructuresPage.debugLogged')) {
      Session.set('BodyStructuresPage.debugLogged', true);

      log.debug('BodyStructures data - MongoDB _id:', { selectedPatientId });
      console.log('BodyStructures data - FHIR id:', fhirId);
      console.log('BodyStructures data - query:', query);

      const allBodyStructures = BodyStructures.find().fetch();
      console.log('Total BodyStructures in client collection:', allBodyStructures.length);
    }

    const results = BodyStructures.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, []);

  data.bodyStructuresIndex = useTracker(function() {
    return Session.get('BodyStructuresTable.bodyStructuresIndex');
  }, []);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  function handleAddBodyStructure() {
    console.log('Add Body Structure button clicked');
    navigate('/body-structures/new');
  }

  function handleSortOrderChange(event, newOrder) {
    if (newOrder !== null) {
      setSortOrder(newOrder);
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Body Structures
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.bodyStructures.length} body structures found
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
                onClick={handleAddBodyStructure}
              >
                Add Body Structure
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="bodyStructureSearchInput"
              fullWidth
              placeholder="Search body structures by ID, description, morphology, structure, or patient..."
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
  if (data.bodyStructures.length > 0) {
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
        <BodyStructuresTable
          id='bodyStructuresTable'
          bodyStructures={data.bodyStructures}
          count={data.bodyStructures.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onRowClick={function(bodyStructureId) {
            console.log('BodyStructuresPage.onRowClick', bodyStructureId);
            navigate('/body-structures/' + bodyStructureId);
          }}
          onSetPage={function(index) {
            Session.set('BodyStructuresTable.bodyStructuresIndex', index);
          }}
          page={data.bodyStructuresIndex}
        />
      </CardContent>
    </Card>;
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
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No body structure records were found. You can create a new body structure to document anatomical locations for this patient.")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddBodyStructure}
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
            Add Your First Body Structure
          </Button>
        </CardContent>
      </Card>
    </Box>;
  }

  return (
    <Box
      id="bodyStructuresPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      {renderHeader()}
      {layoutContent}
    </Box>
  );
}

export default BodyStructuresPage;
