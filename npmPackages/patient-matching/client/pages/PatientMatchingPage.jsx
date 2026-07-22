// packages/patient-matching/client/pages/PatientMatchingPage.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export default function PatientMatchingPage() {
  console.log('PatientMatchingPage component rendering'); // phi-audit: ok
  
  const [searchCriteria, setSearchCriteria] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    identifier: '',
    gender: ''
  });
  const [matchResults, setMatchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // Track patients collection
  const { patientsReady } = useTracker(() => {
    const handle = Meteor.subscribe('patients.all');
    return {
      patientsReady: handle.ready()
    };
  }, []);

  const handleInputChange = (field) => (event) => {
    setSearchCriteria({
      ...searchCriteria,
      [field]: event.target.value
    });
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    setMatchResults([]);

    try {
      // Build patient object for matching
      const patientToMatch = {
        name: []
      };

      if (searchCriteria.firstName || searchCriteria.lastName) {
        patientToMatch.name.push({
          given: searchCriteria.firstName ? [searchCriteria.firstName] : [],
          family: searchCriteria.lastName || ''
        });
      }

      if (searchCriteria.birthDate) {
        patientToMatch.birthDate = searchCriteria.birthDate;
      }

      if (searchCriteria.gender) {
        patientToMatch.gender = searchCriteria.gender;
      }

      if (searchCriteria.identifier) {
        patientToMatch.identifier = [{
          value: searchCriteria.identifier
        }];
      }

      // Call the matching method
      const result = await Meteor.rpc('patientMatching.idiMatch', {
        options: {
          patient: patientToMatch,
          maxResults: 10
        }
      });

      if (result.success && result.bundle) {
        setMatchResults(result.bundle.entry || []);
      }
    } catch (err) {
      console.error('Error searching for patient matches:', err); // phi-audit: ok
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'certain':
        return 'success';
      case 'probable':
        return 'warning';
      case 'possible':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            <PersonSearchIcon sx={{ mr: 2, verticalAlign: 'bottom' }} />
            Patient Matching
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search for patient records using demographic information and identifiers
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Search Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Criteria
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={searchCriteria.firstName}
                  onChange={handleInputChange('firstName')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={searchCriteria.lastName}
                  onChange={handleInputChange('lastName')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Birth Date"
                  type="date"
                  value={searchCriteria.birthDate}
                  onChange={handleInputChange('birthDate')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Gender"
                  select
                  value={searchCriteria.gender}
                  onChange={handleInputChange('gender')}
                  SelectProps={{ native: true }}
                >
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Identifier (MRN, SSN, etc)"
                  value={searchCriteria.identifier}
                  onChange={handleInputChange('identifier')}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    disabled={isSearching || !patientsReady}
                    startIcon={isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                  >
                    {isSearching ? 'Searching...' : 'Search for Matches'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {matchResults.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Match Results ({matchResults.length} found)
              </Typography>
              
              <List>
                {matchResults.map((entry, index) => {
                  const patient = entry.resource;
                  const score = entry.search?.score || 0;
                  const confidence = entry.search?.extension?.[0]?.valueCode || 'unknown';
                  
                  return (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={confidence}
                                color={getConfidenceColor(confidence)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Birth Date: {patient.birthDate || 'Unknown'} | 
                                Gender: {patient.gender || 'Unknown'} |
                                Score: {(score * 100).toFixed(1)}%
                              </Typography>
                              {patient.identifier && patient.identifier.length > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  ID: {patient.identifier[0].value}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton color="primary">
                            <VerifiedUserIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < matchResults.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {!isSearching && matchResults.length === 0 && searchCriteria.firstName && (
          <Alert severity="info">
            No matches found. Try adjusting your search criteria.
          </Alert>
        )}
      </Paper>
      </Container>
    </Box>
  );
}