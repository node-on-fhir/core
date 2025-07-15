// /packages/pacio-core/client/pages/AdvanceDirectivesPage.jsx

import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Card,
  CardContent,
  Button,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

export function AdvanceDirectivesPage() {
  const navigate = useNavigate();

  function handleCreateNew() {
    // Navigate to patient selection or creation flow
    navigate('/patients');
  }

  return (
    <div id="advanceDirectivesPage" style={{ paddingTop: '80px' }}>
      <Container maxWidth="xl">
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Advance Directives
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage patient advance directives and living wills
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Recent Advance Directives
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  Select a patient from the sidebar to view their advance directives, 
                  or click below to create a new directive.
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleCreateNew}
                >
                  Create New Advance Directive
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Typography variant="body2">
                  • Total Directives: 0
                </Typography>
                <Typography variant="body2">
                  • Active: 0
                </Typography>
                <Typography variant="body2">
                  • Revoked: 0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}