
/*
 * Library: IMMZD2DTMeaslesDose0Logic (IMMZ.D2.DT.Measles.MCV dose 0)
 * Rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
 * Decision Table: Measles-containing vaccine dose 0 (MCV0) administration
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTMeaslesDose0Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMeaslesEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for MCV0" then "Client is not due for MCV0 Guidance"
    when "Consider MCV0." then "Consider MCV0. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for MCV0 Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for MCV0 Case 1":
  Encounter."Client's age is less than 6 months"

/*
@output: Client is not due for MCV0 Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for MCV0 Case 2":
  Encounter."MCV0 was not administered"
    and Encounter."Client's age is between 6 months and 9 months"
    and Encounter."Live vaccine was administered in the last 4 weeks"

/*
@output: Client is not due for MCV0 Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for MCV0 Case 3":
  Encounter."Client's age is more than or equal to 9 months"

/*
@output: Client is not due for MCV0 Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for MCV0 Case 4":
  Encounter."MCV0 was administered"

/*
@output: Client is not due for MCV0
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for MCV0":
  "Client is not due for MCV0 Case 1"
    or "Client is not due for MCV0 Case 2"
    or "Client is not due for MCV0 Case 3"
    or "Client is not due for MCV0 Case 4"

/*
@output: Client is not due for MCV0 Guidance
@guidance: Should not vaccinate client with MCV0 as client's age is less than 6 months. Check for any vaccines due and inform the caregiver of when to come back for MCV0.
@guidance: Should not vaccinate client with MCV0 as live vaccine was administered in the past 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for MCV0.
@guidance: Should not vaccinate client with MCV0 as client's age is more than 9 months.
Check measles routine immunization schedule.
@guidance: MCV0 was administered.
Check measles routine immunization schedule.
*/
define "Client is not due for MCV0 Guidance":
  case
    when "Client is not due for MCV0 Case 1" then 'Should not vaccinate client with MCV0 as client\'s age is less than 6 months. Check for any vaccines due and inform the caregiver of when to come back for MCV0.'
    when "Client is not due for MCV0 Case 2" then 'Should not vaccinate client with MCV0 as live vaccine was administered in the past 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for MCV0.'
    when "Client is not due for MCV0 Case 3" then 'Should not vaccinate client with MCV0 as client\'s age is more than 9 months.
Check measles routine immunization schedule.'
    when "Client is not due for MCV0 Case 4" then 'MCV0 was administered.
Check measles routine immunization schedule.'
    else ''
  end

/*
@output: Consider MCV0.
@pseudocode: Create a clinical note.
*/
define "Consider MCV0.":
  Encounter."MCV0 was not administered"
    and Encounter."Client's age is between 6 months and 9 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"

/*
@output: Consider MCV0. Guidance
@guidance: May vaccinate client with MCV0 as client is within appropriate age range, MCV0 was not administered and no live vaccine was administered in the past 4 weeks. Check if one of the MCV0 specific scenarios is applicable.
*/
define "Consider MCV0. Guidance":
  'May vaccinate client with MCV0 as client is within appropriate age range, MCV0 was not administered and no live vaccine was administered in the past 4 weeks. Check if one of the MCV0 specific scenarios is applicable.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '36.Alt6m' then "Client is not due for MCV0 Case 1" and "Guidance" = 'Should not vaccinate client with MCV0 as client\'s age is less than 6 months. Check for any vaccines due and inform the caregiver of when to come back for MCV0.'
    when Patient.id = '37.Abt6m9mLVlt4w' then "Client is not due for MCV0 Case 2" and "Guidance" = 'Should not vaccinate client with MCV0 as live vaccine was administered in the past 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for MCV0.'
    when Patient.id = '38.Abt6m9mLVgt4w' then "Consider MCV0." and "Guidance" = 'May vaccinate client with MCV0 as client is within appropriate age range, MCV0 was not administered and no live vaccine was administered in the past 4 weeks. Check if one of the MCV0 specific scenarios is applicable.'
    when Patient.id = '39.Agt9m' then "Client is not due for MCV0 Case 3" and "Guidance" = 'Should not vaccinate client with MCV0 as client\'s age is more than 9 months.
Check measles routine immunization schedule.'
    when Patient.id = '40.D1' then "Client is not due for MCV0 Case 4" and "Guidance" = 'MCV0 was administered.
Check measles routine immunization schedule.'
    else 'No test case set'
  end
