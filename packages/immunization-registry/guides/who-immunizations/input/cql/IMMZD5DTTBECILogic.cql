
/*
 * Library: IMMZD5DTTBECILogic (IMMZ.D5.DT.TBE contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTTBECILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTTBEEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for TBE dose
  */
  define "Draft Medication Request ID for TBE dose":
    First(Encounter."Draft Medication Request for TBE dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Clinical judgement is required. Create a clinical note" then "Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Clinical judgement is required. Create a clinical note Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 1":
  Encounter."The client is currently pregnant"

/*
@output: Clinical judgement is required. Create a clinical note Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 2":
  Encounter."The client has moderate to severe fever"

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  "Clinical judgement is required. Create a clinical note Case 1"
    or "Clinical judgement is required. Create a clinical note Case 2"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: Conduct a risk–benefit assessment considering the incidence of the disease,  consider risks of vaccination and make a clinical judgement.
@guidance: Consider postponing the vaccination if the client has fever > 38.5°C or other signs of serious disease. Consider risks of vaccination and make a clinical judgement.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  case
    when "Clinical judgement is required. Create a clinical note Case 1" then 'Conduct a risk–benefit assessment considering the incidence of the disease,  consider risks of vaccination and make a clinical judgement.'
    when "Clinical judgement is required. Create a clinical note Case 2" then 'Consider postponing the vaccination if the client has fever > 38.5°C or other signs of serious disease. Consider risks of vaccination and make a clinical judgement.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '69.0' then "Clinical judgement is required. Create a clinical note Case 1" and "Guidance" = 'Conduct a risk–benefit assessment considering the incidence of the disease,  consider risks of vaccination and make a clinical judgement.'
    when Patient.id = '70.0' then "Clinical judgement is required. Create a clinical note Case 2" and "Guidance" = 'Consider postponing the vaccination if the client has fever > 38.5°C or other signs of serious disease. Consider risks of vaccination and make a clinical judgement.'
    else 'No test case set'
  end
