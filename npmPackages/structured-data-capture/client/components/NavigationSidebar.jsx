// npmPackages/structured-data-capture/client/components/NavigationSidebar.jsx
//
// SDC CONSOLE section manifest — sticky nav over the questionnaire's sections
// with mono labels, square completion glyphs, accent required markers, and a
// scroll-spy active rail (activeLinkId supplied by QuestionnaireForm). All
// colors ride the .sdc-console vars; legacy color props remain accepted for
// caller compatibility but are not the styling backbone.

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton
} from '@mui/material';
import { get } from 'lodash';
import { QuestionnaireUtils } from '../../lib/QuestionnaireUtils';
import { Brackets } from '../consoleTheme';

export function NavigationSidebar(props) {
  const {
    items = [],
    response,
    onNavigate,
    activeLinkId = null,
    sticky = true,
    maxHeight = '80vh',
    // Legacy theming props — accepted, superseded by console vars
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
        currentSection = { ...item, children: [] };
        sectionList.push(currentSection);
      } else if (currentSection && item.depth > 0) {
        currentSection.children.push(item);
      } else {
        sectionList.push({ ...item, children: [] });
      }
    });

    return sectionList;
  }, [navigationItems]);

  const renderNavItem = function(item, indent = 0) {
    const disabled = !item.isEnabled;
    const active = item.linkId === activeLinkId;

    // Completion glyph: groups show a fraction-style dash, questions show ■/□
    const glyph = item.isGroup ? '▸' : (item.hasAnswer ? '■' : '□');
    const glyphColor = item.isGroup
      ? 'var(--stone)'
      : (item.hasAnswer ? 'var(--green)' : 'var(--stone-dim)');

    return (
      <ListItem key={item.linkId} disablePadding>
        <ListItemButton
          onClick={() => onNavigate(item.linkId)}
          disabled={disabled}
          dense
          sx={{
            pl: 1.5 + indent,
            py: 0.5,
            borderLeft: '2px solid ' + (active ? 'var(--accent)' : 'transparent'),
            transition: 'border-color 0.18s ease, background 0.18s ease',
            '&:hover': {
              background: 'color-mix(in srgb, var(--accent) 6%, transparent)'
            }
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: 'var(--mono)',
              fontSize: item.isGroup ? '10px' : '11px',
              minWidth: 18,
              color: glyphColor,
              lineHeight: 1.6
            }}
          >
            {glyph}
          </Box>
          <Typography
            component="span"
            noWrap
            sx={{
              fontFamily: item.isGroup ? 'var(--display)' : 'var(--mono)',
              fontSize: item.isGroup ? '12px' : '11px',
              letterSpacing: item.isGroup ? '0.08em' : '0.04em',
              textTransform: item.isGroup ? 'uppercase' : 'none',
              color: disabled
                ? 'var(--ink-dim)'
                : (active ? 'var(--ink)' : (item.isGroup ? 'var(--ink)' : 'var(--stone)')),
              textDecoration: disabled ? 'line-through' : 'none',
              flexGrow: 1
            }}
          >
            {item.text}
          </Typography>
          {item.required && !item.hasAnswer && (
            <Box
              component="span"
              title="Required"
              sx={{ color: 'var(--accent)', fontSize: '10px', ml: 0.5, lineHeight: 1 }}
            >
              ●
            </Box>
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box
      className="sdc-boot"
      sx={{
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 20 : 0,
        maxHeight,
        overflow: 'auto',
        bgcolor: 'var(--panel)',
        border: '1px solid var(--hairline)',
        color: 'var(--ink)'
      }}
    >
      <Brackets />
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography
          component="div"
          sx={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.28em',
            color: 'var(--stone)'
          }}
        >
          SECTION MANIFEST
        </Typography>
      </Box>

      <Box sx={{ height: '1px', bgcolor: 'var(--hairline)', mx: 2 }} className="sdc-rule" />

      <List dense sx={{ py: 1 }}>
        {sections.map(function(section, sectionIndex) {
          if (section.isGroup) {
            return (
              <React.Fragment key={section.linkId}>
                {sectionIndex > 0 && (
                  <Box sx={{ height: '1px', bgcolor: 'var(--hairline)', mx: 2, my: 1, opacity: 0.6 }} />
                )}
                {renderNavItem(section)}
                {section.children.map(child => renderNavItem(child, 2))}
              </React.Fragment>
            );
          } else {
            return renderNavItem(section);
          }
        })}
      </List>
    </Box>
  );
}
