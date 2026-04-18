// /imports/ui-fhir/specimens/SpecimensPage.jsx

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

import SpecimensTable from './SpecimensTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

import { Specimens } from '/imports/lib/schemas/SimpleSchemas/Specimens';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedSpecimenId', false);
Session.setDefault('specimenSearchFilter', '');
Session.setDefault('SpecimensPage.onePageLayout', true);
Session.setDefault('SpecimensTable.hideCheckbox', true);
Session.setDefault('SpecimensTable.specimensIndex', 0);

//=============================================================================================================================================
// MAIN COMPONENT

export function SpecimensPage(props) {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('SpecimensPage.debugLogged', false);
    };
  }, []);

  // Subscribe to specimens data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

    let query = {};

    if (selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');

      if (fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if (selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    if (searchFilter && searchFilter.length > 0) {
      query = {
        $and: [
          query,
          {
            $or: [
              { '_id': searchFilter },
              { 'id': searchFilter },
              { 'type.text': { $regex: searchFilter, $options: 'i' } },
              { 'type.coding.0.display': { $regex: searchFilter, $options: 'i' } },
              { 'status': { $regex: searchFilter, $options: 'i' } },
              { 'accessionIdentifier.value': { $regex: searchFilter, $options: 'i' } },
              { 'subject.display': { $regex: searchFilter, $options: 'i' } },
              { 'collection.bodySite.text': { $regex: searchFilter, $options: 'i' } }
            ]
          }
        ]
      };
    }

    if (autoSubscribeEnabled) {
      const handle = Meteor.subscribe('autopublish.Specimens', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Specimens', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    specimens: [],
    onePageLayout: true,
    specimensIndex: 0
  };

  data.onePageLayout = useTracker(function () {
    return Session.get('SpecimensPage.onePageLayout');
  }, []);
  data.hideCheckbox = useTracker(function () {
    return Session.get('SpecimensTable.hideCheckbox');
  }, []);
  data.specimens = useTracker(function () {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;

    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};

    if (!Session.get('SpecimensPage.debugLogged')) {
      Session.set('SpecimensPage.debugLogged', true);
      console.log('Specimens data - query:', query);
    }

    const results = Specimens.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, []);
  data.specimensIndex = useTracker(function () {
    return Session.get('SpecimensTable.specimensIndex');
  }, []);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  function handleAddSpecimen() {
    console.log('Add Specimen button clicked');
    navigate('/specimens/new');
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
              Specimens
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.specimens.length} specimens found
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
                id="newSpecimenButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddSpecimen}
              >
                Add Specimen
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="specimenSearchInput"
              fullWidth
              placeholder="Search specimens by ID, type, status, accession ID, patient name, or body site..."
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
  if (data.specimens.length > 0) {
    layoutContent = <Card
      sx={{
        width: '100%',
        borderRadius: 3,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <SpecimensTable
          id='specimensTable'
          specimens={data.specimens}
          count={data.specimens.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onRowClick={function (specimenId) {
            console.log('SpecimensPage.onRowClick', specimenId);
            navigate('/specimens/' + specimenId);
          }}
          onSetPage={function (index) {
            Session.set('SpecimensTable.specimensIndex', index);
          }}
          page={data.specimensIndex}
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
          boxShadow: 2,
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
            id="newSpecimenButton"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSpecimen}
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
            Add Your First Specimen
          </Button>
        </CardContent>
      </Card>
    </Box>;
  }

  return (
    <Box
      id="specimensPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      {data.specimens.length > 0 && renderHeader()}
      {layoutContent}
    </Box>
  );
}

export default SpecimensPage;
