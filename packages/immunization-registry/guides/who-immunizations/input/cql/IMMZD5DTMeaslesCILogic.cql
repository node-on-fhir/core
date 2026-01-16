
/*
 * Library: IMMZD5DTMeaslesCILogic (IMMZ.D5.DT.Measles contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due
 * Decision Table: IMMZ.D5.DT.Measles contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTMeaslesCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTMeaslesEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Draft Medication Request ID for MCV dose
*/
define "Draft Medication Request ID for MCV dose":
	First(Encounter."Draft Medication Request for MCV dose").id

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Measles vaccination contraindicated" then "Measles vaccination contraindicated Guidance"
    when "Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note" then "Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note Guidance"
    when "Clinical judgement required. Create a clinical note" then "Clinical judgement required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Measles vaccination contraindicated Case 1
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Measles vaccination contraindicated Case 1":
  Encounter."The client is pregnant"

/*
@output: Measles vaccination contraindicated Case 2
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Measles vaccination contraindicated Case 2":
  Encounter."The client is severely immunosuppressed"

/*
@output: Measles vaccination contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Measles vaccination contraindicated":
  "Measles vaccination contraindicated Case 1"
    or "Measles vaccination contraindicated Case 2"

/*
@output: Measles vaccination contraindicated Guidance
@guidance: Do not vaccinate client with measles as measles vaccination is contraindicated for pregnant client.
@guidance: Do not vaccinate client with measles as measles vaccination is contraindicated for severely immunosuppressed client.
*/
define "Measles vaccination contraindicated Guidance":
  case
    when "Measles vaccination contraindicated Case 1" then 'Do not vaccinate client with measles as measles vaccination is contraindicated for pregnant client.'
    when "Measles vaccination contraindicated Case 2" then 'Do not vaccinate client with measles as measles vaccination is contraindicated for severely immunosuppressed client.'
    else ''
  end

/*
@output: Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note":
  Encounter."The client has history of anaphylactic reactions"

/*
@output: Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note Guidance
@guidance: Do not vaccinate client with measles if client has history of anaphylactic reaction to any component of the vaccine (e.g. neomycin or gelatin).
*/
define "Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note Guidance":
  'Do not vaccinate client with measles if client has history of anaphylactic reaction to any component of the vaccine (e.g. neomycin or gelatin).'

/*
@output: Clinical judgement required. Create a clinical note Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement required. Create a clinical note Case 1":
  Encounter."The client has history of severe allergic reactions"

/*
@output: Clinical judgement required. Create a clinical note Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement required. Create a clinical note Case 2":
  Encounter."The client has a symptomatic HIV infection"

/*
@output: Clinical judgement required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement required. Create a clinical note":
  "Clinical judgement required. Create a clinical note Case 1"
    or "Clinical judgement required. Create a clinical note Case 2"

/*
@output: Clinical judgement required. Create a clinical note Guidance
@guidance: Do not vaccinate client with measles if client has history of severe allergic reactions to any component of the vaccine (e.g. neomycin or gelatin).
@guidance: Client has symptomatic HIV infection. Measles vaccination may be considered if the client is not severely immunosuppressed according to conventional definitions, consider risks of vaccination and make a clinical judgement.
*/
define "Clinical judgement required. Create a clinical note Guidance":
  case
    when "Clinical judgement required. Create a clinical note Case 1" then 'Do not vaccinate client with measles if client has history of severe allergic reactions to any component of the vaccine (e.g. neomycin or gelatin).'
    when "Clinical judgement required. Create a clinical note Case 2" then 'Client has symptomatic HIV infection. Measles vaccination may be considered if the client is not severely immunosuppressed according to conventional definitions, consider risks of vaccination and make a clinical judgement.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '56.CI162' then "Measles vaccination contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with measles as measles vaccination is contraindicated for pregnant client.'
    when Patient.id = '57.CI166' then "Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with measles if client has history of anaphylactic reaction to any component of the vaccine (e.g. neomycin or gelatin).'
    when Patient.id = '58.CI167' then "Clinical judgement required. Create a clinical note Case 1" and "Guidance" = 'Do not vaccinate client with measles if client has history of severe allergic reactions to any component of the vaccine (e.g. neomycin or gelatin).'
    when Patient.id = '59.CI165' then "Measles vaccination contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with measles as measles vaccination is contraindicated for severely immunosuppressed client.'
    when Patient.id = '60.CI168' then "Clinical judgement required. Create a clinical note Case 2" and "Guidance" = 'Client has symptomatic HIV infection. Measles vaccination may be considered if the client is not severely immunosuppressed according to conventional definitions, consider risks of vaccination and make a clinical judgement.'
    else 'No test case set'
  end
