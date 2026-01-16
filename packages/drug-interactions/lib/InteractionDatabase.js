// packages/drug-interactions/lib/InteractionDatabase.js

// Simplified drug interaction database for ONC certification
// Based on common critical interactions from PDDI-CDS guidelines

export const DRUG_DRUG_INTERACTIONS = [
  // Warfarin interactions
  {
    id: 'warfarin-nsaid',
    drug1: { code: '11289', display: 'Warfarin', system: 'RxNorm' },
    drug2Class: 'NSAID',
    drugs2: ['1191', '5640', '2551', '3638'], // Aspirin, Ibuprofen, Celecoxib, Diclofenac
    severity: 'severe',
    mechanism: 'Increased bleeding risk',
    effect: 'NSAIDs may increase the anticoagulant effect of warfarin',
    management: 'Monitor INR closely. Consider using acetaminophen for pain relief.',
    evidence: 'strong',
    references: 'PDDI-CDS IG'
  },
  {
    id: 'warfarin-amiodarone',
    drug1: { code: '11289', display: 'Warfarin', system: 'RxNorm' },
    drug2: { code: '703', display: 'Amiodarone', system: 'RxNorm' },
    severity: 'severe',
    mechanism: 'CYP2C9 inhibition',
    effect: 'Amiodarone may increase warfarin levels by 2-3 fold',
    management: 'Reduce warfarin dose by 30-50%. Monitor INR frequently.',
    evidence: 'strong',
    references: 'PDDI-CDS IG'
  },
  
  // Digoxin interactions
  {
    id: 'digoxin-loop-diuretic',
    drug1: { code: '3407', display: 'Digoxin', system: 'RxNorm' },
    drug2Class: 'Loop Diuretic',
    drugs2: ['4603', '1719', '2767'], // Furosemide, Bumetanide, Torsemide
    severity: 'moderate',
    mechanism: 'Hypokalemia/hypomagnesemia',
    effect: 'Loop diuretics may increase risk of digoxin toxicity',
    management: 'Monitor potassium and magnesium levels. Consider potassium supplementation.',
    evidence: 'strong',
    references: 'PDDI-CDS IG'
  },
  {
    id: 'digoxin-cyclosporine',
    drug1: { code: '3407', display: 'Digoxin', system: 'RxNorm' },
    drug2: { code: '3008', display: 'Cyclosporine', system: 'RxNorm' },
    severity: 'severe',
    mechanism: 'P-glycoprotein inhibition',
    effect: 'Cyclosporine increases digoxin levels significantly',
    management: 'Reduce digoxin dose by 50%. Monitor digoxin levels.',
    evidence: 'strong',
    references: 'PDDI-CDS IG'
  },
  
  // NSAID + Corticosteroid interactions
  {
    id: 'nsaid-corticosteroid',
    drug1Class: 'NSAID',
    drugs1: ['1191', '5640', '2551', '3638'],
    drug2Class: 'Corticosteroid',
    drugs2: ['6902', '8640', '312617'], // Prednisone, Prednisolone, Methylprednisolone
    severity: 'moderate',
    mechanism: 'Additive GI toxicity',
    effect: 'Increased risk of GI bleeding and ulceration',
    management: 'Consider PPI prophylaxis. Monitor for GI symptoms.',
    evidence: 'strong',
    references: 'PDDI-CDS IG'
  },
  
  // ACE inhibitor + Potassium-sparing diuretic
  {
    id: 'ace-k-sparing',
    drug1Class: 'ACE Inhibitor',
    drugs1: ['29046', '18867', '50166'], // Lisinopril, Enalapril, Ramipril
    drug2Class: 'Potassium-sparing Diuretic',
    drugs2: ['11170', '37418'], // Spironolactone, Eplerenone
    severity: 'severe',
    mechanism: 'Additive hyperkalemia',
    effect: 'Risk of dangerous hyperkalemia',
    management: 'Monitor potassium levels closely. Consider alternative diuretic.',
    evidence: 'strong',
    references: 'Clinical guidelines'
  },
  
  // Statins + CYP3A4 inhibitors
  {
    id: 'simvastatin-cyp3a4',
    drug1: { code: '36567', display: 'Simvastatin', system: 'RxNorm' },
    drug2Class: 'Strong CYP3A4 Inhibitor',
    drugs2: ['4493', '27250', '7233'], // Clarithromycin, Itraconazole, Ketoconazole
    severity: 'contraindicated',
    mechanism: 'CYP3A4 inhibition',
    effect: 'Increased risk of rhabdomyolysis',
    management: 'Do not co-prescribe. Use alternative statin (pravastatin, rosuvastatin).',
    evidence: 'strong',
    references: 'FDA black box warning'
  }
];

