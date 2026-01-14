
/*
 * Library: IMMZD5DTVaricellaCILogic (IMMZ.D5.DT.Varicella contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTVaricellaCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTVaricellaEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Varicella dose
  */
  define "Draft Medication Request ID for Varicella dose":
    First(Encounter."Draft Medication Request for Varicella dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Varicella vaccination is contraindicated" then "Varicella vaccination is contraindicated Guidance"
    when "Clinical judgement is required. Create clinical note" then "Clinical judgement is required. Create clinical note Guidance"
    when "Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note" then "Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Varicella vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Varicella vaccination is contraindicated":
  Encounter."The client is currently pregnant"

/*
@output: Varicella vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with varicella as varicella vaccination is contraindicated for pregnant client.
*/
define "Varicella vaccination is contraindicated Guidance":
  'Do not vaccinate client with varicella as varicella vaccination is contraindicated for pregnant client.'

/*
@output: Clinical judgement is required. Create clinical note Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create clinical note Case 1":
  Encounter."The client is planning to get pregnant in the next month"

/*
@output: Clinical judgement is required. Create clinical note Case 2
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create clinical note Case 2":
  Encounter."The client is immunocompromised"

/*
@output: Clinical judgement is required. Create clinical note Case 3
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create clinical note Case 3":
  Encounter."The client is receiving or has received medications that may be immunosuppressive"

/*
@output: Clinical judgement is required. Create clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create clinical note":
  "Clinical judgement is required. Create clinical note Case 1"
    or "Clinical judgement is required. Create clinical note Case 2"
    or "Clinical judgement is required. Create clinical note Case 3"

/*
@output: Clinical judgement is required. Create clinical note Guidance
@guidance: Discuss pregnancy intentions, consider risks of vaccination and make a clinical judgement. It is recommended to delay pregnancy for 4 weeks after vaccination.
@guidance: Client is immunocompromised, consider risks of vaccination and make a judgement. Consider 2 dose schedule.
@guidance: Client is receiving or has received medications that may be immunosuppressive, consider risks of vaccination and make a judgement.
*/
define "Clinical judgement is required. Create clinical note Guidance":
  case
    when "Clinical judgement is required. Create clinical note Case 1" then 'Discuss pregnancy intentions, consider risks of vaccination and make a clinical judgement. It is recommended to delay pregnancy for 4 weeks after vaccination.'
    when "Clinical judgement is required. Create clinical note Case 2" then 'Client is immunocompromised, consider risks of vaccination and make a judgement. Consider 2 dose schedule.'
    when "Clinical judgement is required. Create clinical note Case 3" then 'Client is receiving or has received medications that may be immunosuppressive, consider risks of vaccination and make a judgement.'
    else ''
  end

/*
@output: Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note":
  Encounter."The client has immune deficiency"

/*
@output: Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note Guidance
@guidance: Varicella vaccination is usually contraindicated in clients with congenital or acquired immune deficiencies. Consider risks of vaccination and make a judgement.
*/
define "Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note Guidance":
  'Varicella vaccination is usually contraindicated in clients with congenital or acquired immune deficiencies. Consider risks of vaccination and make a judgement.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '34.1' then "Varicella vaccination is contraindicated" and "Guidance" = 'Do not vaccinate client with varicella as varicella vaccination is contraindicated for pregnant client.'
    when Patient.id = '35.1' then "Clinical judgement is required. Create clinical note Case 1" and "Guidance" = 'Discuss pregnancy intentions, consider risks of vaccination and make a clinical judgement. It is recommended to delay pregnancy for 4 weeks after vaccination.'
    when Patient.id = '36.1' then "Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note" and "Guidance" = 'Varicella vaccination is usually contraindicated in clients with congenital or acquired immune deficiencies. Consider risks of vaccination and make a judgement.'
    when Patient.id = '37.1' then "Clinical judgement is required. Create clinical note Case 2" and "Guidance" = 'Client is immunocompromised, consider risks of vaccination and make a judgement. Consider 2 dose schedule.'
    when Patient.id = '38.1' then "Clinical judgement is required. Create clinical note Case 3" and "Guidance" = 'Client is receiving or has received medications that may be immunosuppressive, consider risks of vaccination and make a judgement.'
    else 'No test case set'
  end
