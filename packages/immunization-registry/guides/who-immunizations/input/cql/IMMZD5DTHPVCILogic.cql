
/*
 * Library: IMMZD5DTHPVCILogic (IMMZ.D5.DT.HPV contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTHPVCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTHPVEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for HPV dose
  */
  define "Draft Medication Request ID for HPV dose":
    First(Encounter."Draft Medication Request for HPV dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Human papillomavirus (HPV) vaccination is contraindicated" then "Human papillomavirus (HPV) vaccination is contraindicated Guidance"
    when "HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Human papillomavirus (HPV) vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Human papillomavirus (HPV) vaccination is contraindicated":
  Encounter."The client is currently pregnant"

/*
@output: Human papillomavirus (HPV) vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with HPV as HPV vaccination is contraindicated for pregnant client.
*/
define "Human papillomavirus (HPV) vaccination is contraindicated Guidance":
  'Do not vaccinate client with HPV as HPV vaccination is contraindicated for pregnant client.'

/*
@output: HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has history of severe allergic reactions"

/*
@output: HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with HPV if client has history of a severe allergic reaction after a previous HPV vaccine dose, or to a component of the vaccine.
*/
define "HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with HPV if client has history of a severe allergic reaction after a previous HPV vaccine dose, or to a component of the vaccine.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '45.0' then "Human papillomavirus (HPV) vaccination is contraindicated" and "Guidance" = 'Do not vaccinate client with HPV as HPV vaccination is contraindicated for pregnant client.'
    when Patient.id = '46.0' then "HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with HPV if client has history of a severe allergic reaction after a previous HPV vaccine dose, or to a component of the vaccine.'
    else 'No test case set'
  end
