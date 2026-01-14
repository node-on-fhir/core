
/*
 * Library: IMMZD5DTMumpsCILogic (IMMZ.D5.DT.Mumps contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTMumpsCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTMumpsEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Mumps dose
  */
  define "Draft Medication Request ID for Mumps dose":
    First(Encounter."Draft Medication Request for Mumps dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Mumps vaccination is contraindicated" then "Mumps vaccination is contraindicated Guidance"
    when "Mumps vaccination could be contraindicated. Clinical judgement is required." then "Mumps vaccination could be contraindicated. Clinical judgement is required. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Mumps vaccination is contraindicated Case 1
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Mumps vaccination is contraindicated Case 1":
  Encounter."The client is currently pregnant"

/*
@output: Mumps vaccination is contraindicated Case 2
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Mumps vaccination is contraindicated Case 2":
  Encounter."The client has immune deficiency"

/*
@output: Mumps vaccination is contraindicated Case 3
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Mumps vaccination is contraindicated Case 3":
  Encounter."The client is severely immunosuppressed"

/*
@output: Mumps vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Mumps vaccination is contraindicated":
  "Mumps vaccination is contraindicated Case 1"
    or "Mumps vaccination is contraindicated Case 2"
    or "Mumps vaccination is contraindicated Case 3"

/*
@output: Mumps vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with mumps as mumps vaccination is contraindicated for pregnant individuals.
@guidance: Do not vaccinate client with mumps as mumps vaccination is contraindicated in individuals with immunodeficiency syndromes.
@guidance: Do not vaccinate client with mumps as mumps vaccination is contraindicated in immunosuppressed individuals.
*/
define "Mumps vaccination is contraindicated Guidance":
  case
    when "Mumps vaccination is contraindicated Case 1" then 'Do not vaccinate client with mumps as mumps vaccination is contraindicated for pregnant individuals.'
    when "Mumps vaccination is contraindicated Case 2" then 'Do not vaccinate client with mumps as mumps vaccination is contraindicated in individuals with immunodeficiency syndromes.'
    when "Mumps vaccination is contraindicated Case 3" then 'Do not vaccinate client with mumps as mumps vaccination is contraindicated in immunosuppressed individuals.'
    else ''
  end

/*
@output: Mumps vaccination could be contraindicated. Clinical judgement is required.
@pseudocode: Create a clinical note.
*/
define "Mumps vaccination could be contraindicated. Clinical judgement is required.":
  Encounter."The client has allergy to vaccine components"

/*
@output: Mumps vaccination could be contraindicated. Clinical judgement is required. Guidance
@guidance: Do not vaccinate client with mumps if client has allergy to vaccine components, such as neomycin and gelatin.
*/
define "Mumps vaccination could be contraindicated. Clinical judgement is required. Guidance":
  'Do not vaccinate client with mumps if client has allergy to vaccine components, such as neomycin and gelatin.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '20.1' then "Mumps vaccination is contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with mumps as mumps vaccination is contraindicated for pregnant individuals.'
    when Patient.id = '21.1' then "Mumps vaccination could be contraindicated. Clinical judgement is required." and "Guidance" = 'Do not vaccinate client with mumps if client has allergy to vaccine components, such as neomycin and gelatin.'
    when Patient.id = '22.1' then "Mumps vaccination is contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with mumps as mumps vaccination is contraindicated in individuals with immunodeficiency syndromes.'
    when Patient.id = '23.1' then "Mumps vaccination is contraindicated Case 3" and "Guidance" = 'Do not vaccinate client with mumps as mumps vaccination is contraindicated in immunosuppressed individuals.'
    else 'No test case set'
  end