export const DRUG_ALLERGY_INTERACTIONS = [
  // Penicillin allergies
  {
    id: 'penicillin-allergy',
    allergyCode: '91936005', // Penicillin allergy (SNOMED)
    contraindicatedDrugs: [
      { code: '723', display: 'Amoxicillin', system: 'RxNorm' },
      { code: '733', display: 'Ampicillin', system: 'RxNorm' },
      { code: '70618', display: 'Penicillin G', system: 'RxNorm' },
      { code: '392151', display: 'Amoxicillin-Clavulanate', system: 'RxNorm' }
    ],
    severity: 'contraindicated',
    reaction: 'Anaphylaxis risk',
    crossReactivity: '10% with cephalosporins',
    alternatives: 'Fluoroquinolones, macrolides, or tetracyclines'
  },
  
  // Sulfa allergies
  {
    id: 'sulfa-allergy',
    allergyCode: '91939003', // Sulfamethoxazole allergy (SNOMED)
    contraindicatedDrugs: [
      { code: '10831', display: 'Sulfamethoxazole-Trimethoprim', system: 'RxNorm' },
      { code: '10828', display: 'Sulfasalazine', system: 'RxNorm' },
      { code: '4603', display: 'Furosemide', system: 'RxNorm' }
    ],
    severity: 'severe',
    reaction: 'Stevens-Johnson syndrome risk',
    crossReactivity: 'Variable with non-antibiotic sulfonamides',
    alternatives: 'Non-sulfa antibiotics'
  },
  
  // NSAID allergies
  {
    id: 'nsaid-allergy',
    allergyCode: '293619008', // NSAID allergy (SNOMED)
    contraindicatedDrugs: [
      { code: '5640', display: 'Ibuprofen', system: 'RxNorm' },
      { code: '7052', display: 'Naproxen', system: 'RxNorm' },
      { code: '5521', display: 'Indomethacin', system: 'RxNorm' },
      { code: '6135', display: 'Ketorolac', system: 'RxNorm' }
    ],
    severity: 'severe',
    reaction: 'Bronchospasm, urticaria, anaphylaxis',
    crossReactivity: 'High among NSAIDs, variable with COX-2 inhibitors',
    alternatives: 'Acetaminophen, tramadol'
  },
  
  // Opioid allergies
  {
    id: 'codeine-allergy',
    allergyCode: '387494007', // Codeine allergy (SNOMED)
    contraindicatedDrugs: [
      { code: '2670', display: 'Codeine', system: 'RxNorm' },
      { code: '5489', display: 'Hydrocodone', system: 'RxNorm' },
      { code: '8785', display: 'Oxycodone', system: 'RxNorm' }
    ],
    severity: 'moderate',
    reaction: 'Respiratory depression, pruritus, nausea',
    crossReactivity: 'Variable among opioids',
    alternatives: 'Fentanyl, morphine (if tolerated)'
  }
];

// Helper functions for checking interactions
export function checkDrugDrugInteraction(drug1Code, drug2Code) {
  for (let interaction of DRUG_DRUG_INTERACTIONS) {
    // Check direct drug-drug match
    if (interaction.drug1?.code === drug1Code && interaction.drug2?.code === drug2Code) {
      return interaction;
    }
    if (interaction.drug2?.code === drug1Code && interaction.drug1?.code === drug2Code) {
      return interaction;
    }
    
    // Check drug-class interactions
    if (interaction.drug1?.code === drug1Code && interaction.drugs2?.includes(drug2Code)) {
      return interaction;
    }
    if (interaction.drugs1?.includes(drug1Code) && interaction.drugs2?.includes(drug2Code)) {
      return interaction;
    }
  }
  return null;
}

export function checkDrugAllergyInteraction(drugCode, allergyCode) {
  for (let interaction of DRUG_ALLERGY_INTERACTIONS) {
    if (interaction.allergyCode === allergyCode) {
      const contraindicated = interaction.contraindicatedDrugs.find(d => d.code === drugCode);
      if (contraindicated) {
        return interaction;
      }
    }
  }
  return null;
}

// Get severity color for UI display
export function getSeverityColor(severity) {
  switch(severity) {
    case 'contraindicated': return '#d32f2f'; // red
    case 'severe': return '#f57c00'; // orange
    case 'moderate': return '#fbc02d'; // yellow
    case 'minor': return '#388e3c'; // green
    default: return '#757575'; // grey
  }
}

// Get severity icon for UI display
export function getSeverityIcon(severity) {
  switch(severity) {
    case 'contraindicated': return '⛔';
    case 'severe': return '⚠️';
    case 'moderate': return '⚡';
    case 'minor': return 'ℹ️';
    default: return '•';
  }
}