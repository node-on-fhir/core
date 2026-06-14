// packages/vital-signs/tests/VitalSignsValidation.tests.js

import { expect } from 'chai';
import {
  validateBloodPressure,
  validateHeartRate,
  validateTemperature,
  validateRespiratoryRate,
  validateOxygenSaturation,
  validateBMI,
  validateWeight,
  validateHeight,
  validateVitalSignObservation,
  VITAL_SIGN_RANGES
} from '../lib/utilities/VitalSignsValidator';
import { get } from 'lodash';

describe('VitalSignsValidation', function() {
  
  describe('validateBloodPressure', function() {
    it('should validate normal adult blood pressure', function() {
      const result = validateBloodPressure(120, 80, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Normal');
    });
    
    it('should detect hypertension', function() {
      const result = validateBloodPressure(145, 95, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(2); // Both systolic and diastolic out of range
      expect(result.interpretation).to.equal('Hypertension');
    });
    
    it('should detect hypotension', function() {
      const result = validateBloodPressure(85, 55, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(2);
      expect(result.interpretation).to.equal('Hypotension');
    });
    
    it('should detect critical values', function() {
      const result = validateBloodPressure(200, 120, 'adult');
      
      expect(result.isValid).to.be.false;
      expect(result.errors).to.have.length(2); // Both critically high
      expect(result.errors[0]).to.include('Critically high systolic pressure');
      expect(result.errors[1]).to.include('Critically high diastolic pressure');
    });
    
    it('should validate pediatric ranges', function() {
      const result = validateBloodPressure(100, 65, 'pediatric');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should require both systolic and diastolic values', function() {
      const result1 = validateBloodPressure(null, 80, 'adult');
      const result2 = validateBloodPressure(120, null, 'adult');
      
      expect(result1.isValid).to.be.false;
      expect(result1.errors[0]).to.include('Both systolic and diastolic values are required');
      
      expect(result2.isValid).to.be.false;
      expect(result2.errors[0]).to.include('Both systolic and diastolic values are required');
    });
    
    it('should validate that systolic > diastolic', function() {
      const result = validateBloodPressure(80, 120, 'adult');
      
      expect(result.isValid).to.be.false;
      expect(result.errors[0]).to.include('Systolic pressure must be greater than diastolic pressure');
    });
  });
  
  describe('validateHeartRate', function() {
    it('should validate normal adult heart rate', function() {
      const result = validateHeartRate(75, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Normal');
    });
    
    it('should detect bradycardia', function() {
      const result = validateHeartRate(55, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Bradycardia');
      expect(result.interpretation).to.equal('Bradycardia');
    });
    
    it('should detect tachycardia', function() {
      const result = validateHeartRate(110, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Tachycardia');
      expect(result.interpretation).to.equal('Tachycardia');
    });
    
    it('should detect critical heart rates', function() {
      const result = validateHeartRate(35, 'adult');
      
      expect(result.isValid).to.be.false;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]).to.include('Critically low heart rate');
    });
    
    it('should validate pediatric heart rates by age', function() {
      const newbornResult = validateHeartRate(140, 'pediatric', 'newborn');
      expect(newbornResult.isValid).to.be.true;
      expect(newbornResult.errors).to.have.length(0);
      expect(newbornResult.warnings).to.have.length(0);
      
      const toddlerResult = validateHeartRate(120, 'pediatric', 'toddler');
      expect(toddlerResult.isValid).to.be.true;
      expect(toddlerResult.errors).to.have.length(0);
      expect(toddlerResult.warnings).to.have.length(0);
      
      const adolescentResult = validateHeartRate(80, 'pediatric', 'adolescent');
      expect(adolescentResult.isValid).to.be.true;
      expect(adolescentResult.errors).to.have.length(0);
      expect(adolescentResult.warnings).to.have.length(0);
    });
    
    it('should require positive heart rate', function() {
      const result1 = validateHeartRate(0, 'adult');
      const result2 = validateHeartRate(-10, 'adult');
      const result3 = validateHeartRate(null, 'adult');
      
      expect(result1.isValid).to.be.false;
      expect(result1.errors[0]).to.include('Heart rate must be a positive number');
      
      expect(result2.isValid).to.be.false;
      expect(result2.errors[0]).to.include('Heart rate must be a positive number');
      
      expect(result3.isValid).to.be.false;
      expect(result3.errors[0]).to.include('Heart rate must be a positive number');
    });
  });
  
  describe('validateTemperature', function() {
    it('should validate normal temperature in celsius', function() {
      const result = validateTemperature(36.8, 'celsius');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Normal');
    });
    
    it('should validate normal temperature in fahrenheit', function() {
      const result = validateTemperature(98.6, 'fahrenheit');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Normal');
    });
    
    it('should detect fever in celsius', function() {
      const result = validateTemperature(38.5, 'celsius');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Fever detected');
      expect(result.interpretation).to.equal('Fever');
    });
    
    it('should detect fever in fahrenheit', function() {
      const result = validateTemperature(101.5, 'fahrenheit');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Fever detected');
      expect(result.interpretation).to.equal('Fever');
    });
    
    it('should detect hypothermia', function() {
      const result = validateTemperature(35.5, 'celsius');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Below normal temperature');
      expect(result.interpretation).to.equal('Hypothermia');
    });
    
    it('should detect critical temperatures', function() {
      const highResult = validateTemperature(41, 'celsius');
      const lowResult = validateTemperature(34, 'celsius');
      
      expect(highResult.isValid).to.be.false;
      expect(highResult.errors[0]).to.include('Critically high temperature');
      
      expect(lowResult.isValid).to.be.false;
      expect(lowResult.errors[0]).to.include('Critically low temperature');
    });
    
    it('should require positive temperature', function() {
      const result = validateTemperature(0, 'celsius');
      
      expect(result.isValid).to.be.false;
      expect(result.errors[0]).to.include('Temperature must be a positive number');
    });
  });
  
  describe('validateRespiratoryRate', function() {
    it('should validate normal adult respiratory rate', function() {
      const result = validateRespiratoryRate(16, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Normal');
    });
    
    it('should detect bradypnea', function() {
      const result = validateRespiratoryRate(10, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Bradypnea');
      expect(result.interpretation).to.equal('Bradypnea');
    });
    
    it('should detect tachypnea', function() {
      const result = validateRespiratoryRate(25, 'adult');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Tachypnea');
      expect(result.interpretation).to.equal('Tachypnea');
    });
    
    it('should detect critical respiratory rates', function() {
      const result = validateRespiratoryRate(35, 'adult');
      
      expect(result.isValid).to.be.false;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]).to.include('Critically high respiratory rate');
    });
    
    it('should validate pediatric respiratory rates', function() {
      const newbornResult = validateRespiratoryRate(45, 'pediatric', 'newborn');
      expect(newbornResult.isValid).to.be.true;
      expect(newbornResult.errors).to.have.length(0);
      expect(newbornResult.warnings).to.have.length(0);
      
      const toddlerResult = validateRespiratoryRate(30, 'pediatric', 'toddler');
      expect(toddlerResult.isValid).to.be.true;
      expect(toddlerResult.errors).to.have.length(0);
      expect(toddlerResult.warnings).to.have.length(0);
    });
  });
  
  describe('validateOxygenSaturation', function() {
    it('should validate normal oxygen saturation', function() {
      const result = validateOxygenSaturation(98);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Normal');
    });
    
    it('should detect mild hypoxemia', function() {
      const result = validateOxygenSaturation(92);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Low oxygen saturation');
      expect(result.interpretation).to.equal('Mild hypoxemia');
    });
    
    it('should detect critical hypoxemia', function() {
      const result = validateOxygenSaturation(85);
      
      expect(result.isValid).to.be.false;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]).to.include('Critical hypoxemia');
      expect(result.interpretation).to.equal('Moderate hypoxemia');
    });
    
    it('should validate range 0-100', function() {
      const result1 = validateOxygenSaturation(-5);
      const result2 = validateOxygenSaturation(105);
      
      expect(result1.isValid).to.be.false;
      expect(result1.errors[0]).to.include('Oxygen saturation must be between 0 and 100');
      
      expect(result2.isValid).to.be.false;
      expect(result2.errors[0]).to.include('Oxygen saturation must be between 0 and 100');
    });
  });
  
  describe('validateBMI', function() {
    it('should validate normal BMI', function() {
      const result = validateBMI(22.5);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Normal weight');
    });
    
    it('should detect underweight', function() {
      const result = validateBMI(17.5);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Underweight');
    });
    
    it('should detect overweight', function() {
      const result = validateBMI(27);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Overweight');
    });
    
    it('should detect obesity', function() {
      const result = validateBMI(35);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
      expect(result.interpretation).to.equal('Obese');
    });
    
    it('should warn about unusual BMI values', function() {
      const result1 = validateBMI(8);
      const result2 = validateBMI(65);
      
      expect(result1.isValid).to.be.true;
      expect(result1.warnings).to.have.length(1);
      expect(result1.warnings[0]).to.include('Unusual BMI value');
      
      expect(result2.isValid).to.be.true;
      expect(result2.warnings).to.have.length(1);
      expect(result2.warnings[0]).to.include('Unusual BMI value');
    });
  });
  
  describe('validateWeight', function() {
    it('should validate normal weight in kg', function() {
      const result = validateWeight(70, 'kg');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should validate weight in pounds', function() {
      const result = validateWeight(150, '[lb_av]');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should validate weight in grams', function() {
      const result = validateWeight(3500, 'g');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should warn about unusual weights', function() {
      const result1 = validateWeight(0.4, 'kg');
      const result2 = validateWeight(600, 'kg');
      
      expect(result1.isValid).to.be.true;
      expect(result1.warnings).to.have.length(1);
      expect(result1.warnings[0]).to.include('Unusual weight value');
      
      expect(result2.isValid).to.be.true;
      expect(result2.warnings).to.have.length(1);
      expect(result2.warnings[0]).to.include('Unusual weight value');
    });
    
    it('should require positive weight', function() {
      const result = validateWeight(0, 'kg');
      
      expect(result.isValid).to.be.false;
      expect(result.errors[0]).to.include('Weight must be a positive number');
    });
  });
  
  describe('validateHeight', function() {
    it('should validate normal height in cm', function() {
      const result = validateHeight(175, 'cm');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should validate height in inches', function() {
      const result = validateHeight(69, '[in_i]');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should validate height in meters', function() {
      const result = validateHeight(1.75, 'm');
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should warn about unusual heights', function() {
      const result1 = validateHeight(15, 'cm');
      const result2 = validateHeight(260, 'cm');
      
      expect(result1.isValid).to.be.true;
      expect(result1.warnings).to.have.length(1);
      expect(result1.warnings[0]).to.include('Unusual height value');
      
      expect(result2.isValid).to.be.true;
      expect(result2.warnings).to.have.length(1);
      expect(result2.warnings[0]).to.include('Unusual height value');
    });
  });
  
  describe('validateVitalSignObservation', function() {
    it('should validate a complete blood pressure observation', function() {
      const observation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel'
          }]
        },
        subject: {
          reference: 'Patient/123'
        },
        effectiveDateTime: new Date().toISOString(),
        component: [{
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure'
            }]
          },
          valueQuantity: {
            value: 120,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }, {
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8462-4',
              display: 'Diastolic blood pressure'
            }]
          },
          valueQuantity: {
            value: 80,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }]
      };
      
      const result = validateVitalSignObservation(observation);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should validate heart rate observation', function() {
      const observation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate'
          }]
        },
        subject: {
          reference: 'Patient/123'
        },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: {
          value: 75,
          unit: 'beats/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        }
      };
      
      const result = validateVitalSignObservation(observation);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should validate temperature observation', function() {
      const observation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8310-5',
            display: 'Body temperature'
          }]
        },
        subject: {
          reference: 'Patient/123'
        },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: {
          value: 98.6,
          unit: '°F',
          system: 'http://unitsofmeasure.org',
          code: '[degF]'
        }
      };
      
      const result = validateVitalSignObservation(observation);
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
      expect(result.warnings).to.have.length(0);
    });
    
    it('should detect missing required fields', function() {
      const observation = {
        resourceType: 'Patient', // Wrong type
        // Missing status
        // Missing code
        // Missing subject
      };
      
      const result = validateVitalSignObservation(observation);
      
      expect(result.isValid).to.be.false;
      expect(result.errors.length).to.be.above(0);
      expect(result.errors).to.include('Resource must be of type Observation');
    });
    
    it('should warn about missing effective date', function() {
      const observation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate'
          }]
        },
        subject: {
          reference: 'Patient/123'
        },
        valueQuantity: {
          value: 75,
          unit: 'beats/minute'
        }
        // Missing effectiveDateTime
      };
      
      const result = validateVitalSignObservation(observation);
      
      expect(result.isValid).to.be.true;
      expect(result.warnings).to.have.length(1);
      expect(result.warnings[0]).to.include('Observation should have an effective date/time');
    });
    
    it('should validate blood pressure components', function() {
      const observation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel'
          }]
        },
        subject: {
          reference: 'Patient/123'
        },
        component: [{
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: 'wrong-code', // Wrong systolic code
              display: 'Systolic blood pressure'
            }]
          },
          valueQuantity: {
            value: 120
          }
        }]
        // Missing diastolic component
      };
      
      const result = validateVitalSignObservation(observation);
      
      expect(result.isValid).to.be.false;
      expect(result.errors).to.have.length.above(0);
    });
  });
  
  describe('VITAL_SIGN_RANGES', function() {
    it('should export valid ranges object', function() {
      expect(VITAL_SIGN_RANGES).to.be.an('object');
      expect(VITAL_SIGN_RANGES).to.have.property('bloodPressure');
      expect(VITAL_SIGN_RANGES).to.have.property('heartRate');
      expect(VITAL_SIGN_RANGES).to.have.property('respiratoryRate');
      expect(VITAL_SIGN_RANGES).to.have.property('temperature');
      expect(VITAL_SIGN_RANGES).to.have.property('oxygenSaturation');
      expect(VITAL_SIGN_RANGES).to.have.property('bmi');
    });
    
    it('should contain valid numeric ranges', function() {
      // Check blood pressure ranges
      const bpAdultSystolic = get(VITAL_SIGN_RANGES, 'bloodPressure.systolic.adult');
      expect(bpAdultSystolic.min).to.be.a('number');
      expect(bpAdultSystolic.max).to.be.a('number');
      expect(bpAdultSystolic.min).to.be.below(bpAdultSystolic.max);
      
      // Check heart rate ranges
      const hrAdult = get(VITAL_SIGN_RANGES, 'heartRate.adult');
      expect(hrAdult.min).to.be.a('number');
      expect(hrAdult.max).to.be.a('number');
      expect(hrAdult.min).to.be.below(hrAdult.max);
      
      // Check temperature ranges
      const tempCelsius = get(VITAL_SIGN_RANGES, 'temperature.celsius.normal');
      expect(tempCelsius.min).to.be.a('number');
      expect(tempCelsius.max).to.be.a('number');
      expect(tempCelsius.min).to.be.below(tempCelsius.max);
    });
  });
});