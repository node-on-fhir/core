// npmPackages/pacio-core/client/_compat/PdfViewer.jsx
//
// Compatibility shim. The Atmosphere pacio-core imported PdfViewer from the
// host app (/imports/ui-fhir/DocumentReferences/PdfViewer), which no longer
// exists as a module. The app instead exposes a PdfViewer via the Meteor global
// (index.jsx's /pdf route uses `Meteor.PdfViewer`). This shim renders
// Meteor.PdfViewer when a host package has registered it, otherwise a graceful
// notice — preserving the <PdfViewer> usage in AdvanceDirectiveDetail.

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Alert } from '@mui/material';

export function PdfViewer(props) {
  if (Meteor.PdfViewer) {
    const Viewer = Meteor.PdfViewer;
    return <Viewer {...props} />;
  }
  return (
    <Alert severity="info" sx={{ my: 2 }}>
      PDF viewer is not available. Enable a package that registers
      <code> Meteor.PdfViewer</code> to preview documents inline.
    </Alert>
  );
}

export default PdfViewer;
