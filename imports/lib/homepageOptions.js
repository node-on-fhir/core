// imports/lib/homepageOptions.js
//
// Settings-driven homepage options for the workspace-preference surfaces
// (SelectHomepageDialog, WorkspacePreferencesCard):
//   settings.public.preferences.homepageOptions = [{ label, path, iconName }]
// The icon map is local — the repo has no shared iconName→component mapper.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ListAltIcon from '@mui/icons-material/ListAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardIcon from '@mui/icons-material/Dashboard';

const ICON_MAP = {
  MenuBook: MenuBookIcon,
  ListAlt: ListAltIcon,
  Visibility: VisibilityIcon,
  Dashboard: DashboardIcon
};

export function getHomepageOptions() {
  const options = get(Meteor, 'settings.public.preferences.homepageOptions', []);
  if (!Array.isArray(options)) {
    return [];
  }
  return options.filter(function(option) {
    return option && typeof option.path === 'string' && typeof option.label === 'string';
  });
}

export function resolveHomepageIcon(iconName) {
  return ICON_MAP[iconName] || DashboardIcon;
}
