// packages/drug-interactions/client/DrugInteractionCheckerPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent,
  Grid,
  TextField,
  Autocomplete,
  Button,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Stack
} from '@mui/material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { 
  DRUG_DRUG_INTERACTIONS, 
  DRUG_ALLERGY_INTERACTIONS,
  checkDrugDrugInteraction,
  checkDrugAllergyInteraction,
  getSeverityColor,
  getSeverityIcon
} from '../lib/InteractionDatabase';

// Common medications for autocomplete
const COMMON_MEDICATIONS = [
  { code: '11289', display: 'Warfarin', system: 'RxNorm' },
  { code: '3407', display: 'Digoxin', system: 'RxNorm' },
  { code: '1191', display: 'Aspirin', system: 'RxNorm' },
  { code: '5640', display: 'Ibuprofen', system: 'RxNorm' },
  { code: '723', display: 'Amoxicillin', system: 'RxNorm' },
  { code: '6902', display: 'Prednisone', system: 'RxNorm' },
  { code: '29046', display: 'Lisinopril', system: 'RxNorm' },
  { code: '36567', display: 'Simvastatin', system: 'RxNorm' },
  { code: '4603', display: 'Furosemide', system: 'RxNorm' },
  { code: '11170', display: 'Spironolactone', system: 'RxNorm' },
  { code: '703', display: 'Amiodarone', system: 'RxNorm' },
  { code: '161', display: 'Acetaminophen', system: 'RxNorm' },
  { code: '8640', display: 'Prednisolone', system: 'RxNorm' },
  { code: '2551', display: 'Celecoxib', system: 'RxNorm' },
  { code: '3008', display: 'Cyclosporine', system: 'RxNorm' },
  { code: '18867', display: 'Enalapril', system: 'RxNorm' },
  { code: '1719', display: 'Bumetanide', system: 'RxNorm' },
  { code: '4493', display: 'Clarithromycin', system: 'RxNorm' },
  { code: '10831', display: 'Sulfamethoxazole-Trimethoprim', system: 'RxNorm' },
  { code: '7052', display: 'Naproxen', system: 'RxNorm' }
];

// Common allergies
const COMMON_ALLERGIES = [
  { code: '91936005', display: 'Penicillin allergy', system: 'SNOMED' },
  { code: '91939003', display: 'Sulfonamide allergy', system: 'SNOMED' },
  { code: '293619008', display: 'NSAID allergy', system: 'SNOMED' },
  { code: '387494007', display: 'Codeine allergy', system: 'SNOMED' },
  { code: '294505008', display: 'Aspirin allergy', system: 'SNOMED' },
  { code: '293585002', display: 'Cephalosporin allergy', system: 'SNOMED' }
];

