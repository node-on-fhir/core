/*
 * Library: IMMZD2DTBCGLogic (IMMZ.D2.DT.BCG)
 * Rule: Determine if the client is due for a bacille Calmette–Guérin (BCG) vaccination according to the national immunization schedule
 * Decision Table: IMMZ.D2.DT.BCG
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTBCGLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTBCGEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case 
    when "Client is due for BCG vaccination" then "Client is due for BCG vaccination Guidance"
    when "Client is not due for BCG vaccination" then "Client is not due for BCG vaccination Guidance"
    when "Clinical judgement is required. Create clinical note." then "Clinical judgement is required. Create clinical note. Guidance"
    when "BCG immunization schedule is complete" then "BCG immunization schedule is complete Guidance" 
    else ''
  end
  
define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is due for BCG vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for BCG vaccination Case 1":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is less than or equal to 28 days"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."No live vaccine was administered"

/*
@output: Client is due for BCG vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for BCG vaccination Case 2":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is less than or equal to 28 days"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is immunologically stable"
    and Encounter."No live vaccine was administered"

/*
@output: Client is due for BCG vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for BCG vaccination Case 3":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is negative"
    and Encounter."No live vaccine was administered in the last four weeks"

/*
@output: Client is due for BCG vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for BCG vaccination Case 4":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is immunologically stable"
    and Encounter."No live vaccine was administered in the last four weeks"
    and Encounter."Client is clinically well"

/*
@output: Client is due for BCG vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for BCG vaccination Case 5":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is negative"
    and Encounter."No live vaccine was administered in the last four weeks"

/*
@output: Client is due for BCG vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for BCG vaccination Case 6":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is immunologically stable"
    and Encounter."No live vaccine was administered in the last four weeks"
    and Encounter."Client is clinically well"

/*
@output: Client is due for BCG vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for BCG vaccination":
  "Client is due for BCG vaccination Case 1"
    or "Client is due for BCG vaccination Case 2"
    or "Client is due for BCG vaccination Case 3"
    or "Client is due for BCG vaccination Case 4"
    or "Client is due for BCG vaccination Case 5"
    or "Client is due for BCG vaccination Case 6"

/*
@output: Client is due for BCG vaccination Guidance
@guidance = Should vaccinate client with first BCG dose as no BCG dose was administered, client is within age range, HIV status is not positive and no live vaccine was administered.
Check for contraindications.
@guidance = Should vaccinate client with first BCG dose as no BCG dose was administered, client is immunologically stable and no live vaccine was administered.
Check for contraindications.
@guidance = Should vaccinate client with first BCG dose as no BCG dose was administered, client's TB test result is negative and no live vaccine was administered in the past 4 weeks.
Check for contraindications.
@guidance = Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the last 4 weeks.
Check for contraindications.
@guidance = Should vaccinate client with first BCG dose as no BCG dose was administered, client's TB test result is negative and no live vaccine was administered in the past 4 weeks.
Check for contraindications.
@guidance = Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the past 4 weeks.
Check for contraindications
*/
define "Client is due for BCG vaccination Guidance":
  case
    when "Client is due for BCG vaccination Case 1" then 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is within age range, HIV status is not positive and no live vaccine was administered.
Check for contraindications.'
    when "Client is due for BCG vaccination Case 2" then 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is immunologically stable and no live vaccine was administered.
Check for contraindications.'
    when "Client is due for BCG vaccination Case 3" then 'Should vaccinate client with first BCG dose as no BCG dose was administered, client\'s TB test result is negative and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when "Client is due for BCG vaccination Case 4" then 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the last 4 weeks.
Check for contraindications.'
    when "Client is due for BCG vaccination Case 5" then 'Should vaccinate client with first BCG dose as no BCG dose was administered, client\'s TB test result is negative and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when "Client is due for BCG vaccination Case 6" then 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the past 4 weeks.
Check for contraindications'
    else ''
  end

