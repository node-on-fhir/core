
/*
 * Library: IMMZD2DTTBEMoscowLogic (IMMZ.D2.DT.TBE.TBE-Moscow)
 * Rule: Determine if the client is due for a tick-borne encephalitis (TBE) vaccination according to the national immunization schedule
 * Decision Table: TBE-Moscow schedule
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children	)
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTTBEMoscowLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTTBEEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for TBE vaccination" then "Client is not due for TBE vaccination Guidance"
    when "Client is due for TBE vaccination" then "Client is due for TBE vaccination Guidance"
    when "Primary series is complete. Client is not due for TBE booster dose" then "Primary series is complete. Client is not due for TBE booster dose Guidance"
    when "Primary series is complete. Client is due for TBE booster dose" then "Primary series is complete. Client is due for TBE booster dose Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for TBE vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for TBE vaccination Case 1":
  Encounter."Client's age is less than 3 years"

/*
@output: Client is not due for TBE vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for TBE vaccination Case 2":
  Encounter."One TBE primary series dose was administered"
    and Encounter."The latest TBE dose was administered less than 1 month ago"

/*
@output: Client is not due for TBE vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for TBE vaccination Case 3":
  Encounter."Two TBE primary series doses were administered"
    and Encounter."The latest TBE dose was administered less than 12 months ago"

/*
@output: Client is not due for TBE vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for TBE vaccination":
  "Client is not due for TBE vaccination Case 1"
    or "Client is not due for TBE vaccination Case 2"
    or "Client is not due for TBE vaccination Case 3"

/*
@output: Client is not due for TBE vaccination Guidance
@guidance: Should not vaccinate client with first TBE dose as client's age is under 3 years.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second TBE dose as the latest dose was administered less than 1 month ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with third TBE dose as the latest dose was administered less than 12 months ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose
*/
define "Client is not due for TBE vaccination Guidance":
  case
    when "Client is not due for TBE vaccination Case 1" then 'Should not vaccinate client with first TBE dose as client\'s age is under 3 years.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for TBE vaccination Case 2" then 'Should not vaccinate client with second TBE dose as the latest dose was administered less than 1 month ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for TBE vaccination Case 3" then 'Should not vaccinate client with third TBE dose as the latest dose was administered less than 12 months ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose'
    else ''
  end

/*
@output: Client is due for TBE vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for TBE vaccination Case 1":
  Encounter."No TBE primary series doses were administered"
    and Encounter."Client's age is more than or equal to 3 years"

/*
@output: Client is due for TBE vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for TBE vaccination Case 2":
  Encounter."One TBE primary series dose was administered"
    and Encounter."The latest TBE dose was administered more than 1 month ago"

/*
@output: Client is due for TBE vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for TBE vaccination Case 3":
  Encounter."Two TBE primary series doses were administered"
    and Encounter."The latest TBE dose was administered more than 12 months ago"

/*
@output: Client is due for TBE vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for TBE vaccination":
  "Client is due for TBE vaccination Case 1"
    or "Client is due for TBE vaccination Case 2"
    or "Client is due for TBE vaccination Case 3"

/*
@output: Client is due for TBE vaccination Guidance
@guidance: Should vaccinate client with first TBE dose as no TBE doses have been administered and client's age is more than 3 years.
Check for contraindications.
@guidance: Should vaccinate client with second TBE dose as the latest dose was administered more than 1 month ago.
Check for contraindications.
@guidance: Should vaccinate client with third TBE dose as the latest dose was administered more than 12 months ago.
Check for contraindications.
*/
define "Client is due for TBE vaccination Guidance":
  case
    when "Client is due for TBE vaccination Case 1" then 'Should vaccinate client with first TBE dose as no TBE doses have been administered and client\'s age is more than 3 years.
Check for contraindications.'
    when "Client is due for TBE vaccination Case 2" then 'Should vaccinate client with second TBE dose as the latest dose was administered more than 1 month ago.
Check for contraindications.'
    when "Client is due for TBE vaccination Case 3" then 'Should vaccinate client with third TBE dose as the latest dose was administered more than 12 months ago.
Check for contraindications.'
    else ''
  end

/*
@output: Primary series is complete. Client is not due for TBE booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Primary series is complete. Client is not due for TBE booster dose":
  Encounter."Three TBE primary series doses were administered"
    and Encounter."The latest TBE dose was administered less than 3 years ago"

/*
@output: Primary series is complete. Client is not due for TBE booster dose Guidance
@guidance: Should not vaccinate client with TBE booster dose as the latest TBE dose was administered less than 3 years ago.
Check for contraindications.
*/
define "Primary series is complete. Client is not due for TBE booster dose Guidance":
  'Should not vaccinate client with TBE booster dose as the latest TBE dose was administered less than 3 years ago.
Check for contraindications.'

/*
@output: Primary series is complete. Client is due for TBE booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Primary series is complete. Client is due for TBE booster dose":
  Encounter."Three TBE primary series doses were administered"
    and Encounter."The latest TBE dose was administered more than 3 years ago"

/*
@output: Primary series is complete. Client is due for TBE booster dose Guidance
@guidance: Should vaccinate client with TBE booster dose as the primary series has been completed and the latest TBE dose was administered more than 3 years ago.
Check for contraindications.
*/
define "Primary series is complete. Client is due for TBE booster dose Guidance":
  'Should vaccinate client with TBE booster dose as the primary series has been completed and the latest TBE dose was administered more than 3 years ago.
Check for contraindications.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '40.1' then "Client is not due for TBE vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first TBE dose as client\'s age is under 3 years.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '41.01' then "Client is due for TBE vaccination Case 1" and "Guidance" = 'Should vaccinate client with first TBE dose as no TBE doses have been administered and client\'s age is more than 3 years.
Check for contraindications.'
    when Patient.id = '42.02' then "Client is not due for TBE vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second TBE dose as the latest dose was administered less than 1 month ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '43.02' then "Client is due for TBE vaccination Case 2" and "Guidance" = 'Should vaccinate client with second TBE dose as the latest dose was administered more than 1 month ago.
Check for contraindications.'
    when Patient.id = '44.02' then "Client is not due for TBE vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third TBE dose as the latest dose was administered less than 12 months ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose'
    when Patient.id = '45.02' then "Client is due for TBE vaccination Case 3" and "Guidance" = 'Should vaccinate client with third TBE dose as the latest dose was administered more than 12 months ago.
Check for contraindications.'
    when Patient.id = '46.02' then "Primary series is complete. Client is not due for TBE booster dose" and "Guidance" = 'Should not vaccinate client with TBE booster dose as the latest TBE dose was administered less than 3 years ago.
Check for contraindications.'
    when Patient.id = '47.02' then "Primary series is complete. Client is due for TBE booster dose" and "Guidance" = 'Should vaccinate client with TBE booster dose as the primary series has been completed and the latest TBE dose was administered more than 3 years ago.
Check for contraindications.'
    else 'No test case set'
  end
