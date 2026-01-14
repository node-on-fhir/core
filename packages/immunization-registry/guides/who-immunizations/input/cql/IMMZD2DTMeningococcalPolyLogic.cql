
/*
 * Library: IMMZD2DTMeningococcalPolyLogic (IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines)
 * Rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
 * Decision Table: Polysaccharide vaccines schedule
(Polysaccharide vaccines can be used to control outbreaks in countries where limited economic resources or insufficient supply restrict the use of meningococcal conjugate vaccines)
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTMeningococcalPolyLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMeningococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for meningococcal vaccination" then "Client is not due for meningococcal vaccination Guidance"
    when "Client is due for meningococcal vaccination" then "Client is due for meningococcal vaccination Guidance"
    when "The primary series is complete. Client is not due for meningococcal booster dose." then "The primary series is complete. Client is not due for meningococcal booster dose. Guidance"
    when "The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note" then "The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note Guidance"
    when "Meningococcal immunization schedule is complete" then "Meningococcal immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for meningococcal vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for meningococcal vaccination":
  Encounter."Client's age is less than 2 years"

/*
@output: Client is not due for meningococcal vaccination Guidance
@guidance: Should not vaccinate client with first meningococcal dose as client's age is less than 2 years. Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
*/
define "Client is not due for meningococcal vaccination Guidance":
  'Should not vaccinate client with first meningococcal dose as client\'s age is less than 2 years. Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'

/*
@output: Client is due for meningococcal vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for meningococcal vaccination":
  Encounter."No meningococcal primary series dose was administered"
    and Encounter."Client's age is more than 2 years"

/*
@output: Client is due for meningococcal vaccination Guidance
@guidance: Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.
*/
define "Client is due for meningococcal vaccination Guidance":
  'Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.'

/*
@output: The primary series is complete. Client is not due for meningococcal booster dose.
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "The primary series is complete. Client is not due for meningococcal booster dose.":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."The latest meningococcal dose was administered less than 3 years ago"

/*
@output: The primary series is complete. Client is not due for meningococcal booster dose. Guidance
@guidance: Should not vaccinate client with meningococcal booster dose as the latest meningococcal dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver of when to come back for the booster dose.
*/
define "The primary series is complete. Client is not due for meningococcal booster dose. Guidance":
  'Should not vaccinate client with meningococcal booster dose as the latest meningococcal dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver of when to come back for the booster dose.'

/*
@output: The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."The latest meningococcal dose was administered more than 3 years ago"
    and Encounter."No meningococcal booster dose was administered"

/*
@output: The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note Guidance
@guidance: May administer meningococcal booster dose if the client is considered to be at continued high risk of exposure. Evaluate the client and use clinical judgement.
*/
define "The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note Guidance":
  'May administer meningococcal booster dose if the client is considered to be at continued high risk of exposure. Evaluate the client and use clinical judgement.'

/*
@output: Meningococcal immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Meningococcal immunization schedule is complete":
  Encounter."One meningococcal primary series dose was administered"
    and Encounter."The latest meningococcal dose was administered more than 3 years ago"
    and Encounter."Meningococcal booster dose was administered"

/*
@output: Meningococcal immunization schedule is complete Guidance
@guidance: Meningococcal immunization schedule is complete. One primary series dose and one booster dose have been administered.
Check for any other vaccines due.
*/
define "Meningococcal immunization schedule is complete Guidance":
  'Meningococcal immunization schedule is complete. One primary series dose and one booster dose have been administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '68.1' then "Client is not due for meningococcal vaccination" and "Guidance" = 'Should not vaccinate client with first meningococcal dose as client\'s age is less than 2 years. Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '69.01' then "Client is due for meningococcal vaccination" and "Guidance" = 'Should vaccinate client with first meningococcal dose as no meningococcal doses were administered and client is within appropriate age range.
Check for contraindications.'
    when Patient.id = '70.02' then "The primary series is complete. Client is not due for meningococcal booster dose." and "Guidance" = 'Should not vaccinate client with meningococcal booster dose as the latest meningococcal dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver of when to come back for the booster dose.'
    when Patient.id = '71.023' then "The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note" and "Guidance" = 'May administer meningococcal booster dose if the client is considered to be at continued high risk of exposure. Evaluate the client and use clinical judgement.'
    when Patient.id = '72.023' then "Meningococcal immunization schedule is complete" and "Guidance" = 'Meningococcal immunization schedule is complete. One primary series dose and one booster dose have been administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
