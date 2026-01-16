
/*
 * Library: IMMZD5DTSeasonalinfluenzaCILogic (IMMZ.D5.DT.Seasonal influenza contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTSeasonalinfluenzaCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTSeasonalinfluenzaEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Seasonal influenza dose
  */
  define "Draft Medication Request ID for Seasonal influenza dose":
    First(Encounter."Draft Medication Request for Seasonal influenza dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1":
  Encounter."The client has a history of anaphylactic reactions"

/*
@output: Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2":
  Encounter."The client has a history of severe allergic reactions after a previous dose or to a vaccine component"

/*
@output: Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1"
    or "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2"

/*
@output: Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with seasonal influenza if client has had a severe allergic reaction (e.g. anaphylaxis) after a previous dose or to a vaccine component. 
@guidance: Do not vaccinate client with seasonal influenza if client has had a severe allergic reaction (e.g. anaphylaxis) after a previous dose or to a vaccine component. 
*/
define "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  case
    when "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1" then 'Do not vaccinate client with seasonal influenza if client has had a severe allergic reaction (e.g. anaphylaxis) after a previous dose or to a vaccine component. '
    when "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2" then 'Do not vaccinate client with seasonal influenza if client has had a severe allergic reaction (e.g. anaphylaxis) after a previous dose or to a vaccine component. '
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '21.0' then "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1" and "Guidance" = 'Do not vaccinate client with seasonal influenza if client has had a severe allergic reaction (e.g. anaphylaxis) after a previous dose or to a vaccine component. '
    when Patient.id = '22.0' then "Seasonal influenza vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2" and "Guidance" = 'Do not vaccinate client with seasonal influenza if client has had a severe allergic reaction (e.g. anaphylaxis) after a previous dose or to a vaccine component. '
    else 'No test case set'
  end
