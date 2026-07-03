// npmPackages/prescription-benefit/client/components/RawXmlAccordion.jsx
//
// Collapsible raw RTPBRequest / RTPBResponse XML — the "send and receive ...
// XML format" evidence for § 170.315(b)(4).

import React from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography, Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';

function XmlBlock(props) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        bgcolor: 'background.default',
        color: 'text.primary',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {props.xml || ''}
    </Box>
  );
}

function RawXmlAccordion(props) {
  return (
    <Box sx={{ mt: 3 }}>
      <Accordion id="prescriptionBenefitRequestXml" disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <CodeIcon sx={{ mr: 1 }} fontSize="small" />
          <Typography color="text.primary">RTPBRequest (XML sent)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <XmlBlock xml={props.requestXml} />
        </AccordionDetails>
      </Accordion>
      <Accordion id="prescriptionBenefitResponseXml" disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <CodeIcon sx={{ mr: 1 }} fontSize="small" />
          <Typography color="text.primary">RTPBResponse (XML received)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <XmlBlock xml={props.responseXml} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default RawXmlAccordion;
