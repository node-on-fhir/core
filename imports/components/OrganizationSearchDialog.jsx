// imports/components/OrganizationSearchDialog.jsx

import React, { useState, useEffect } from 'react';

import {
  TextField,
  InputAdornment,
  IconButton,
  DialogContent,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import PropTypes from 'prop-types';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import OrganizationsTable from '/imports/ui-fhir/organizations/OrganizationsTable';

// Get the Organizations collection
let Organizations;
let useAppTheme;
Meteor.startup(function(){
  if (Meteor.Collections?.Organizations) {
    Organizations = Meteor.Collections.Organizations;
  }
  useAppTheme = Meteor.useTheme;
});

function OrganizationSearchDialog(props){
  let {
    defaultSearchTerm,
    onSelect,
    hideFhirBarcode,
    ...otherProps
  } = props;

  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(defaultSearchTerm || '');

  // Debounce the search term
  useEffect(function() {
    const timer = setTimeout(function() {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return function() { clearTimeout(timer); };
  }, [searchTerm]);

  // Subscribe to organizations data with search query
  const isReady = useTracker(function(){
    let query = {};
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      const searchPattern = debouncedSearchTerm.trim();
      query = {
        $or: [
          {'name': {$regex: searchPattern, $options: 'i'}},
          {'type.0.coding.0.display': {$regex: searchPattern, $options: 'i'}},
          {'address.0.city': {$regex: searchPattern, $options: 'i'}}
        ]
      };
    }

    const handle = Meteor.subscribe('autopublish.Organizations', query, { limit: 100 });
    return handle.ready();
  }, [debouncedSearchTerm]);

  let organizations = useTracker(function(){
    if (!Organizations || !isReady) return [];

    let searchQuery = {};
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      const searchRegex = new RegExp(debouncedSearchTerm.trim(), 'i');
      searchQuery = {
        $or: [
          {'name': {$regex: searchRegex}},
          {'type.0.coding.0.display': {$regex: searchRegex}},
          {'address.0.city': {$regex: searchRegex}}
        ]
      };
    }

    return Organizations.find(searchQuery).fetch();
  }, [debouncedSearchTerm, isReady]);

  function changeInput(event){
    setSearchTerm(event.target.value);
  }

  function handleFilterOrganizations(event){
    console.log('handleFilterOrganizations', searchTerm);
  }

  return (
    <DialogContent dividers sx={{
      minHeight: '650px',
      bgcolor: cardBgColor,
      color: cardTextColor,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      '& .MuiTextField-root': {
        '& .MuiInputBase-root': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
        },
        '& .MuiInputBase-input::placeholder': {
          color: textSecondary,
          opacity: 1
        }
      },
      '& .MuiIconButton-root': { color: cardTextColor },
      '& .MuiTableCell-root': {
        color: cardTextColor,
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
      },
      '& .MuiTableHead-root .MuiTableCell-root': {
        bgcolor: isDark ? '#2a2a2a' : '#f5f5f5'
      },
      '& .MuiTablePagination-root': { color: cardTextColor },
      '& .MuiTablePagination-selectLabel': { color: cardTextColor },
      '& .MuiTablePagination-displayedRows': { color: cardTextColor },
      '& .MuiTablePagination-selectIcon': { color: cardTextColor }
    }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          id="organizationSearchField"
          placeholder="Search by organization name, type, or city..."
          onChange={changeInput}
          value={searchTerm}
          fullWidth
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="search organizations"
                  onClick={handleFilterOrganizations}
                  edge="end"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {!isReady ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      ) : organizations.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Typography variant="h6" sx={{ color: textSecondary }}>
            {searchTerm ? 'No organizations found matching your search' : 'No organizations available'}
          </Typography>
        </Box>
      ) : (
        <OrganizationsTable
          hideActionIcons={true}
          hideCheckbox={true}
          hideIdentifier={true}
          hideActive={true}
          hidePhone={true}
          hideEmail={true}
          hideAddressLine={true}
          hideCity={false}
          hideState={false}
          hidePostalCode={true}
          hideCountry={true}
          hideBarcode={hideFhirBarcode !== false}
          organizations={organizations}
          paginationCount={organizations.length}
          rowsPerPage={10}
          onRowClick={function(selectedOrgId){
            console.log('OrganizationSearchDialog.OrganizationsTable.onRowClick', selectedOrgId);

            if(typeof onSelect === "function"){
              const foundOrg = organizations.find(function(o) {
                const orgId = typeof o._id === 'object' && o._id._str ? o._id._str : String(o._id);
                return orgId === selectedOrgId;
              });
              console.log('OrganizationSearchDialog found org:', foundOrg);
              if (foundOrg) {
                onSelect(selectedOrgId, foundOrg);
              } else {
                onSelect(selectedOrgId);
              }
            }
          }}
        />
      )}
    </DialogContent>
  );
}

OrganizationSearchDialog.propTypes = {
  hideFhirBarcode: PropTypes.bool,
  defaultSearchTerm: PropTypes.string,
  onSelect: PropTypes.func
};

OrganizationSearchDialog.defaultProps = {
  defaultSearchTerm: "",
  hideFhirBarcode: true
};

export default OrganizationSearchDialog;
