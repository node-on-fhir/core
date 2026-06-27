// EPIC ENDPOINTS
// https://open.epic.com/Endpoints/R4

// CERNER ENDPOINTS - PATIENT LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_patient_r4_endpoints.json

// CERNER ENDPOINTS - PROVIDER LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_provider_r4_endpoints.json



import React, { useState, useEffect } from 'react';
import { Random } from 'meteor/random'

import { useFormik, FormikErrors } from 'formik';

import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Tab,
  Tabs,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Image,
  Typography,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormGroup,
  InputAdornment,
  Input,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ClassIcon from '@mui/icons-material/Class';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import LocalPlayIcon from '@mui/icons-material/LocalPlay';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { get, has, set } from 'lodash';

import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import jwt from 'jsonwebtoken';

import { Icon } from 'react-icons-kit';
import { home } from 'react-icons-kit/icomoon/home';
import {ic_vpn_key} from 'react-icons-kit/md/ic_vpn_key';

import {keyOutline} from 'react-icons-kit/typicons/keyOutline'
import {key} from 'react-icons-kit/typicons/key'

import "ace-builds";
import 'ace-builds/src-noconflict/mode-json'

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";


import { fetch, Headers } from 'meteor/fetch';

import forge from 'node-forge';

let pki = forge.pki;

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import SyncIcon from '@mui/icons-material/Sync';
import ServerVersioningCard from './ServerVersioningCard.jsx';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import DnsIcon from '@mui/icons-material/Dns';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SaveIcon from '@mui/icons-material/Save';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

import { Endpoints } from '../lib/schemas/SimpleSchemas/Endpoints';
import { SubscriptionsTable } from './SubscriptionsTable';
import { OAuthClients } from '/imports/collections/OAuthClients';

import { useNavigate, useSearchParams } from "react-router-dom";
import { DynamicSpacer } from '../ui/DynamicSpacer';
import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';


//----------------------------------------------------------------------
// Helper Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})


// =============================================================================
// UDAP CLIENTS TAB COMPONENT
// =============================================================================

