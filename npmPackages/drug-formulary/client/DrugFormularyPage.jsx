// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/drug-formulary/client/DrugFormularyPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Avatar,
  Tooltip,
  Alert,
  AlertTitle,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Collapse
} from '@mui/material';

import {
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Assignment as FormularyIcon,
  Security as CoverageIcon,
  AccountBalance as TierIcon,
  LocalOffer as GenericIcon,
  Verified as BrandIcon,
  MedicalServices as SpecialtyIcon,
  Schedule as PriorAuthIcon,
  AttachMoney as CopayIcon,
  Percent as CoinsuranceIcon
} from '@mui/icons-material';

import moment from 'moment';

// ONC 170.315(a)(10) Drug-formulary and preferred drug list checks
// Tufte-inspired information-dense design with layered disclosure
function DrugFormularyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // name, rxnorm, ndc
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [expandedDrug, setExpandedDrug] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, table, compare
  
  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  
  // Mock formulary data - in production this would come from FHIR resources
  const mockFormularyData = [
    {
      id: '1',
      rxnorm: '197361',
      ndc: '0378-0180-01',
      name: 'Atorvastatin 20 MG Oral Tablet',
      brandName: 'Lipitor',
      isGeneric: true,
      tier: 'tier1',
      tierLabel: 'Generic',
      copay: 10,
      coinsurance: 0,
      priorAuth: false,
      stepTherapy: false,
      quantityLimit: '90 per 30 days',
      specialtyDrug: false,
      mailOrder: true,
      alternatives: [
        { name: 'Rosuvastatin 10 MG', tier: 'tier1', copay: 10 },
        { name: 'Simvastatin 20 MG', tier: 'tier1', copay: 5 }
      ],
      plans: ['plan1', 'plan2', 'plan3']
    },
    {
      id: '2',
      rxnorm: '847230',
      ndc: '0002-3227-30',
      name: 'Insulin Glargine 100 UNT/ML Injectable Solution',
      brandName: 'Lantus',
      isGeneric: false,
      tier: 'tier3',
      tierLabel: 'Preferred Brand',
      copay: 45,
      coinsurance: 30,
      priorAuth: true,
      stepTherapy: false,
      quantityLimit: '10 ML per 30 days',
      specialtyDrug: false,
      mailOrder: true,
      alternatives: [
        { name: 'Insulin Detemir', tier: 'tier3', copay: 45 },
        { name: 'Insulin NPH', tier: 'tier1', copay: 15 }
      ],
      plans: ['plan1', 'plan2']
    },
    {
      id: '3',
      rxnorm: '1361615',
      ndc: '50090-2883-00',
      name: 'Humira 40 MG/0.4 ML Pen Injector',
      brandName: 'Humira',
      isGeneric: false,
      tier: 'specialty',
      tierLabel: 'Specialty',
      copay: 250,
      coinsurance: 40,
      priorAuth: true,
      stepTherapy: true,
      quantityLimit: '2 pens per 28 days',
      specialtyDrug: true,
      mailOrder: false,
      alternatives: [
        { name: 'Enbrel', tier: 'specialty', copay: 250 },
        { name: 'Rinvoq', tier: 'specialty', copay: 300 }
      ],
      plans: ['plan1']
    },
    {
      id: '4',
      rxnorm: '311354',
      ndc: '0093-0150-01',
      name: 'Metformin HCl 500 MG Oral Tablet',
      brandName: 'Glucophage',
      isGeneric: true,
      tier: 'tier1',
      tierLabel: 'Generic',
      copay: 4,
      coinsurance: 0,
      priorAuth: false,
      stepTherapy: false,
      quantityLimit: '180 per 30 days',
      specialtyDrug: false,
      mailOrder: true,
      alternatives: [],
      plans: ['plan1', 'plan2', 'plan3']
    },
    {
      id: '5',
      rxnorm: '731370',
      ndc: '0173-0829-00',
      name: 'Eliquis 5 MG Oral Tablet',
      brandName: 'Eliquis',
      isGeneric: false,
      tier: 'tier4',
      tierLabel: 'Non-Preferred Brand',
      copay: 90,
      coinsurance: 50,
      priorAuth: true,
      stepTherapy: true,
      quantityLimit: '60 per 30 days',
      specialtyDrug: false,
      mailOrder: true,
      alternatives: [
        { name: 'Warfarin', tier: 'tier1', copay: 4 },
        { name: 'Xarelto', tier: 'tier4', copay: 90 }
      ],
      plans: ['plan2', 'plan3']
    }
  ];

  const insurancePlans = [
    { id: 'plan1', name: 'Blue Shield PPO Gold', type: 'PPO', premium: 450 },
    { id: 'plan2', name: 'Aetna HMO Silver', type: 'HMO', premium: 325 },
    { id: 'plan3', name: 'Kaiser Bronze', type: 'HMO', premium: 275 }
  ];

  // Filter drugs based on search criteria
  const filteredDrugs = mockFormularyData.filter(drug => {
    let matchesSearch = true;
    if (searchTerm) {
      switch (searchType) {
        case 'rxnorm':
          matchesSearch = drug.rxnorm.includes(searchTerm);
          break;
        case 'ndc':
          matchesSearch = drug.ndc.includes(searchTerm);
          break;
        default:
          matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.brandName.toLowerCase().includes(searchTerm.toLowerCase());
      }
    }
    
    const matchesPlan = selectedPlan === 'all' || drug.plans.includes(selectedPlan);
    const matchesTier = tierFilter === 'all' || drug.tier === tierFilter;
    
    return matchesSearch && matchesPlan && matchesTier;
  });

  const getTierColor = (tier) => {
    switch (tier) {
      case 'tier1': return 'success';
      case 'tier2': return 'info';
      case 'tier3': return 'warning';
      case 'tier4': return 'error';
      case 'specialty': return 'secondary';
      default: return 'default';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'tier1': return <Typography variant="caption" sx={{ fontWeight: 600 }}>$</Typography>;
      case 'tier2': return <Typography variant="caption" sx={{ fontWeight: 600 }}>$$</Typography>;
      case 'tier3': return <Typography variant="caption" sx={{ fontWeight: 600 }}>$$$</Typography>;
      case 'tier4': return <Typography variant="caption" sx={{ fontWeight: 600 }}>$$$$</Typography>;
      case 'specialty': return <SpecialtyIcon fontSize="small" />;
      default: return null;
    }
  };

  // Calculate total monthly cost for a drug
  const calculateMonthlyCost = (drug) => {
    const baseCost = drug.copay || 0;
    const coinsuranceAmount = drug.coinsurance ? (baseCost * drug.coinsurance / 100) : 0;
    return baseCost + coinsuranceAmount;
  };

  // Small multiple visualization for cost comparison across plans
  const CostComparisonChart = ({ drug }) => (
    <Grid container spacing={1}>
      {insurancePlans.map(plan => {
        const isAvailable = drug.plans.includes(plan.id);
        const monthlyCost = isAvailable ? calculateMonthlyCost(drug) : null;
        
        return (
          <Grid item xs={4} key={plan.id}>
            <Box sx={{ 
              p: 1, 
              border: 1, 
              borderColor: isAvailable ? 'divider' : 'error.light',
              borderRadius: 1,
              bgcolor: isAvailable ? 'background.paper' : 'grey.50',
              opacity: isAvailable ? 1 : 0.5
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {plan.name.split(' ')[0]}
              </Typography>
              <Typography variant="h6">
                {isAvailable ? `$${monthlyCost}` : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                /month
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with certification info */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs>
                  <Typography variant="h5" gutterBottom>
                    Drug Formulary & Preferred Drug List
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ONC §170.315(a)(10) Compliant • DaVinci PDEx Formulary • Real-time Coverage
                  </Typography>
                </Grid>
                <Grid item>
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      label={`${mockFormularyData.length} Drugs`}
                      color="primary"
                      size="small"
                    />
                    <Chip 
                      label={`${insurancePlans.length} Plans`}
                      color="secondary"
                      size="small"
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: 1, borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Search Drugs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Search By</InputLabel>
              <Select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                label="Search By"
              >
                <MenuItem value="name">Drug Name</MenuItem>
                <MenuItem value="rxnorm">RxNorm Code</MenuItem>
                <MenuItem value="ndc">NDC</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Insurance Plan</InputLabel>
              <Select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                label="Insurance Plan"
              >
                <MenuItem value="all">All Plans</MenuItem>
                {insurancePlans.map(plan => (
                  <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Cost Tier</InputLabel>
              <Select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                label="Cost Tier"
              >
                <MenuItem value="all">All Tiers</MenuItem>
                <MenuItem value="tier1">Tier 1 - Generic</MenuItem>
                <MenuItem value="tier2">Tier 2 - Preferred</MenuItem>
                <MenuItem value="tier3">Tier 3 - Non-Preferred</MenuItem>
                <MenuItem value="tier4">Tier 4 - Highest</MenuItem>
                <MenuItem value="specialty">Specialty</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="grid">Grid</ToggleButton>
              <ToggleButton value="table">Table</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Prior Authorization Alert */}
      {filteredDrugs.some(d => d.priorAuth) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Prior Authorization Required</AlertTitle>
          Some medications in your search require prior authorization. Contact your provider for approval.
        </Alert>
      )}

      {/* Drug Grid View - Tufte small multiples */}
      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredDrugs.map((drug) => (
            <Grid item xs={12} md={6} key={drug.id}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 2 }}>
                  {/* Drug Header */}
                  <Grid container alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: drug.isGeneric ? 'success.light' : 'primary.light' 
                        }}>
                          {drug.isGeneric ? <GenericIcon fontSize="small" /> : <BrandIcon fontSize="small" />}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {drug.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {drug.brandName}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              RxNorm: {drug.rxnorm}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item>
                      <Chip 
                        label={drug.tierLabel}
                        color={getTierColor(drug.tier)}
                        size="small"
                        icon={getTierIcon(drug.tier)}
                      />
                    </Grid>
                  </Grid>

                  {/* Cost and Coverage Info - Information Dense Display */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CopayIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            Copay: <strong>${drug.copay}</strong>
                          </Typography>
                        </Stack>
                        {drug.coinsurance > 0 && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CoinsuranceIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              Coinsurance: <strong>{drug.coinsurance}%</strong>
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack spacing={0.5}>
                        {drug.priorAuth && (
                          <Chip 
                            label="Prior Auth Required" 
                            color="warning" 
                            size="small"
                            icon={<PriorAuthIcon />}
                          />
                        )}
                        {drug.stepTherapy && (
                          <Chip 
                            label="Step Therapy" 
                            color="info" 
                            size="small"
                            icon={<WarningIcon />}
                          />
                        )}
                        {drug.specialtyDrug && (
                          <Chip 
                            label="Specialty Drug" 
                            color="secondary" 
                            size="small"
                            icon={<SpecialtyIcon />}
                          />
                        )}
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Quantity Limits */}
                  {drug.quantityLimit && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Quantity Limit: {drug.quantityLimit}
                    </Typography>
                  )}

                  {/* Cost Comparison Small Multiples */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                      Cost Across Plans
                    </Typography>
                    <CostComparisonChart drug={drug} />
                  </Box>

                  {/* Alternatives Section */}
                  {drug.alternatives.length > 0 && (
                    <Box>
                      <Button
                        size="small"
                        onClick={() => setExpandedDrug(expandedDrug === drug.id ? null : drug.id)}
                        endIcon={expandedDrug === drug.id ? <CollapseIcon /> : <ExpandIcon />}
                      >
                        View Alternatives ({drug.alternatives.length})
                      </Button>
                      <Collapse in={expandedDrug === drug.id}>
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          {drug.alternatives.map((alt, idx) => (
                            <Stack 
                              key={idx} 
                              direction="row" 
                              justifyContent="space-between" 
                              alignItems="center"
                              sx={{ py: 0.5 }}
                            >
                              <Typography variant="caption">{alt.name}</Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip 
                                  label={alt.tier.replace('tier', 'Tier ')} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  ${alt.copay}
                                </Typography>
                              </Stack>
                            </Stack>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Table View - Dense Information Display */
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme => theme.palette.grey[50] }}>
                <TableCell sx={{ fontWeight: 600 }}>Drug Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>RxNorm</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Copay</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Coinsurance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Requirements</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Quantity Limit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plans</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrugs.map((drug) => (
                <TableRow key={drug.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {drug.isGeneric ? <GenericIcon fontSize="small" color="success" /> : <BrandIcon fontSize="small" color="primary" />}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {drug.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {drug.brandName}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {drug.rxnorm}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={drug.isGeneric ? 'Generic' : 'Brand'} 
                      size="small"
                      color={drug.isGeneric ? 'success' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={drug.tierLabel}
                      color={getTierColor(drug.tier)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${drug.copay}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {drug.coinsurance > 0 ? `${drug.coinsurance}%` : '-'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {drug.priorAuth && (
                        <Chip label="PA" size="small" color="warning" />
                      )}
                      {drug.stepTherapy && (
                        <Chip label="ST" size="small" color="info" />
                      )}
                      {drug.specialtyDrug && (
                        <Chip label="SP" size="small" color="secondary" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {drug.quantityLimit || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {drug.plans.map(planId => {
                        const plan = insurancePlans.find(p => p.id === planId);
                        return (
                          <Tooltip key={planId} title={plan?.name}>
                            <Chip 
                              label={plan?.name.split(' ')[0]} 
                              size="small" 
                              variant="outlined"
                            />
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Legend/Key */}
      <Paper elevation={0} sx={{ mt: 3, p: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>Key</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Cost Tiers</Typography>
              {['tier1', 'tier2', 'tier3', 'tier4', 'specialty'].map(tier => (
                <Stack key={tier} direction="row" spacing={1} alignItems="center">
                  <Chip 
                    label={getTierIcon(tier)} 
                    size="small" 
                    color={getTierColor(tier)}
                    sx={{ width: 40 }}
                  />
                  <Typography variant="caption">
                    {tier === 'tier1' ? 'Generic' :
                     tier === 'tier2' ? 'Preferred Brand' :
                     tier === 'tier3' ? 'Non-Preferred Brand' :
                     tier === 'tier4' ? 'Highest Cost' : 'Specialty'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Requirements</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label="PA" size="small" color="warning" />
                <Typography variant="caption">Prior Authorization</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label="ST" size="small" color="info" />
                <Typography variant="caption">Step Therapy</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label="SP" size="small" color="secondary" />
                <Typography variant="caption">Specialty Drug</Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Drug Types</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <GenericIcon fontSize="small" color="success" />
                <Typography variant="caption">Generic Available</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <BrandIcon fontSize="small" color="primary" />
                <Typography variant="caption">Brand Name</Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Coverage</Typography>
              <Typography variant="caption">
                Costs shown are estimates. Contact your plan for exact coverage details.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mail order may offer additional savings for maintenance medications.
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default DrugFormularyPage;