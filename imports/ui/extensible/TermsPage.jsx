// imports/ui/extensible/TermsPage.jsx
import React from 'react';
import { 
  Container,
  Typography,
  Paper,
  Box
} from '@mui/material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTheme } from '@mui/material/styles';

function TermsPage(props) {
  const theme = useTheme();
  
  const title = get(Meteor, 'settings.public.businessPages.terms.title', 'Terms and Conditions');
  const content = get(Meteor, 'settings.public.businessPages.terms.content', 
    `By using this application, you agree to the following terms and conditions. 
    This software is provided as-is and we make no warranties regarding its fitness 
    for any particular purpose.`
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 4,
      pb: 8
    }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 300
            }}
          >
            {title}
          </Typography>
          <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
            {content}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default TermsPage;