
/*
 * Library: IMMZD5DTHepatitisACILogic (IMMZ.D5.DT.Hepatitis A contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTHepatitisACILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTHepatitisAEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Hepatitis A dose
  */
  define "Draft Medication Request ID for Hepatitis A dose":
    First(Encounter."Draft Medication Request for Hepatitis A dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Live attentuated Hepatitis A-containing vaccine is contraindicated" then "Live attentuated Hepatitis A-containing vaccine is contraindicated Guidance"
    when "Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Live attentuated Hepatitis A-containing vaccine is contraindicated Case 1
@pseudocode: "Immunization recommendation status" = "Contraindicated" (where "Type of hepatitis A dose" = "Live attenuated hepatitis A vaccine")
*/
define "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 1":
  Encounter."The client is currently pregnant"

/*
@output: Live attentuated Hepatitis A-containing vaccine is contraindicated Case 2
@pseudocode: "Immunization recommendation status" = "Contraindicated" (where "Type of hepatitis A dose" = "Live attenuated hepatitis A vaccine")
*/
define "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 2":
  Encounter."The client is severely immunocompromised"

/*
@output: Live attentuated Hepatitis A-containing vaccine is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated" (where "Type of hepatitis A dose" = "Live attenuated hepatitis A vaccine")
*/
define "Live attentuated Hepatitis A-containing vaccine is contraindicated":
  "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 1"
    or "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 2"

/*
@output: Live attentuated Hepatitis A-containing vaccine is contraindicated Guidance
@guidance: Do not vaccinate client with hepatitis A as hepatitis A  vaccination is contraindicated for pregnant client and may pose a theoretical risk to the developing fetus.
@guidance: Do not vaccinate client with hepatitis A as hepatitis A  vaccination is contraindicated for severely immunocompromised clients.
*/
define "Live attentuated Hepatitis A-containing vaccine is contraindicated Guidance":
  case
    when "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 1" then 'Do not vaccinate client with hepatitis A as hepatitis A  vaccination is contraindicated for pregnant client and may pose a theoretical risk to the developing fetus.'
    when "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 2" then 'Do not vaccinate client with hepatitis A as hepatitis A  vaccination is contraindicated for severely immunocompromised clients.'
    else ''
  end

/*
@output: Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has a history of severe allergic reactions"

/*
@output: Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with inactivated hepatitis A vaccination if client has had a severe allergic reaction to the previous dose.
Do not vaccinate client with live attenuated hepatitis A vaccination if client has severe allergy to components included in the live attenuated hepatitis A-containing vaccines.
*/
define "Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with inactivated hepatitis A vaccination if client has had a severe allergic reaction to the previous dose.
Do not vaccinate client with live attenuated hepatitis A vaccination if client has severe allergy to components included in the live attenuated hepatitis A-containing vaccines.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '39.0' then "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with hepatitis A as hepatitis A  vaccination is contraindicated for pregnant client and may pose a theoretical risk to the developing fetus.'
    when Patient.id = '40.0' then "Live attentuated Hepatitis A-containing vaccine is contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with hepatitis A as hepatitis A  vaccination is contraindicated for severely immunocompromised clients.'
    when Patient.id = '41.0' then "Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with inactivated hepatitis A vaccination if client has had a severe allergic reaction to the previous dose.
Do not vaccinate client with live attenuated hepatitis A vaccination if client has severe allergy to components included in the live attenuated hepatitis A-containing vaccines.'
    else 'No test case set'
  end
