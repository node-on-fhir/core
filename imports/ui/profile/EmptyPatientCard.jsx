// imports/ui/profile/EmptyPatientCard.jsx
//
// The 1g on-ramp card: account exists, no patient record linked. Same
// 148px | 1fr frame as the badge PatientCard, but dashed accent border and a
// ghost barcode — the card itself is the call to action.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CakeIcon from '@mui/icons-material/Cake';
import ProfileBarcode from './ProfileBarcode.jsx';

export default function EmptyPatientCard({ email, onCreate, onFind }) {
  return (
    <Box
      className="pf-card--patient"
      sx={{
        display: 'grid',
        gridTemplateColumns: '148px minmax(0, 1fr)',
        border: '1px dashed var(--pf-accent-deep)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Photo column: dashed drop-zone state (no record yet — decorative) */}
      <Box className="pf-photo-col" sx={{
        minHeight: 190,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0.5,
        borderRight: '1px dashed var(--pf-accent-deep)',
        color: 'var(--pf-accent)', opacity: 0.7
      }}>
        <PhotoCameraIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: 10 }}>Add photo</Typography>
      </Box>

      <Box sx={{ p: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <ProfileBarcode ghost width={220} height={22} />
        <Typography variant="h3" sx={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--pf-ink-mid)' }}>
          No patient record yet
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-dim)' }}>
          Your account is <Box component="span" className="pf-mono" sx={{ fontSize: 12 }}>{email}</Box>.
          Create a record, or link one that a hospital already holds for you.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Button
            id="createMyRecordButton"
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onCreate}
            sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-accent)', borderColor: 'var(--pf-accent)' }}
          >
            Create my record
          </Button>
          <Button
            id="findExistingRecordButton"
            variant="outlined"
            size="small"
            startIcon={<SearchIcon />}
            onClick={onFind}
            sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
          >
            Find an existing record
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: 12, color: 'var(--pf-ink-faint)', mt: 0.5 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <CakeIcon sx={{ fontSize: 12 }} /> Birth date
          </Box>
          <span>·</span> <span>Sex</span>
          <span>·</span> <span>Phone</span>
          <span>·</span> <span>Address</span>
        </Box>
      </Box>
    </Box>
  );
}
