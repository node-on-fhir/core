// /packages/pacio-core/client/pages/TakeVitalSignsPage.jsx

import React, { useState } from 'react';
import { 
    Container, 
    Paper, 
    Typography, 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Button,
    Box,
    Grid,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    LinearProgress,
    Chip
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

// Define vital signs with LOINC codes and units
const VITAL_SIGNS = [
    {
        name: 'Respiratory Rate',
        loincCode: '9279-1',
        loincName: 'Respiratory Rate',
        units: ['/min'],
        field: 'respiratoryRate',
        resourceType: 'simple'
    },
    {
        name: 'Heart Rate',
        loincCode: '8867-4',
        loincName: 'Heart rate',
        units: ['/min'],
        field: 'heartRate',
        resourceType: 'simple'
    },
    {
        name: 'Oxygen Saturation',
        loincCode: '2708-6',
        loincName: 'Oxygen saturation in Arterial blood',
        units: ['%'],
        field: 'oxygenSaturation',
        resourceType: 'simple'
    },
    {
        name: 'Body Temperature',
        loincCode: '8310-5',
        loincName: 'Body temperature',
        units: ['Cel', '[degF]'],
        field: 'bodyTemperature',
        resourceType: 'simple'
    },
    {
        name: 'Body Height',
        loincCode: '8302-2',
        loincName: 'Body height',
        units: ['cm', '[in_i]'],
        field: 'bodyHeight',
        resourceType: 'simple',
        pediatric: true
    },
    {
        name: 'Head Circumference',
        loincCode: '9843-4',
        loincName: 'Head Occipital-frontal circumference',
        units: ['cm', '[in_i]'],
        field: 'headCircumference',
        resourceType: 'simple',
        pediatric: true
    },
    {
        name: 'Body Weight',
        loincCode: '29463-7',
        loincName: 'Body weight',
        units: ['g', 'kg', '[lb_av]', '[oz_av]'],
        field: 'bodyWeight',
        resourceType: 'simple'
    },
    {
        name: 'Body Mass Index',
        loincCode: '39156-5',
        loincName: 'Body mass index (BMI) [Ratio]',
        units: ['kg/m2'],
        field: 'bmi',
        resourceType: 'simple',
        calculated: true
    },
    {
        name: 'Blood Pressure',
        loincCode: '85354-9',
        loincName: 'Blood pressure panel with all children optional',
        field: 'bloodPressure',
        resourceType: 'panel',
        components: [
            {
                name: 'Systolic',
                loincCode: '8480-6',
                loincName: 'Systolic blood pressure',
                units: ['mm[Hg]'],
                field: 'systolic'
            },
            {
                name: 'Diastolic',
                loincCode: '8462-4',
                loincName: 'Diastolic blood pressure',
                units: ['mm[Hg]'],
                field: 'diastolic'
            }
        ]
    }
];

export default function TakeVitalSignsPage() {
    // Get Honeycomb theme for dark mode support
    const useAppTheme = Meteor.useTheme;
    const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
    const isDark = appTheme.theme === 'dark';

    // Theme-aware colors for cards
    const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
    const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

    const [showPediatric, setShowPediatric] = useState(false);
    const [vitalSignValues, setVitalSignValues] = useState({});
    const [selectedUnits, setSelectedUnits] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const selectedPatient = useTracker(() => {
        // Check both possible session variables
        const patient = Session.get('ICD10_PATIENT') || Session.get('selectedPatient');
        console.log('TakeVitalSignsPage - selectedPatient:', patient);
        return patient;
    }, []);

    // Calculate progress and completion status
    const calculateProgress = () => {
        const visibleVitalSigns = VITAL_SIGNS.filter(vs => !vs.pediatric || showPediatric);
        let filledCount = 0;
        
        visibleVitalSigns.forEach(vitalSign => {
            if (vitalSign.resourceType === 'panel') {
                // Check if any component has a value
                const hasValue = vitalSign.components.some(comp => 
                    get(vitalSignValues, `${vitalSign.field}.${comp.field}`)
                );
                if (hasValue) filledCount++;
            } else if (!vitalSign.calculated) {
                if (get(vitalSignValues, vitalSign.field)) filledCount++;
            }
        });
        
        return {
            filled: filledCount,
            total: visibleVitalSigns.filter(vs => !vs.calculated).length,
            percentage: (filledCount / visibleVitalSigns.filter(vs => !vs.calculated).length) * 100
        };
    };
    
    const hasAnyValue = () => {
        const hasValue = VITAL_SIGNS.some(vitalSign => {
            if (vitalSign.pediatric && !showPediatric) return false;
            
            if (vitalSign.resourceType === 'panel') {
                return vitalSign.components.some(comp => 
                    get(vitalSignValues, `${vitalSign.field}.${comp.field}`)
                );
            } else {
                return !!get(vitalSignValues, vitalSign.field);
            }
        });
        console.log('TakeVitalSignsPage - hasAnyValue:', hasValue, 'vitalSignValues:', vitalSignValues);
        return hasValue;
    };

    const handleValueChange = (field, value) => {
        setVitalSignValues({
            ...vitalSignValues,
            [field]: value
        });
        
        // Auto-calculate BMI if weight and height are present
        if (field === 'bodyWeight' || field === 'bodyHeight') {
            calculateBMI();
        }
    };
    
    const handleUnitChange = (field, unit) => {
        setSelectedUnits({
            ...selectedUnits,
            [field]: unit
        });
    };
    
    const calculateBMI = () => {
        const weight = parseFloat(get(vitalSignValues, 'bodyWeight', 0));
        const height = parseFloat(get(vitalSignValues, 'bodyHeight', 0));
        
        if (weight > 0 && height > 0) {
            // Convert to kg and m if needed
            let weightKg = weight;
            let heightM = height / 100; // assuming cm input
            
            const unit = get(selectedUnits, 'bodyWeight', 'kg');
            if (unit === '[lb_av]') {
                weightKg = weight * 0.453592;
            } else if (unit === 'g') {
                weightKg = weight / 1000;
            }
            
            const heightUnit = get(selectedUnits, 'bodyHeight', 'cm');
            if (heightUnit === '[in_i]') {
                heightM = (height * 2.54) / 100;
            }
            
            const bmi = weightKg / (heightM * heightM);
            setVitalSignValues(prev => ({
                ...prev,
                bmi: bmi.toFixed(1)
            }));
        }
    };
    
    const createObservation = (vitalSign, value, unit) => {
        const observation = {
            resourceType: 'Observation',
            status: 'final',
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'vital-signs',
                    display: 'Vital Signs'
                }],
                text: 'Vital Signs'
            }],
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: vitalSign.loincCode,
                    display: vitalSign.loincName
                }],
                text: vitalSign.name
            },
            subject: {
                reference: `Patient/${get(selectedPatient, 'id', '')}`,
                display: `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`
            },
            effectiveDateTime: moment().format(),
            issued: moment().format()
        };
        
        if (vitalSign.resourceType === 'simple') {
            observation.valueQuantity = {
                value: parseFloat(value),
                unit: unit,
                system: 'http://unitsofmeasure.org',
                code: unit
            };
        } else if (vitalSign.resourceType === 'panel') {
            // Handle blood pressure panel
            observation.component = [];
            vitalSign.components.forEach(component => {
                const componentValue = get(vitalSignValues, `${vitalSign.field}.${component.field}`);
                if (componentValue) {
                    observation.component.push({
                        code: {
                            coding: [{
                                system: 'http://loinc.org',
                                code: component.loincCode,
                                display: component.loincName
                            }]
                        },
                        valueQuantity: {
                            value: parseFloat(componentValue),
                            unit: component.units[0],
                            system: 'http://unitsofmeasure.org',
                            code: component.units[0]
                        }
                    });
                }
            });
        }
        
        return observation;
    };
    
    const handleSave = async function() {
        if (!selectedPatient) {
            Session.set('mainAppDialogJson', {
                title: 'No Patient Selected',
                message: 'Please select a patient before recording vital signs.'
            });
            return;
        }
        
        setIsSaving(true);
        const observations = [];
        
        // Create observations for each entered vital sign
        VITAL_SIGNS.forEach(vitalSign => {
            if (vitalSign.pediatric && !showPediatric) return;
            
            const value = get(vitalSignValues, vitalSign.field);
            if (value) {
                const unit = get(selectedUnits, vitalSign.field, vitalSign.units?.[0]);
                if (vitalSign.resourceType === 'panel') {
                    // Check if any component has a value
                    const hasValue = vitalSign.components.some(comp => 
                        get(vitalSignValues, `${vitalSign.field}.${comp.field}`)
                    );
                    if (hasValue) {
                        observations.push(createObservation(vitalSign, value, unit));
                    }
                } else {
                    observations.push(createObservation(vitalSign, value, unit));
                }
            }
        });
        
        // Save observations
        console.log('TakeVitalSignsPage - Saving observations:', observations);
        for (const observation of observations) {
            try {
                console.log('TakeVitalSignsPage - Saving observation:', observation);
                const result = await Meteor.callAsync('observations.create', observation);
                console.log('TakeVitalSignsPage - Observation saved, result:', result);
            } catch (error) {
                console.error('Error creating observation:', error);
                Session.set('mainAppDialogJson', {
                    title: 'Error Saving Vital Signs',
                    message: `Failed to save ${observation.code.text}: ${error.message}`
                });
            }
        }
        
        setIsSaving(false);
        Session.set('mainAppDialogJson', {
            title: 'Success',
            message: 'Vital signs have been saved successfully.'
        });
        
        // Clear form
        setVitalSignValues({});
        setSelectedUnits({});
    };
    
    const renderVitalSignRow = (vitalSign) => {
        if (vitalSign.pediatric && !showPediatric) return null;
        
        if (vitalSign.resourceType === 'panel') {
            // Render blood pressure with two inputs
            return (
                <TableRow key={vitalSign.loincCode}>
                    <TableCell>{vitalSign.name}</TableCell>
                    <TableCell>{vitalSign.loincCode}</TableCell>
                    <TableCell>
                        <Grid container spacing={2}>
                            {vitalSign.components.map(component => (
                                <Grid item xs={6} key={component.loincCode}>
                                    <TextField
                                        label={component.name}
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={get(vitalSignValues, `${vitalSign.field}.${component.field}`, '')}
                                        onChange={(e) => handleValueChange(`${vitalSign.field}.${component.field}`, e.target.value)}
                                        InputProps={{
                                            endAdornment: component.units[0]
                                        }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </TableCell>
                </TableRow>
            );
        }
        
        return (
            <TableRow key={vitalSign.loincCode}>
                <TableCell>{vitalSign.name}</TableCell>
                <TableCell>{vitalSign.loincCode}</TableCell>
                <TableCell>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={8}>
                            <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={get(vitalSignValues, vitalSign.field, '')}
                                onChange={(e) => handleValueChange(vitalSign.field, e.target.value)}
                                disabled={vitalSign.calculated}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            {vitalSign.units?.length > 1 ? (
                                <FormControl size="small" fullWidth>
                                    <Select
                                        value={get(selectedUnits, vitalSign.field, vitalSign.units[0])}
                                        onChange={(e) => handleUnitChange(vitalSign.field, e.target.value)}
                                    >
                                        {vitalSign.units.map(unit => (
                                            <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Typography variant="body2">{vitalSign.units?.[0]}</Typography>
                            )}
                        </Grid>
                    </Grid>
                </TableCell>
            </TableRow>
        );
    };
    
    return (
        <Box sx={{ minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Typography variant="h4" gutterBottom sx={{ color: cardTextColor }}>
                    Take Vital Signs
                </Typography>

            {selectedPatient ? (
                <Typography variant="subtitle1" gutterBottom sx={{ color: cardTextColor }}>
                    Patient: {get(selectedPatient, 'name[0].given[0]', '')} {get(selectedPatient, 'name[0].family', '')}
                </Typography>
            ) : (
                <Typography variant="subtitle1" color="error" gutterBottom>
                    No patient selected. Please select a patient first.
                </Typography>
            )}
            
            <Box mb={3}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showPediatric}
                                    onChange={(e) => setShowPediatric(e.target.checked)}
                                />
                            }
                            label="Show pediatric measurements (Body Height, Head Circumference)"
                            sx={{
                                '& .MuiFormControlLabel-label': { color: cardTextColor }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <LinearProgress 
                                variant="determinate" 
                                value={calculateProgress().percentage} 
                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                color={calculateProgress().percentage === 100 ? "success" : "primary"}
                            />
                            <Chip 
                                label={`${calculateProgress().filled} / ${calculateProgress().total}`}
                                color={calculateProgress().percentage === 100 ? "success" : "default"}
                                size="small"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            
            <TableContainer component={Paper} sx={{
                bgcolor: cardBgColor,
                color: cardTextColor,
                '& .MuiTableCell-root': {
                    color: cardTextColor,
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
                },
                '& .MuiTableCell-head': {
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    color: cardTextColor,
                    fontWeight: 600
                },
                '& .MuiTextField-root': {
                    '& .MuiInputLabel-root': { color: cardTextColor },
                    '& .MuiInputBase-root': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                    }
                },
                '& .MuiSelect-root': { color: cardTextColor },
                '& .MuiSelect-icon': { color: cardTextColor },
                '& .MuiTypography-root': { color: cardTextColor }
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Vital Sign</TableCell>
                            <TableCell>LOINC Code</TableCell>
                            <TableCell>Value & Unit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {VITAL_SIGNS.map(vitalSign => renderVitalSignRow(vitalSign))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    color={calculateProgress().percentage === 100 ? "success" : "primary"}
                    onClick={handleSave}
                    disabled={isSaving || !selectedPatient || !hasAnyValue()}
                >
                    {isSaving ? 'Saving...' : 'Save Vital Signs'}
                </Button>
            </Box>
            </Container>
        </Box>
    );
}