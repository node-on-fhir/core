
/*
 * Library: IMMZD5DTRubellaCILogic (IMMZ.D5.DT.Rubella contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTRubellaCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTRubellaEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Rubella dose
  */
  define "Draft Medication Request ID for Rubella dose":
    First(Encounter."Draft Medication Request for Rubella dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Rubella vaccination is contraindicated" then "Rubella vaccination is contraindicated Guidance"
    when "Clinical judgement is required. Create a clinical note" then "Clinical judgement is required. Create a clinical note Guidance"
    when "Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Rubella vaccination is contraindicated Case 1
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rubella vaccination is contraindicated Case 1":
  Encounter."The client is currently pregnant"

/*
@output: Rubella vaccination is contraindicated Case 2
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rubella vaccination is contraindicated Case 2":
  Encounter."The client is receiving blood products"

/*
@output: Rubella vaccination is contraindicated Case 3
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rubella vaccination is contraindicated Case 3":
  Encounter."The client has symptomatic HIV infection"

/*
@output: Rubella vaccination is contraindicated Case 4
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rubella vaccination is contraindicated Case 4":
  Encounter."The client has TB disease"

/*
@output: Rubella vaccination is contraindicated Case 5
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rubella vaccination is contraindicated Case 5":
  Encounter."The client has immunodeficiency syndromes"

/*
@output: Rubella vaccination is contraindicated Case 6
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rubella vaccination is contraindicated Case 6":
  Encounter."The client is exposed to immunosuppressive treatment"

/*
@output: Rubella vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rubella vaccination is contraindicated":
  "Rubella vaccination is contraindicated Case 1"
    or "Rubella vaccination is contraindicated Case 2"
    or "Rubella vaccination is contraindicated Case 3"
    or "Rubella vaccination is contraindicated Case 4"
    or "Rubella vaccination is contraindicated Case 5"
    or "Rubella vaccination is contraindicated Case 6"

/*
@output: Rubella vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with rubella as rubella vaccination is contraindicated for pregnant client.
@guidance: Do not vaccinate client with rubella as rubella vaccination is contraindicated until at least 3 months after stopping receiving blood products.
@guidance: Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with symptomatic HIV infection.
@guidance: Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with active TB.
@guidance: Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with severe immunodeficiency.
@guidance: Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients receiving or exposed to immunosuppressive therapy.
*/
define "Rubella vaccination is contraindicated Guidance":
  case
    when "Rubella vaccination is contraindicated Case 1" then 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for pregnant client.'
    when "Rubella vaccination is contraindicated Case 2" then 'Do not vaccinate client with rubella as rubella vaccination is contraindicated until at least 3 months after stopping receiving blood products.'
    when "Rubella vaccination is contraindicated Case 3" then 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with symptomatic HIV infection.'
    when "Rubella vaccination is contraindicated Case 4" then 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with active TB.'
    when "Rubella vaccination is contraindicated Case 5" then 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with severe immunodeficiency.'
    when "Rubella vaccination is contraindicated Case 6" then 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients receiving or exposed to immunosuppressive therapy.'
    else ''
  end

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  Encounter."The client is planning to get pregnant in next month"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: Discuss pregnancy intentions with client, consider risks of vaccination and make a clinical judgement. Clients planning a pregnancy are advised to avoid pregnancy for 1 month after rubella vaccination.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  'Discuss pregnancy intentions with client, consider risks of vaccination and make a clinical judgement. Clients planning a pregnancy are advised to avoid pregnancy for 1 month after rubella vaccination.'

/*
@output: Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has history of severe allergic reactions"

/*
@output: Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with rubella if client has experienced a severe allergic reaction after a previous vaccine dose or vaccine component.
*/
define "Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with rubella if client has experienced a severe allergic reaction after a previous vaccine dose or vaccine component.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '28.1' then "Rubella vaccination is contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for pregnant client.'
    when Patient.id = '29.1' then "Clinical judgement is required. Create a clinical note" and "Guidance" = 'Discuss pregnancy intentions with client, consider risks of vaccination and make a clinical judgement. Clients planning a pregnancy are advised to avoid pregnancy for 1 month after rubella vaccination.'
    when Patient.id = '30.1' then "Rubella vaccination is contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with rubella as rubella vaccination is contraindicated until at least 3 months after stopping receiving blood products.'
    when Patient.id = '31.1' then "Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with rubella if client has experienced a severe allergic reaction after a previous vaccine dose or vaccine component.'
    when Patient.id = '32.1' then "Rubella vaccination is contraindicated Case 3" and "Guidance" = 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with symptomatic HIV infection.'
    when Patient.id = '33.1' then "Rubella vaccination is contraindicated Case 4" and "Guidance" = 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with active TB.'
    when Patient.id = '34.1' then "Rubella vaccination is contraindicated Case 5" and "Guidance" = 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients with severe immunodeficiency.'
    when Patient.id = '35.1' then "Rubella vaccination is contraindicated Case 6" and "Guidance" = 'Do not vaccinate client with rubella as rubella vaccination is contraindicated for clients receiving or exposed to immunosuppressive therapy.'
    else 'No test case set'
  end
