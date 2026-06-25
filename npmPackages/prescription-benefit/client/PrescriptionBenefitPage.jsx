// npmPackages/prescription-benefit/client/PrescriptionBenefitPage.jsx
//
// Real-Time Prescription Benefit (§ 170.315(b)(4)) workflow:
//   Compose (RTPBRequest) -> Run (mock or live) -> Result (display) + History.

import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Card, CardHeader, CardContent, Box, Tabs, Tab, Alert, Chip,
  TextField, Button, Autocomplete, MenuItem, Typography, Grid,
  ToggleButtonGroup, ToggleButton, Table, TableHead, TableBody, TableRow,
  TableCell, CircularProgress
} from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import BenefitResultCard from './components/BenefitResultCard.jsx';
import AlternativesTable from './components/AlternativesTable.jsx';
import RawXmlAccordion from './components/RawXmlAccordion.jsx';
import { PrescriptionBenefitRequest, PrescriptionBenefitResponse } from '../lib/collections.js';
import { productFromMedicationRequest } from '../lib/RtpbModel.js';
import sampleData from '../data/sampleDrugs.json';

const SAMPLE_DRUGS = get(sampleData, 'drugs', []);

function money(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  return '$' + Number(amount).toFixed(2);
}

function PrescriptionBenefitPage() {
  const patient = useTracker(function() { return Session.get('selectedPatient'); }, []);
  const patientId = useTracker(function() { return Session.get('selectedPatientId'); }, []);

  // Server mode (mock vs live endpoint).
  const [config, setConfig] = useState({ mode: 'mock', endpointConfigured: false });
  useEffect(function() {
    Meteor.call('prescriptionBenefit.getConfig', function(error, result) {
      if (!error && result) setConfig(result);
    });
  }, []);

  // Compose form state.
  const [rxSource, setRxSource] = useState('composer');
  const [product, setProduct] = useState({ rxnorm: '', ndc: '', display: '' });
  const [quantity, setQuantity] = useState(30);
  const [daysSupply, setDaysSupply] = useState(30);
  const [prescriber, setPrescriber] = useState({ npi: '', name: '' });
  const [pharmacy, setPharmacy] = useState({ ncpdpId: '', name: 'Community Pharmacy' });
  const [coverage, setCoverage] = useState({ payerName: 'Sample PBM Plan', bin: '', pcn: '', groupId: '', memberId: '' });
  const [selectedMrId, setSelectedMrId] = useState('');

  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Patient's MedicationRequests (for the "From MedicationRequest" prefill).
  const medicationRequests = useTracker(function() {
    const Collection = get(Meteor, 'Collections.MedicationRequests');
    if (!Collection || !patientId) return [];
    Meteor.subscribe('autopublish.MedicationRequests', { patient: patientId }, {});
    return Collection.find({}).fetch();
  }, [patientId]);

  // Transaction history (both halves), joined by requestId.
  const history = useTracker(function() {
    if (!patientId) return [];
    Meteor.subscribe('prescriptionBenefit.transactions', patientId, 50);
    const requests = PrescriptionBenefitRequest.find({ patientId: patientId }, { sort: { createdAt: -1 } }).fetch();
    return requests.map(function(req) {
      const resp = PrescriptionBenefitResponse.findOne({ requestId: req._id });
      return { request: req, response: resp };
    });
  }, [patientId]);

  // ---- Footer-button bridge (Session tokens) ----
  const submitToken = useTracker(function() { return Session.get('prescriptionBenefitSubmitToken'); }, []);
  const clearToken = useTracker(function() { return Session.get('prescriptionBenefitClearToken'); }, []);
  const sessionTab = useTracker(function() { return Session.get('prescriptionBenefitActiveTab'); }, []);
  const lastSubmit = useRef(null);
  const lastClear = useRef(null);

  function handleDrugPick(drug) {
    if (!drug) return;
    setProduct({
      rxnorm: get(drug, 'rxnorm', ''),
      ndc: get(drug, 'ndc', ''),
      display: get(drug, 'display', '')
    });
  }

  function handleMrSelect(mrId) {
    setSelectedMrId(mrId);
    const mr = medicationRequests.find(function(m) { return get(m, '_id') === mrId || get(m, 'id') === mrId; });
    if (mr) setProduct(productFromMedicationRequest(mr));
  }

  function buildRequestJson() {
    const name = get(patient, 'name.0', {});
    return {
      transactionType: 'RTPBRequest',
      patient: {
        id: get(patient, 'id', get(patient, '_id', '')),
        firstName: get(name, 'given.0', ''),
        lastName: get(name, 'family', ''),
        dob: get(patient, 'birthDate', ''),
        gender: get(patient, 'gender', '')
      },
      product: product,
      quantity: Number(quantity) || 0,
      daysSupply: Number(daysSupply) || 0,
      prescriber: prescriber,
      pharmacy: pharmacy,
      coverage: coverage
    };
  }

  function handleSubmit() {
    if (!patient) {
      setError('No patient selected.');
      return;
    }
    if (!get(product, 'rxnorm')) {
      setError('Select or enter a product (RxNorm code required) before running the benefit check.');
      setActiveTab(0);
      return;
    }
    setError(null);
    setSubmitting(true);

    const requestJson = buildRequestJson();
    const options = selectedMrId ? { medicationRequestId: selectedMrId } : {};

    Meteor.callAsync('prescriptionBenefit.submitRequest', requestJson, options)
      .then(function(res) {
        setResult(res);
        setSubmitting(false);
        setActiveTab(1);
        console.log('[PrescriptionBenefitPage] benefit check complete:', get(res, 'requestId'));
      })
      .catch(function(err) {
        setSubmitting(false);
        setError(get(err, 'reason', get(err, 'message', 'Benefit check failed.')));
        console.error('[PrescriptionBenefitPage] submit error:', err);
      });
  }

  function handleClear() {
    setProduct({ rxnorm: '', ndc: '', display: '' });
    setSelectedMrId('');
    setQuantity(30);
    setDaysSupply(30);
    setResult(null);
    setError(null);
    setActiveTab(0);
  }

  // Run footer-token effects each render, guarded by the last-seen token.
  useEffect(function() {
    if (submitToken && submitToken !== lastSubmit.current) {
      lastSubmit.current = submitToken;
      handleSubmit();
    }
    if (clearToken && clearToken !== lastClear.current) {
      lastClear.current = clearToken;
      handleClear();
    }
    if (typeof sessionTab === 'number') {
      setActiveTab(sessionTab);
      Session.set('prescriptionBenefitActiveTab', undefined);
    }
  });

  function loadHistoryRow(row) {
    const req = get(row, 'request', {});
    const resp = get(row, 'response', {});
    setResult({
      requestId: get(req, '_id'),
      responseId: get(resp, '_id'),
      mode: get(resp, 'source', get(req, 'mode', '')),
      requestJson: get(req, 'requestJson', {}),
      requestXml: get(req, 'requestXml', ''),
      responseJson: get(resp, 'responseJson', {}),
      responseXml: get(resp, 'responseXml', ''),
      summary: get(resp, 'summary', {})
    });
    setActiveTab(1);
  }

  // ---- Render ----
  if (!patient) {
    return (
      <Container id="prescriptionBenefitPage" maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar to run a
          real-time prescription benefit check.
        </Alert>
      </Container>
    );
  }

  return (
    <Container id="prescriptionBenefitPage" maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardHeader
          avatar={<LocalPharmacyIcon />}
          title="Prescription Benefit"
          subheader="Real-Time Prescription Benefit · § 170.315(b)(4)"
          action={
            <Chip
              sx={{ mr: 2, mt: 1 }}
              label={config.mode === 'live' ? 'Mode: Live endpoint' : 'Mode: Mock PBM'}
              color={config.mode === 'live' ? 'info' : 'default'}
              variant="outlined"
            />
          }
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiCardHeader-subheader': { color: 'primary.contrastText' },
            '& .MuiCardHeader-avatar': { color: 'primary.contrastText' }
          }}
        />
      </Card>

      <Tabs value={activeTab} onChange={function(e, v) { setActiveTab(v); }} sx={{ mb: 2 }}>
        <Tab label="Compose" />
        <Tab label="Result" disabled={!result} />
        <Tab label="History" />
      </Tabs>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {/* ---- COMPOSE ---- */}
      {activeTab === 0 ? (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardHeader
            title="Compose RTPBRequest"
            subheader={get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')}
          />
          <CardContent>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={rxSource}
              onChange={function(e, v) { if (v) setRxSource(v); }}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="composer">New (composer)</ToggleButton>
              <ToggleButton value="medicationRequest">From MedicationRequest</ToggleButton>
            </ToggleButtonGroup>

            <Grid container spacing={2}>
              {rxSource === 'composer' ? (
                <Grid item xs={12}>
                  <Autocomplete
                    id="prescriptionBenefitDrugPicker"
                    options={SAMPLE_DRUGS}
                    getOptionLabel={function(o) { return get(o, 'display', ''); }}
                    onChange={function(e, v) { handleDrugPick(v); }}
                    renderInput={function(params) {
                      return <TextField {...params} label="Pick a sample drug (RxNorm + NDC)" size="small" />;
                    }}
                  />
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <TextField
                    id="prescriptionBenefitMrSelect"
                    select
                    fullWidth
                    size="small"
                    label="Select a MedicationRequest"
                    value={selectedMrId}
                    onChange={function(e) { handleMrSelect(e.target.value); }}
                    helperText={medicationRequests.length === 0 ? 'No MedicationRequests found for this patient.' : ''}
                  >
                    {medicationRequests.map(function(mr) {
                      return (
                        <MenuItem key={get(mr, '_id')} value={get(mr, '_id')}>
                          {get(mr, 'medicationCodeableConcept.text',
                            get(mr, 'medicationCodeableConcept.coding.0.display', get(mr, '_id')))}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField id="prescriptionBenefitRxNorm" fullWidth size="small" label="RxNorm code"
                  value={product.rxnorm}
                  onChange={function(e) { setProduct(Object.assign({}, product, { rxnorm: e.target.value })); }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField id="prescriptionBenefitNdc" fullWidth size="small" label="NDC"
                  value={product.ndc}
                  onChange={function(e) { setProduct(Object.assign({}, product, { ndc: e.target.value })); }} />
              </Grid>
              <Grid item xs={12}>
                <TextField id="prescriptionBenefitDescription" fullWidth size="small" label="Product description"
                  value={product.display}
                  onChange={function(e) { setProduct(Object.assign({}, product, { display: e.target.value })); }} />
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField id="prescriptionBenefitQuantity" fullWidth size="small" type="number" label="Quantity"
                  value={quantity} onChange={function(e) { setQuantity(e.target.value); }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField id="prescriptionBenefitDaysSupply" fullWidth size="small" type="number" label="Days supply"
                  value={daysSupply} onChange={function(e) { setDaysSupply(e.target.value); }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField id="prescriptionBenefitPharmacyName" fullWidth size="small" label="Pharmacy"
                  value={pharmacy.name}
                  onChange={function(e) { setPharmacy(Object.assign({}, pharmacy, { name: e.target.value })); }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField id="prescriptionBenefitPrescriberName" fullWidth size="small" label="Prescriber"
                  value={prescriber.name}
                  onChange={function(e) { setPrescriber(Object.assign({}, prescriber, { name: e.target.value })); }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField id="prescriptionBenefitPrescriberNpi" fullWidth size="small" label="Prescriber NPI"
                  value={prescriber.npi}
                  onChange={function(e) { setPrescriber(Object.assign({}, prescriber, { npi: e.target.value })); }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField id="prescriptionBenefitPayerName" fullWidth size="small" label="Payer / PBM"
                  value={coverage.payerName}
                  onChange={function(e) { setCoverage(Object.assign({}, coverage, { payerName: e.target.value })); }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField id="prescriptionBenefitMemberId" fullWidth size="small" label="Member ID"
                  value={coverage.memberId}
                  onChange={function(e) { setCoverage(Object.assign({}, coverage, { memberId: e.target.value })); }} />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button id="prescriptionBenefitClearButton" variant="outlined" startIcon={<ClearIcon />}
                onClick={handleClear} disabled={submitting}>
                Clear
              </Button>
              <Button id="prescriptionBenefitSubmitButton" variant="contained" color="primary"
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Running...' : 'Run Benefit Check'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {/* ---- RESULT ---- */}
      {activeTab === 1 && result ? (
        <Box>
          <BenefitResultCard result={result} />
          <AlternativesTable alternatives={get(result, 'responseJson.alternatives', [])} />
          <RawXmlAccordion
            requestXml={get(result, 'requestXml', '')}
            responseXml={get(result, 'responseXml', '')}
          />
        </Box>
      ) : null}

      {/* ---- HISTORY ---- */}
      {activeTab === 2 ? (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardHeader title="Transaction History" subheader={history.length + ' transaction(s)'} />
          <CardContent>
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No prescription benefit transactions for this patient yet.
              </Typography>
            ) : (
              <Table id="prescriptionBenefitHistoryTable" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Out-of-pocket</TableCell>
                    <TableCell align="right">Alternatives</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map(function(row) {
                    const req = get(row, 'request', {});
                    const summary = get(row, 'response.summary', {});
                    return (
                      <TableRow key={get(req, '_id')} hover sx={{ cursor: 'pointer' }}
                        onClick={function() { loadHistoryRow(row); }}>
                        <TableCell>{get(req, 'createdAt', '').slice(0, 19).replace('T', ' ')}</TableCell>
                        <TableCell>{get(req, 'requestJson.product.display', '—')}</TableCell>
                        <TableCell align="right">{money(get(summary, 'requestedPatientPay', null))}</TableCell>
                        <TableCell align="right">{get(summary, 'alternativeCount', 0)}</TableCell>
                        <TableCell>{get(req, 'mode', '—')}</TableCell>
                        <TableCell>{get(req, 'status', '—')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </Container>
  );
}

export default PrescriptionBenefitPage;
