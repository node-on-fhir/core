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
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import forge from 'node-forge';
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

  // Get Epic configuration
  const epicConfig = get(Meteor, 'settings.public.smartOnFhir', []).find(
    config => config.vendor.includes('Epic')
  );
  const privateKey = get(Meteor, 'settings.private.x509.privateKey', '');

  // Generate JWT assertion for backend auth
  const generateJwtAssertion = () => {
    try {
      const clientId = epicConfig?.client_id;
      const tokenEndpoint = epicConfig?.fhirServiceUrl?.replace('/api/FHIR/R4', '/oauth2/token');
      
      if (!clientId || !tokenEndpoint || !privateKey) {
        throw new Error('Missing configuration for backend authentication');
      }

      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: clientId,
        sub: clientId,
        aud: tokenEndpoint,
        jti: `${clientId}-${Date.now()}`,
        exp: now + 300, // 5 minutes
        iat: now
      };

      // Sign with private key
      const assertion = jwt.sign(jwtPayload, privateKey, { 
        algorithm: 'RS384',
        header: {
          typ: 'JWT'
        }
      });

      setJwtAssertion(assertion);
      return assertion;
    } catch (err) {
      setError(`JWT Generation Error: ${err.message}`);
      return null;
    }
  };

  // Exchange JWT for access token
  const authenticateBackend = async () => {
    setLoading(true);
    setError('');
    setTokenResponse(null);
    setFhirResponse(null);

    try {
      const assertion = generateJwtAssertion();
      if (!assertion) return;

      const tokenEndpoint = epicConfig?.fhirServiceUrl?.replace('/api/FHIR/R4', '/oauth2/token');
      
      // Prepare form data for token request
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      formData.append('client_assertion', assertion);
      formData.append('scope', 'system/*.read');

      // Call server method to exchange token
      Meteor.call('epic.exchangeBackendToken', {
        tokenEndpoint,
        formData: formData.toString()
      }, (err, result) => {
        if (err) {
          setError(`Token Exchange Error: ${err.message}`);
        } else {
          setAccessToken(result.access_token);
          setTokenResponse(result);
        }
        setLoading(false);
      });
    } catch (err) {
      setError(`Authentication Error: ${err.message}`);
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

    try {
      const resourceUrl = selectedPatientId 
        ? `${epicConfig.fhirServiceUrl}/Patient/${selectedPatientId}`
        : `${epicConfig.fhirServiceUrl}/Patient?_count=10`;

      Meteor.call('epic.makeFhirRequest', {
        url: resourceUrl,
        accessToken
      }, (err, result) => {
        if (err) {
          setError(`FHIR Request Error: ${err.message}`);
        } else {
          setFhirResponse(result);
        }
        setLoading(false);
      });
    } catch (err) {
      setError(`FHIR Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Epic Backend Authentication (RFC 7523)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page demonstrates backend services authentication using JWT Bearer tokens. 
        No user interaction or browser redirects are required.
      </Alert>

      {/* Configuration Display */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Configuration" />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Client ID:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {epicConfig?.client_id || 'Not configured'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Token Endpoint:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {epicConfig?.fhirServiceUrl?.replace('/api/FHIR/R4', '/oauth2/token') || 'Not configured'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Private Key Available:</Typography>
              <Chip 
                label={privateKey ? 'Yes' : 'No'} 
                color={privateKey ? 'success' : 'error'} 
                size="small" 
              />
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
            disabled={!epicConfig || !privateKey}
          >
            Generate JWT
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
            <TextField
              label="Patient ID (optional)"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              placeholder="Leave empty to search patients"
              fullWidth
            />
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
              <Typography variant="subtitle2" gutterBottom>FHIR Response:</Typography>
              <pre style={{ fontSize: '0.875rem', overflow: 'auto', maxHeight: '400px' }}>
                {JSON.stringify(fhirResponse, null, 2)}
              </pre>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
}