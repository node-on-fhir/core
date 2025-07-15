// /packages/pacio-core/client/pages/TransitionOfCarePage.jsx

import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SwapHoriz as SwapHorizIcon } from '@mui/icons-material';

export function TransitionOfCarePage() {
  const navigate = useNavigate();

  function handleCreateTransition() {
    // Navigate to patient selection
    navigate('/patients');
  }

  return (
    <div id="transitionOfCarePage" style={{ paddingTop: '80px' }}>
      <Container maxWidth="xl">
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Transition of Care
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage patient transitions between care settings
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SwapHorizIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Recent Transitions
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  Track and manage patient transitions between hospitals, skilled nursing 
                  facilities, home health, and other care settings.
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Transition Types:
                  </Typography>
                  <Chip label="Hospital to SNF" size="small" sx={{ mr: 1 }} />
                  <Chip label="SNF to Home" size="small" sx={{ mr: 1 }} />
                  <Chip label="Hospital to Home Health" size="small" />
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleCreateTransition}
                >
                  Create New Transition
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transition Summary
                </Typography>
                <Typography variant="body2">
                  • Active Transitions: 0
                </Typography>
                <Typography variant="body2">
                  • Completed This Month: 0
                </Typography>
                <Typography variant="body2">
                  • Pending Reviews: 0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}