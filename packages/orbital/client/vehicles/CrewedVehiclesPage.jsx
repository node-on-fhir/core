// packages/orbital/client/vehicles/CrewedVehiclesPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Dark theme support - access Honeycomb's custom theme hook
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CardActions,
  Button,
  TextField,
  Typography,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Divider
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BadgeIcon from '@mui/icons-material/Badge';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ExploreIcon from '@mui/icons-material/Explore';
import SpeedIcon from '@mui/icons-material/Speed';
import AirIcon from '@mui/icons-material/Air';
import { get } from 'lodash';

import { CrewedVehicles } from '../../lib/CrewedVehicles';
import { flattenCrewedVehicle, getDeviceProperty } from '../../lib/VehicleDehydrator';
import CrewedVehiclesTable from './CrewedVehiclesTable';

/**
 * Convert camelCase property name to Title Case display label.
 * e.g. "pressurizedVolume" → "Pressurized Volume"
 */
function camelToTitleCase(str) {
  if (!str) return '';
  const result = str.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Extract display value from a FHIR Device property entry.
 */
function getPropertyDisplayValue(prop) {
  // valueQuantity (can be array or object)
  const qtyValue = get(prop, 'valueQuantity.0.value', get(prop, 'valueQuantity.value'));
  if (qtyValue !== undefined) {
    const unit = get(prop, 'valueQuantity.0.unit', get(prop, 'valueQuantity.unit', ''));
    return unit ? qtyValue + ' ' + unit : String(qtyValue);
  }

  // valueCodeableConcept
  const conceptText = get(prop, 'valueCodeableConcept.0.text', get(prop, 'valueCodeableConcept.text'));
  if (conceptText) return conceptText;
  const conceptDisplay = get(prop, 'valueCodeableConcept.0.coding.0.display', get(prop, 'valueCodeableConcept.coding.0.display'));
  if (conceptDisplay) return conceptDisplay;

  // valueBoolean
  const boolVal = get(prop, 'valueBoolean');
  if (boolVal !== undefined) {
    if (Array.isArray(boolVal) && boolVal.length > 0) return String(boolVal[0]);
    return String(boolVal);
  }

  // valueCode
  const codeVal = get(prop, 'valueCode');
  if (codeVal !== undefined) {
    if (Array.isArray(codeVal) && codeVal.length > 0) return String(codeVal[0].value || codeVal[0]);
    return String(codeVal);
  }

  return '';
}

// Session defaults
Session.setDefault('selectedCrewedVehicleId', false);
Session.setDefault('crewedVehicleSearchFilter', '');
Session.setDefault('CrewedVehiclesPage.sortAscending', false);
Session.setDefault('CrewedVehiclesPage.showSystemId', false);

function CrewedVehiclesPage() {
  // Use Meteor.useNavigate to work within package context
  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : function() { console.warn('useNavigate not available'); };

  // Use Meteor.useLocation to read URL query params
  const useLocation = Meteor.useLocation;
  const location = useLocation ? useLocation() : { search: '' };

  // Dark theme support
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  // Local state
  const [searchFilter, setSearchFilter] = useState('');
  const [sortAscending, setSortAscending] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [viewMode, setViewMode] = useState(2);
  const [tagFilter, setTagFilter] = useState('all');

  // Subscribe to vehicles
  const isLoading = useTracker(function() {
    let query = {};

    if (searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          { '_id': searchFilter },
          { 'id': searchFilter },
          { 'deviceName.0.name': { $regex: searchFilter, $options: 'i' } },
          { 'manufacturer': { $regex: searchFilter, $options: 'i' } },
          { 'modelNumber': { $regex: searchFilter, $options: 'i' } },
          { 'serialNumber': { $regex: searchFilter, $options: 'i' } },
          { 'extension.tags': { $regex: searchFilter, $options: 'i' } }
        ]
      };
    }

    const handle = Meteor.subscribe('autopublish.CrewedVehicles', query, { limit: 100 });
    return !handle.ready();
  }, [searchFilter]);

  // Get vehicles from collection
  const vehicles = useTracker(function() {
    const sortDirection = sortAscending ? 1 : -1;
    let query = {};
    if (tagFilter === 'artemis') {
      query['meta.tag.code'] = { $regex: /^artemis/i };
    } else if (tagFilter === 'ground-transportation') {
      query['meta.tag.code'] = { $regex: /^ground.transportation/i };
    }
    return CrewedVehicles.find(query, { sort: { '_id': sortDirection } }).fetch();
  }, [sortAscending, tagFilter]);

  // Get vehicle count
  const vehicleCount = useTracker(function() {
    return CrewedVehicles.find({}).count();
  }, []);

  // Handle URL query param for vehicle selection
  useEffect(function() {
    if (vehicles.length > 0 && !selectedVehicle) {
      const searchParams = new URLSearchParams(location.search);
      const vehicleId = searchParams.get('vehicle');
      if (vehicleId) {
        const vehicle = vehicles.find(function(v) {
          const flatV = flattenCrewedVehicle(v);
          return flatV._id === vehicleId;
        });
        if (vehicle) {
          setSelectedVehicle(vehicle);
        }
      }
    }
  }, [vehicles, location.search]);

  // Reset image error when selected vehicle changes
  useEffect(function() {
    setImageError(false);
  }, [selectedVehicle]);

  // Handle row click - select vehicle for preview
  function handleRowClick(vehicleId) {
    // Find in already-fetched vehicles array instead of re-querying
    const vehicle = vehicles.find(function(v) {
      const flatV = flattenCrewedVehicle(v);
      return flatV._id === vehicleId;
    });
    if (vehicle) {
      setSelectedVehicle(vehicle);
      // Update URL with vehicle ID for bookmarking
      navigate('/vehicle-catalog?vehicle=' + vehicleId, { replace: true });
    } else {
      console.warn('[handleRowClick] Vehicle not found:', vehicleId);
    }
  }

  // Handle add new vehicle
  function handleAddVehicle() {
    navigate('/vehicle-catalog/new');
  }

  // Handle view details
  function handleViewDetails() {
    if (selectedVehicle) {
      navigate('/vehicle-catalog/' + selectedVehicle._id);
    }
  }

  // Handle edit
  function handleEdit() {
    if (selectedVehicle) {
      navigate('/vehicle-catalog/' + selectedVehicle._id);
    }
  }

  // Get flattened vehicle for display
  const flatVehicle = selectedVehicle ? flattenCrewedVehicle(selectedVehicle) : null;

  // Build theme-aware image path using vehicle id
  const themeVariant = isDark ? 'dark' : 'light';
  const imagePath = selectedVehicle?.id
    ? `/packages/orbital_core/assets/${selectedVehicle.id}.${themeVariant}.jpg`
    : null;

  return (
    <Box id="crewedVehiclesPage" sx={{ width: '80%', maxWidth: '80%', mx: 'auto', py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RocketLaunchIcon />
              Crewed Vehicles
              <Chip label={vehicleCount} size="small" sx={{
                ml: 1,
                color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
                bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)'
              }} />
              <Chip
                label="All"
                size="small"
                variant={tagFilter === 'all' ? 'filled' : 'filled'}
                onClick={() => setTagFilter('all')}
                sx={{
                  ml: 1,
                  cursor: 'pointer',
                  ...(tagFilter === 'all'
                    ? {
                        color: isDark ? '#fff' : undefined,
                        border: isDark ? '1px solid rgba(255,255,255,0.5)' : undefined
                      }
                    : {
                        bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
                        color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
                      })
                }}
              />
              <Chip
                label="Artemis"
                size="small"
                variant={tagFilter === 'artemis' ? 'filled' : 'filled'}
                onClick={() => setTagFilter('artemis')}
                sx={{
                  cursor: 'pointer',
                  ...(tagFilter === 'artemis'
                    ? {
                        color: isDark ? '#fff' : undefined,
                        border: isDark ? '1px solid rgba(255,255,255,0.5)' : undefined
                      }
                    : {
                        bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
                        color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
                      })
                }}
              />
              <Chip
                label="Ground Transportation"
                size="small"
                variant={tagFilter === 'ground-transportation' ? 'filled' : 'filled'}
                onClick={() => setTagFilter('ground-transportation')}
                sx={{
                  cursor: 'pointer',
                  ...(tagFilter === 'ground-transportation'
                    ? {
                        color: isDark ? '#fff' : undefined,
                        border: isDark ? '1px solid rgba(255,255,255,0.5)' : undefined
                      }
                    : {
                        bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
                        color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
                      })
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {/* Sort toggle */}
            <ToggleButtonGroup
              value={sortAscending ? 'asc' : 'desc'}
              exclusive
              onChange={(e, value) => setSortAscending(value === 'asc')}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.54)',
                  borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.12)',
                  '&.Mui-selected': {
                    color: isDark ? '#fff' : 'rgba(0,0,0,0.87)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)'
                  }
                }
              }}
            >
              <ToggleButton value="asc" aria-label="sort ascending">
                <ArrowUpwardIcon />
              </ToggleButton>
              <ToggleButton value="desc" aria-label="sort descending">
                <ArrowDownwardIcon />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* System ID toggle */}
            <ToggleButtonGroup
              value={showSystemId ? ['systemId'] : []}
              onChange={(e, newFormats) => setShowSystemId(newFormats.includes('systemId'))}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.54)',
                  borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.12)',
                  '&.Mui-selected': {
                    color: isDark ? '#fff' : 'rgba(0,0,0,0.87)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)'
                  }
                }
              }}
            >
              <ToggleButton value="systemId" aria-label="show system id">
                <BadgeIcon />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* 1-up / 2-up view toggle */}
            <ToggleButtonGroup
              value={String(viewMode)}
              exclusive
              onChange={(e, val) => { if (val !== null) setViewMode(Number(val)); }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.54)',
                  borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.12)',
                  '&.Mui-selected': {
                    color: isDark ? '#fff' : 'rgba(0,0,0,0.87)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)'
                  }
                }
              }}
            >
              <ToggleButton value="1" aria-label="single column view">
                1
              </ToggleButton>
              <ToggleButton value="2" aria-label="two column view">
                2
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Add button */}
            <Button
              id="newCrewedVehicleButton"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddVehicle}
              sx={{ ml: 1 }}
            >
              Add Vehicle
            </Button>
          </Grid>
        </Grid>

        {/* Search */}
        <TextField
          id="vehicleSearchInput"
          fullWidth
          placeholder="Search by name, manufacturer, model, tags..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          sx={{
            mt: 2,
            '& .MuiInputBase-root': {
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              color: cardTextColor
            },
            '& .MuiInputBase-input': {
              color: cardTextColor,
              '&::placeholder': {
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                opacity: 1
              }
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main'
            }
          }}
        />
      </Box>

      {/* Two Column Layout */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Column - Table */}
        <Box sx={{ flex: viewMode === 1 ? '1 1 100%' : { xs: '1 1 100%', md: '0 0 60%' }, minWidth: 0 }}>
          <Card sx={{
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiTableCell-root': {
              color: cardTextColor,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
            },
            '& .MuiSelect-icon': { color: cardTextColor }
          }}>
            <CardContent sx={{ p: 0 }}>
              {isLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography>Loading vehicles...</Typography>
                </Box>
              ) : vehicles.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No vehicles found
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddVehicle}
                  >
                    Add Your First Vehicle
                  </Button>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <CrewedVehiclesTable
                    vehicles={vehicles}
                    selectedVehicleId={selectedVehicle?._id}
                    onRowClick={handleRowClick}
                    hideBarcode={!showSystemId}
                    isDark={isDark}
                    showDeviceProperties={viewMode === 1}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right Column - Preview (2-up mode only) */}
        {viewMode === 2 && (
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 40%' }, minWidth: 0 }}>
          <Card sx={{
            position: { md: 'sticky' },
            top: { md: 80 },
            bgcolor: cardBgColor,
            color: cardTextColor
          }}>
            {selectedVehicle ? (
              <>
                {imagePath && !imageError ? (
                  <CardMedia
                    component="img"
                    height="250"
                    image={imagePath}
                    alt={flatVehicle?.vehicleName || 'Vehicle'}
                    onError={() => setImageError(true)}
                    sx={{ objectFit: 'cover', bgcolor: 'background.default' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 250,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <RocketLaunchIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {flatVehicle?.vehicleName || 'Unnamed Vehicle'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {flatVehicle?.manufacturer && (
                      <Typography variant="body1">
                        <strong>Manufacturer:</strong> {flatVehicle.manufacturer}
                      </Typography>
                    )}
                    {flatVehicle?.modelNumber && (
                      <Typography variant="body1">
                        <strong>Model:</strong> {flatVehicle.modelNumber}
                      </Typography>
                    )}
                    {flatVehicle?.vehicleTypeDisplay && (
                      <Typography variant="body1">
                        <strong>Type:</strong> {flatVehicle.vehicleTypeDisplay}
                      </Typography>
                    )}
                    {flatVehicle?.crewCapacity && (
                      <Typography variant="body1">
                        <strong>Crew Capacity:</strong> {flatVehicle.crewCapacity}
                      </Typography>
                    )}
                    {flatVehicle?.missionTypeDisplay && (
                      <Typography variant="body1">
                        <strong>Mission Type:</strong> {flatVehicle.missionTypeDisplay}
                      </Typography>
                    )}
                    <Typography variant="body1">
                      <strong>Status:</strong>{' '}
                      <Chip
                        label={flatVehicle?.status || 'unknown'}
                        size="small"
                        color={flatVehicle?.status === 'active' ? 'success' : 'default'}
                        sx={flatVehicle?.status !== 'active' ? {
                          bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
                          color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
                        } : {}}
                      />
                    </Typography>
                    {Array.isArray(get(selectedVehicle, 'meta.tag')) && selectedVehicle.meta.tag.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <strong>Tags:</strong>
                        {selectedVehicle.meta.tag.map(function(tag, index) {
                          const label = get(tag, 'display') || get(tag, 'code', '');
                          return label ? (
                            <Chip
                              key={index}
                              label={label}
                              size="small"
                              sx={{
                                bgcolor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
                                color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
                              }}
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                  </Box>

                  {/* Stats Grid (extension-based, backward compat) */}
                  {(flatVehicle?.crewComplement || flatVehicle?.cargoCapacity || flatVehicle?.fuelCapacity ||
                    flatVehicle?.range || flatVehicle?.maxVelocity || flatVehicle?.lifeSupportDuration) && (
                    <>
                      <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
                      <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Vehicle Specifications
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                        {flatVehicle?.crewComplement && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PeopleIcon sx={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Crew</Typography>
                              <Typography variant="body2">{flatVehicle.crewComplement}</Typography>
                            </Box>
                          </Box>
                        )}
                        {flatVehicle?.cargoCapacity && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InventoryIcon sx={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Cargo</Typography>
                              <Typography variant="body2">{flatVehicle.cargoCapacity}</Typography>
                            </Box>
                          </Box>
                        )}
                        {flatVehicle?.fuelCapacity && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalGasStationIcon sx={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Fuel</Typography>
                              <Typography variant="body2">{flatVehicle.fuelCapacity}</Typography>
                            </Box>
                          </Box>
                        )}
                        {flatVehicle?.range && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ExploreIcon sx={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Range</Typography>
                              <Typography variant="body2">{flatVehicle.range}</Typography>
                            </Box>
                          </Box>
                        )}
                        {flatVehicle?.maxVelocity && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SpeedIcon sx={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Max Velocity</Typography>
                              <Typography variant="body2">{flatVehicle.maxVelocity}</Typography>
                            </Box>
                          </Box>
                        )}
                        {flatVehicle?.lifeSupportDuration && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AirIcon sx={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Life Support</Typography>
                              <Typography variant="body2">{flatVehicle.lifeSupportDuration}</Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </>
                  )}

                  {/* Device Properties (from FHIR property[] array) */}
                  {Array.isArray(get(selectedVehicle, 'property')) && selectedVehicle.property.length > 0 && (
                    <>
                      <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
                      <Typography variant="subtitle2" sx={{ mb: 1, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Device Properties
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {selectedVehicle.property.map(function(prop, index) {
                          const label = camelToTitleCase(get(prop, 'type.text', ''));
                          const value = getPropertyDisplayValue(prop);
                          if (!label || !value) return null;
                          return (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                                {label}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
                                {value}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ExploreIcon />}
                    sx={{ mr: 'auto' }}
                    onClick={function() {
                      Session.set('selectedCrewedVehicle', selectedVehicle);
                      Session.set('selectedCrewedVehicleId', selectedVehicle._id);
                      Session.set('selectedCrewedVehicleFhirId', selectedVehicle.id);
                      console.log('[CrewedVehiclesPage] Set dashboard vehicle:', get(selectedVehicle, 'deviceName.0.name', selectedVehicle._id));
                    }}
                  >
                    Set as Dashboard
                  </Button>
                  <Button onClick={handleViewDetails} variant="contained" disabled>
                    View Details
                  </Button>
                  <Button onClick={handleEdit} variant="outlined" disabled>
                    Edit
                  </Button>
                </CardActions>
              </>
            ) : (
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <RocketLaunchIcon sx={{
                  fontSize: 60,
                  color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)',
                  mb: 2
                }} />
                <Typography variant="h6" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                  Select a vehicle to preview
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                  Click on a row in the table to see vehicle details
                </Typography>
              </CardContent>
            )}
          </Card>
        </Box>
        )}
      </Box>
    </Box>
  );
}

export default CrewedVehiclesPage;
