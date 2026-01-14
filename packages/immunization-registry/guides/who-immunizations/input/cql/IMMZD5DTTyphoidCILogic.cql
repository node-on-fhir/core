
/*
 * Library: IMMZD5DTTyphoidCILogic (IMMZ.D5.DT.Typhoid contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications		
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTTyphoidCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTTyphoidEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Typhoid dose
  */
  define "Draft Medication Request ID for Typhoid dose":
    First(Encounter."Draft Medication Request for Typhoid dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." then "Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance"
    when "Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note" then "Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note Guidance"
    when "Typhoid vaccination is contraindicated for Ty21a vaccine." then "Typhoid vaccination is contraindicated for Ty21a vaccine. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.":
  Encounter."The client has hypersensitivity to any component of the vaccine"

/*
@output: Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance
@guidance: Do not vaccinate client with typhoid if client has known hypersensitivity to any component of the vaccine.
*/
define "Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance":
  'Do not vaccinate client with typhoid if client has known hypersensitivity to any component of the vaccine.'

/*
@output: Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note
@pseudocode: "Immunization recommendation status" =  "Contraindicated" (where "Type of typhoid dose" = "Ty21a") AND "Immunization recommendation status" = "Further evaluation needed" (where "Type of typhoid dose" = "Typbar-TCV" OR "ViPS")
*/
define "Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note":
  Encounter."The client is currently pregnant"

/*
@output: Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note Guidance
@guidance: Do not vaccinate client with Ty21a vaccine as live attenuated Ty21a vaccine is contraindicated for pregnant clients. For Typbar-TCV or ViPS vaccine, check if an alternative typhoid vaccine is appropriate for the client, consider risks of vaccination and make a clinical judgement.
*/
define "Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note Guidance":
  'Do not vaccinate client with Ty21a vaccine as live attenuated Ty21a vaccine is contraindicated for pregnant clients. For Typbar-TCV or ViPS vaccine, check if an alternative typhoid vaccine is appropriate for the client, consider risks of vaccination and make a clinical judgement.'

/*
@output: Typhoid vaccination is contraindicated for Ty21a vaccine. Case 1
@pseudocode: "Immunization recommendation status" =  "Contraindicated" (where "Type of typhoid dose" = "Ty21a")
*/
define "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 1":
  Encounter."The client is currently taking antibiotics"

/*
@output: Typhoid vaccination is contraindicated for Ty21a vaccine. Case 2
@pseudocode: "Immunization recommendation status" =  "Contraindicated" (where "Type of typhoid dose" = "Ty21a")
*/
define "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 2":
  Encounter."The client's HIV status is positive"
    and Encounter."The client is not immunologically stable"

/*
@output: Typhoid vaccination is contraindicated for Ty21a vaccine.
@pseudocode: "Immunization recommendation status" =  "Contraindicated" (where "Type of typhoid dose" = "Ty21a")
*/
define "Typhoid vaccination is contraindicated for Ty21a vaccine.":
  "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 1"
    or "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 2"

/*
@output: Typhoid vaccination is contraindicated for Ty21a vaccine. Guidance
@guidance: Do not vaccinate client with Ty21a vaccine as Ty21a vaccine is contraindicated for clients who are taking antibiotics. Evaluate if other types of typhoid vacccines can be administered.
@guidance: Do not vaccinate client with Ty21a vaccine as Ty21a vaccine is contraindicated for HIV-infected client who are not immunologically stable.
*/
define "Typhoid vaccination is contraindicated for Ty21a vaccine. Guidance":
  case
    when "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 1" then 'Do not vaccinate client with Ty21a vaccine as Ty21a vaccine is contraindicated for clients who are taking antibiotics. Evaluate if other types of typhoid vacccines can be administered.'
    when "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 2" then 'Do not vaccinate client with Ty21a vaccine as Ty21a vaccine is contraindicated for HIV-infected client who are not immunologically stable.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '41.1' then "Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." and "Guidance" = 'Do not vaccinate client with typhoid if client has known hypersensitivity to any component of the vaccine.'
    when Patient.id = '42.1' then "Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note" and "Guidance" = 'Do not vaccinate client with Ty21a vaccine as live attenuated Ty21a vaccine is contraindicated for pregnant clients. For Typbar-TCV or ViPS vaccine, check if an alternative typhoid vaccine is appropriate for the client, consider risks of vaccination and make a clinical judgement.'
    when Patient.id = '43.1' then "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 1" and "Guidance" = 'Do not vaccinate client with Ty21a vaccine as Ty21a vaccine is contraindicated for clients who are taking antibiotics. Evaluate if other types of typhoid vacccines can be administered.'
    when Patient.id = '44.23' then "Typhoid vaccination is contraindicated for Ty21a vaccine. Case 2" and "Guidance" = 'Do not vaccinate client with Ty21a vaccine as Ty21a vaccine is contraindicated for HIV-infected client who are not immunologically stable.'
    else 'No test case set'
  end
