// /packages/synthea/client/syntheaDefaults.js

// Default values from synthea.properties
// These are used to determine when to include --config flags
export const SYNTHEA_DEFAULTS = {
  // Population generation
  'generate.default_population': 1,
  'generate.thread_pool_size': -1,
  'generate.only_dead_patients': false,
  'generate.only_alive_patients': false,
  'generate.append_numbers_to_person_names': true,
  'generate.veteran_population_override': false,
  'generate.max_attempts_to_keep_patient': 1000,
  'generate.track_detailed_transition_metrics': false,
  
  // Export settings
  'exporter.baseDirectory': './output/',
  'exporter.years_of_history': 10,
  'exporter.fhir.export': true,
  'exporter.fhir.us_core_version': '5.0.1',
  'exporter.fhir.bulk_data': true,  // Changed to true as default per user preference
  'exporter.ccda.export': false,
  'exporter.csv.export': false,
  'exporter.text.export': false,
  'exporter.clinical_note.export': false,
  'exporter.symptoms.csv.export': false,
  'exporter.json.export': false,
  'exporter.hospital.fhir.export': true,
  'exporter.practitioner.fhir.export': true,
  'exporter.use_uuid_filenames': false,
  'exporter.pretty_print': true,
  'exporter.split_records': false,
  'exporter.metadata.export': true,
  'exporter.csv.append_mode': false,
  'exporter.csv.folder_per_run': false,
  
  // Demographics
  'generate.middle_names': 0.80,  // 80% probability
  
  // Insurance settings
  'generate.insurance.mandate.year': 2006,
  'generate.insurance.employer_coverage': 0.83,  // 83%
  
  // Payer settings
  'generate.payers.selection_behavior': 'priority',
  'generate.payers.insurance_plans.income_premium_ratio': 0.034,  // 3.4%
  
  // Cost calculation
  'generate.costs.method': 'exponential',
  'generate.costs.default_procedure_cost': 500.00,
  'generate.costs.default_medication_cost': 255.00,
  'generate.costs.default_encounter_cost': 125.00,
  'generate.costs.default_immunization_cost': 136.00,
  'generate.costs.default_lab_cost': 100.00,
  
  // Provider settings
  'generate.providers.selection_behavior': 'nearest',
  'generate.providers.maximum_search_distance': 1000,
  'generate.providers.default_to_hospital_on_failure': true,
  'generate.providers.minimum': 1,
  
  // Socioeconomic weights
  'generate.demographics.socioeconomic.weights.income': 0.2,  // 20%
  'generate.demographics.socioeconomic.weights.education': 0.7,  // 70%
  'generate.demographics.socioeconomic.weights.occupation': 0.1,  // 10%
  
  // Lifecycle settings
  'lifecycle.death_by_natural_causes': false,
  'lifecycle.death_by_loss_of_care': false,
  
  // Logging
  'generate.log_patients.detail': 'simple'
};

// Helper function to check if a value differs from default
export function isDifferentFromDefault(property, value) {
  if (!(property in SYNTHEA_DEFAULTS)) {
    // If we don't know the default, include it to be safe
    return true;
  }
  
  const defaultValue = SYNTHEA_DEFAULTS[property];
  
  // Handle numeric comparisons
  if (typeof defaultValue === 'number' && typeof value === 'number') {
    return Math.abs(defaultValue - value) > 0.001;
  }
  
  // Handle string and boolean comparisons
  return defaultValue !== value;
}