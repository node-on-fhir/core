// packages/pacio-core/client/components/transitionOfCare/TocDocumentReferenceCard.jsx
//
// Card component for displaying a TOCDocumentReference resource.

import React from 'react';
import { get } from 'lodash';
import moment from 'moment';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button
} from '@mui/material';

import DescriptionIcon from '@mui/icons-material/Description';

function TocDocumentReferenceCard(props) {
  const { documentReference, onClick } = props;

  if (!documentReference) return null;

  const status = get(documentReference, 'status', 'unknown');
  const description = get(documentReference, 'description', 'No description');
  const date = get(documentReference, 'date', '');
  const typeDisplay = get(documentReference, 'type.coding[0].display', 'Transfer Summary Note');
  const compositionRef = get(documentReference, 'context.related[0].reference', '');

  function getStatusColor(s) {
    switch (s) {
      case 'current': return 'success';
      case 'superseded': return 'warning';
      case 'entered-in-error': return 'error';
      default: return 'default';
    }
  }

  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">
              {typeDisplay}
            </Typography>
          </Box>
          <Chip label={status} color={getStatusColor(status)} size="small" />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {description}
        </Typography>

        {date && (
          <Typography variant="caption" color="text.secondary">
            Date: {moment(date).format('YYYY-MM-DD HH:mm')}
          </Typography>
        )}

        {compositionRef && (
          <Typography variant="caption" color="text.secondary" display="block">
            Linked to: {compositionRef}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default TocDocumentReferenceCard;
