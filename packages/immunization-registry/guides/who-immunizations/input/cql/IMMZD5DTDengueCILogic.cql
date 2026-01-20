
/*
 * Library: IMMZD5DTDengueCILogic (IMMZ.D5.DT.Dengue contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTDengueCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTDengueEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Dengue dose
  */
  define "Draft Medication Request ID for Dengue dose":
    First(Encounter."Draft Medication Request for Dengue dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Dengue vaccination is contraindicated" then "Dengue vaccination is contraindicated Guidance"
    when "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." then "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Dengue vaccination is contraindicated Case 1
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated Case 1":
  Encounter."The client is immunocompromised"

/*
@output: Dengue vaccination is contraindicated Case 2
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated Case 2":
  Encounter."The client is severely immunocompromised"

/*
@output: Dengue vaccination is contraindicated Case 3
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated Case 3":
  Encounter."The client is currently pregnant"

/*
@output: Dengue vaccination is contraindicated Case 4
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated Case 4":
  Encounter."The client is currently lactating"

/*
@output: Dengue vaccination is contraindicated Case 5
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated Case 5":
  Encounter."The client has immunodeficiency syndromes"

/*
@output: Dengue vaccination is contraindicated Case 6
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated Case 6":
  Encounter."The client is severely immunosuppressed"

/*
@output: Dengue vaccination is contraindicated Case 7
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated Case 7":
  Encounter."The client has symptomatic HIV infection"

/*
@output: Dengue vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Dengue vaccination is contraindicated":
  "Dengue vaccination is contraindicated Case 1"
    or "Dengue vaccination is contraindicated Case 2"
    or "Dengue vaccination is contraindicated Case 3"
    or "Dengue vaccination is contraindicated Case 4"
    or "Dengue vaccination is contraindicated Case 5"
    or "Dengue vaccination is contraindicated Case 6"
    or "Dengue vaccination is contraindicated Case 7"

/*
@output: Dengue vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals
@guidance: Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals
@guidance: Do not vaccinate client with dengue as dengue vaccination is contraindicated for pregnant women.
@guidance: Do not vaccinate client with dengue as dengue vaccination is contraindicated for lactating women.
@guidance: Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals
@guidance: Do not vaccinate client with dengue as dengue vaccination is contraindicated in severely immunosuppresed individuals.
@guidance: Do not vaccinate client with dengue as dengue vaccination is contraindicated in individuals with symptomatic HIV.
*/
define "Dengue vaccination is contraindicated Guidance":
  case
    when "Dengue vaccination is contraindicated Case 1" then 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals'
    when "Dengue vaccination is contraindicated Case 2" then 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals'
    when "Dengue vaccination is contraindicated Case 3" then 'Do not vaccinate client with dengue as dengue vaccination is contraindicated for pregnant women.'
    when "Dengue vaccination is contraindicated Case 4" then 'Do not vaccinate client with dengue as dengue vaccination is contraindicated for lactating women.'
    when "Dengue vaccination is contraindicated Case 5" then 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals'
    when "Dengue vaccination is contraindicated Case 6" then 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in severely immunosuppresed individuals.'
    when "Dengue vaccination is contraindicated Case 7" then 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in individuals with symptomatic HIV.'
    else ''
  end

/*
@output: Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1":
  Encounter."The client has history of severe allergic reactions"

/*
@output: Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2":
  Encounter."The client has history of anaphylactic reactions"

/*
@output: Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.":
  "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1"
    or "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2"

/*
@output: Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance
@guidance: Do not vaccinate client with dengue if client has had a severe allergic reaction to any component of the dengue vaccine or after prior administration of the dengue vaccine.
@guidance: Do not vaccinate for dengue if client has had a severe allergic reaction to any component of the dengue vaccine or after prior administration of the dengue vaccine.
*/
define "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance":
  case
    when "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1" then 'Do not vaccinate client with dengue if client has had a severe allergic reaction to any component of the dengue vaccine or after prior administration of the dengue vaccine.'
    when "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2" then 'Do not vaccinate for dengue if client has had a severe allergic reaction to any component of the dengue vaccine or after prior administration of the dengue vaccine.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '37.1' then "Dengue vaccination is contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals'
    when Patient.id = '38.1' then "Dengue vaccination is contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals'
    when Patient.id = '39.1' then "Dengue vaccination is contraindicated Case 3" and "Guidance" = 'Do not vaccinate client with dengue as dengue vaccination is contraindicated for pregnant women.'
    when Patient.id = '40.1' then "Dengue vaccination is contraindicated Case 4" and "Guidance" = 'Do not vaccinate client with dengue as dengue vaccination is contraindicated for lactating women.'
    when Patient.id = '41.1' then "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1" and "Guidance" = 'Do not vaccinate client with dengue if client has had a severe allergic reaction to any component of the dengue vaccine or after prior administration of the dengue vaccine.'
    when Patient.id = '42.1' then "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2" and "Guidance" = 'Do not vaccinate for dengue if client has had a severe allergic reaction to any component of the dengue vaccine or after prior administration of the dengue vaccine.'
    when Patient.id = '43.1' then "Dengue vaccination is contraindicated Case 5" and "Guidance" = 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in immunocompromised individuals'
    when Patient.id = '44.1' then "Dengue vaccination is contraindicated Case 6" and "Guidance" = 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in severely immunosuppresed individuals.'
    when Patient.id = '45.1' then "Dengue vaccination is contraindicated Case 7" and "Guidance" = 'Do not vaccinate client with dengue as dengue vaccination is contraindicated in individuals with symptomatic HIV.'
    else 'No test case set'
  end