/*
@output: Client is not due for BCG vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 1":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is less than or equal to 28 days"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Live vaccine was administered in the last four weeks"

/*
@output: Client is not due for BCG vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 2":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is less than or equal to 28 days"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is immunologically stable"
    and Encounter."Live vaccine was administered in the last four weeks"

/*
@output: Client is not due for BCG vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 3":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is less than or equal to 28 days"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is not immunologically stable"

/*
@output: Client is not due for BCG vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 4":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is less than or equal to 28 days"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently not receiving antiretroviral therapy"

/*
@output: Client is not due for BCG vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 5":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is negative"
    and Encounter."Live vaccine was administered in the last four weeks"

/*
@output: Client is not due for BCG vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 6":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is positive"

/*
@output: Client is not due for BCG vaccination Case 7
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 7":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is not immunologically stable"

/*
@output: Client is not due for BCG vaccination Case 8
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 8":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is not clinically well"

/*
@output: Client is not due for BCG vaccination Case 9
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 9":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is immunologically stable"
    and Encounter."Live vaccine was administered in the last four weeks"
    and Encounter."Client is clinically well"

/*
@output: Client is not due for BCG vaccination Case 10
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 10":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently not receiving antiretroviral therapy"

/*
@output: Client is not due for BCG vaccination Case 11
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 11":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is negative"
    and Encounter."Live vaccine was administered in the last four weeks"

/*
@output: Client is not due for BCG vaccination Case 12
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 12":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is positive"

/*
@output: Client is not due for BCG vaccination Case 13
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 13":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is not immunologically stable"

/*
@output: Client is not due for BCG vaccination Case 14
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 14":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is not clinically well"

/*
@output: Client is not due for BCG vaccination Case 15
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 15":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently receiving antiretroviral therapy"
    and Encounter."Client is immunologically stable"
    and Encounter."Live vaccine was administered in the last four weeks"
    and Encounter."Client is clinically well"

/*
@output: Client is not due for BCG vaccination Case 16
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination Case 16":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is positive"
    and Encounter."Client is currently not receiving antiretroviral therapy"

/*
@output: Client is not due for BCG vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for BCG vaccination":
  "Client is not due for BCG vaccination Case 1"
    or "Client is not due for BCG vaccination Case 2"
    or "Client is not due for BCG vaccination Case 3"
    or "Client is not due for BCG vaccination Case 4"
    or "Client is not due for BCG vaccination Case 5"
    or "Client is not due for BCG vaccination Case 6"
    or "Client is not due for BCG vaccination Case 7"
    or "Client is not due for BCG vaccination Case 8"
    or "Client is not due for BCG vaccination Case 9"
    or "Client is not due for BCG vaccination Case 10"
    or "Client is not due for BCG vaccination Case 11"
    or "Client is not due for BCG vaccination Case 12"
    or "Client is not due for BCG vaccination Case 13"
    or "Client is not due for BCG vaccination Case 14"
    or "Client is not due for BCG vaccination Case 15"
    or "Client is not due for BCG vaccination Case 16"

/*
@output: Client is not due for BCG vaccination Guidance
@guidance = Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as client is not immunologically stable.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as ART has not been started.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance = Should not vaccinate client with first BCG dose as client's TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out).
@guidance = Should not vaccinate client with first BCG dose as client is not immunologically stable.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as client is not clinically well.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as client is not currently receiving ART.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as client's TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out).
@guidance = Should not vaccinate client with first BCG dose as client is not immnologically stable.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as client is not clinically well.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.
@guidance = Should not vaccinate client with first BCG dose as client is not currently receiving ART.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.
*/
define "Client is not due for BCG vaccination Guidance":
  case
    when "Client is not due for BCG vaccination Case 1" then 'Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 2" then 'Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 3" then 'Should not vaccinate client with first BCG dose as client is not immunologically stable.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 4" then 'Should not vaccinate client with first BCG dose as ART has not been started.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 5" then 'Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for BCG vaccination Case 6" then 'Should not vaccinate client with first BCG dose as client\'s TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out).'
    when "Client is not due for BCG vaccination Case 7" then 'Should not vaccinate client with first BCG dose as client is not immunologically stable.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 8" then 'Should not vaccinate client with first BCG dose as client is not clinically well.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 9" then 'Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 10" then 'Should not vaccinate client with first BCG dose as client is not currently receiving ART.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 11" then 'Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 12" then 'Should not vaccinate client with first BCG dose as client\'s TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out).'
    when "Client is not due for BCG vaccination Case 13" then 'Should not vaccinate client with first BCG dose as client is not immnologically stable.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 14" then 'Should not vaccinate client with first BCG dose as client is not clinically well.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 15" then 'Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when "Client is not due for BCG vaccination Case 16" then 'Should not vaccinate client with first BCG dose as client is not currently receiving ART.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    else ''
  end

/*
@output: Clinical judgement is required. Create clinical note. Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create clinical note. Case 1":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is between 28 days and 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is unknown (test not done or no result yet)"

/*
@output: Clinical judgement is required. Create clinical note. Case 2
@pseudocode: '"Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create clinical note. Case 2":
  Encounter."No BCG primary series dose was administered"
    and Encounter."Client's age is more than 5 years"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client's TB infection test result is unknown (test not done or no result yet)"

/*
@output: Clinical judgement is required. Create clinical note.
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create clinical note.":
  "Clinical judgement is required. Create clinical note. Case 1"
    or "Clinical judgement is required. Create clinical note. Case 2"

/*
@output: Clinical judgement is required. Create clinical note. Guidance
@guidance = Recommend the client to perform TB infection testing.
Re-evaluate client once the test result is available.
@guidance = Recommend the client to perform TB infection testing.
Re-evaluate client once the test result is available.
*/
define "Clinical judgement is required. Create clinical note. Guidance":
  case
    when "Clinical judgement is required. Create clinical note. Case 1" then 'Recommend the client to perform TB infection testing.
