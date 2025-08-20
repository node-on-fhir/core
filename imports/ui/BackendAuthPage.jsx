// /imports/ui/BackendAuthPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Button, 
  TextField, 
  Box,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Stack,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import jwt from 'jsonwebtoken';

export default function BackendAuthPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [tokenResponse, setTokenResponse] = useState(null);
  const [error, setError] = useState('');
  const [jwtAssertion, setJwtAssertion] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [fhirResponse, setFhirResponse] = useState(null);
  const [privateKeyExists, setPrivateKeyExists] = useState(false);
  const [keyId, setKeyId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resourceType, setResourceType] = useState('ResearchStudy');
  const [studyStatus, setStudyStatus] = useState('active');

  // Get EHR configuration (looking for backend service configurations)
  const ehrConfig = get(Meteor, 'settings.public.smartOnFhir', []).find(
    config => config.vendor && (config.vendor.includes('Epic') || config.client_id)
  );

  // Check if private key exists on server
  useEffect(() => {
    Meteor.call('rfc7523.checkPrivateKeyExists', (err, result) => {
      if (!err && result) {
        setPrivateKeyExists(result.exists);
        setKeyId(result.keyId);
      }
    });
  }, []);

  // Generate JWT assertion for backend auth
  const generateJwtAssertion = () => {
    setLoading(true);
    setError('');
    
    const clientId = ehrConfig?.client_id;
    const tokenEndpoint = ehrConfig?.fhirServiceUrl?.replace('/api/FHIR/R4', '/oauth2/token');
    
    if (!clientId || !tokenEndpoint) {
      setError('Missing EHR configuration');
      setLoading(false);
      return;
    }

    Meteor.call('rfc7523.generateJwtAssertion', {
      clientId,
      tokenEndpoint
    }, (err, result) => {
      if (err) {
        setError(`JWT Generation Error: ${err.message}`);
      } else {
        setJwtAssertion(result.assertion);
        setKeyId(result.keyId);
      }
      setLoading(false);
    });
  };

  // Exchange JWT for access token
  const authenticateBackend = async () => {
    console.log('authenticateBackend called');
    console.log('JWT Assertion exists:', !!jwtAssertion);
    console.log('EHR Config:', ehrConfig);
    
    if (!jwtAssertion) {
      setError('Please generate a JWT assertion first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setTokenResponse(null);
    setFhirResponse(null);

    try {
      const tokenEndpoint = ehrConfig?.fhirServiceUrl?.replace('/api/FHIR/R4', '/oauth2/token');
      console.log('Token endpoint:', tokenEndpoint);
      
      // Prepare form data for token request
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      formData.append('client_assertion', jwtAssertion);
      formData.append('scope', 'system/*.read');
      
      console.log('Form data prepared:', formData.toString());
      setSuccessMessage(`Calling token endpoint: ${tokenEndpoint}`);

      // Call server method to exchange token
      Meteor.call('rfc7523.exchangeBackendToken', {
        tokenEndpoint,
        formData: formData.toString()
      }, (err, result) => {
        console.log('Token exchange callback - Error:', err, 'Result:', result);
        
        if (err) {
          setError(`Token Exchange Error: ${err.message}`);
          setSuccessMessage('');
          console.error('Full error:', err);
        } else {
          console.log('Token exchange successful:', result);
          setSuccessMessage('Token exchange successful! Access token received.');
          setError('');
          setAccessToken(result.access_token);
          setTokenResponse(result);
        }
        setLoading(false);
      });
    } catch (err) {
      setError(`Authentication Error: ${err.message}`);
      setSuccessMessage('');
      console.error('Caught error:', err);
      setLoading(false);
    }
  };

  // Test FHIR API call
  const testFhirCall = async () => {
    if (!accessToken) {
      setError('No access token available');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let resourceUrl;
      // Some EHRs require specific parameters for ResearchStudy
      if (resourceType === 'ResearchStudy') {
        resourceUrl = `${ehrConfig.fhirServiceUrl}/${resourceType}?status=${studyStatus}&_count=10`;
      } else if (resourceType === 'ResearchSubject') {
        resourceUrl = `${ehrConfig.fhirServiceUrl}/${resourceType}?status=on-study&_count=10`;
      } else {
        resourceUrl = `${ehrConfig.fhirServiceUrl}/${resourceType}?_count=10`;
      }
      
      console.log('Making FHIR request to:', resourceUrl);
      setSuccessMessage(`Requesting ${resourceType} resources from FHIR server...`);

      Meteor.call('rfc7523.makeFhirRequest', {
        url: resourceUrl,
        accessToken
      }, (err, result) => {
        if (err) {
          setError(`FHIR Request Error: ${err.message}`);
          setSuccessMessage('');
        } else {
          setFhirResponse(result);
          setSuccessMessage(`Successfully retrieved ${result.entry?.length || 0} ${resourceType} resources`);
          setError('');
        }
        setLoading(false);
      });
    } catch (err) {
      setError(`FHIR Error: ${err.message}`);
      setSuccessMessage('');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Backend Authentication (RFC 7523)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page demonstrates backend services authentication using JWT Bearer tokens. 
        No user interaction or browser redirects are required.
      </Alert>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Important:</strong> You're running on localhost. RFC 7523 servers in production won't be able to access your JWK Set URL at {Meteor.absoluteUrl()}.well-known/jwks.json
        <br />
        For backend authentication to work:
        <ul style={{ marginTop: '8px', marginBottom: 0 }}>
          <li>Deploy to a public URL (e.g., your meteorapp.com domain)</li>
          <li>Configure the EHR with your public JWK Set URL</li>
          <li>Ensure your client_id matches the EHR's configuration</li>
        </ul>
      </Alert>

      {/* Configuration Display */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Configuration" />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Client ID:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {ehrConfig?.client_id || 'Not configured'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Token Endpoint:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {ehrConfig?.fhirServiceUrl?.replace('/api/FHIR/R4', '/oauth2/token') || 'Not configured'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Private Key Available:</Typography>
              <Chip 
                label={privateKeyExists ? 'Yes' : 'No'} 
                color={privateKeyExists ? 'success' : 'error'} 
                size="small" 
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">JWK Set URL:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {Meteor.absoluteUrl() + '.well-known/jwks.json'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Key ID (kid):</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {keyId}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* JWT Generation */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Step 1: Generate JWT Assertion" />
        <CardContent>
          <Button 
            variant="contained" 
            onClick={generateJwtAssertion}
            disabled={!ehrConfig || !privateKeyExists || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate JWT'}
          </Button>
          
          {jwtAssertion && (
            <Paper sx={{ p: 2, mt: 2, backgroundColor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>JWT Assertion:</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace', 
                  wordBreak: 'break-all',
                  fontSize: '0.75rem'
                }}
              >
                {jwtAssertion}
              </Typography>
              
              {/* Decode and display JWT */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Decoded JWT:</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <strong>Header:</strong>
                </Typography>
                <pre style={{ fontSize: '0.75rem', margin: '4px 0' }}>
                  {JSON.stringify(jwt.decode(jwtAssertion, { complete: true })?.header, null, 2)}
                </pre>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mt: 1 }}>
                  <strong>Payload:</strong>
                </Typography>
                <pre style={{ fontSize: '0.75rem', margin: '4px 0' }}>
                  {JSON.stringify(jwt.decode(jwtAssertion), null, 2)}
                </pre>
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Token Exchange */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Step 2: Exchange JWT for Access Token" />
        <CardContent>
          <Button 
            variant="contained" 
            onClick={authenticateBackend}
            disabled={!jwtAssertion || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Authenticate'}
          </Button>
          
          {tokenResponse && (
            <Paper sx={{ p: 2, mt: 2, backgroundColor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>Token Response:</Typography>
              <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                {JSON.stringify(tokenResponse, null, 2)}
              </pre>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Test FHIR Call */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Step 3: Test FHIR API Call" />
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Note: Some EHRs require specific search parameters for ResearchStudy and ResearchSubject resources.
              A status parameter is automatically included.
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                label="Resource Type"
              >
                <MenuItem value="ResearchStudy">ResearchStudy</MenuItem>
                <MenuItem value="ResearchSubject">ResearchSubject</MenuItem>
                <MenuItem value="Patient">Patient</MenuItem>
              </Select>
            </FormControl>
            
            {resourceType === 'ResearchStudy' && (
              <FormControl fullWidth>
                <InputLabel>Study Status</InputLabel>
                <Select
                  value={studyStatus}
                  onChange={(e) => setStudyStatus(e.target.value)}
                  label="Study Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="administratively-completed">Administratively Completed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="closed-to-accrual">Closed to Accrual</MenuItem>
                  <MenuItem value="closed-to-accrual-and-intervention">Closed to Accrual and Intervention</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="disapproved">Disapproved</MenuItem>
                  <MenuItem value="in-review">In Review</MenuItem>
                  <MenuItem value="temporarily-closed-to-accrual">Temporarily Closed to Accrual</MenuItem>
                  <MenuItem value="temporarily-closed-to-accrual-and-intervention">Temporarily Closed to Accrual and Intervention</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <Button 
              variant="contained" 
              onClick={testFhirCall}
              disabled={!accessToken || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Test FHIR Call'}
            </Button>
          </Stack>
          
          {fhirResponse && (
            <Paper sx={{ p: 2, mt: 2, backgroundColor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>
                FHIR Response:
                {fhirResponse.truncated && (
                  <Chip 
                    label={`Showing 100 of ${fhirResponse.originalCount} total entries`} 
                    color="warning" 
                    size="small" 
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <pre style={{ fontSize: '0.875rem', overflow: 'auto', maxHeight: '400px' }}>
                {JSON.stringify(fhirResponse, null, 2)}
              </pre>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Success Display */}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
}