function UdapClientsTab(props){
  let {
    udapClients, setUdapClients,
    udapModalOpen, setUdapModalOpen,
    udapSecretDialogOpen, setUdapSecretDialogOpen,
    udapRegisteredClient, setUdapRegisteredClient,
    udapFormData, setUdapFormData,
    remoteServerUrl, setRemoteServerUrl,
    remoteUdapMetadata, setRemoteUdapMetadata,
    fetchingRemoteMetadata, setFetchingRemoteMetadata,
    remoteMetadataError, setRemoteMetadataError,
    copyToClipboard, setCopyMessage, setSnackbarSeverity, setCopySuccess,
    theme
  } = props;

  // Subscribe to OAuthClients
  useEffect(function(){
    Meteor.subscribe('OAuthClients');
  }, []);

  let oauthClients = useTracker(function(){
    return OAuthClients.find({}, { sort: { created_at: -1 } }).fetch();
  }, []);

  function handleOpenUdapModal(){
    setUdapFormData({
      client_id: Random.id(),
      client_name: '',
      scope: 'system/*.read',
      redirect_uris: '',
      launch_uri: '',
      jwks_uri: '',
      grant_types: ['client_credentials'],
      response_types: ['code'],
      token_endpoint_auth_method: 'private_key_jwt',
      pkce_enabled: false,
      pkce_method: 'S256',
      tos_uri: ''
    });
    setUdapModalOpen(true);
  }

  function handleCloseUdapModal(){
    setUdapModalOpen(false);
  }

  function handleUdapFormChange(field, value){
    setUdapFormData(function(prev){
      let next = Object.assign({}, prev);
      next[field] = value;
      return next;
    });
  }

  function handleUdapCheckboxChange(field, value){
    setUdapFormData(function(prev){
      let next = Object.assign({}, prev);
      let current = next[field] || [];
      if(current.includes(value)){
        next[field] = current.filter(function(item){ return item !== value; });
      } else {
        next[field] = current.concat([value]);
      }
      return next;
    });
  }

  async function handleUdapSubmit(){
    try {
      let payload = {
        client_id: udapFormData.client_id,
        client_name: udapFormData.client_name,
        scope: udapFormData.scope,
        redirect_uris: udapFormData.redirect_uris.split('\n').filter(function(uri){ return uri.trim() !== ''; }),
        grant_types: udapFormData.grant_types,
        response_types: udapFormData.response_types,
        token_endpoint_auth_method: udapFormData.token_endpoint_auth_method
      };

      if(udapFormData.tos_uri){
        payload.tos_uri = udapFormData.tos_uri;
      }
      if(udapFormData.launch_uri){
        payload.launch_uri = udapFormData.launch_uri;
      }
      if(udapFormData.jwks_uri){
        payload.jwks_uri = udapFormData.jwks_uri;
      }

      console.log('[UDAP Clients] Submitting registration:', payload);

      let response = await fetch('/oauth/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result = await response.json();

      if(response.ok){
        console.log('[UDAP Clients] Client registered:', result);
        setUdapRegisteredClient(result);
        setUdapModalOpen(false);
        setCopyMessage('OAuth client registered successfully!');
        setSnackbarSeverity('success');
        setCopySuccess(true);
        setUdapSecretDialogOpen(true);
        Meteor.subscribe('OAuthClients');
      } else {
        console.error('[UDAP Clients] Registration failed:', result);
        setCopyMessage('Registration failed: ' + (result.error || result.description || 'Unknown error'));
        setSnackbarSeverity('error');
        setCopySuccess(true);
      }
    } catch(error){
      console.error('[UDAP Clients] Error:', error);
      setCopyMessage('Error: ' + error.message);
      setSnackbarSeverity('error');
      setCopySuccess(true);
    }
  }

  function handleDiscoverRemoteServer(){
    if(!remoteServerUrl){
      setRemoteMetadataError('Please enter a FHIR server URL');
      return;
    }

    setFetchingRemoteMetadata(true);
    setRemoteMetadataError('');
    setRemoteUdapMetadata(null);

    Meteor.call('serverConfiguration.fetchRemoteUdapMetadata', remoteServerUrl, function(error, result){
      setFetchingRemoteMetadata(false);
      if(error){
        console.error('[UDAP Clients] Remote discovery error:', error);
        setRemoteMetadataError(error.reason || error.message || 'Failed to fetch UDAP metadata');
      }
      if(result){
        console.log('[UDAP Clients] Remote metadata:', result);
        setRemoteUdapMetadata(result);
      }
    });
  }

  function handleRegisterFromDiscovery(){
    // Pre-fill the registration form from discovered metadata
    let scopes = get(remoteUdapMetadata, 'scopes_supported', []).join(' ') || 'system/*.read';
    let grantTypes = get(remoteUdapMetadata, 'grant_types_supported', ['client_credentials']);

    setUdapFormData({
      client_id: Random.id(),
      client_name: 'Client for ' + remoteServerUrl,
      scope: scopes,
      redirect_uris: '',
      launch_uri: '',
      jwks_uri: '',
      grant_types: grantTypes,
      response_types: ['code'],
      token_endpoint_auth_method: 'private_key_jwt',
      pkce_enabled: false,
      pkce_method: 'S256',
      tos_uri: ''
    });
    setUdapModalOpen(true);
  }

  function getAuthTypeLabel(client){
    let method = get(client, 'token_endpoint_auth_method', '');
    if(method === 'private_key_jwt') return 'Asymmetric';
    if(method === 'client_secret_basic' || method === 'client_secret_post') return 'Symmetric';
    if(method === 'none') return 'Public';
    return method || 'Unknown';
  }

  function getAuthTypeColor(client){
    let method = get(client, 'token_endpoint_auth_method', '');
    if(method === 'private_key_jwt') return 'primary';
    if(method === 'client_secret_basic' || method === 'client_secret_post') return 'warning';
    if(method === 'none') return 'default';
    return 'default';
  }

  return (
    <Box sx={{ minHeight: '60vh' }}>
      {/* Client list */}
      <Card sx={{ mb: 2 }}>
        <CardHeader
          avatar={<VpnKeyIcon color="primary" />}
          title={oauthClients.length + ' Registered OAuth Clients'}
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenUdapModal}
            >
              Register New Client
            </Button>
          }
        />
        <CardContent>
          {oauthClients.length === 0 && (
            <Alert severity="info">No OAuth clients registered yet. Click "Register New Client" to add one.</Alert>
          )}
          {oauthClients.map(function(client){
            return (
              <Accordion key={client._id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
                    <Typography sx={{ fontWeight: 500, minWidth: '150px' }}>
                      {get(client, 'client_name', 'Unnamed')}
                    </Typography>
                    <Chip
                      label={getAuthTypeLabel(client)}
                      color={getAuthTypeColor(client)}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {get(client, 'client_id', '')}
                    </Typography>
                    {get(client, 'created_at') && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto', flexShrink: 0 }}>
                        {new Date(client.created_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Client ID</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {get(client, 'client_id', '')}
                        </Typography>
                        <IconButton size="small" onClick={function(){ copyToClipboard(get(client, 'client_id', ''), 'Client ID copied!'); }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Auth Method</Typography>
                      <Typography variant="body2">{get(client, 'token_endpoint_auth_method', 'N/A')}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Scope</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{get(client, 'scope', 'N/A')}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Grant Types</Typography>
                      <Typography variant="body2">{(get(client, 'grant_types') || []).join(', ') || 'N/A'}</Typography>
                    </Grid>
                    {get(client, 'redirect_uris') && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Redirect URIs</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{(get(client, 'redirect_uris') || []).join(', ')}</Typography>
                      </Grid>
                    )}
                    {get(client, 'jwks_uri') && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">JWK Set URL</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{get(client, 'jwks_uri', '')}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </CardContent>
      </Card>

      {/* Discover Remote FHIR Server */}
      <Card sx={{ mb: 2 }}>
        <CardHeader
          avatar={<TravelExploreIcon color="primary" />}
          title="Discover Remote FHIR Server"
          subheader="Fetch UDAP metadata from a remote FHIR server to discover registration endpoints and supported scopes."
        />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Remote FHIR Server URL"
              value={remoteServerUrl}
              onChange={function(e){ setRemoteServerUrl(e.target.value); }}
              placeholder="https://example.com/fhir"
              helperText="Enter the base URL of a FHIR server (e.g., https://example.com/fhir)"
            />
            <Button
              variant="contained"
              onClick={handleDiscoverRemoteServer}
              disabled={fetchingRemoteMetadata || !remoteServerUrl}
              startIcon={fetchingRemoteMetadata ? <CircularProgress size={20} /> : <TravelExploreIcon />}
              sx={{ minWidth: '120px', alignSelf: 'flex-start', mt: '8px' }}
            >
              {fetchingRemoteMetadata ? 'Fetching...' : 'Discover'}
            </Button>
          </Box>

          {remoteMetadataError && (
            <Alert severity="error" sx={{ mb: 2 }}>{remoteMetadataError}</Alert>
          )}

          {remoteUdapMetadata && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                UDAP metadata discovered from {remoteServerUrl}
              </Alert>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                {get(remoteUdapMetadata, 'registration_endpoint') && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Registration Endpoint</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {get(remoteUdapMetadata, 'registration_endpoint')}
                    </Typography>
                  </Grid>
                )}
                {get(remoteUdapMetadata, 'token_endpoint') && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Token Endpoint</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {get(remoteUdapMetadata, 'token_endpoint')}
                    </Typography>
                  </Grid>
                )}
                {get(remoteUdapMetadata, 'grant_types_supported') && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Supported Grant Types</Typography>
                    <Typography variant="body2">{get(remoteUdapMetadata, 'grant_types_supported', []).join(', ')}</Typography>
                  </Grid>
                )}
                {get(remoteUdapMetadata, 'scopes_supported') && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Supported Scopes</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{get(remoteUdapMetadata, 'scopes_supported', []).join(', ')}</Typography>
                  </Grid>
                )}
              </Grid>

              <AceEditor
                mode="json"
                theme={theme === 'light' ? "tomorrow" : "monokai"}
                wrapEnabled={true}
                readOnly={true}
                name="remoteUdapMetadataEditor"
                editorProps={{ $blockScrolling: true }}
                value={JSON.stringify(remoteUdapMetadata, null, 2)}
                style={{ width: '100%', height: '200px', borderRadius: '4px', marginBottom: '10px' }}
                setOptions={{
                  showLineNumbers: true,
                  tabSize: 2
                }}
              />

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleRegisterFromDiscovery}
              >
                Register as Client
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Registration Dialog */}
      <Dialog
        open={udapModalOpen}
        onClose={handleCloseUdapModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Register New OAuth Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: '8px' }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client ID"
                value={udapFormData.client_id}
                onChange={function(e){ handleUdapFormChange('client_id', e.target.value); }}
                InputProps={{
                  endAdornment: (
                    <>
                      <IconButton onClick={function(){ handleUdapFormChange('client_id', Random.id()); }} size="small">
                        <AddIcon />
                      </IconButton>
                      <IconButton onClick={function(){ copyToClipboard(udapFormData.client_id, 'Client ID copied!'); }} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    </>
                  )
                }}
                helperText="Unique identifier for this client"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Client Name"
                value={udapFormData.client_name}
                onChange={function(e){ handleUdapFormChange('client_name', e.target.value); }}
                helperText="Human-readable name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Redirect URIs"
                value={udapFormData.redirect_uris}
                onChange={function(e){ handleUdapFormChange('redirect_uris', e.target.value); }}
                helperText="One URL per line"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Scopes"
                value={udapFormData.scope}
                onChange={function(e){ handleUdapFormChange('scope', e.target.value); }}
                helperText="Space-separated SMART/UDAP scopes"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Grant Types</FormLabel>
                <FormGroup row>
                  {['authorization_code', 'client_credentials', 'refresh_token'].map(function(gt){
                    return (
                      <FormControlLabel
                        key={gt}
                        control={
                          <Checkbox
                            checked={udapFormData.grant_types.includes(gt)}
                            onChange={function(){ handleUdapCheckboxChange('grant_types', gt); }}
                          />
                        }
                        label={gt}
                      />
                    );
                  })}
                </FormGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Token Endpoint Auth Method</InputLabel>
                <Select
                  value={udapFormData.token_endpoint_auth_method}
                  onChange={function(e){ handleUdapFormChange('token_endpoint_auth_method', e.target.value); }}
                  label="Token Endpoint Auth Method"
                >
                  <MenuItem value="client_secret_basic">client_secret_basic (Confidential Symmetric)</MenuItem>
                  <MenuItem value="client_secret_post">client_secret_post (Confidential Symmetric)</MenuItem>
                  <MenuItem value="private_key_jwt">private_key_jwt (Confidential Asymmetric)</MenuItem>
                  <MenuItem value="none">none (Public)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="JWK Set URL (Optional)"
                value={udapFormData.jwks_uri}
                onChange={function(e){ handleUdapFormChange('jwks_uri', e.target.value); }}
                helperText="For asymmetric authentication"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terms of Service URI (Optional)"
                value={udapFormData.tos_uri}
                onChange={function(e){ handleUdapFormChange('tos_uri', e.target.value); }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUdapModal}>Cancel</Button>
          <Button
            onClick={handleUdapSubmit}
            variant="contained"
            color="primary"
            disabled={!udapFormData.client_name}
          >
            Register Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* Client Secret Display Dialog */}
      <Dialog
        open={udapSecretDialogOpen}
        onClose={function(){ setUdapSecretDialogOpen(false); }}
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
                value={get(udapRegisteredClient, 'client_id', '')}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={function(){ copyToClipboard(get(udapRegisteredClient, 'client_id', ''), 'Client ID copied!'); }} size="small">
                      <ContentCopyIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            {get(udapRegisteredClient, 'client_secret') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Client Secret"
                  value={get(udapRegisteredClient, 'client_secret', '')}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={function(){ copyToClipboard(get(udapRegisteredClient, 'client_secret', ''), 'Client secret copied!'); }} size="small">
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
                value={get(udapRegisteredClient, 'client_name', '')}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Scopes"
                value={get(udapRegisteredClient, 'scope', '')}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={function(){ setUdapSecretDialogOpen(false); }} variant="contained" color="primary">
            I've Saved The Credentials
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


function ServerConfigurationPage(props){
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  let [ wellKnownUdapUrl, setWellKnownUdapUrl ] = useState(Meteor.absoluteUrl() + ".well-known/udap");
  let [ certificate, setCertificate ] = useState([]);
  let [ publicKey, setPublicKey ] = useState("");
  let [ privateKey, setPrivateKey ] = useState("");
  let [ serverHasPublicKey, setServerHasPublicKey] = useState(false);
  let [ serverHasPrivateKey, setServerHasPrivateKey] = useState(false);
  let [ serverHasPublicCert, setServerHasPublicCert] = useState(false);

  let [ publicKeyText, setPublicKeyText ] = useState("");
  let [ privateKeyText, setPrivateKeyText ] = useState("");
  let [ publicCertPem, setPublicCertPem ] = useState("");

  let [ publicKeyJwk, setPublicKeyJwk ] = useState(null);
  let [ copySuccess, setCopySuccess ] = useState(false);
  let [ copyMessage, setCopyMessage ] = useState("");

  let [endpointExpanded, setEndpointExpanded] = useState({});
  let [endpointContent, setEndpointContent] = useState({});
  let [endpointLoading, setEndpointLoading] = useState({});

  let [ keysStoredInDb, setKeysStoredInDb ] = useState(false);
  let [ keysStoredDetails, setKeysStoredDetails ] = useState(null);
  let [ savingKeysToDb, setSavingKeysToDb ] = useState(false);

  let [ loadingAction, setLoadingAction ] = useState('');
  let [ snackbarSeverity, setSnackbarSeverity ] = useState('success');

  let [ keysGeneratedNotSaved, setKeysGeneratedNotSaved ] = useState(false);
  let [ savingGeneratedKeys, setSavingGeneratedKeys ] = useState(false);
  let [ certGeneratedNotSaved, setCertGeneratedNotSaved ] = useState(false);
  let [ savingCert, setSavingCert ] = useState(false);

  // UDAP Clients tab state
  let [ udapClients, setUdapClients ] = useState([]);
  let [ udapModalOpen, setUdapModalOpen ] = useState(false);
  let [ udapSecretDialogOpen, setUdapSecretDialogOpen ] = useState(false);
  let [ udapRegisteredClient, setUdapRegisteredClient ] = useState(null);
  let [ udapFormData, setUdapFormData ] = useState({
    client_id: '',
    client_name: '',
    scope: 'system/*.read',
    redirect_uris: '',
    launch_uri: '',
    jwks_uri: '',
    grant_types: ['client_credentials'],
    response_types: ['code'],
    token_endpoint_auth_method: 'private_key_jwt',
    pkce_enabled: false,
    pkce_method: 'S256',
    tos_uri: ''
  });

  // Remote UDAP discovery state
  let [ remoteServerUrl, setRemoteServerUrl ] = useState('');
  let [ remoteUdapMetadata, setRemoteUdapMetadata ] = useState(null);
  let [ fetchingRemoteMetadata, setFetchingRemoteMetadata ] = useState(false);
  let [ remoteMetadataError, setRemoteMetadataError ] = useState('');

  let [checked, setChecked] = React.useState(true);
  let [defaultDirectoryQuery, setDefaultDirectoryQuery] = React.useState(get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.path', ""));

  let handleChange = (event) => {
    setChecked(event.target.checked);
  };

  // Collect extension tabs with package name metadata
  let extensionTabs = [];
  Object.keys(Package).forEach(function(packageName){
    if(Package[packageName].ServerConfigs){
      extensionTabs.push({
        label: packageName,
        slug: packageName,
        components: Package[packageName].ServerConfigs
      });
    }
  });

  // Also collect server configs from NPM workflow packages via WorkflowRegistry
  WorkflowRegistry.getServerConfigsWithNames().forEach(function(entry){
    extensionTabs.push({
      label: entry.name,
      slug: entry.name,
      components: entry.components
    });
  });

  // Build slug-to-index map for URL param sync
  let coreTabSlugs = ['server-info', 'keys-certs', 'smart-on-fhir', 'udap-clients', 'upstream', 'tefca', 'init-data'];
  let tabSlugMap = {};
  coreTabSlugs.forEach(function(slug, i){
    tabSlugMap[slug] = i;
  });
  extensionTabs.forEach(function(ext, i){
    tabSlugMap[ext.slug] = coreTabSlugs.length + i;
  });

  // Resolve activeTab from URL ?tab= param
  let tabParam = searchParams.get('tab');
  let activeTab = 0;
  if(tabParam && tabSlugMap.hasOwnProperty(tabParam)){
    activeTab = tabSlugMap[tabParam];
  }

  useEffect(function(){
    if(Meteor.isClient){
      Meteor.call('hasServerKeys', function(error, result){
        if(result){
          // console.log('.ServerConfigurationPage.useEffect', result);
          setServerHasPublicKey(get(result, 'x509.publicKey'));
          setServerHasPrivateKey(get(result, 'x509.privateKey'));
          setServerHasPublicCert(get(result, 'x509.publicCertPem'))
          setPublicKeyText(get(result, 'x509.publicKey'))
          setPublicCertPem(get(result, 'x509.publicCertPem'))
          
          // Fetch JWK representation
          if(get(result, 'x509.publicCertPem')){
            Meteor.call('getJwkFromCertificate', function(error, jwkResult){
              if(jwkResult){
                setPublicKeyJwk(jwkResult);
              }
            });
          }
        }
      });

      // Check if keys are stored in database
      Meteor.call('serverConfiguration.hasStoredKeys', function(error, result){
        if(result && result.stored){
          setKeysStoredInDb(true);
          setKeysStoredDetails(result);
        }
      });
    }


  }, []);

  let currentUser = useTracker(function(){
    return Session.get('currentUser');
  }, []);

  let subscriptionChannelResourceType = useTracker(function(){
    return Session.get('SubscriptionChannelResourceType');
  }, []);

  defaultDirectoryQuery = useTracker(function(){
    return Session.get('MainSearch.defaultDirectoryQuery');
  }, []);

  function openExternalPage(url){
    logger.debug('client.app.layout.ServerConfigurationPage.openExternalPage', url);
    window.open(url);
    // navigate(url, { replace: true });
  }


  //----------------------------------------------------------------------
  // Main Render Method  

  

  let tagLineStyle = {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '0px',
    marginBottom: '40px'
  }

  let featureRowStyle = {
    height: '52px'
  }

  function openPage(url){
    navigate(url, { replace: true });
  }
  
  function copyToClipboard(text, message){
    navigator.clipboard.writeText(text).then(function() {
      setCopyMessage(message || "Copied to clipboard!");
      setCopySuccess(true);
    }, function(err) {
      console.error('Could not copy text: ', err);
    });
  }

  function showSnackbar(message, severity){
    setSnackbarSeverity(severity || 'success');
    setCopyMessage(message);
    setCopySuccess(true);
  }

  function toggleEndpoint(slug, url){
    let isExpanding = !endpointExpanded[slug];
    setEndpointExpanded(function(prev){
      let next = Object.assign({}, prev);
      next[slug] = !prev[slug];
      return next;
    });

    // Fetch content on first expand
    if(isExpanding && !endpointContent[slug]){
      setEndpointLoading(function(prev){
        let next = Object.assign({}, prev);
        next[slug] = true;
        return next;
      });

      fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(function(response){ return response.json(); })
        .then(function(data){
          setEndpointContent(function(prev){
            let next = Object.assign({}, prev);
            next[slug] = JSON.stringify(data, null, 2);
            return next;
          });
          setEndpointLoading(function(prev){
            let next = Object.assign({}, prev);
            next[slug] = false;
            return next;
          });
        })
        .catch(function(err){
          setEndpointContent(function(prev){
            let next = Object.assign({}, prev);
            next[slug] = 'Error fetching: ' + err.message;
            return next;
          });
          setEndpointLoading(function(prev){
            let next = Object.assign({}, prev);
            next[slug] = false;
            return next;
          });
        });
    }
  }

  function handelUpdateWellKnownUdapUrl(event){
    setWellKnownUdapUrl(event.currentTarget.value)
  }
  async function handleFetchWellknownUdap(){
    console.log('wellKnownUdapUrl', wellKnownUdapUrl);

    // HTTP.get(wellKnownUdapUrl, function(error, result){
    //   if(error){
    //     console.log('handleFetchWellknownUdap.error', error)
    //   }
    //   if(result){
    //     console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

    //     alert(result.data.x5c[0]);
        
    //     if(Array.isArray(get(result, 'data.x5c'))){
    //       console.log('x.509 cert: ' + result.data.x5c[0]);
    //       setCertificate(result.data.x5c);          
    //     }
        
    //   }
    // })

    await fetch(wellKnownUdapUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then(result => {
      console.log('Success:', result);
      
      console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

      alert(result.data.x5c[0]);
      
      if(Array.isArray(get(result, 'data.x5c'))){
        console.log('x.509 cert: ' + result.data.x5c[0]);
        setCertificate(result.data.x5c);          
      }
    }).catch((error) => {
      console.error('Error:', error);
    });
  }
  function generateKeys(){
    let keys = pki.rsa.generateKeyPair(2048);
    console.log('keys', keys)

    var publicKeyText = pki.publicKeyToPem(keys.publicKey);
    console.log('publicKeyText', JSON.stringify(publicKeyText))

    setPublicKeyText(JSON.stringify(publicKeyText))

    var privateKeyText = pki.privateKeyToPem(keys.privateKey);
    console.log('privateKeyText', JSON.stringify(privateKeyText));

    setPrivateKeyText(JSON.stringify(privateKeyText))

    // Flag that keys need to be saved to server before cert generation
    setKeysGeneratedNotSaved(true);
  }
  function handleSaveGeneratedKeysToServer(){
    setSavingGeneratedKeys(true);
    Meteor.call('serverConfiguration.saveGeneratedX509Keys', publicKeyText, privateKeyText, function(error, result){
      setSavingGeneratedKeys(false);
      if(error){
        console.error('[ServerConfigurationPage] Error saving generated keys:', error);
        setCopyMessage("Error saving keys: " + error.reason);
        setSnackbarSeverity('error');
        setCopySuccess(true);
      }
      if(result && result.success){
        setKeysGeneratedNotSaved(false);
        setServerHasPublicKey(true);
        setServerHasPrivateKey(true);
        setKeysStoredInDb(true);
        setKeysStoredDetails({ stored: true, keys: result.keysStored, updatedAt: new Date() });
        setCopyMessage("Keys saved to server and database!");
        setSnackbarSeverity('success');
        setCopySuccess(true);
      }
    });
  }
  function handleSaveKeysToDb(){
    setSavingKeysToDb(true);
    Meteor.call('serverConfiguration.saveX509Keys', function(error, result){
      setSavingKeysToDb(false);
      if(error){
        console.error('[ServerConfigurationPage] Error saving keys to DB:', error);
        setCopyMessage("Error saving keys: " + error.reason);
        setCopySuccess(true);
      }
      if(result && result.success){
        setKeysStoredInDb(true);
        setKeysStoredDetails({ stored: true, keys: result.keysStored, updatedAt: new Date() });
        setCopyMessage("Keys saved to database successfully!");
        setCopySuccess(true);
      }
    });
  }

  function handleGenerateCert(){
    console.log("Generating certificate...");

    Meteor.call('generateCertificate', function(error, certificatePem){
      if(error){
        console.error('error', error);
        setCopyMessage("Error generating certificate: " + error.reason);
        setSnackbarSeverity('error');
        setCopySuccess(true);
      }
      if(certificatePem){
        console.log('certificatePem', certificatePem)
        setPublicCertPem(certificatePem);
        setCertGeneratedNotSaved(true);
      }
    })
  }
  function handleSaveGeneratedCert(){
    setSavingCert(true);
    Meteor.call('serverConfiguration.saveGeneratedCert', publicCertPem, function(error, result){
      setSavingCert(false);
      if(error){
        console.error('[ServerConfigurationPage] Error saving cert:', error);
        setCopyMessage("Error saving certificate: " + error.reason);
        setSnackbarSeverity('error');
        setCopySuccess(true);
      }
      if(result && result.success){
        setCertGeneratedNotSaved(false);
        setServerHasPublicCert(true);
        setCopyMessage("Certificate saved to server and database!");
        setSnackbarSeverity('success');
        setCopySuccess(true);
      }
    });
  }
  function handleSyncLantern(){
    console.log("Syncing lantern...")
    setLoadingAction('syncLantern');

    Meteor.call('syncLantern', function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error syncing Lantern: ' + error.reason, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar('Lantern sync complete');
      }
    })
  }
  
  function generateResearchStudies(){
    console.log("Generating Research Studies...")
    setLoadingAction('generateResearchStudies');

    Meteor.call('generateResearchStudies', 10, function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error generating Research Studies: ' + error.message, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar(result.message);
      }
    })
  }
  
  function generateResearchSubjects(){
    console.log("Generating Research Subjects...")
    setLoadingAction('generateResearchSubjects');

    Meteor.call('generateResearchSubjects', 20, function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error generating Research Subjects: ' + error.message, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar(result.message);
      }
    })
  }
  
  function clearResearchData(){
    console.log("Clearing Research Data...")

    if(confirm("Are you sure you want to clear all Research Studies and Subjects?")){
      setLoadingAction('clearResearchData');

      Meteor.call('clearResearchData', function(error, result){
        setLoadingAction('');
        if(error){
          console.error('error', error)
          showSnackbar('Error clearing Research Data: ' + error.message, 'error');
        }
        if(result){
          console.log('result', result)
          showSnackbar(result.message);
        }
      })
    }
  }
  function handleSyncProviderDirectory(){
    console.log("Syncing provider directory...")
    setLoadingAction('syncProviderDirectory');

    Meteor.call('syncProviderDirectory', function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error syncing provider directory: ' + error.reason, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar('Provider directory sync complete');
      }
    })
  }
  function fetchTefcaEndpoints(){
    console.log('fetchTefcaEndpoints'); 

    
    Meteor.call('syncTefcaEndpoints', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    });

  }
  function handleSyncUpstreamDirectory(){
    console.log("Syncing upstream directory...");

    let options = {};

    Session.get('SubscriptionChannelResourceType');

    if(Session.get('SubscriptionChannelResourceType')){
      options.resourceType = Session.get('SubscriptionChannelResourceType');
    }

    console.log('options', options)

    Meteor.call('syncUpstreamDirectory', options, function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initCodeSystems(){
    console.log("Initializing code systems...");
    setLoadingAction('initCodeSystems');

    Meteor.call('initCodeSystems', function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error initializing code systems: ' + error.reason, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar('Code systems initialized');
      }
    })
  }
  function initUsCore(){
    console.log("Initializing US Core...");
    setLoadingAction('initUsCore');

    Meteor.call('initUsCore', function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error initializing US Core: ' + error.reason, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar('US Core initialized');
      }
    })
  }
  function initSearchParameters(){
    console.log("Initializing search parameters...");
    setLoadingAction('initSearchParameters');

    Meteor.call('initSearchParameters', function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error initializing search parameters: ' + error.reason, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar('Search parameters initialized');
      }
    })
  }
  function initStructureDefinitions(){
    console.log("Initializing structure definitions...");
    setLoadingAction('initStructureDefinitions');

    Meteor.call('initStructureDefinitions', function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error initializing structure definitions: ' + error.reason, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar('Structure definitions initialized');
      }
    })
  }
  function initValueSets(){
    console.log("Initializing value sets...");
    setLoadingAction('initValueSets');

    Meteor.call('initValueSets', function(error, result){
      setLoadingAction('');
      if(error){
        console.error('error', error)
        showSnackbar('Error initializing value sets: ' + error.reason, 'error');
      }
      if(result){
        console.log('result', result)
        showSnackbar('Value sets initialized');
      }
    })
  }

  function fetchDefaultQuery(){
    
    let upstreamDirectory = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '');
    console.log('------------------------------------------');
    console.log('Fetch Default Query');
    console.log('');
    console.log('FHIR Server Base: ', upstreamDirectory);    
    console.log('Default Query:    ', defaultDirectoryQuery);
    console.log('');

    Meteor.call('fetchDefaultDirectoryQuery', function(error, result){
      if(error){
        alert(error.message)
      }
      if(result){
        console.log('result', result);
      }
    })
  }

  

  function handleOpenResourceTypes(){
    Session.set('mainAppDialogTitle', "Select Resource Types");
    Session.set('mainAppDialogComponent', "SearchResourceTypesDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('mainAppDialogOpen', true);
  }

  // let headerHeight = LayoutHelpers.calcHeaderHeight();
  // let formFactor = LayoutHelpers.determineFormFactor();
  // let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let serverPublicKeyElems = [];
  if(serverHasPublicKey){
    serverPublicKeyElems.push(<Card margin={20} style={{width: '100%', fontSize: '80%'}}  >      
      <CardHeader avatar={<Icon icon={key} size={32} />} title="Public Key Configured!" />    
      <CardContent>
        <TextField
          fullWidth={true}
          id="publicKey"
          type="publicKey"
          value={publicKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            },
            disableUnderline: true
          }}
          disabled
        />
      </CardContent>
    </Card>);
    serverPublicKeyElems.push(<DynamicSpacer />);
    
    // Add JWK display if available
    if(publicKeyJwk){
      serverPublicKeyElems.push(<Card key="jwk-display" margin={20} style={{width: '100%', fontSize: '80%'}}  >      
        <CardHeader 
          avatar={<Icon icon={key} size={32} />} 
          title="JSON Web Key (JWK)" 
          subheader="Public key in JWK format for SMART on FHIR JWT authentication"
          action={
            <IconButton onClick={() => copyToClipboard(JSON.stringify(publicKeyJwk, null, 2), "JWK copied to clipboard!")}>
              <ContentCopyIcon />
            </IconButton>
          }
        />    
        <CardContent>
          <AceEditor
            mode="json"
            theme={theme === 'light' ? "tomorrow" : "monokai"}
            wrapEnabled={true}
            readOnly={true}
            name="jwkEditor"
            editorProps={{ $blockScrolling: true }}
            value={JSON.stringify(publicKeyJwk, null, 2)}
            style={{width: '100%', height: '200px', borderRadius: '4px'}}
            setOptions={{
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
          <Typography variant="body2" style={{marginTop: '10px', marginBottom: '10px'}}>
            JWK Set URL: <code>{Meteor.absoluteUrl()}.well-known/jwks.json</code>
            <IconButton 
              size="small" 
              onClick={() => copyToClipboard(Meteor.absoluteUrl() + '.well-known/jwks.json', "JWK Set URL copied!")}
              style={{marginLeft: '10px'}}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            style={{marginRight: '10px'}}
            onClick={openExternalPage.bind(this, Meteor.absoluteUrl() + ".well-known/jwks.json")}
          >View JWK Set Endpoint</Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              Meteor.call('generateClientAssertionJwt', 
                get(Meteor, 'settings.public.smartOnFhir[0].client_id', 'test-client'),
                get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + '/oauth2/token',
                null,
                300,
                function(error, result){
                  if(error){
                    alert('Error generating test JWT: ' + error.message);
                  } else {
                    copyToClipboard(result.jwt, "Test JWT copied to clipboard!");
                  }
                }
              );
            }}
          >Generate Test JWT</Button>
        </CardContent>
      </Card>);
      serverPublicKeyElems.push(<DynamicSpacer />);
    }
  }

  let serverPublicCertElems =[];
  if(serverHasPublicCert){
    serverPublicCertElems.push(<Card margin={20} style={{width: '100%', fontSize: '80%'}}  >      
      <CardHeader avatar={<Icon icon={key} size={32} />} title="Public Cert Available!" />    
      <CardContent>
        <TextField
          fullWidth={true}
          id="publicCert"
          type="publicCert"
          value={publicCertPem}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            },
            disableUnderline: true
          }}
          disabled
        />
      </CardContent>
    </Card>);
    serverPublicCertElems.push(<DynamicSpacer />);
  }

  let serverPrivateKeyElems = [];
  if(serverHasPrivateKey){
    serverPrivateKeyElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
      <CardHeader avatar={<Icon icon={keyOutline} size={32} />} title="Private Key Configured!" />    
    </Card>)
    serverPrivateKeyElems.push(<DynamicSpacer key={Random.id()} />);
  }


  let smartOnFhirElems = [];
  // if(get(Meteor, 'settings.public.interfaces.smartOnFhir')){
  smartOnFhirElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
    <CardHeader title="SMART on FHIR" subheader="This server is configured to support SMART on FHIR applications." />
    <CardContent>
      <AceEditor
        mode="json"
        theme={theme === 'light' ? "tomorrow" : "monokai"}
        wrapEnabled={false}
        // onChange={onUpdateLlmFriendlyNdjsonString}
        name="synthesisEditor"
        editorProps={{ $blockScrolling: true }}
        value={JSON.stringify(get(Meteor, 'settings.public.smartOnFhir'), null, 2)}
        style={{width: '100%', position: 'relative', height: '300px', minHeight: '300px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
      /> 
      <Button
        variant="contained"
        color="primary"
        style={{marginTop: '10px', marginRight: '20px'}}
        onClick={openExternalPage.bind(this, Meteor.absoluteUrl() + ".well-known/smart-configuration")}
      >View .well-known/smart-configuration</Button>
      <Button
        variant="contained"
        color="primary"
        style={{marginTop: '10px'}}
        onClick={openExternalPage.bind(this, "https://launch.smarthealthit.org/")}
      >SMART Launcher</Button>
    </CardContent>
  </Card>)
  smartOnFhirElems.push(<DynamicSpacer key={Random.id()} />);

  // }

  let generateKeyElems = [];
  if(!serverHasPublicKey && !serverHasPrivateKey){
    generateKeyElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
      <CardHeader title="Generate Keys" subheader="No X.509 keys were detected on the server. You will want to generate keys and then copy them to the Meteor settings file.  Be sure to include the /n newline characters!" />
      <CardContent >
        <TextField
          label="Public Key"
          fullWidth={true}
          id="publicKey"
          type="publicKey"
          value={publicKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            }
          }}
        />
        <TextField
          label="Private Key"
          fullWidth={true}
          id="privateKey"
          type="privateKey"
          value={privateKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={generateKeys.bind(this)}
          style={{marginRight: '10px'}}
        >Generate Keys</Button>
        {keysGeneratedNotSaved && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveGeneratedKeysToServer}
            disabled={savingGeneratedKeys}
            startIcon={savingGeneratedKeys ? <CircularProgress size={20} /> : <SaveIcon />}
            style={{marginRight: '10px'}}
          >
            {savingGeneratedKeys ? 'Saving...' : 'Save Keys to Server'}
          </Button>
        )}
        {keysGeneratedNotSaved && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Keys generated in browser only. Click "Save Keys to Server" before generating a certificate.
          </Alert>
        )}
      </CardContent>
    </Card>)
    generateKeyElems.push(<DynamicSpacer key={Random.id()} />);
  }

  let generateCertButton;
  let generateCertElems = [];
  let isDisabled = true;


  if(!serverHasPublicCert){
    generateCertButton = <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateCert.bind(this)}
        disabled={keysGeneratedNotSaved || (!serverHasPublicKey && !serverHasPrivateKey)}
        style={{marginRight: '10px'}}
      >Generate Cert</Button>
      {certGeneratedNotSaved && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSaveGeneratedCert}
          disabled={savingCert}
          startIcon={savingCert ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {savingCert ? 'Saving...' : 'Save Cert to Database'}
        </Button>
      )}
      {(!serverHasPublicKey && !serverHasPrivateKey && !keysGeneratedNotSaved) && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Generate and save keys first before generating a certificate.
        </Alert>
      )}
      {keysGeneratedNotSaved && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Save the generated keys to the server before generating a certificate.
        </Alert>
      )}
    </Box>
  }

  generateCertElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
    <CardHeader title="Generate Cert" subheader="Generate an X.509 self-signed certificate from the server keys." />
    <CardContent >
      <TextField
        label="Public Cert"
        fullWidth={true}
        id="publicCert"
        type="publicCert"
        value={JSON.stringify(publicCertPem)}
        style={{marginBottom: '10px'}}
        multiline
        InputProps={{
          style: {
            fontSize: '120%',
            fontFamily: 'monospace'
          }
        }}
        disabled={currentUser ? false : true}
      />
      { generateCertButton }
    </CardContent>
  </Card>)
  generateCertElems.push(<DynamicSpacer key={Random.id()} />)
  

  if(currentUser){
    isDisabled = false;
  }

  // FHIR Infrastructure card
  let fhirInfrastructureElements;
  if(currentUser){
    fhirInfrastructureElements = <Card sx={{ mb: 2, width: '100%' }}>
      <CardHeader
        avatar={<BuildIcon />}
        title="FHIR Infrastructure"
        subheader="Initialize conformance resources required by the FHIR server"
      />
      <CardContent>
        <Button
          variant="contained"
          fullWidth
          onClick={initUsCore}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'initUsCore' ? <CircularProgress size={20} /> : <StorageIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'initUsCore' ? 'Initializing US Core...' : 'Init US Core'}</Button>
        <Button
          variant="contained"
          fullWidth
          onClick={initCodeSystems}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'initCodeSystems' ? <CircularProgress size={20} /> : <ClassIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'initCodeSystems' ? 'Initializing Code Systems...' : 'Init Code Systems'}</Button>
        <Button
          variant="contained"
          fullWidth
          onClick={initSearchParameters}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'initSearchParameters' ? <CircularProgress size={20} /> : <SearchIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'initSearchParameters' ? 'Initializing Search Parameters...' : 'Init Search Parameters'}</Button>
        <Button
          variant="contained"
          fullWidth
          onClick={initStructureDefinitions}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'initStructureDefinitions' ? <CircularProgress size={20} /> : <CollectionsBookmarkIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'initStructureDefinitions' ? 'Initializing Structure Definitions...' : 'Init Structure Definitions'}</Button>
        <Button
          variant="contained"
          fullWidth
          onClick={initValueSets}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'initValueSets' ? <CircularProgress size={20} /> : <CollectionsBookmarkIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'initValueSets' ? 'Initializing Value Sets...' : 'Init Value Sets'}</Button>
      </CardContent>
    </Card>
  }

  // Directory Sync card
  let directorySyncElements;
  if(currentUser){
    directorySyncElements = <Card sx={{ mb: 2, width: '100%' }}>
      <CardHeader
        avatar={<SyncIcon />}
        title="Directory Sync"
        subheader="Sync endpoint directories from external sources"
      />
      <CardContent>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSyncLantern}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'syncLantern' ? <CircularProgress size={20} /> : <SyncIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'syncLantern' ? 'Syncing Lantern...' : 'Sync Lantern'}</Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSyncProviderDirectory}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'syncProviderDirectory' ? <CircularProgress size={20} /> : <SyncIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'syncProviderDirectory' ? 'Syncing Provider Directory...' : 'Sync Provider Directory'}</Button>
      </CardContent>
    </Card>
  }

  // Synthea DB Utils - Research Study/Subject generation
  let syntheaDbUtilsElements;
  if(currentUser && get(Meteor, 'settings.public.enableSyntheaDbUtils')){
    syntheaDbUtilsElements = <Card sx={{ mb: 2, width: '100%' }}>
      <CardHeader
        title="Synthea Database Utilities"
        subheader="Generate synthetic Research Studies and Subjects for testing"
      />
      <CardContent>
        <Button
          variant="contained"
          fullWidth
          size="small"
          color="primary"
          onClick={generateResearchStudies}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'generateResearchStudies' ? <CircularProgress size={20} /> : <StorageIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'generateResearchStudies' ? 'Generating Research Studies...' : 'Generate Research Studies (10)'}</Button>
        <Button
          variant="contained"
          fullWidth
          size="small"
          color="primary"
          onClick={generateResearchSubjects}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'generateResearchSubjects' ? <CircularProgress size={20} /> : <StorageIcon />}
          sx={{ mb: 1 }}
        >{loadingAction === 'generateResearchSubjects' ? 'Generating Research Subjects...' : 'Generate Research Subjects (20)'}</Button>
        <Button
          variant="outlined"
          fullWidth
          size="small"
          color="error"
          onClick={clearResearchData}
          disabled={!!loadingAction}
          startIcon={loadingAction === 'clearResearchData' ? <CircularProgress size={20} /> : null}
          sx={{ mb: 1 }}
        >{loadingAction === 'clearResearchData' ? 'Clearing Research Data...' : 'Clear All Research Data'}</Button>
      </CardContent>
    </Card>
  }


  let upstreamServerSyncButton = <Button

    variant="contained"
    fullWidth
    onClick={ handleSyncUpstreamDirectory.bind(this) }
    disabled={isDisabled}
  >Subscribe to Upstream Directory</Button>

  let fetchDefaultDirectoryQueryButton = <Button variant="contained" fullWidth onClick={fetchDefaultQuery.bind(this)} disabled={isDisabled}>Fetch Default Query</Button>

  let tefcaEndpoints = get(Meteor, 'settings.public.interfaces.tefcaEndpoints', [
      "https://open.epic.com/Endpoints/R4",
      "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_patient_r4_endpoints.json",
      "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_provider_r4_endpoints.json"
  ])
  let tefcaEndpointsElements = []
  tefcaEndpointsElements.push(<Card key={Random.id()} margin={20} style={{width: '100%'}}  >
    <CardHeader title="Sync TEFCA Endpoints" />
    <CardContent>
          
      <Grid container spacing={3} justify="center" style={{paddingTop: '20px'}}>
        <Grid item xs={12}>
            <TextField
              label="Endpoints Found"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              // value={Endpoints.find().count()}
              value={0}
              style={{marginBottom: '10px'}}
              disabled={true}
            />      
            <TextField
              label="Upstream Directory"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              multiline={true}
              value={tefcaEndpoints.join("\n")}
              style={{marginBottom: '10px'}}
              disabled={true}
            />                                  
        </Grid>
      </Grid>

      <Button variant="contained" fullWidth onClick={fetchTefcaEndpoints.bind(this)} >Fetch TEFCA Endpoints</Button>
      <br />
    </CardContent>
  </Card>)
  tefcaEndpointsElements.push(<DynamicSpacer key={Random.id()} />);

  let upstreamServer = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '')
  let upstreamServerElements = [];
  upstreamServerElements.push(<Card key={Random.id()} margin={20} style={{width: '100%'}}  >
    <CardHeader title="Upstream Directory" />
    <CardContent>
          
      <Grid container spacing={3} justify="center" style={{paddingTop: '20px'}}>
        <Grid item xs={12} >
            <TextField
              label="Upstream Directory"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              value={upstreamServer}
              style={{marginBottom: '10px'}}
              disabled={isDisabled}
            />         
            <TextField
              label="Default Query"
              fullWidth={true}
              id="defaultDirectoryQuery"
              type="defaultDirectoryQuery"
              value={defaultDirectoryQuery}
              style={{marginBottom: '10px'}}
              disabled={isDisabled}
            />              
        </Grid>
      </Grid>

      { fetchDefaultDirectoryQueryButton }
      <br />
    </CardContent>
  </Card>);
  upstreamServerElements.push(<DynamicSpacer key={Random.id()} />);

  let subscribeUpstreamCard = [];
  subscribeUpstreamCard.push(<Card key={Random.id()}>
    <CardHeader title="Subscribe Upstream" />
    <CardContent>
      <Grid container>
            <Grid item xs={12}>
              <FormControl style={{width: '100%', marginTop: '40px', marginBottom: '0px'}}>
                <InputLabel shrink={true} >Resource Type</InputLabel>
                <Input
                  id="resourceType"
                  name="resourceType"
                  // className={classes.input}   
                  value={subscriptionChannelResourceType}
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  placeholder="Organization"
                  disabled={isDisabled}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle type select"
                        onClick={ handleOpenResourceTypes.bind(this) }
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  }           
                />
              </FormControl>  
            </Grid>
          </Grid>

          <Grid container spacing={3} justify="center" style={{paddingTop: '00px'}}>
            <Grid item xs={12} style={{paddingTop: '20px', paddingBottom: '20px'}}>
              <FormControlLabel
                control={<Checkbox checked={true} onChange={handleChange} />}
                label="Realtime"
                disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Daily"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Weekly"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Monthly"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Last Updated"
                disabled={true}
                // disabled={isDisabled}
              />
            </Grid>
          </Grid>


          <br height={40} />

          { upstreamServerSyncButton }
    </CardContent>
  </Card>);
  subscribeUpstreamCard.push(<DynamicSpacer key={Random.id()} />);

  let subscriptionsCard = <Card key={Random.id()} style={{marginBottom: '20px'}}>
      <CardHeader title="Subscriptions" />
      <CardContent>
        SubscriptionsTable disabled...
        {/* <SubscriptionsTable
            hideContact={true}
            hideEnd={true}
        /> */}
      </CardContent>
    </Card>




  // Build tab list dynamically with per-extension tabs
  let tabDefinitions = [
    { label: 'Server Info', slug: 'server-info' },
    { label: 'Keys & Certs', slug: 'keys-certs' },
    { label: 'SMART on FHIR', slug: 'smart-on-fhir' },
    { label: 'UDAP Clients', slug: 'udap-clients' },
    { label: 'Upstream', slug: 'upstream' },
    { label: 'TEFCA', slug: 'tefca' },
    { label: 'Init Data', slug: 'init-data' }
  ];

  extensionTabs.forEach(function(ext){
    tabDefinitions.push({ label: ext.label, slug: ext.slug });
  });

  // Build reverse map: index → slug
  let indexToSlug = {};
  tabDefinitions.forEach(function(tab, i){
    indexToSlug[i] = tab.slug;
  });

  function handleTabChange(event, newValue){
    let slug = indexToSlug[newValue] || 'server-info';
    navigate('/server-configuration?tab=' + slug, { replace: true });
  }

  return (
    <div id='ServerConfigurationPage' style={{height: window.innerHeight, overflow: "auto", paddingBottom: '128px', paddingTop: '20px'}} >

      <Container maxWidth="lg" style={{paddingBottom: '80px'}}>
        <Grid container spacing={3}>
          <Grid item xs={2}>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                position: 'sticky',
                top: 20,
                '& .MuiTab-root': {
                  alignItems: 'flex-end',
                  textAlign: 'right',
                  textTransform: 'none',
                  minHeight: 48,
                  fontSize: '0.875rem'
                },
                '& .Mui-selected': {
                  fontWeight: 600
                }
              }}
            >
              {tabDefinitions.map(function(tab, index){
                return <Tab key={index} label={tab.label} />;
              })}
            </Tabs>
          </Grid>
          <Grid item xs={10}>
            {activeTab === 0 && (
              <Box sx={{ minHeight: '60vh' }}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader
                    avatar={<DnsIcon color="primary" />}
                    title="FHIR Server"
                  />
                  <CardContent>
                    <Alert
                      severity="info"
                      icon={<LinkIcon />}
                      action={
                        <IconButton size="small" onClick={function(){ copyToClipboard(Meteor.absoluteUrl() + 'baseR4', "FHIR Base URL copied!"); }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {Meteor.absoluteUrl() + 'baseR4'}
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>

                <Card sx={{ mb: 2 }}>
                  <CardHeader
                    avatar={<SearchIcon color="primary" />}
                    title="Discovery & Metadata Endpoints"
                  />
                  <CardContent>
                    {[
                      { slug: 'metadata', label: 'Capability Statement', url: Meteor.absoluteUrl() + 'baseR4/metadata' },
                      { slug: 'smart-config', label: 'SMART Configuration', url: Meteor.absoluteUrl() + '.well-known/smart-configuration' },
                      { slug: 'udap', label: 'UDAP Discovery', url: Meteor.absoluteUrl() + '.well-known/udap' },
                      { slug: 'jwks', label: 'JWK Set', url: Meteor.absoluteUrl() + '.well-known/jwks.json' }
                    ].map(function(endpoint){
                      return (
                        <Alert
                          key={endpoint.slug}
                          severity="info"
                          icon={<LinkIcon />}
                          action={
                            <IconButton size="small" onClick={function(e){ e.stopPropagation(); copyToClipboard(endpoint.url, endpoint.label + " URL copied!"); }}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          }
                          sx={{ mb: 1, cursor: 'pointer', '& .MuiAlert-message': { width: '100%', overflow: 'hidden' } }}
                          onClick={function(){ toggleEndpoint(endpoint.slug, endpoint.url); }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={endpoint.label} size="small" sx={{ flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {endpoint.url}
                            </Typography>
                          </Box>
                          <Collapse in={endpointExpanded[endpoint.slug] || false}>
                            <Typography
                              component="pre"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                mt: 1,
                                p: 1,
                                bgcolor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: 300,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              {endpointLoading[endpoint.slug] ? 'Loading...' : (endpointContent[endpoint.slug] || 'Click to fetch')}
                            </Typography>
                          </Collapse>
                        </Alert>
                      );
                    })}
                  </CardContent>
                </Card>
              </Box>
            )}
            {activeTab === 1 && (
              <Box sx={{ minHeight: '60vh' }}>
                { serverPrivateKeyElems }
                { serverPublicKeyElems }
                { serverPublicCertElems }
                { generateKeyElems }
                { generateCertElems }

                <Card sx={{ width: '100%', mb: 2 }}>
                  <CardHeader
                    avatar={<StorageIcon />}
                    title="Database Key Storage"
                    subheader="Save X.509 keys to the database for Electron deployments where --settings file cannot be passed at launch."
                  />
                  <CardContent>
                    {keysStoredInDb ? (
                      <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                        Keys are stored in the database.
                        {get(keysStoredDetails, 'keys') ? (' Fields: ' + keysStoredDetails.keys.join(', ') + '.') : ''}
                        {get(keysStoredDetails, 'updatedAt') ? (' Last updated: ' + new Date(keysStoredDetails.updatedAt).toLocaleString() + '.') : ''}
                      </Alert>
                    ) : (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        No keys stored in database. Keys are currently loaded from the settings file or environment variables.
                      </Alert>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveKeysToDb}
                      disabled={savingKeysToDb || (!serverHasPublicKey && !serverHasPrivateKey)}
                      startIcon={savingKeysToDb ? <CircularProgress size={20} /> : <StorageIcon />}
                    >
                      {savingKeysToDb ? 'Saving...' : (keysStoredInDb ? 'Update Keys in Database' : 'Save Keys to Database')}
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            )}
            {activeTab === 2 && (
              <Box sx={{ minHeight: '60vh' }}>
                { smartOnFhirElems }
              </Box>
            )}
            {activeTab === 3 && (
              <UdapClientsTab
                udapClients={udapClients}
                setUdapClients={setUdapClients}
                udapModalOpen={udapModalOpen}
                setUdapModalOpen={setUdapModalOpen}
                udapSecretDialogOpen={udapSecretDialogOpen}
                setUdapSecretDialogOpen={setUdapSecretDialogOpen}
                udapRegisteredClient={udapRegisteredClient}
                setUdapRegisteredClient={setUdapRegisteredClient}
                udapFormData={udapFormData}
                setUdapFormData={setUdapFormData}
                remoteServerUrl={remoteServerUrl}
                setRemoteServerUrl={setRemoteServerUrl}
                remoteUdapMetadata={remoteUdapMetadata}
                setRemoteUdapMetadata={setRemoteUdapMetadata}
                fetchingRemoteMetadata={fetchingRemoteMetadata}
                setFetchingRemoteMetadata={setFetchingRemoteMetadata}
                remoteMetadataError={remoteMetadataError}
                setRemoteMetadataError={setRemoteMetadataError}
                copyToClipboard={copyToClipboard}
                setCopyMessage={setCopyMessage}
                setSnackbarSeverity={setSnackbarSeverity}
                setCopySuccess={setCopySuccess}
                theme={theme}
              />
            )}
            {activeTab === 4 && (
              <Box sx={{ minHeight: '60vh' }}>
                { upstreamServerElements }
                { subscribeUpstreamCard }
                { subscriptionsCard }
              </Box>
            )}
            {activeTab === 5 && (
              <Box sx={{ minHeight: '60vh' }}>
                { tefcaEndpointsElements }
              </Box>
            )}
            {activeTab === 6 && (
              <Box sx={{ minHeight: '60vh' }}>
                { fhirInfrastructureElements }
                <ServerVersioningCard />
                { directorySyncElements }
                { syntheaDbUtilsElements }
              </Box>
            )}
            {extensionTabs.map(function(ext, i){
              let tabIndex = coreTabSlugs.length + i;
              return activeTab === tabIndex ? (
                <Box key={ext.slug} sx={{ minHeight: '60vh' }}>
                  { ext.components }
                </Box>
              ) : null;
            })}
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopySuccess(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {copyMessage}
        </Alert>
      </Snackbar>

    </div>
  );
}

export default ServerConfigurationPage;