// imports/ui/extensible/EulaPage.jsx
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

function EulaPage(props) {
  const theme = useTheme();
  
  const title = get(Meteor, 'settings.public.businessPages.eula.title', 'End User License Agreement');
  const content = get(Meteor, 'settings.public.businessPages.eula.content', 
    `This End User License Agreement (EULA) is a legal agreement between you and our organization 
    for the use of this software application. By installing or using this software, you agree 
    to be bound by the terms of this agreement.`
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

export default EulaPage;