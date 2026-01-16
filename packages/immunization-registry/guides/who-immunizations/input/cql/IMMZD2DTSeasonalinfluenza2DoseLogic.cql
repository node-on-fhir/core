
/*
 * Library: IMMZD2DTSeasonalinfluenza2DoseLogic (IMMZ.D2.DT.Seasonal influenza)
 * Rule: Determine if the client is due for a seasonal influenza vaccination according to the national immunization schedule
 * Decision Table: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTSeasonalinfluenza2DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTSeasonalinfluenzaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for seasonal influenza vaccination" then "Client is not due for seasonal influenza vaccination Guidance"
    when "Client is due for seasonal influenza vaccination" then "Client is due for seasonal influenza vaccination Guidance"
    when "The primary series is complete. Client is not due for seasonal influenza annual dose" then "The primary series is complete. Client is not due for seasonal influenza annual dose Guidance"
    when "The primary series is complete. Client is due for seasonal influenza annual dose" then "The primary series is complete. Client is due for seasonal influenza annual dose Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for seasonal influenza vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for seasonal influenza vaccination Case 1":
  Encounter."Client's age is less than 6 months"

/*
@output: Client is not due for seasonal influenza vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for seasonal influenza vaccination Case 2":
  Encounter."One seasonal influenza primary series doses were administered"
    and Encounter."Client's age is less than 9 years"
    and Encounter."The latest seasonal influenza dose was administered less than 4 weeks ago"

/*
@output: Client is not due for seasonal influenza vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for seasonal influenza vaccination":
  "Client is not due for seasonal influenza vaccination Case 1"
    or "Client is not due for seasonal influenza vaccination Case 2"

/*
@output: Client is not due for seasonal influenza vaccination Guidance
@guidance: Should not vaccinate client with first seasonal influenza dose as client's age is less than 6 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with second seasonal influenza dose as latest seasonal influenza dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.
*/
define "Client is not due for seasonal influenza vaccination Guidance":
  case
    when "Client is not due for seasonal influenza vaccination Case 1" then 'Should not vaccinate client with first seasonal influenza dose as client\'s age is less than 6 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when "Client is not due for seasonal influenza vaccination Case 2" then 'Should not vaccinate client with second seasonal influenza dose as latest seasonal influenza dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    else ''
  end

/*
@output: Client is due for seasonal influenza vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for seasonal influenza vaccination Case 1":
  Encounter."No seasonal influenza primary series doses were administered"
    and Encounter."Client's age is more than or equal to 6 months"

/*
@output: Client is due for seasonal influenza vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for seasonal influenza vaccination Case 2":
  Encounter."One seasonal influenza primary series doses were administered"
    and Encounter."Client's age is less than 9 years"
    and Encounter."The latest seasonal influenza dose was administered more than 4 weeks ago"

/*
@output: Client is due for seasonal influenza vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for seasonal influenza vaccination":
  "Client is due for seasonal influenza vaccination Case 1"
    or "Client is due for seasonal influenza vaccination Case 2"

/*
@output: Client is due for seasonal influenza vaccination Guidance
@guidance: Should vaccinate client with first seasonal influenza dose as no seasonal infuenza doses were administered and client is within appropriate age range. 
Check for contraindications. 
@guidance: Should vaccinate client with second seasonal influenza dose as client is within appropriate age range and latest seasonal influenza dose was administerered more than 4 weeks ago.
Check for contraindications. 
*/
define "Client is due for seasonal influenza vaccination Guidance":
  case
    when "Client is due for seasonal influenza vaccination Case 1" then 'Should vaccinate client with first seasonal influenza dose as no seasonal infuenza doses were administered and client is within appropriate age range. 
Check for contraindications. '
    when "Client is due for seasonal influenza vaccination Case 2" then 'Should vaccinate client with second seasonal influenza dose as client is within appropriate age range and latest seasonal influenza dose was administerered more than 4 weeks ago.
Check for contraindications. '
    else ''
  end

