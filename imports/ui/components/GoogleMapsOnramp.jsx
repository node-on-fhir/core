// imports/ui/components/GoogleMapsOnramp.jsx
//
// Guided BYOK panel shown by map pages when no Google Maps key resolves.
// The game ships with no bundled key; this walks the player through
// provisioning their own (their quota, their billing) and saves it to
// userApiKeys (provider 'googleMaps'). Theme tokens only.

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Box, Card, CardHeader, CardContent, Typography, TextField, Button,
  Link, List, ListItem, ListItemText, Alert
} from '@mui/material';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import { notify } from '/imports/lib/notify.js';
import { MAPS_PROVIDER_ID } from '/imports/lib/googleMapsKeyResolution';

const SETUP_STEPS = [
  { primary: '1. Create (or sign in to) a Google Cloud account', secondary: 'console.cloud.google.com — the free tier covers typical gameplay usage.' },
  { primary: '2. Create a project and enable the "Maps JavaScript API"', secondary: 'APIs & Services → Library → Maps JavaScript API → Enable.' },
  { primary: '3. Create an API key', secondary: 'APIs & Services → Credentials → Create credentials → API key.' },
  { primary: '4. Restrict the key to the Maps JavaScript API', secondary: 'Edit the key → API restrictions → Restrict key. It is YOUR key — restriction protects YOUR billing.' },
  { primary: '5. Paste it below', secondary: 'Stored in your account only; never bundled with the game.' }
];

export function GoogleMapsOnramp({ onKeySaved }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await Meteor.rpc('userApiKeys.save', {
        provider: MAPS_PROVIDER_ID,
        value: value.trim()
      });
      notify({ title: 'Uplink established', message: 'Google Maps key saved to your account.', severity: 'success' });
      if (onKeySaved) { onKeySaved(); }
    } catch (err) {
      setError(err.reason || err.message || 'Could not save the key');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card sx={{ maxWidth: 720, mx: 'auto', my: 4 }}>
      <CardHeader
        avatar={<SatelliteAltIcon color="primary" />}
        title="Satellite uplink credentials required"
        subheader="Surface maps stream through the Google Maps Platform. Mission Control does not issue shared credentials — provision your own uplink key."
      />
      <CardContent>
        <List dense>
          {SETUP_STEPS.map(function(step) {
            return (
              <ListItem key={step.primary} disableGutters>
                <ListItemText primary={step.primary} secondary={step.secondary} />
              </ListItem>
            );
          })}
        </List>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <Link href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
            Open the Google Cloud credentials console
          </Link>
        </Typography>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            id="googleMapsOnrampKeyInput"
            label="Google Maps API key"
            placeholder="AIza..."
            value={value}
            onChange={function(event) { setValue(event.target.value); }}
            inputProps={{ autoCapitalize: 'none', spellCheck: false }}
          />
          <Button
            variant="contained"
            disabled={saving || value.trim().length < 20}
            onClick={handleSave}
            sx={{ flexShrink: 0 }}
          >
            {saving ? 'Linking…' : 'Establish uplink'}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Manage or remove this key anytime from My Profile → API keys.
        </Typography>
      </CardContent>
    </Card>
  );
}

export default GoogleMapsOnramp;
