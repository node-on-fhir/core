// imports/ui/profile/cards/AuthorizedAppsCard.jsx
//
// ONC 170.315(g)(10) 9.3.01 — apps the patient has authorized, with immediate
// revocation. Dense-row Nocturne rendering; the confirm dialog and revoke rpc
// stay at page level so the certification-tested semantics are unchanged.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CableIcon from '@mui/icons-material/Cable';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DeleteIcon from '@mui/icons-material/Delete';

import { get } from 'lodash';
import moment from 'moment';

import { ProfileCardHeader, AddRow, NeutralChip, AccentChip } from '../ProfilePrimitives.jsx';

export default function AuthorizedAppsCard({ authorizations, onRevoke }) {
  if (!authorizations || authorizations.length === 0) {
    return (
      <AddRow
        id="authorizedAppsAddRow"
        icon={<VerifiedUserIcon />}
        label="Authorized apps — no applications have access to your health data"
        disabled
      />
    );
  }

  return (
    <Box className="pf-card" id="authorizedAppsCard">
      <ProfileCardHeader
        icon={<VerifiedUserIcon />}
        title="Authorized apps"
        kicker="revocation is immediate"
      />
      <Box sx={{ pt: 0.5, pb: 1 }}>
        {authorizations.map(function(auth) {
          const authorizedDate = get(auth, 'access_token_created_at') || get(auth, 'created_at');
          const expiresDate = get(auth, 'authorization_expires_at');
          const isExpired = expiresDate && moment(expiresDate).isBefore(moment());
          const scopes = (get(auth, 'requested_scope') || get(auth, 'scope', '')).split(' ')
            .filter(function(s) { return s && s.includes('/'); })
            .slice(0, 5)
            .map(function(scope) { return scope.split('/').pop().split('.')[0]; });

          return (
            <Box
              key={auth._id}
              className="pf-row"
              sx={{
                display: 'grid',
                gridTemplateColumns: '22px minmax(0, 1fr) minmax(0, 1.2fr) 130px 90px',
                alignItems: 'center',
                gap: 1,
                p: '9px 14px',
                opacity: isExpired ? 0.6 : 1
              }}
            >
              <CableIcon sx={{ fontSize: 16, color: 'var(--pf-ink-mid)' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {get(auth, 'client_name') || get(auth, 'client_id', 'Unknown Application')}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
                  {authorizedDate ? `authorized ${moment(authorizedDate).format('MMM D, YYYY h:mm A')}` : 'authorization date unknown'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {scopes.map(function(scope) { return <NeutralChip key={scope} label={scope} />; })}
              </Box>
              <Box>
                {expiresDate ? (
                  isExpired
                    ? <NeutralChip icon={<ScheduleIcon />} label={`expired ${moment(expiresDate).format('MMM D')}`} />
                    : <AccentChip icon={<ScheduleIcon />} label={`expires ${moment(expiresDate).format('MMM D')}`} />
                ) : null}
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DeleteIcon sx={{ fontSize: 13 }} />}
                disabled={!!isExpired}
                onClick={function() { onRevoke(auth); }}
                sx={{ fontSize: 11, p: '3px 8px', borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
              >
                Revoke
              </Button>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