/*
@output: The primary series is complete. Client is not due for seasonal influenza annual dose Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "The primary series is complete. Client is not due for seasonal influenza annual dose Case 1":
  Encounter."One seasonal influenza primary series doses were administered"
    and Encounter."Client's age is more than or equal to 9 years"
    and Encounter."The latest seasonal influenza dose was  administered less than 1 year ago"

/*
@output: The primary series is complete. Client is not due for seasonal influenza annual dose Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "The primary series is complete. Client is not due for seasonal influenza annual dose Case 2":
  Encounter."Two seasonal influenza primary series doses were administered"
    and Encounter."The latest seasonal influenza dose was  administered less than 1 year ago"

/*
@output: The primary series is complete. Client is not due for seasonal influenza annual dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "The primary series is complete. Client is not due for seasonal influenza annual dose":
  "The primary series is complete. Client is not due for seasonal influenza annual dose Case 1"
    or "The primary series is complete. Client is not due for seasonal influenza annual dose Case 2"

/*
@output: The primary series is complete. Client is not due for seasonal influenza annual dose Guidance
@guidance: Should not vaccinate client with annual dose as the latest seasonal influenza dose was administered less than 1 year ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with annual dose as latest seasonal influenza dose was administered less than 1 year ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "The primary series is complete. Client is not due for seasonal influenza annual dose Guidance":
  case
    when "The primary series is complete. Client is not due for seasonal influenza annual dose Case 1" then 'Should not vaccinate client with annual dose as the latest seasonal influenza dose was administered less than 1 year ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "The primary series is complete. Client is not due for seasonal influenza annual dose Case 2" then 'Should not vaccinate client with annual dose as latest seasonal influenza dose was administered less than 1 year ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: The primary series is complete. Client is due for seasonal influenza annual dose Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "The primary series is complete. Client is due for seasonal influenza annual dose Case 1":
  Encounter."One seasonal influenza primary series doses were administered"
    and Encounter."Client's age is more than or equal to 9 years"
    and Encounter."The latest seasonal influenza dose was administered more than 1 year ago"

/*
@output: The primary series is complete. Client is due for seasonal influenza annual dose Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "The primary series is complete. Client is due for seasonal influenza annual dose Case 2":
  Encounter."Two seasonal influenza primary series doses were administered"
    and Encounter."The latest seasonal influenza dose was administered more than 1 year ago"

/*
@output: The primary series is complete. Client is due for seasonal influenza annual dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "The primary series is complete. Client is due for seasonal influenza annual dose":
  "The primary series is complete. Client is due for seasonal influenza annual dose Case 1"
    or "The primary series is complete. Client is due for seasonal influenza annual dose Case 2"

/*
@output: The primary series is complete. Client is due for seasonal influenza annual dose Guidance
@guidance: Should vaccinate client with annual dose as the latest seasonal influenza dose was administered more than 1 year ago. 
Check for contraindications.
@guidance: Should vaccinate client with  annual dose as latest seasonal influenza dose was administered more than 1 year ago. 
Check for contraindications.
*/
define "The primary series is complete. Client is due for seasonal influenza annual dose Guidance":
  case
    when "The primary series is complete. Client is due for seasonal influenza annual dose Case 1" then 'Should vaccinate client with annual dose as the latest seasonal influenza dose was administered more than 1 year ago. 
Check for contraindications.'
    when "The primary series is complete. Client is due for seasonal influenza annual dose Case 2" then 'Should vaccinate client with  annual dose as latest seasonal influenza dose was administered more than 1 year ago. 
Check for contraindications.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Client is not due for seasonal influenza vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first seasonal influenza dose as client\'s age is less than 6 months. 
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '09.01' then "Client is due for seasonal influenza vaccination Case 1" and "Guidance" = 'Should vaccinate client with first seasonal influenza dose as no seasonal infuenza doses were administered and client is within appropriate age range. 
Check for contraindications. '
    when Patient.id = '10.012' then "Client is not due for seasonal influenza vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second seasonal influenza dose as latest seasonal influenza dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '11.012' then "Client is due for seasonal influenza vaccination Case 2" and "Guidance" = 'Should vaccinate client with second seasonal influenza dose as client is within appropriate age range and latest seasonal influenza dose was administerered more than 4 weeks ago.
Check for contraindications. '
    when Patient.id = '12.012' then "The primary series is complete. Client is not due for seasonal influenza annual dose Case 1" and "Guidance" = 'Should not vaccinate client with annual dose as the latest seasonal influenza dose was administered less than 1 year ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '13.012' then "The primary series is complete. Client is due for seasonal influenza annual dose Case 1" and "Guidance" = 'Should vaccinate client with annual dose as the latest seasonal influenza dose was administered more than 1 year ago. 
Check for contraindications.'
    when Patient.id = '14.02' then "The primary series is complete. Client is not due for seasonal influenza annual dose Case 2" and "Guidance" = 'Should not vaccinate client with annual dose as latest seasonal influenza dose was administered less than 1 year ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '15.02' then "The primary series is complete. Client is due for seasonal influenza annual dose Case 2" and "Guidance" = 'Should vaccinate client with  annual dose as latest seasonal influenza dose was administered more than 1 year ago. 
Check for contraindications.'
    else 'No test case set'
  end
