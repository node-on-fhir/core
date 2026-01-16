/*
 * Library: IMMZD5DTBCGContraindicationsLogic (IMMZ.D5.DT.BCG contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due
 * Decision Table: IMMZ.D5.DT.BCG contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTBCGContraindicationsLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTBCGEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for BCG dose
  */
  define "Draft Medication Request ID for BCG dose":
    First(Encounter."Draft Medication Request for BCG dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case 
    when "Bacille Calmette–Guérin (BCG) vaccination is contraindicated" then "Bacille Calmette–Guérin (BCG) vaccination is contraindicated Guidance"
    when "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." then "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance"
    when "BCG vaccination is contraindicated" then "BCG vaccination is contraindicated Guidance" 
    else ''
  end
  
define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Bacille Calmette–Guérin (BCG) vaccination is contraindicated
@pseudocode: '"Immunization recommendation status" = "Contraindicated"
*/
define "Bacille Calmette–Guérin (BCG) vaccination is contraindicated":
  Encounter."The client is pregnant"

/*
@output: Bacille Calmette–Guérin (BCG) vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with BCG as BCG vaccination is not recommended during pregnancy
*/
define "Bacille Calmette–Guérin (BCG) vaccination is contraindicated Guidance":
  'Do not vaccinate client with BCG as BCG vaccination is not recommended during pregnancy'

/*
@output: BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1":
  Encounter."The client has history of severe allergic reactions"

/*
@output: BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2":
  Encounter."The client is exposed to immunosuppressive treatment"
    and Encounter."Client's age is more than or equal to 1 year"

/*
@output: BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.":
  "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1"
    or "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2"

/*
@output: BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance
@guidance = Do not vaccinate client with BCG if the client had previous allergic reaction to any component of the vaccine
@guidance = Do not vaccinate client with BCG if client is exposed to or receives immunosuppressive treatment
*/
define "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance":
  case
    when "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1" then 'Do not vaccinate client with BCG if the client had previous allergic reaction to any component of the vaccine'
    when "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2" then 'Do not vaccinate client with BCG if client is exposed to or receives immunosuppressive treatment'
    else ''
  end

/*
@output: BCG vaccination is contraindicated Case 1
@pseudocode: '"Immunization recommendation status" = "Contraindicated"
*/
define "BCG vaccination is contraindicated Case 1":
  Encounter."The client has immunodeficiency syndromes"

/*
@output: BCG vaccination is contraindicated Case 2
@pseudocode: '"Immunization recommendation status" = "Contraindicated"
*/
define "BCG vaccination is contraindicated Case 2":
  Encounter."The client is exposed to immunosuppressive treatment"
    and Encounter."Client's age is less than 1 year"

/*
@output: BCG vaccination is contraindicated
@pseudocode: '"Immunization recommendation status" = "Contraindicated"
*/
define "BCG vaccination is contraindicated":
  "BCG vaccination is contraindicated Case 1"
    or "BCG vaccination is contraindicated Case 2"

/*
@output: BCG vaccination is contraindicated Guidance
@guidance = Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients with immunodeficiency syndromes
@guidance = Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients undergoing immunosuppressive treatment
*/
define "BCG vaccination is contraindicated Guidance":
  case
    when "BCG vaccination is contraindicated Case 1" then 'Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients with immunodeficiency syndromes'
    when "BCG vaccination is contraindicated Case 2" then 'Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients undergoing immunosuppressive treatment'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'BCG37.1' then "Bacille Calmette–Guérin (BCG) vaccination is contraindicated" and "Guidance" = 'Do not vaccinate client with BCG as BCG vaccination is not recommended during pregnancy'
    when Patient.id = 'BCG38.1' then "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 1" and "Guidance" = 'Do not vaccinate client with BCG if the client had previous allergic reaction to any component of the vaccine'
    when Patient.id = 'BCG39.1' then "BCG vaccination is contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients with immunodeficiency syndromes'
    when Patient.id = 'BCG40.2' then "BCG vaccination is contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients undergoing immunosuppressive treatment'
    when Patient.id = 'BCG41.2' then "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Case 2" and "Guidance" = 'Do not vaccinate client with BCG if client is exposed to or receives immunosuppressive treatment'
    else 'No test case set'
  end
