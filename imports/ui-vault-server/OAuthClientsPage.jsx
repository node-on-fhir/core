// imports/ui-vault-server/OAuthClientsPage.jsx

import React, { useState } from 'react';

import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';

import { useTracker, useFind, useSubscribe } from 'meteor/react-meteor-data';

import OAuthClientsTable from './OAuthClientsTable';

import { get, cloneDeep } from 'lodash';


// import { OAuthClients } from '../collections/OAuthClients';
import { OAuthClients } from '/imports/collections/OAuthClients';


//---------------------------------------------------------------
// Session Variables


Session.setDefault('oauthClientPageTabIndex', 0);
Session.setDefault('oauthClientSearchFilter', '');
Session.setDefault('selectedOAuthClientId', '');
Session.setDefault('selectedOAuthClient', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('oauthClientsArray', []);
Session.setDefault('OAuthClientsPage.onePageLayout', true)
Session.setDefault('OAuthClientsTable.hideCheckbox', true)


Meteor.startup(function(){
  Meteor.subscribe('OAuthClients');  
})

//===========================================================================
// MAIN COMPONENT  

Session.setDefault('oauthClientChecklistMode', false)

export function OAuthClientsPage(props){

  const isLoading = useSubscribe('OAuthClients');

  // Modal dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [registeredClient, setRegisteredClient] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    scope: 'profile fhirUser */Patient launch/patient openid offline_access',
    redirect_uris: '',
    launch_uri: '',
    jwks_uri: '',
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_basic',
    pkce_enabled: false,
    pkce_method: 'S256',
    auth_request_method: 'GET',
    tos_uri: ''
  });

  let data = {
    selectedAuditEventId: '',
    selectedAuditEvent: null,
    oauthClients: [],
    onePageLayout: true,
    hideCheckbox: true,
    oauthClientSearchFilter: '',
    options: {
      sort: {
        'focus.display': -1,
        lastModified: -1
      }
    },
    oauthClientChecklistMode: false
  };

  data.oauthClients = useFind(() => OAuthClients.find());

  data.onePageLayout = useTracker(function(){
    return Session.get('OAuthClientsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('OAuthClientsTable.hideCheckbox');
  }, [])
  data.selectedOAuthClientId = useTracker(function(){
    return Session.get('selectedOAuthClientId');
  }, [])
  data.selectedOAuthClient = useTracker(function(){
    return OAuthClients.findOne(Session.get('selectedOAuthClientId'));
  }, [])
  data.oauthClients = useTracker(function(){
    let results = [];
    // if(Session.get('oauthClientChecklistMode')){
    //   results = OAuthClients.find({
    //     'focus.display': "Patient Correction"
    //   }, {
    //     limit: 10,
    //     sort: {lastModified: -1}
    //   }).fetch();      
    // } else {
      results = OAuthClients.find({}, {sort: {'created_at': -1}}).fetch();
    // }

    return results;
  }, [])
  data.oauthClientSearchFilter = useTracker(function(){
    return Session.get('oauthClientSearchFilter')
  }, [])
  data.oauthClientChecklistMode = useTracker(function(){
    return Session.get('oauthClientChecklistMode')
  }, [])

  let [pageIndex, setPage] = useState(0);

  // Handler functions for modal dialog
  function handleOpenModal(){
    setFormData({
      client_id: Random.id(),
      client_name: '',
      scope: 'profile fhirUser */Patient launch/patient openid offline_access',
      redirect_uris: '',
      launch_uri: '',
      jwks_uri: '',
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
      pkce_enabled: false,
      pkce_method: 'S256',
      auth_request_method: 'GET',
      tos_uri: ''
    });
    setModalOpen(true);
  }

  function handleCloseModal(){
    setModalOpen(false);
  }

  function handleFormChange(field, value){
    setFormData(prevState => ({
      ...prevState,
      [field]: value
    }));
  }

  function handleCheckboxChange(field, value){
    setFormData(prevState => {
      const currentValues = prevState[field] || [];
      if(currentValues.includes(value)){
        return {
          ...prevState,
          [field]: currentValues.filter(item => item !== value)
        };
      } else {
        return {
          ...prevState,
          [field]: [...currentValues, value]
        };
      }
    });
  }

  function handleGenerateClientId(){
    setFormData(prevState => ({
      ...prevState,
      client_id: Random.id()
    }));
  }

  function handleCopyToClipboard(text){
    navigator.clipboard.writeText(text);
    setSnackbarMessage('Copied to clipboard!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }

  async function handleSubmit(){
    try {
      // Prepare payload for POST /oauth/registration
      const payload = {
        client_id: formData.client_id,
        client_name: formData.client_name,
        scope: formData.scope,
        redirect_uris: formData.redirect_uris.split('\n').filter(uri => uri.trim() !== ''),
        grant_types: formData.grant_types,
        response_types: formData.response_types,
        token_endpoint_auth_method: formData.token_endpoint_auth_method
      };

      if(formData.tos_uri){
        payload.tos_uri = formData.tos_uri;
      }

      if(formData.launch_uri){
        payload.launch_uri = formData.launch_uri;
      }

      if(formData.jwks_uri){
        payload.jwks_uri = formData.jwks_uri;
      }

      console.log('Submitting OAuth client registration:', payload);

      const response = await fetch('/oauth/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if(response.ok){
        console.log('Client registered successfully:', result);

        // Store the full response (includes client_secret)
        setRegisteredClient(result);

        // Close registration modal
        setModalOpen(false);

        // Show success message
        setSnackbarMessage('OAuth client registered successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Open secret display dialog
        setSecretDialogOpen(true);

        // Refresh the subscription to show new client
        Meteor.subscribe('OAuthClients');
      } else {
        console.error('Registration failed:', result);
        setSnackbarMessage('Registration failed: ' + (result.error || result.description || 'Unknown error'));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch(error){
      console.error('Error registering client:', error);
      setSnackbarMessage('Error: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }


  function handleRowClick(oauthClientId){
    console.log('OAuthClientsPage.handleRowClick', oauthClientId)
    // let oauthClient = OAuthClients.findOne({id: oauthClientId});

    // if(oauthClient){
    //   Session.set('selectedOAuthClientId', get(oauthClient, 'id'));
    //   Session.set('selectedOAuthClient', oauthClient);
    //   Session.set('OAuthClient.Current', oauthClient);
      
    //   let showModals = true;
    //   if(showModals){
    //     Session.set('mainAppDialogOpen', true);
    //     Session.set('mainAppDialogComponent', "OAuthClientDetail");
    //     Session.set('mainAppDialogMaxWidth', "sm");

    //     if(Meteor.currentUserId()){
    //       Session.set('mainAppDialogTitle', "Edit OAuthClient");
    //     } else {
    //       Session.set('mainAppDialogTitle', "View OAuthClient");
    //     }
    //   }      
    // } else {
    //   console.log('No oauthClient found...')
    // }
  }
  function onInsert(oauthClientId){
    Session.set('selectedOAuthClientId', '');
    Session.set('oauthClientPageTabIndex', 1);
    // HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "OAuthClients", recordId: oauthClientId});
  }
  function onCancel(){
    Session.set('oauthClientPageTabIndex', 1);
  } 


  // console.log('OAuthClientsPage.data', data)

  function handleChange(event, newValue) {
    Session.set('oauthClientPageTabIndex', newValue)
  }

  // Get FHIR base URL for Inferno registration
  const fhirBaseUrl = window.location.origin + get(Meteor, 'settings.private.fhir.fhirPath', '/baseR4');

  let layoutContents;
  if(data.onePageLayout){
    layoutContents = <Card height="auto" margin={20} >
      <CardHeader
        title={data.oauthClients.length + " OAuth Clients"}
        subheader={"FHIR Endpoint: " + fhirBaseUrl}
        action={
          <Grid container spacing={1} alignItems="center" justifyContent="flex-end">
            <Grid item>
              <IconButton onClick={() => handleCopyToClipboard(fhirBaseUrl)} size="small" title="Copy FHIR Endpoint">
                <ContentCopyIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenModal}
              >
                New Client
              </Button>
            </Grid>
          </Grid>
        }
      />
      <CardContent>

        <OAuthClientsTable 
          oauthClients={ data.oauthClients }
          hideCheckbox={data.hideCheckbox}
          hideStatus={false}
          hideName={false}
          hideConnectionType={false}
          hideOrganization={false}
          hideAddress={false}    
          paginationLimit={10}     
          checklist={data.oauthClientChecklistMode}
          onRowClick={ handleRowClick.bind(this) }
          // rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
          count={data.oauthClients.length}
          onSetPage={function(index){
            setPage(index)
          }}     
          page={pageIndex}                 
          />
        </CardContent>
      </Card>
  } else {
    layoutContents = <Grid container spacing={3}>
      <Grid item lg={6}>
        <Card height="auto" margin={20} >
          <CardHeader title={data.oauthClients.length + " Code Systems"} />
          <CardContent>
            <OAuthClientsTable 
              oauthClients={ data.oauthClients }
              selectedOAuthClientId={ data.selectedOAuthClientId }
              hideIdentifier={true} 
              hideCheckbox={data.hideCheckbox}
              hideActionIcons={true}
              hideStatus={false}
              hideName={false}
              hideConnectionType={false}
              hideOrganization={false}
              hideAddress={false}    
              onRowClick={ handleRowClick.bind(this) }
              // rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
              count={data.oauthClients.length}
              />
          </CardContent>
        </Card>
      </Grid>
      <Grid item lg={4}>
        <Card height="auto" margin={20}>
          <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedOAuthClientId }</h1>
          {/* <CardHeader title={data.selectedOAuthClientId } className="helveticas barcode" /> */}
          <CardContent>
            <CardContent>
              {/* <OAuthClientDetail 
                id='oauthClientDetails'                 
                displayDatePicker={true} 
                displayBarcodes={false}
                oauthClient={ data.selectedOAuthClient }
                oauthClientId={ data.selectedOAuthClientId } 
                showOAuthClientInputs={true}
                showHints={false}

              /> */}
            </CardContent>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  }


  // let headerHeight = LayoutHelpers.calcHeaderHeight();
  // let formFactor = LayoutHelpers.determineFormFactor();
  // let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  return (
    <div id="certsStoragePage" style={{padding: '20px'}}>
      { layoutContents }

      {/* New Client Modal Dialog */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Register New OAuth Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{marginTop: '8px'}}>
            {/* Client ID */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client ID"
                value={formData.client_id}
                onChange={(e) => handleFormChange('client_id', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <>
                      <IconButton onClick={handleGenerateClientId} size="small">
                        <AddIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCopyToClipboard(formData.client_id)} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    </>
                  )
                }}
                helperText="Unique identifier for this client"
              />
            </Grid>

            {/* Client Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Client Name"
                value={formData.client_name}
                onChange={(e) => handleFormChange('client_name', e.target.value)}
                helperText="Human-readable name (e.g., 'Inferno Test Runner')"
              />
            </Grid>

            {/* Redirect URIs */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Redirect URIs"
                value={formData.redirect_uris}
                onChange={(e) => handleFormChange('redirect_uris', e.target.value)}
                helperText="One URL per line (e.g., https://inferno.healthit.gov/suites/custom/smart/redirect)"
              />
            </Grid>

            {/* Scope */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Scopes"
                value={formData.scope}
                onChange={(e) => handleFormChange('scope', e.target.value)}
                helperText="Space-separated SMART on FHIR scopes"
              />
            </Grid>

            {/* Grant Types */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Grant Types</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.grant_types.includes('authorization_code')}
                        onChange={() => handleCheckboxChange('grant_types', 'authorization_code')}
                      />
                    }
                    label="authorization_code"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.grant_types.includes('client_credentials')}
                        onChange={() => handleCheckboxChange('grant_types', 'client_credentials')}
                      />
                    }
                    label="client_credentials"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.grant_types.includes('refresh_token')}
                        onChange={() => handleCheckboxChange('grant_types', 'refresh_token')}
                      />
                    }
                    label="refresh_token"
                  />
                </FormGroup>
              </FormControl>
            </Grid>

            {/* Response Types */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Response Types</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.response_types.includes('code')}
                        onChange={() => handleCheckboxChange('response_types', 'code')}
                      />
                    }
                    label="code"
                  />
                </FormGroup>
              </FormControl>
            </Grid>

            {/* Token Endpoint Auth Method */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Token Endpoint Auth Method</InputLabel>
                <Select
                  value={formData.token_endpoint_auth_method}
                  onChange={(e) => handleFormChange('token_endpoint_auth_method', e.target.value)}
                  label="Token Endpoint Auth Method"
                >
                  <MenuItem value="client_secret_basic">client_secret_basic (Confidential Symmetric)</MenuItem>
                  <MenuItem value="client_secret_post">client_secret_post (Confidential Symmetric)</MenuItem>
                  <MenuItem value="private_key_jwt">private_key_jwt (Confidential Asymmetric)</MenuItem>
                  <MenuItem value="none">none (Public)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* PKCE Enabled */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Proof Key for Code Exchange (PKCE)</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.pkce_enabled}
                        onChange={(e) => handleFormChange('pkce_enabled', e.target.checked)}
                      />
                    }
                    label="PKCE Enabled (Required for Public clients)"
                  />
                </FormGroup>
              </FormControl>
            </Grid>

            {/* PKCE Code Challenge Method */}
            {formData.pkce_enabled && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>PKCE Code Challenge Method</InputLabel>
                  <Select
                    value={formData.pkce_method}
                    onChange={(e) => handleFormChange('pkce_method', e.target.value)}
                    label="PKCE Code Challenge Method"
                  >
                    <MenuItem value="S256">S256 (Recommended)</MenuItem>
                    <MenuItem value="plain">Plain</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Authorization Request Method */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Authorization Request Method</InputLabel>
                <Select
                  value={formData.auth_request_method}
                  onChange={(e) => handleFormChange('auth_request_method', e.target.value)}
                  label="Authorization Request Method"
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* SMART Launch URI */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SMART Launch URI (Optional)"
                value={formData.launch_uri}
                onChange={(e) => handleFormChange('launch_uri', e.target.value)}
                helperText="For SMART App Launch (e.g., https://inferno.healthit.gov/suites/custom/smart/launch)"
              />
            </Grid>

            {/* JWK Set URL */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="JWK Set URL (Optional)"
                value={formData.jwks_uri}
                onChange={(e) => handleFormChange('jwks_uri', e.target.value)}
                helperText="For multi-patient API / Backend Services (e.g., https://inferno.healthit.gov/suites/custom/g10_certification/.well-known/jwks.json)"
              />
            </Grid>

            {/* Terms of Service URI */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terms of Service URI (Optional)"
                value={formData.tos_uri}
                onChange={(e) => handleFormChange('tos_uri', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.client_name || !formData.redirect_uris}
          >
            Register Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* Client Secret Display Dialog */}
      <Dialog
        open={secretDialogOpen}
        onClose={() => setSecretDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Client Registered Successfully!</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> Save these credentials now. The client secret will not be shown again!
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client ID"
                value={get(registeredClient, 'client_id', '')}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => handleCopyToClipboard(get(registeredClient, 'client_id', ''))} size="small">
                      <ContentCopyIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>

            {get(registeredClient, 'client_secret') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Client Secret"
                  value={get(registeredClient, 'client_secret', '')}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={() => handleCopyToClipboard(get(registeredClient, 'client_secret', ''))} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    )
                  }}
                  helperText="This secret will only be shown once. Copy it now!"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client Name"
                value={get(registeredClient, 'client_name', '')}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Scopes"
                value={get(registeredClient, 'scope', '')}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSecretDialogOpen(false)} variant="contained" color="primary">
            I've Saved The Credentials
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}


export default OAuthClientsPage;