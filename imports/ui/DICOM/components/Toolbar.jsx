// imports/ui/DICOM/components/Toolbar.jsx
// Toolbar component for DICOM viewer with imaging tools

import React from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  PanTool as PanIcon,
  ZoomIn as ZoomIcon,
  Straighten as LengthIcon,
  Refresh as ResetIcon,
  CameraAlt as ScreenshotIcon,
  Tune as WindowLevelIcon,
} from '@mui/icons-material';

/**
 * Viewer toolbar with imaging tools
 */
export function Toolbar({
  activeTool = 'Wwwc',
  onToolChange,
  onReset,
  onScreenshot,
  currentImage = 1,
  totalImages = 1,
}) {
  const tools = [
    { id: 'Wwwc', label: 'Window/Level', icon: <WindowLevelIcon />, tooltip: 'Adjust brightness/contrast' },
    { id: 'Pan', label: 'Pan', icon: <PanIcon />, tooltip: 'Pan image' },
    { id: 'Zoom', label: 'Zoom', icon: <ZoomIcon />, tooltip: 'Zoom in/out' },
    { id: 'Length', label: 'Measure', icon: <LengthIcon />, tooltip: 'Measure distance' },
  ];

  const handleToolClick = function(toolId) {
    if (onToolChange) {
      onToolChange(toolId);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* Tool selection */}
      <ButtonGroup variant="outlined" size="small">
        {tools.map(function(tool) {
          return (
            <Tooltip key={tool.id} title={tool.tooltip} arrow>
              <Button
                variant={activeTool === tool.id ? 'contained' : 'outlined'}
                onClick={() => handleToolClick(tool.id)}
                startIcon={tool.icon}
                sx={{ minWidth: 100 }}
              >
                {tool.label}
              </Button>
            </Tooltip>
          );
        })}
        {totalImages > 1 && (
          <Button
            variant="outlined"
            disabled
            sx={{
              minWidth: 120,
              color: 'text.primary !important',
              borderColor: 'divider',
            }}
          >
            Image {currentImage} / {totalImages}
          </Button>
        )}
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Reset view" arrow>
          <IconButton
            size="small"
            onClick={onReset}
            color="primary"
          >
            <ResetIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Take screenshot" arrow>
          <IconButton
            size="small"
            onClick={onScreenshot}
            color="primary"
          >
            <ScreenshotIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Active tool indicator */}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'success.main',
          }}
        />
        <Box sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
          Active: {tools.find(function(t) { return t.id === activeTool; })?.label || activeTool}
        </Box>
      </Box>
    </Box>
  );
}

export default Toolbar;