export default function DrugInteractionCheckerPage(props) {
  const [mode, setMode] = useState(props.defaultMode || 'drug-drug');
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [checkInProgress, setCheckInProgress] = useState(false);

  // Check interactions whenever medications or allergies change
  useEffect(() => {
    if (mode === 'drug-drug' && selectedMedications.length >= 2) {
      checkDrugDrugInteractions();
    } else if (mode === 'drug-allergy' && selectedMedications.length > 0 && selectedAllergies.length > 0) {
      checkDrugAllergyInteractions();
    }
  }, [selectedMedications, selectedAllergies, mode]);

  function checkDrugDrugInteractions() {
    setCheckInProgress(true);
    const found = [];
    
    for (let i = 0; i < selectedMedications.length; i++) {
      for (let j = i + 1; j < selectedMedications.length; j++) {
        const interaction = checkDrugDrugInteraction(
          selectedMedications[i].code,
          selectedMedications[j].code
        );
        if (interaction) {
          found.push({
            ...interaction,
            drug1Display: selectedMedications[i].display,
            drug2Display: selectedMedications[j].display
          });
        }
      }
    }
    
    setInteractions(found);
    setCheckInProgress(false);
  }

  function checkDrugAllergyInteractions() {
    setCheckInProgress(true);
    const found = [];
    
    for (let med of selectedMedications) {
      for (let allergy of selectedAllergies) {
        const interaction = checkDrugAllergyInteraction(med.code, allergy.code);
        if (interaction) {
          found.push({
            ...interaction,
            drugDisplay: med.display,
            allergyDisplay: allergy.display
          });
        }
      }
    }
    
    setInteractions(found);
    setCheckInProgress(false);
  }

  function addMedication(medication) {
    if (medication && !selectedMedications.find(m => m.code === medication.code)) {
      setSelectedMedications([...selectedMedications, medication]);
    }
  }

  function removeMedication(index) {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  }

  function addAllergy(allergy) {
    if (allergy && !selectedAllergies.find(a => a.code === allergy.code)) {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  }

  function removeAllergy(index) {
    setSelectedAllergies(selectedAllergies.filter((_, i) => i !== index));
  }

  function clearAll() {
    setSelectedMedications([]);
    setSelectedAllergies([]);
    setInteractions([]);
  }

  return (
    <Box
      id="drugInteractionCheckerPage"
      data-testid="drug-interaction-page"
      sx={{
        p: 3,
        minHeight: '100vh'
      }}
    >
      <Typography variant="h4" sx={{ mb: 3 }} data-testid="page-title">
        Drug Interaction Checker - ONC §170.315(a)(4)
      </Typography>

      <Grid container spacing={3}>
        {/* Input Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Interaction Check Configuration"
              action={
                <Button
                  color="secondary"
                  onClick={clearAll}
                  size="small"
                  data-testid="clear-all-button"
                >
                  Clear All
                </Button>
              }
            />
            <CardContent>
              {/* Mode Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Check Type</InputLabel>
                <Select
                  data-testid="check-type-select"
                  value={mode}
                  label="Check Type"
                  onChange={(e) => {
                    setMode(e.target.value);
                    setInteractions([]);
                  }}
                >
                  <MenuItem value="drug-drug" data-testid="drug-drug-option">Drug-Drug Interactions</MenuItem>
                  <MenuItem value="drug-allergy" data-testid="drug-allergy-option">Drug-Allergy Interactions</MenuItem>
                </Select>
              </FormControl>

              {/* Medication Selection */}
              <Typography variant="h6" sx={{ mb: 1 }}>
                Medications
              </Typography>
              <Autocomplete
                data-testid="medication-autocomplete"
                options={COMMON_MEDICATIONS}
                getOptionLabel={(option) => option.display}
                renderInput={(params) => (
                  <TextField {...params} label="Add medication" variant="outlined" data-testid="medication-search-input" />
                )}
                onChange={(event, value) => addMedication(value)}
                sx={{ mb: 2 }}
              />

              {/* Selected Medications List */}
              {selectedMedications.length > 0 && (
                <Paper variant="outlined" sx={{ p: 1, mb: 3 }} data-testid="selected-medications-list">
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedMedications.map((med, index) => (
                      <Chip
                        key={index}
                        label={med.display}
                        onDelete={() => removeMedication(index)}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                        data-testid={`medication-chip-${index}`}
                      />
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Allergy Selection (for drug-allergy mode) */}
              {mode === 'drug-allergy' && (
                <>
                  <Typography variant="h6" sx={{ mb: 1, mt: 3 }}>
                    Allergies
                  </Typography>
                  <Autocomplete
                    data-testid="allergy-autocomplete"
                    options={COMMON_ALLERGIES}
                    getOptionLabel={(option) => option.display}
                    renderInput={(params) => (
                      <TextField {...params} label="Add allergy" variant="outlined" data-testid="allergy-search-input" />
                    )}
                    onChange={(event, value) => addAllergy(value)}
                    sx={{ mb: 2 }}
                  />

                  {/* Selected Allergies List */}
                  {selectedAllergies.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 1 }} data-testid="selected-allergies-list">
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {selectedAllergies.map((allergy, index) => (
                          <Chip
                            key={index}
                            label={allergy.display}
                            onDelete={() => removeAllergy(index)}
                            color="warning"
                            variant="outlined"
                            sx={{ m: 0.5 }}
                            data-testid={`allergy-chip-${index}`}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  )}
                </>
              )}

              {/* Status Messages */}
              <Box sx={{ mt: 3 }}>
                {mode === 'drug-drug' && selectedMedications.length < 2 && (
                  <Alert severity="info" data-testid="drug-drug-status-message">
                    Add at least 2 medications to check for interactions
                  </Alert>
                )}
                {mode === 'drug-allergy' && (
                  <>
                    {selectedMedications.length === 0 && (
                      <Alert severity="info" data-testid="drug-allergy-status-message">Add medications to check</Alert>
                    )}
                    {selectedAllergies.length === 0 && selectedMedications.length > 0 && (
                      <Alert severity="info" data-testid="allergy-status-message">Add allergies to check against</Alert>
                    )}
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Interaction Check Results" />
            <CardContent>
              {interactions.length === 0 && selectedMedications.length >= 2 && (
                <Alert severity="success" icon={<CheckCircleIcon />} data-testid="no-interactions-alert">
                  <AlertTitle>No Interactions Found</AlertTitle>
                  No significant interactions detected between selected items.
                </Alert>
              )}

              {interactions.length > 0 && (
                <Stack spacing={2} data-testid="interactions-list">
                  {interactions.map((interaction, index) => (
                    <Alert
                      key={index}
                      data-testid={`interaction-alert-${index}`}
                      severity={
                        interaction.severity === 'contraindicated' ? 'error' :
                        interaction.severity === 'severe' ? 'error' :
                        interaction.severity === 'moderate' ? 'warning' : 'info'
                      }
                      icon={<WarningIcon />}
                    >
                      <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }} data-testid={`interaction-severity-${index}`}>
                        <span>{getSeverityIcon(interaction.severity)}</span>
                        <span style={{ color: getSeverityColor(interaction.severity) }}>
                          {interaction.severity.toUpperCase()}
                        </span>
                        {mode === 'drug-drug' ? (
                          <span data-testid={`interaction-drugs-${index}`}>: {interaction.drug1Display || interaction.drug1?.display} + {interaction.drug2Display || interaction.drug2?.display}</span>
                        ) : (
                          <span data-testid={`interaction-drug-allergy-${index}`}>: {interaction.drugDisplay} + {interaction.allergyDisplay}</span>
                        )}
                      </AlertTitle>

                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }} data-testid={`interaction-mechanism-${index}`}>
                          <strong>Mechanism:</strong> {interaction.mechanism}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }} data-testid={`interaction-effect-${index}`}>
                          <strong>Effect:</strong> {interaction.effect || interaction.reaction}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }} data-testid={`interaction-management-${index}`}>
                          <strong>Management:</strong> {interaction.management || interaction.alternatives}
                        </Typography>
                        {interaction.crossReactivity && (
                          <Typography variant="body2" sx={{ mb: 1 }} data-testid={`interaction-cross-reactivity-${index}`}>
                            <strong>Cross-reactivity:</strong> {interaction.crossReactivity}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" data-testid={`interaction-evidence-${index}`}>
                          Evidence: {interaction.evidence || 'Clinical'} |
                          Reference: {interaction.references || 'Clinical guidelines'}
                        </Typography>
                      </Box>
                    </Alert>
                  ))}
                </Stack>
              )}

              {/* ONC Certification Info */}
              <Box
                data-testid="onc-certification-info"
                sx={{
                  mt: 4,
                  p: 2,
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  This tool meets ONC §170.315(a)(4) certification requirements for:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="• Drug-drug interaction checking"
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="• Drug-allergy interaction checking"
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="• Severity-based alerting with management guidance"
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}