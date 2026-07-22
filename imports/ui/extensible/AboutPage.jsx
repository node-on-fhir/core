// imports/ui/extensible/AboutPage.jsx
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

function AboutPage(props) {
  const theme = useTheme();
  
  const title = get(Meteor, 'settings.public.businessPages.about.title', 'About Us');
  const content = get(Meteor, 'settings.public.businessPages.about.content', 
    `Welcome to our healthcare application. We are dedicated to improving healthcare delivery 
    through innovative technology solutions that prioritize patient care and data security.`
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

export default AboutPage;