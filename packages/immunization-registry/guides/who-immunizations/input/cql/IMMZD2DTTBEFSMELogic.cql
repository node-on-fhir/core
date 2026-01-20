
/*
 * Library: IMMZD2DTTBEFSMELogic (IMMZ.D2.DT.TBE.FSME-Immun)
 * Rule: Determine if the client is due for a tick-borne encephalitis (TBE) vaccination according to the national immunization schedule
 * Decision Table: FSME-Immun schedule
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children)
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTTBEFSMELogic

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
    when "Clinical judgement is required." then "Clinical judgement is required. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for TBE vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for TBE vaccination Case 1":
  Encounter."Client's age is less than 1 year"

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
    and Encounter."The latest TBE dose was administered less than 5 months ago"

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
@guidance: Should not vaccinate client with first TBE dose as client's age is less than 1 year.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with second TBE dose as the latest dose was administered less than 1 month ago. Check for any vaccines due and inform the caregiver of when to come back for the next dose
@guidance: Should not vaccinate client with third TBE dose as the latest dose was administered less than 5 months ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for TBE vaccination Guidance":
  case
    when "Client is not due for TBE vaccination Case 1" then 'Should not vaccinate client with first TBE dose as client\'s age is less than 1 year.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for TBE vaccination Case 2" then 'Should not vaccinate client with second TBE dose as the latest dose was administered less than 1 month ago. Check for any vaccines due and inform the caregiver of when to come back for the next dose'
    when "Client is not due for TBE vaccination Case 3" then 'Should not vaccinate client with third TBE dose as the latest dose was administered less than 5 months ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for TBE vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for TBE vaccination Case 1":
  Encounter."No TBE primary series doses were administered"
    and Encounter."Client's age is more than or equal to 1 year"

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
    and Encounter."The latest TBE dose was administered more than 5 months ago"

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
@guidance: Should vaccinate client with first TBE dose as no TBE doses have been administered and client's age is more than 1 year.
Check for contraindications.
@guidance: Should vaccinate client with second TBE dose as the latest dose was administered more than 1 month ago.
Check for contraindications.
@guidance: Should vaccinate client with third TBE dose as the latest dose was administered more than 5 months ago.
Check for contraindications.
*/
define "Client is due for TBE vaccination Guidance":
  case
    when "Client is due for TBE vaccination Case 1" then 'Should vaccinate client with first TBE dose as no TBE doses have been administered and client\'s age is more than 1 year.
Check for contraindications.'
    when "Client is due for TBE vaccination Case 2" then 'Should vaccinate client with second TBE dose as the latest dose was administered more than 1 month ago.
Check for contraindications.'
    when "Client is due for TBE vaccination Case 3" then 'Should vaccinate client with third TBE dose as the latest dose was administered more than 5 months ago.
Check for contraindications.'
    else ''
  end

/*
@output: Primary series is complete. Client is not due for TBE booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Primary series is complete. Client is not due for TBE booster dose":
  Encounter."Three TBE primary series doses were administered"
    and Encounter."No TBE booster dose was administered"
    and Encounter."The latest TBE dose was administered less than 3 years ago"

/*
@output: Primary series is complete. Client is not due for TBE booster dose Guidance
@guidance: Should not vaccinate client with TBE booster dose as the latest TBE dose was administered less than 3 years ago.
Check for any vaccines due and inform the caregiver of when to come back for the booster dose
*/
define "Primary series is complete. Client is not due for TBE booster dose Guidance":
  'Should not vaccinate client with TBE booster dose as the latest TBE dose was administered less than 3 years ago.
Check for any vaccines due and inform the caregiver of when to come back for the booster dose'

/*
@output: Primary series is complete. Client is due for TBE booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Primary series is complete. Client is due for TBE booster dose":
  Encounter."Three TBE primary series doses were administered"
    and Encounter."No TBE booster dose was administered"
    and Encounter."The latest TBE dose was administered more than 3 years ago"

/*
@output: Primary series is complete. Client is due for TBE booster dose Guidance
@guidance: Should vaccinate client with TBE booster dose as the latest TBE dose was administered more than 3 years ago.
Check for contraindications.
*/
define "Primary series is complete. Client is due for TBE booster dose Guidance":
  'Should vaccinate client with TBE booster dose as the latest TBE dose was administered more than 3 years ago.
Check for contraindications.'

/*
@output: Clinical judgement is required.
@pseudocode: Create a clinical note
*/
define "Clinical judgement is required.":
  Encounter."Three TBE primary series doses were administered"
    and Encounter."At least one booster dose was administered"

/*
@output: Clinical judgement is required. Guidance
@guidance: Assess if supplementary booster TBE dose(s) are necessary and create a clinical note.
Check for any other vaccines due.
*/
define "Clinical judgement is required. Guidance":
  'Assess if supplementary booster TBE dose(s) are necessary and create a clinical note.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Client is not due for TBE vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first TBE dose as client\'s age is less than 1 year.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '09.01' then "Client is due for TBE vaccination Case 1" and "Guidance" = 'Should vaccinate client with first TBE dose as no TBE doses have been administered and client\'s age is more than 1 year.
Check for contraindications.'
    when Patient.id = '10.03' then "Client is not due for TBE vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second TBE dose as the latest dose was administered less than 1 month ago. Check for any vaccines due and inform the caregiver of when to come back for the next dose'
    when Patient.id = '11.03' then "Client is due for TBE vaccination Case 2" and "Guidance" = 'Should vaccinate client with second TBE dose as the latest dose was administered more than 1 month ago.
Check for contraindications.'
    when Patient.id = '12.03' then "Client is not due for TBE vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third TBE dose as the latest dose was administered less than 5 months ago.
Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '13.03' then "Client is due for TBE vaccination Case 3" and "Guidance" = 'Should vaccinate client with third TBE dose as the latest dose was administered more than 5 months ago.
Check for contraindications.'
    when Patient.id = '14.023' then "Primary series is complete. Client is not due for TBE booster dose" and "Guidance" = 'Should not vaccinate client with TBE booster dose as the latest TBE dose was administered less than 3 years ago.
Check for any vaccines due and inform the caregiver of when to come back for the booster dose'
    when Patient.id = '15.023' then "Primary series is complete. Client is due for TBE booster dose" and "Guidance" = 'Should vaccinate client with TBE booster dose as the latest TBE dose was administered more than 3 years ago.
Check for contraindications.'
    when Patient.id = '16.02' then "Clinical judgement is required." and "Guidance" = 'Assess if supplementary booster TBE dose(s) are necessary and create a clinical note.
Check for any other vaccines due.'
    else 'No test case set'
  end
