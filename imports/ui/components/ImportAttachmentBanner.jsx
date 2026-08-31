// imports/ui/components/ImportAttachmentBanner.jsx
//
// Shared import-attachment banner (design v2 §E, PR6). A single, clearly-named,
// refinable component that renders ONE Alert describing which patient an import
// will attach to — driven by the side-effect-free importAttachment.preview
// method's { attachmentSource, display } result.
//
// One Alert state per source:
//   selected        -> info:    "Importing to {display} — you have this patient selected."
//   profile-linked  -> info:    "Importing to {display} — linked to your profile."
//   payload-created -> info:    "This import will create a new patient record ({display})."
//                               + optional [Link to my records] when onLinkToMySet given
//   unlinked        -> warning: "Data will be imported to the warehouse without a
//                               patient. Re-attach later or flush this run."
// willCreatePatient is treated the same as payload-created (a will-create signal
// the caller can raise even before a payload Patient is confirmed).
//
// Tri-state loading (null -> loading -> ready) is the CALLER's job: this
// component renders NOTHING while attachmentSource is undefined, so a preview
// that hasn't resolved yet produces no flicker. Theme tokens only.

import React from 'react';

import { Alert, AlertTitle, Box, Button } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

export function ImportAttachmentBanner(props) {
  const attachmentSource = props.attachmentSource;
  const display = props.display;
  const willCreatePatient = props.willCreatePatient;
  const onLinkToMySet = props.onLinkToMySet;
  const sx = props.sx || {};

  // Tri-state: nothing to say until the preview has resolved a source.
  if (attachmentSource === undefined || attachmentSource === null) {
    return null;
  }

  const patientLabel = (typeof display === 'string' && display.length > 0)
    ? display
    : 'this patient';

  // ---- selected ----
  if (attachmentSource === 'selected') {
    return (
      <Alert severity="info" sx={sx}>
        Importing to <strong>{patientLabel}</strong> — you have this patient selected.
      </Alert>
    );
  }

  // ---- profile-linked ----
  if (attachmentSource === 'profile-linked') {
    return (
      <Alert severity="info" sx={sx}>
        Importing to <strong>{patientLabel}</strong> — linked to your profile.
      </Alert>
    );
  }

  // ---- payload-created / willCreatePatient ----
  if (attachmentSource === 'payload-created' || willCreatePatient) {
    const newLabel = (typeof display === 'string' && display.length > 0)
      ? display
      : 'a new patient record';
    return (
      <Alert severity="info" sx={sx}>
        <AlertTitle>New patient record</AlertTitle>
        This import will create a new patient record (<strong>{newLabel}</strong>).
        {onLinkToMySet ? (
          <Box sx={{ mt: 1 }}>
            <Button
              id="import-attachment-link-btn"
              size="small"
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={onLinkToMySet}
            >
              Link to my records
            </Button>
          </Box>
        ) : null}
      </Alert>
    );
  }

  // ---- unlinked ----
  if (attachmentSource === 'unlinked') {
    return (
      <Alert severity="warning" sx={sx}>
        <AlertTitle>No patient attached</AlertTitle>
        Data will be imported to the warehouse without a patient. You can re-attach
        it to a patient later, or flush this import run to remove it.
      </Alert>
    );
  }

  // Unknown source — render nothing rather than guess.
  return null;
}

export default ImportAttachmentBanner;
