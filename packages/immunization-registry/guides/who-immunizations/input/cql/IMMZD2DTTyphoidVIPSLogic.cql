
/*
 * Library: IMMZD2DTTyphoidVIPSLogic (IMMZ.D2.DT.Typhoid.ViPS)
 * Rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
 * Decision Table: Unconjugated Vi polysaccharide (ViPS) schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTTyphoidVIPSLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTTyphoidEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for Typhoid vaccination" then "Client is not due for Typhoid vaccination Guidance"
    when "Client is due for Typhoid vaccination" then "Client is due for Typhoid vaccination Guidance"
    when "Primary series is complete. Client is not due for typhoid booster dose" then "Primary series is complete. Client is not due for typhoid booster dose Guidance"
    when "Primary series is complete. Client is due for typhoid booster dose" then "Primary series is complete. Client is due for typhoid booster dose Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for Typhoid vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Typhoid vaccination":
  Encounter."Client's age is less than 2 years"

/*
@output: Client is not due for Typhoid vaccination Guidance
@guidance: Should not vaccinate client with typhoid dose as client's age is less than 2 years.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
*/
define "Client is not due for Typhoid vaccination Guidance":
  'Should not vaccinate client with typhoid dose as client\'s age is less than 2 years.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'

/*
@output: Client is due for Typhoid vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Typhoid vaccination":
  Encounter."No typhoid primary series doses were administered"
    and Encounter."Client's age is more than or equal to 2 years"

/*
@output: Client is due for Typhoid vaccination Guidance
@guidance: Should vaccinate client with typhoid dose as no typhoid doses were administered and client is within appropriate age range.
Check for contraindications.
*/
define "Client is due for Typhoid vaccination Guidance":
  'Should vaccinate client with typhoid dose as no typhoid doses were administered and client is within appropriate age range.
Check for contraindications.'

/*
@output: Primary series is complete. Client is not due for typhoid booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Primary series is complete. Client is not due for typhoid booster dose":
  Encounter."One typhoid primary series dose was administered"
    and Encounter."The latest typhoid dose was administered less than 3 years ago"

/*
@output: Primary series is complete. Client is not due for typhoid booster dose Guidance
@guidance: Should not vaccinate client with typhoid booster dose as the latest typhoid dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Primary series is complete. Client is not due for typhoid booster dose Guidance":
  'Should not vaccinate client with typhoid booster dose as the latest typhoid dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'

/*
@output: Primary series is complete. Client is due for typhoid booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Primary series is complete. Client is due for typhoid booster dose":
  Encounter."One typhoid primary series dose was administered"
    and Encounter."The latest typhoid dose was administered more than 3 years ago"

/*
@output: Primary series is complete. Client is due for typhoid booster dose Guidance
@guidance: Should vaccinate client with typhoid booster dose as the latest dose was administered more than 3 years ago.
Check for contraindications.
*/
define "Primary series is complete. Client is due for typhoid booster dose Guidance":
  'Should vaccinate client with typhoid booster dose as the latest dose was administered more than 3 years ago.
Check for contraindications.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '19.2' then "Client is not due for Typhoid vaccination" and "Guidance" = 'Should not vaccinate client with typhoid dose as client\'s age is less than 2 years.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '20.12' then "Client is due for Typhoid vaccination" and "Guidance" = 'Should vaccinate client with typhoid dose as no typhoid doses were administered and client is within appropriate age range.
Check for contraindications.'
    when Patient.id = '21.13' then "Primary series is complete. Client is not due for typhoid booster dose" and "Guidance" = 'Should not vaccinate client with typhoid booster dose as the latest typhoid dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '22.13' then "Primary series is complete. Client is due for typhoid booster dose" and "Guidance" = 'Should vaccinate client with typhoid booster dose as the latest dose was administered more than 3 years ago.
Check for contraindications.'
    else 'No test case set'
  end
