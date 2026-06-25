// npmPackages/prescription-benefit/client/FooterButtons.jsx
//
// Route-scoped footer buttons for /prescription-benefits. Coordinates with
// PrescriptionBenefitPage via Session tokens (the footer renders outside the
// page tree). IDs/className follow .claude/rules/ui/footer-buttons.md.

import React from 'react';
import { Box, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

export function PrescriptionBenefitFooterButtons() {
  function requestSubmit() {
    Session.set('prescriptionBenefitSubmitToken', Random.id());
  }
  function requestClear() {
    Session.set('prescriptionBenefitClearToken', Random.id());
  }
  function goToHistory() {
    Session.set('prescriptionBenefitActiveTab', 2);
  }

  return (
    <Box
      className="footer-buttons-prescription-benefit"
      sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}
    >
      <Button
        id="prescription-benefit-history-footer-btn"
        variant="text"
        startIcon={<HistoryIcon />}
        onClick={goToHistory}
      >
        History
      </Button>
      <Button
        id="prescription-benefit-clear-footer-btn"
        variant="outlined"
        startIcon={<ClearIcon />}
        onClick={requestClear}
      >
        Clear
      </Button>
      <Button
        id="prescription-benefit-submit-footer-btn"
        variant="contained"
        color="primary"
        startIcon={<SendIcon />}
        onClick={requestSubmit}
      >
        Run Benefit Check
      </Button>
    </Box>
  );
}

export default PrescriptionBenefitFooterButtons;
