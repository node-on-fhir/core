// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/NavigationSidebar.jsx

import React, { useMemo } from 'react';
import { 
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material';
import {
  RadioButtonUnchecked as EmptyIcon,
  CheckCircle as FilledIcon,
  FolderOpen as GroupIcon,
  Article as DisplayIcon
} from '@mui/icons-material';
import { get, isArray } from 'lodash';
import { QuestionnaireUtils } from '../../lib/QuestionnaireUtils';

export function NavigationSidebar(props) {
  const {
    items = [],
    response,
    onNavigate,
    sticky = true,
    maxHeight = '80vh',
    // Dark mode theming props
    isDark = false,
    cardBgColor = '#ffffff',
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    paperBgColor = '#ffffff',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  // Build navigation structure
  const navigationItems = useMemo(function() {
    const navItems = [];
    
    items.forEach(function(item) {
      const linkId = get(item, 'linkId');
      const type = get(item, 'type');
      const text = get(item, 'text');
      const depth = get(item, '_depth', 0);
      const required = get(item, 'required', false);
      
      // Skip display items in navigation
      if (type === 'display') return;
      
      // Check if item has answer
      const responseItem = QuestionnaireUtils.findResponseItemByLinkId(response, linkId);
      const hasAnswer = responseItem && get(responseItem, 'answer.length', 0) > 0;
      const isEnabled = QuestionnaireUtils.isItemEnabled(item, response);
      
      navItems.push({
        linkId,
        type,
        text,
        depth,
        required,
        hasAnswer,
        isEnabled,
        isGroup: type === 'group'
      });
    });
    
    return navItems;
  }, [items, response]);

  // Group items by section
  const sections = useMemo(function() {
    const sectionList = [];
    let currentSection = null;
    
    navigationItems.forEach(function(item) {
      if (item.depth === 0 && item.isGroup) {
        // Start new section
        currentSection = {
          ...item,
          children: []
        };
        sectionList.push(currentSection);
      } else if (currentSection && item.depth > 0) {
        // Add to current section
        currentSection.children.push(item);
      } else {
        // Top-level non-group item
        sectionList.push({
          ...item,
          children: []
        });
      }
    });
    
    return sectionList;
  }, [navigationItems]);

  const getIcon = function(item) {
    if (item.isGroup) return <GroupIcon />;
    if (item.hasAnswer) return <FilledIcon color="success" />;
    return <EmptyIcon />;
  };

  const renderNavItem = function(item, indent = 0) {
    const disabled = !item.isEnabled;
    const disabledColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.38)';
    const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

    return (
      <ListItem
        key={item.linkId}
        disablePadding
        sx={{ pl: indent }}
      >
        <ListItemButton
          onClick={() => onNavigate(item.linkId)}
          disabled={disabled}
          dense
          sx={{ '&:hover': { bgcolor: hoverBgColor } }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: cardTextColor }}>
            {getIcon(item)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: disabled ? 'line-through' : 'none',
                    color: disabled ? disabledColor : cardTextColor
                  }}
                  noWrap
                >
                  {item.text}
                </Typography>
                {item.required && !item.hasAnswer && (
                  <Chip
                    label="Required"
                    size="small"
                    color="error"
                    sx={{ height: 16, fontSize: '0.625rem' }}
                  />
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 20 : 0,
        maxHeight,
        overflow: 'auto',
        bgcolor: paperBgColor,
        color: cardTextColor
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: cardTextColor }}>
          Navigation
        </Typography>
        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
          Click to jump to section
        </Typography>
      </Box>

      <Divider sx={{ borderColor: borderColor }} />

      <List dense>
        {sections.map(function(section, sectionIndex) {
          if (section.isGroup) {
            return (
              <React.Fragment key={section.linkId}>
                {sectionIndex > 0 && <Divider sx={{ my: 1, borderColor: borderColor }} />}
                {renderNavItem(section)}
                {section.children.map(child => renderNavItem(child, 2))}
              </React.Fragment>
            );
          } else {
            return renderNavItem(section);
          }
        })}
      </List>
    </Paper>
  );
}