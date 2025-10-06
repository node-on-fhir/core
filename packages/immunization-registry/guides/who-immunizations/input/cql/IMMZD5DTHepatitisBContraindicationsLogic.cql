/*
 * Library: IMMZD5DTHepatitisBContraindicationsLogic (IMMZ.D5.DT.Hepatitis B contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due
 * Decision Table: IMMZ.D5.DT.Hepatitis B contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTHepatitisBContraindicationsLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTHepatitisBEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Hepatitis B dose
  */
  define "Draft Medication Request ID for Hepatitis B dose":
    First(Encounter."Draft Medication Request for Hepatitis B dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case 
    when "Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." then "Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance" 
    else ''
  end
  
define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.":
  Encounter."The client has history of severe allergic reactions"

/*
@output: Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance
@guidance: Do not vaccinate client with hepatitis B if the client had a history of serious allergic reactions to any of the vaccine components. Allergy to yeast is considered a contraindication to immunization with yeast-produced hepatitis B-containing vaccine.
*/
define "Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance":
  'Do not vaccinate client with hepatitis B if the client had a history of serious allergic reactions to any of the vaccine components. Allergy to yeast is considered a contraindication to immunization with yeast-produced hepatitis B-containing vaccine.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'HepatitisB62.1' then "Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." and "Guidance" = 'Do not vaccinate client with hepatitis B if the client had a history of serious allergic reactions to any of the vaccine components. Allergy to yeast is considered a contraindication to immunization with yeast-produced hepatitis B-containing vaccine.'
    else 'No test case set'
  end
