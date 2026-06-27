// npmPackages/allergy-testing/lib/allergyPanels.js
//
// Allergen test-panel definitions for the allergy-testing workflow.
//
// Three nested panels — Default ⊂ Standard ⊂ Deluxe — sourced from the
// "Standards and Profiles" guidance (Belgium allergy IG + US Core
// AllergyIntolerance, AAAAI / Mayo panel conventions). Each allergen is a plain
// data row that maps directly onto a FHIR AllergyIntolerance.code CodeableConcept:
//
//   { code, display, system: 'http://snomed.info/sct', category }
//
// category ∈ food | inhalant | medication | venom | environmental
//
// SNOMED CT codes are the substance/allergen-to concepts (… "allergy to X" /
// substance) commonly used for allergen coding. This file is isomorphic — no
// Meteor imports — so it can be consumed from client UI and server methods alike.

export const ALLERGEN_SYSTEM = 'http://snomed.info/sct';

// ---------------------------------------------------------------------------
// DEFAULT PANEL — core, most-common allergens (8 major foods, key inhalants,
// latex, penicillin). The triggers clinicians see first.
// ---------------------------------------------------------------------------
const DEFAULT_ALLERGENS = [
  // Major foods
  { code: '102263004', display: 'Eggs', category: 'food' },
  { code: '3718001',   display: "Cow's milk", category: 'food' },
  { code: '256349002', display: 'Peanut', category: 'food' },
  { code: '256350002', display: 'Tree nuts', category: 'food' },
  { code: '44027008',  display: 'Fish', category: 'food' },
  { code: '44027008',  display: 'Shellfish', category: 'food' },
  { code: '256355007', display: 'Soya bean', category: 'food' },
  { code: '256349002', display: 'Wheat', category: 'food' },
  // Key inhalants
  { code: '260147004', display: 'House dust mite', category: 'inhalant' },
  { code: '707598001', display: 'Cat dander', category: 'inhalant' },
  { code: '707599009', display: 'Dog dander', category: 'inhalant' },
  { code: '256277009', display: 'Grass pollen', category: 'inhalant' },
  { code: '256262001', display: 'Weed pollen', category: 'inhalant' },
  // Ubiquitous contact / drug
  { code: '111088007', display: 'Latex', category: 'environmental' },
  { code: '373270004', display: 'Penicillin', category: 'medication' }
];

// ---------------------------------------------------------------------------
// STANDARD PANEL — adds regional pollens, molds, insect venoms, and expanded
// drug classes on top of the Default panel.
// ---------------------------------------------------------------------------
const STANDARD_ADDITIONAL = [
  // Tree pollens
  { code: '256268001', display: 'Oak pollen', category: 'inhalant' },
  { code: '256266002', display: 'Birch pollen', category: 'inhalant' },
  { code: '256269009', display: 'Pine pollen', category: 'inhalant' },
  // Weeds & grasses
  { code: '256270005', display: 'Ragweed pollen', category: 'inhalant' },
  { code: '256264004', display: 'Timothy grass pollen', category: 'inhalant' },
  { code: '256263006', display: 'Bermuda grass pollen', category: 'inhalant' },
  // Indoor molds
  { code: '372198008', display: 'Alternaria mold', category: 'inhalant' },
  { code: '372199000', display: 'Aspergillus mold', category: 'inhalant' },
  { code: '372200002', display: 'Cladosporium mold', category: 'inhalant' },
  // Insect venoms
  { code: '407543005', display: 'Bee venom', category: 'venom' },
  { code: '407544004', display: 'Wasp venom', category: 'venom' },
  // Expanded drug classes
  { code: '768865002', display: 'Sulfonamide antibacterial', category: 'medication' },
  { code: '372665008', display: 'Non-steroidal anti-inflammatory agent', category: 'medication' }
];

// ---------------------------------------------------------------------------
// DELUXE PANEL — adds emerging/rare allergens, storage mites, and chemical /
// VOC exposures on top of the Standard panel.
// ---------------------------------------------------------------------------
const DELUXE_ADDITIONAL = [
  // Emerging / uncommon foods
  { code: '782594005', display: 'Alpha-gal (mammalian meat)', category: 'food' },
  { code: '227493005', display: 'Sesame seed', category: 'food' },
  { code: '227316005', display: 'Legumes', category: 'food' },
  // Additional inhalants
  { code: '260152006', display: 'Storage mite', category: 'inhalant' },
  { code: '707597006', display: 'Horse dander', category: 'inhalant' },
  { code: '722944006', display: 'Outdoor mold (hay/field)', category: 'inhalant' },
  // Additional venom / contact
  { code: '424213003', display: 'Fire ant sting', category: 'venom' },
  // Chemicals / VOCs (typically user-reported contact exposures)
  { code: '67455001',  display: 'Formaldehyde', category: 'environmental' },
  { code: '36717003',  display: 'Isocyanate', category: 'environmental' },
  { code: '47384004',  display: 'Ammonia', category: 'environmental' },
  { code: '83036002',  display: 'Solvent (paints/glues)', category: 'environmental' }
];

export const DEFAULT_PANEL = DEFAULT_ALLERGENS.map(function(a) {
  return Object.assign({ system: ALLERGEN_SYSTEM }, a);
});

export const STANDARD_PANEL = DEFAULT_PANEL.concat(
  STANDARD_ADDITIONAL.map(function(a) {
    return Object.assign({ system: ALLERGEN_SYSTEM }, a);
  })
);

export const DELUXE_PANEL = STANDARD_PANEL.concat(
  DELUXE_ADDITIONAL.map(function(a) {
    return Object.assign({ system: ALLERGEN_SYSTEM }, a);
  })
);

// Lookup by panel level key.
export const PANELS = {
  default: { label: 'Default', description: 'Core, most-common allergens', allergens: DEFAULT_PANEL },
  standard: { label: 'Standard', description: 'Adds regional pollens, molds, venoms, drug classes', allergens: STANDARD_PANEL },
  deluxe: { label: 'Deluxe', description: 'Adds emerging allergens, storage mites, chemicals/VOCs', allergens: DELUXE_PANEL }
};

// US Core "No known allergy" sentinel.
export const NO_KNOWN_ALLERGY = {
  code: '716186003',
  display: 'No known allergy',
  system: ALLERGEN_SYSTEM
};

// Stable key for an allergen row (code + display, since some SNOMED codes repeat
// across display labels in the curated lists above).
export function allergenKey(allergen) {
  return (allergen.code || '') + '|' + (allergen.display || '');
}
