// /imports/ui/pages/PrivacyPage.jsx
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

function PrivacyPage(props) {
  const theme = useTheme();
  
  const title = get(Meteor, 'settings.public.businessPages.privacy.title', 'Privacy Policy');
  const content = get(Meteor, 'settings.public.businessPages.privacy.content', 
    `We are committed to protecting your privacy and ensuring the security of your personal information. 
    This privacy policy outlines how we collect, use, and protect your data in accordance with HIPAA 
    and other applicable regulations.`
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

export default PrivacyPage;