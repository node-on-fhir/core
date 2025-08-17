// /imports/ui/pages/SupportPage.jsx
import React from 'react';
import { 
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Link
} from '@mui/material';
import { 
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTheme } from '@mui/material/styles';

function SupportPage(props) {
  const theme = useTheme();
  
  const title = get(Meteor, 'settings.public.businessPages.support.title', 'Support');
  const content = get(Meteor, 'settings.public.businessPages.support.content', 
    `Need help? Our support team is here to assist you. Please reach out to us using the contact information below.`
  );
  const email = get(Meteor, 'settings.public.businessPages.support.email', 'support@example.com');
  const phone = get(Meteor, 'settings.public.businessPages.support.phone', '1-800-XXX-XXXX');

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
          
          <Stack spacing={2} sx={{ mt: 4 }}>
            {email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="action" />
                <Link href={`mailto:${email}`} underline="hover">
                  {email}
                </Link>
              </Box>
            )}
            {phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" />
                <Link href={`tel:${phone}`} underline="hover">
                  {phone}
                </Link>
              </Box>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default SupportPage;