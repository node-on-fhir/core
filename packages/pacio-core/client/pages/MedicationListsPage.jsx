// /packages/pacio-core/client/pages/MedicationListsPage.jsx

import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  LocalPharmacy as LocalPharmacyIcon,
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';

export function MedicationListsPage() {
  const navigate = useNavigate();

  function handleCreateList() {
    // Navigate to patient selection
    navigate('/patients');
  }

  return (
    <div id="medicationListsPage" style={{ paddingTop: '80px' }}>
      <Container maxWidth="xl">
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Medication Lists
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Comprehensive medication reconciliation and management
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocalPharmacyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Medication Reconciliation
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  Maintain accurate medication lists across care transitions to ensure 
                  patient safety and continuity of care.
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Key Features:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Complete medication history" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Reconciliation at transitions" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Allergy and interaction checking" />
                  </ListItem>
                </List>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleCreateList}
                >
                  Create Medication List
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  List Summary
                </Typography>
                <Typography variant="body2">
                  • Total Lists: 0
                </Typography>
                <Typography variant="body2">
                  • Updated Today: 0
                </Typography>
                <Typography variant="body2">
                  • Pending Review: 0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}