// /imports/ui-fhir/molecularSequences/MolecularSequencesPage.jsx

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

import MolecularSequencesTable from './MolecularSequencesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

import { MolecularSequences } from '/imports/lib/schemas/SimpleSchemas/MolecularSequences';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedMolecularSequenceId', false);
Session.setDefault('molecularSequenceSearchFilter', '');
Session.setDefault('MolecularSequencesPage.onePageLayout', true);
Session.setDefault('MolecularSequencesTable.hideCheckbox', true);
Session.setDefault('MolecularSequencesTable.molecularSequencesIndex', 0);

//=============================================================================================================================================
// MAIN COMPONENT

export function MolecularSequencesPage(props) {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('MolecularSequencesPage.debugLogged', false);
    };
  }, []);

  // Subscribe to molecular sequences data
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
              { 'type': { $regex: searchFilter, $options: 'i' } },
              { 'observedSeq': { $regex: searchFilter, $options: 'i' } },
              { 'patient.display': { $regex: searchFilter, $options: 'i' } }
            ]
          }
        ]
      };
    }

    if (autoSubscribeEnabled) {
      const handle = Meteor.subscribe('autopublish.MolecularSequences', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.MolecularSequences', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    molecularSequences: [],
    onePageLayout: true,
    molecularSequencesIndex: 0
  };

  data.onePageLayout = useTracker(function () {
    return Session.get('MolecularSequencesPage.onePageLayout');
  }, []);
  data.hideCheckbox = useTracker(function () {
    return Session.get('MolecularSequencesTable.hideCheckbox');
  }, []);
  data.molecularSequences = useTracker(function () {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;

    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};

    if (!Session.get('MolecularSequencesPage.debugLogged')) {
      Session.set('MolecularSequencesPage.debugLogged', true);
      console.log('MolecularSequences data - query:', query);
    }

    const results = MolecularSequences.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, []);
  data.molecularSequencesIndex = useTracker(function () {
    return Session.get('MolecularSequencesTable.molecularSequencesIndex');
  }, []);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  function handleAddMolecularSequence() {
    console.log('Add MolecularSequence button clicked');
    navigate('/molecular-sequences/new');
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
              Molecular Sequences
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.molecularSequences.length} molecular sequences found
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
                id="newMolecularSequenceButton"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMolecularSequence}
              >
                Add Molecular Sequence
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="molecularSequenceSearchInput"
              fullWidth
              placeholder="Search molecular sequences by ID, type, observed sequence, or patient name..."
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
  if (data.molecularSequences.length > 0) {
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
        <MolecularSequencesTable
          id='molecularSequencesTable'
          molecularSequences={data.molecularSequences}
          count={data.molecularSequences.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onRowClick={function (molecularSequenceId) {
            console.log('MolecularSequencesPage.onRowClick', molecularSequenceId);
            navigate('/molecular-sequences/' + molecularSequenceId);
          }}
          onSetPage={function (index) {
            Session.set('MolecularSequencesTable.molecularSequencesIndex', index);
          }}
          page={data.molecularSequencesIndex}
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
            id="newMolecularSequenceButton"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddMolecularSequence}
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
            Add Your First Molecular Sequence
          </Button>
        </CardContent>
      </Card>
    </Box>;
  }

  return (
    <Box
      id="molecularSequencesPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      {data.molecularSequences.length === 0 && (
        <TextField
          id="molecularSequenceSearchInput"
          fullWidth
          placeholder="Search molecular sequences by ID, type, observed sequence, or patient name..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        />
      )}
      {data.molecularSequences.length > 0 && renderHeader()}
      {layoutContent}
    </Box>
  );
}

export default MolecularSequencesPage;