Re-evaluate client once the test result is available.'
    when "Clinical judgement is required. Create clinical note. Case 2" then 'Recommend the client to perform TB infection testing.
Re-evaluate client once the test result is available.'
    else ''
  end

/*
@output: BCG immunization schedule is complete
@pseudocode: '"Immunization recommendation status" = "Complete"
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "BCG vaccines")
*/
define "BCG immunization schedule is complete":
  Encounter."One BCG primary series dose was administered"

/*
@output: BCG immunization schedule is complete Guidance
@guidance: BCG immunization schedule is complete. One BCG primary series dose was administered.
Check for any vaccines due.
*/
define "BCG immunization schedule is complete Guidance":
  'BCG immunization schedule is complete. One BCG primary series dose was administered.
Check for any vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'BCG07.4' then "Client is due for BCG vaccination Case 1" and "Guidance" = 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is within age range, HIV status is not positive and no live vaccine was administered.
Check for contraindications.'
    when Patient.id = 'BCG08.4' then "Client is not due for BCG vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG09.6' then "Client is due for BCG vaccination Case 2" and "Guidance" = 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is immunologically stable and no live vaccine was administered.
Check for contraindications.'
    when Patient.id = 'BCG10.6' then "Client is not due for BCG vaccination Case 2" and "Guidance" = 'Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG11.5' then "Client is not due for BCG vaccination Case 3" and "Guidance" = 'Should not vaccinate client with first BCG dose as client is not immunologically stable.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG12.4' then "Client is not due for BCG vaccination Case 4" and "Guidance" = 'Should not vaccinate client with first BCG dose as ART has not been started.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG13.5' then "Client is due for BCG vaccination Case 3" and "Guidance" = 'Should vaccinate client with first BCG dose as no BCG dose was administered, client\'s TB test result is negative and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = 'BCG14.5' then "Client is not due for BCG vaccination Case 5" and "Guidance" = 'Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = 'BCG15.4' then "Clinical judgement is required. Create clinical note. Case 1" and "Guidance" = 'Recommend the client to perform TB infection testing.
Re-evaluate client once the test result is available.'
    when Patient.id = 'BCG16.4' then "Client is not due for BCG vaccination Case 6" and "Guidance" = 'Should not vaccinate client with first BCG dose as client\'s TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out).'
    when Patient.id = 'BCG17.5' then "Client is not due for BCG vaccination Case 7" and "Guidance" = 'Should not vaccinate client with first BCG dose as client is not immunologically stable.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG18.5' then "Client is not due for BCG vaccination Case 8" and "Guidance" = 'Should not vaccinate client with first BCG dose as client is not clinically well.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG19.7' then "Client is due for BCG vaccination Case 4" and "Guidance" = 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the last 4 weeks.
Check for contraindications.'
    when Patient.id = 'BCG20.7' then "Client is not due for BCG vaccination Case 9" and "Guidance" = 'Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG21.4' then "Client is not due for BCG vaccination Case 10" and "Guidance" = 'Should not vaccinate client with first BCG dose as client is not currently receiving ART.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG22.5' then "Client is due for BCG vaccination Case 5" and "Guidance" = 'Should vaccinate client with first BCG dose as no BCG dose was administered, client\'s TB test result is negative and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = 'BCG23.5' then "Client is not due for BCG vaccination Case 11" and "Guidance" = 'Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG24.4' then "Clinical judgement is required. Create clinical note. Case 2" and "Guidance" = 'Recommend the client to perform TB infection testing.
Re-evaluate client once the test result is available.'
    when Patient.id = 'BCG25.4' then "Client is not due for BCG vaccination Case 12" and "Guidance" = 'Should not vaccinate client with first BCG dose as client\'s TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out).'
    when Patient.id = 'BCG26.5' then "Client is not due for BCG vaccination Case 13" and "Guidance" = 'Should not vaccinate client with first BCG dose as client is not immnologically stable.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG27.5' then "Client is not due for BCG vaccination Case 14" and "Guidance" = 'Should not vaccinate client with first BCG dose as client is not clinically well.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG28.7' then "Client is due for BCG vaccination Case 6" and "Guidance" = 'Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the past 4 weeks.
Check for contraindications'
    when Patient.id = 'BCG29.7' then "Client is not due for BCG vaccination Case 15" and "Guidance" = 'Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due, and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG30.4' then "Client is not due for BCG vaccination Case 16" and "Guidance" = 'Should not vaccinate client with first BCG dose as client is not currently receiving ART.
Check for any vaccines due and inform the caregiver of when to come back for the first BCG dose.'
    when Patient.id = 'BCG31.1' then "BCG immunization schedule is complete" and "Guidance" = 'BCG immunization schedule is complete. One BCG primary series dose was administered.
Check for any vaccines due.'
    else 'No test case set'
  end
