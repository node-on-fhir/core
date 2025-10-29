// packages/dicom-viewer/client/StudyListPage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

export default function StudyListPage() {
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';
  const paperBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.paperColor', '#1e1e1e')
    : '#ffffff';
  const subheaderColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  return (
    <Box
      id="dicomStudyListPage"
      sx={{
        minHeight: '100vh',
        py: 4
      }}
    >
      <Card sx={{
        mx: 3,
        mb: 3,
        bgcolor: cardBgColor,
        color: cardTextColor
      }}>
        <CardHeader
          title="DICOM Studies"
          subheader="Medical imaging studies for current patient"
          sx={{
            '& .MuiCardHeader-title': {
              color: cardTextColor
            },
            '& .MuiCardHeader-subheader': {
              color: subheaderColor
            }
          }}
        />
        <CardContent>
          <Typography
            variant="body2"
            paragraph
            sx={{
              color: subheaderColor
            }}
          >
            This is the study list page with proper theming. DICOM functionality will be added in Phase 3.
          </Typography>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              bgcolor: paperBgColor,
              '& .MuiTableCell-root': {
                color: cardTextColor,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Study Date</TableCell>
                  <TableCell>Study Description</TableCell>
                  <TableCell>Modality</TableCell>
                  <TableCell>Images</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        py: 3,
                        color: subheaderColor
                      }}
                    >
                      No studies available. Upload functionality coming in Phase 3.
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
