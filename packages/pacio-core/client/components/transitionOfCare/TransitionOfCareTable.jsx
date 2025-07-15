// /packages/pacio-core/client/components/transitionOfCare/TransitionOfCareTable.jsx

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  TableContainer,
  Paper,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import { 
  Visibility as ViewIcon,
  SwapHoriz as TransitionIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { TableNoData } from '/imports/ui-fhir/components/TableNoData';

export function TransitionOfCareTable(props) {
  const navigate = useNavigate();
  const {
    compositions = [],
    selectedCompositionId,
    onRowClick,
    showType = true,
    showAuthor = true,
    showCustodian = true,
    showSections = true,
    showActions = true,
    tableRowSize = 'medium'
  } = props;
  
  // Filter for TOC documents
  const tocCompositions = compositions.filter(function(comp) {
    const type = get(comp, 'type.coding[0].code');
    return type === 'transition-of-care' || 
           type === 'continuity-of-care-document' ||
           type === '18776-5' || // C-CDA R2.1 Continuity of Care Document
           type === '34133-9';   // Summarization of Episode Note
  });
  
  function handleRowClick(compositionId) {
    if (onRowClick) {
      onRowClick(compositionId);
    } else {
      navigate(`/transition-of-care/${compositionId}`);
    }
  }
  
  function renderSectionsSummary(composition) {
    const sections = get(composition, 'section', []);
    const sectionCount = sections.length;
    
    if (sectionCount === 0) {
      return <Typography variant="caption">No sections</Typography>;
    }
    
    // Get first few section titles
    const sectionTitles = sections.slice(0, 3).map(function(section) {
      return get(section, 'title', get(section, 'code.coding[0].display', 'Section'));
    });
    
    const displayText = sectionTitles.join(', ');
    const moreCount = sectionCount - 3;
    
    return (
      <Box>
        <Typography variant="caption" noWrap style={{ maxWidth: 300 }}>
          {displayText}
          {moreCount > 0 && ` +${moreCount} more`}
        </Typography>
      </Box>
    );
  }
  
  function renderStatus(status) {
    let color = 'default';
    
    switch (status) {
      case 'final':
        color = 'success';
        break;
      case 'preliminary':
        color = 'warning';
        break;
      case 'amended':
        color = 'info';
        break;
      case 'entered-in-error':
        color = 'error';
        break;
    }
    
    return (
      <Chip 
        label={status}
        color={color}
        size="small"
      />
    );
  }
  
  if (tocCompositions.length === 0) {
    return <TableNoData message="No transition of care documents found" />;
  }
  
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size={tableRowSize} aria-label="Transition of Care Documents Table">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Title</TableCell>
            {showType && <TableCell>Type</TableCell>}
            {showAuthor && <TableCell>Author</TableCell>}
            {showCustodian && <TableCell>Custodian</TableCell>}
            <TableCell>Status</TableCell>
            {showSections && <TableCell>Sections</TableCell>}
            {showActions && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {tocCompositions.map(function(composition) {
            const isSelected = selectedCompositionId === get(composition, 'id');
            
            return (
              <TableRow
                key={get(composition, 'id')}
                hover
                selected={isSelected}
                onClick={function() { handleRowClick(get(composition, 'id')); }}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>
                  {moment(get(composition, 'date')).format('MMM D, YYYY')}
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TransitionIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      {get(composition, 'title', 'Transition of Care Document')}
                    </Typography>
                  </Box>
                </TableCell>
                {showType && (
                  <TableCell>
                    {get(composition, 'type.coding[0].display', 'Document')}
                  </TableCell>
                )}
                {showAuthor && (
                  <TableCell>
                    {get(composition, 'author[0].display', 'Unknown')}
                  </TableCell>
                )}
                {showCustodian && (
                  <TableCell>
                    {get(composition, 'custodian.display', 'Unknown')}
                  </TableCell>
                )}
                <TableCell>
                  {renderStatus(get(composition, 'status', 'unknown'))}
                </TableCell>
                {showSections && (
                  <TableCell>
                    {renderSectionsSummary(composition)}
                  </TableCell>
                )}
                {showActions && (
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small"
                        onClick={function(e) {
                          e.stopPropagation();
                          handleRowClick(get(composition, 'id'));
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}