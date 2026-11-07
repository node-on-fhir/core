// imports/ui/profile/cards/WorkspacePreferencesCard.jsx
//
// Workspace Preferences — default homepage selection (settings-driven icon
// tiles, saved to profile.preferences.homePage) plus a generic listing of
// per-route saved view preferences (profile.preferences.urlParams, written by
// usePersistedRouteParams on CRUD routes) with per-route reset.

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { ProfileCardHeader } from '../ProfilePrimitives.jsx';
import { notify } from '/imports/lib/notify.js';
import { getHomepageOptions, resolveHomepageIcon } from '/imports/lib/homepageOptions.js';

// Compact variant of the workspace tile language (SelectHomepageDialog)
const TILE_SX = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.5,
  p: 2,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  cursor: 'pointer',
  textAlign: 'center',
  '&:hover': { backgroundColor: 'action.hover', borderColor: 'primary.main' }
};

export default function WorkspacePreferencesCard() {
  const user = useTracker(function() {
    return Meteor.user();
  }, []);

  const homePage = get(user, 'profile.preferences.homePage', '');
  const urlParams = get(user, 'profile.preferences.urlParams', {});
  const options = getHomepageOptions();
  const routeKeys = Object.keys(urlParams);

  if (!options.length && !homePage && !routeKeys.length) {
    return null;
  }

  async function handleSelectHomepage(option) {
    try {
      await Meteor.rpc('users.setHomePagePreference', { path: option.path });
      notify({ title: 'Homepage preference saved', message: option.label, severity: 'success' });
    } catch (error) {
      notify({ title: 'Error saving preference', message: error.reason || error.message, severity: 'error' });
    }
  }

  async function handleResetRoute(route) {
    try {
      await Meteor.rpc('users.clearRoutePreferences', { route: route });
      notify({ title: 'View preferences reset', message: route, severity: 'success' });
    } catch (error) {
      notify({ title: 'Error resetting preferences', message: error.reason || error.message, severity: 'error' });
    }
  }

  return (
    <Box className="pf-card" id="workspacePreferencesCard">
      <ProfileCardHeader
        icon={<TuneIcon />}
        title="Workspace preferences"
        kicker={homePage ? 'homepage set' : 'no homepage set'}
      />

      {options.length > 0 && (
        <Box sx={{ p: '10px 14px 0' }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'var(--pf-ink-dim)' }}>
            Default homepage — where you land after signing in.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {options.map(function(option) {
              const IconComponent = resolveHomepageIcon(option.iconName);
              const selected = option.path === homePage;
              return (
                <Box
                  key={option.path}
                  id={'workspace-homepage-tile' + option.path.replace(/\//g, '-')}
                  onClick={function() { handleSelectHomepage(option); }}
                  sx={{
                    ...TILE_SX,
                    ...(selected && {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.selected'
                    })
                  }}
                >
                  <IconComponent color={selected ? 'primary' : 'action'} sx={{ fontSize: 32 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {option.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box sx={{ p: '12px 14px 12px' }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'var(--pf-ink-dim)' }}>
          Saved view preferences — display settings remembered per page.
        </Typography>
        {routeKeys.length === 0 ? (
          <Typography variant="body2" sx={{ fontSize: 13, color: 'var(--pf-ink-dim)' }}>
            No saved view preferences yet. Column and display toggles on worklist pages are remembered here.
          </Typography>
        ) : (
          routeKeys.map(function(route) {
            const params = urlParams[route] || {};
            return (
              <Box key={route} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75 }}>
                <Typography noWrap component="div" className="pf-mono" sx={{ fontSize: 12, color: 'var(--pf-ink)', minWidth: 140 }}>
                  {route}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                  {Object.keys(params).map(function(key) {
                    return (
                      <Chip
                        key={key}
                        label={key + '=' + params[key]}
                        size="small"
                        sx={{ fontSize: 10, height: 18 }}
                      />
                    );
                  })}
                </Box>
                <Tooltip title={'Reset saved preferences for ' + route}>
                  <IconButton
                    size="small"
                    id={'workspace-reset' + route.replace(/\//g, '-')}
                    onClick={function() { handleResetRoute(route); }}
                  >
                    <RestartAltIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
