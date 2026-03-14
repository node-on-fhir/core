// imports/ui-fhir/lists/ListPreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  List as MuiList,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusColorMap = {
  'current': 'success',
  'retired': 'default',
  'entered-in-error': 'error'
};

const statusLabelMap = {
  'current': 'Current',
  'retired': 'Retired',
  'entered-in-error': 'Entered in Error'
};

const modeLabelMap = {
  'working': 'Working',
  'snapshot': 'Snapshot',
  'changes': 'Changes'
};

//===========================================================================
// COMPONENT

function ListPreview({ resource, resourceId, embedded }) {
  var title = get(resource, 'title', 'Untitled List');
  var status = get(resource, 'status', '');
  var mode = get(resource, 'mode', '');
  var listTypeDisplay = get(resource, 'code.text', '') || get(resource, 'code.coding[0].display', '');
  var listTypeCode = get(resource, 'code.coding[0].code', '');
  var orderByDisplay = get(resource, 'orderedBy.coding[0].display', '');
  var date = get(resource, 'date', '');
  var subjectDisplay = get(resource, 'subject.display', '');
  var subjectReference = get(resource, 'subject.reference', '');
  var sourceDisplay = get(resource, 'source.display', '');
  var sourceReference = get(resource, 'source.reference', '');
  var noteText = get(resource, 'note[0].text', '');
  var entries = get(resource, 'entry', []);

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
        {title}
      </Typography>

      {listTypeDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {listTypeDisplay}{listTypeCode ? ' (' + listTypeCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {subjectDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {subjectDisplay}
              </Typography>
            </>
          )}
          {sourceDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {sourceDisplay}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {date && (
            <>
              <Typography variant="overline" color="text.secondary">
                Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {moment(date).format('MMM D, YYYY h:mm A')}
              </Typography>
            </>
          )}
          {orderByDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Ordered By
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {orderByDisplay}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status and Mode chips */}
      <Box sx={{ display: 'flex', gap: 1, py: 2 }}>
        {status && (
          <Chip
            label={statusLabelMap[status] || status}
            color={statusColorMap[status] || 'default'}
            size="small"
          />
        )}
        {mode && (
          <Chip
            label={modeLabelMap[mode] || mode}
            color="info"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      <Divider />

      {/* Notes */}
      {noteText && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Notes
            </Typography>
            <Typography variant="body1">
              {noteText}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* List entries */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary">
          List Items ({entries.length})
        </Typography>

        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No items in this list.
          </Typography>
        ) : (
          <MuiList dense sx={{ mt: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {entries.map(function(entry, index) {
              return (
                <ListItem key={index} divider={index < entries.length - 1}>
                  <ListItemText
                    primary={get(entry, 'item.display', 'Unnamed Item')}
                    secondary={
                      <>
                        {get(entry, 'item.reference', '')}
                        {get(entry, 'date') && (' - ' + moment(get(entry, 'date')).format('MMM D, YYYY'))}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </MuiList>
        )}
      </Box>

      <Divider />

      {/* Footer with resource ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            List ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ListPreview;
