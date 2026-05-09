// imports/ui-fhir/planDefinitions/PlanDefinitionPreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';

function PlanDefinitionPreview({ resource, resourceId, embedded }) {
  var title = get(resource, 'title', 'Untitled Plan Definition');
  var subtitle = get(resource, 'subtitle', '');
  var name = get(resource, 'name', '');
  var status = get(resource, 'status', 'draft');
  var version = get(resource, 'version', '');
  var typeCode = get(resource, 'type.coding[0].code', '');
  var typeDisplay = get(resource, 'type.coding[0].display', '');
  var description = get(resource, 'description', '');
  var purpose = get(resource, 'purpose', '');
  var usage = get(resource, 'usage', '');
  var publisher = get(resource, 'publisher', '');
  var date = get(resource, 'date', '');
  var approvalDate = get(resource, 'approvalDate', '');
  var lastReviewDate = get(resource, 'lastReviewDate', '');
  var effectivePeriodStart = get(resource, 'effectivePeriod.start', '');
  var effectivePeriodEnd = get(resource, 'effectivePeriod.end', '');
  var copyright = get(resource, 'copyright', '');
  var experimental = get(resource, 'experimental', false);
  var url = get(resource, 'url', '');
  var goals = get(resource, 'goal', []);
  var actions = get(resource, 'action', []);
  var authors = get(resource, 'author', []);

  var statusColorMap = {
    'draft': 'warning',
    'active': 'success',
    'retired': 'default',
    'unknown': 'default'
  };

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
        {title}
      </Typography>

      {/* Subtitle */}
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          {subtitle}
        </Typography>
      )}

      {/* Type line */}
      {typeDisplay && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {name && (
            <>
              <Typography variant="overline" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {name}
              </Typography>
            </>
          )}
          {version && (
            <>
              <Typography variant="overline" color="text.secondary">
                Version
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {version}
              </Typography>
            </>
          )}
          {publisher && (
            <>
              <Typography variant="overline" color="text.secondary">
                Publisher
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {publisher}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {date && (
            <>
              <Typography variant="overline" color="text.secondary">
                Publication Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {date}
              </Typography>
            </>
          )}
          {approvalDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Approval Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {approvalDate}
              </Typography>
            </>
          )}
          {lastReviewDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Last Review Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {lastReviewDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip + experimental flag */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip
          label={status.charAt(0).toUpperCase() + status.slice(1)}
          color={statusColorMap[status] || 'default'}
          size="small"
        />
        {experimental && (
          <Chip label="Experimental" color="info" size="small" variant="outlined" />
        )}
      </Box>

      <Divider />

      {/* Description */}
      {description && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {description}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Purpose */}
      {purpose && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Purpose
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {purpose}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Usage */}
      {usage && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Usage
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {usage}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Effective Period */}
      {(effectivePeriodStart || effectivePeriodEnd) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Effective Period
            </Typography>
            <Typography variant="body1">
              {effectivePeriodStart || '(no start)'} to {effectivePeriodEnd || '(no end)'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Goals ({goals.length})
            </Typography>
            {goals.map(function(goal, index) {
              return (
                <Box key={index} sx={{ mt: 1, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {get(goal, 'description.text', 'Goal ' + (index + 1))}
                  </Typography>
                  {get(goal, 'priority.coding[0].display') && (
                    <Chip
                      label={get(goal, 'priority.coding[0].display')}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
          <Divider />
        </>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Actions ({actions.length})
            </Typography>
            {actions.map(function(action, index) {
              return (
                <Box key={index} sx={{ mt: 1, pl: 2, borderLeft: 2, borderColor: 'secondary.main' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {action.title || 'Action ' + (index + 1)}
                  </Typography>
                  {action.description && (
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  )}
                  {action.priority && (
                    <Chip label={action.priority} size="small" sx={{ mt: 0.5 }} />
                  )}
                </Box>
              );
            })}
          </Box>
          <Divider />
        </>
      )}

      {/* Authors */}
      {authors.length > 0 && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Authors
            </Typography>
            {authors.map(function(author, index) {
              return (
                <Typography key={index} variant="body1">
                  {author.name || 'Unknown'}{get(author, 'telecom[0].value') ? ' (' + get(author, 'telecom[0].value') + ')' : ''}
                </Typography>
              );
            })}
          </Box>
          <Divider />
        </>
      )}

      {/* Copyright */}
      {copyright && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Copyright
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {copyright}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* URL */}
      {url && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Canonical URL
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {url}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with resource ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            PlanDefinition ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PlanDefinitionPreview;
