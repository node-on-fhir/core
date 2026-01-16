
/*
 * Library: IMMZD2DTMeaslesSupplementaryLogic (IMMZ.D2.DT.Measles.Supplementary dose)
 * Rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
 * Decision Table: Measles-containing vaccine (MCV) supplementary dose administration
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTMeaslesSupplementaryLogic

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
    when "Client is not due for measles supplementary dose" then "Client is not due for measles supplementary dose Guidance"
    when "Consider measles supplementary dose. Create a clinical note" then "Consider measles supplementary dose. Create a clinical note Guidance"
    when "Measles immunization schedule is complete" then "Measles immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for measles supplementary dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for measles supplementary dose":
  Encounter."Measles supplementary dose was not administered"
    and Encounter."Measles routine immunization schedule is complete"
    and Encounter."Live vaccine was administered in the past 4 weeks"

/*
@output: Client is not due for measles supplementary dose Guidance
@guidance: Should not vaccinate client with measles supplementary dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for supplementary dose.
*/
define "Client is not due for measles supplementary dose Guidance":
  'Should not vaccinate client with measles supplementary dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for supplementary dose.'

/*
@output: Consider measles supplementary dose. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Consider measles supplementary dose. Create a clinical note":
  Encounter."Measles supplementary dose was not administered"
    and Encounter."Measles routine immunization schedule is complete"
    and Encounter."No live vaccine was administered in the past 4 weeks"

/*
@output: Consider measles supplementary dose. Create a clinical note Guidance
@guidance: May vaccinate client with measles supplementary dose as supplementary dose was not administered, measles routine immunization schedule is complete and no live vaccine administered in the past 4 weeks.
Check if one of the measles supplementary dose specific scenarios is applicable.
*/
define "Consider measles supplementary dose. Create a clinical note Guidance":
  'May vaccinate client with measles supplementary dose as supplementary dose was not administered, measles routine immunization schedule is complete and no live vaccine administered in the past 4 weeks.
Check if one of the measles supplementary dose specific scenarios is applicable.'

/*
@output: Measles immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Measles immunization schedule is complete":
  Encounter."Measles supplementary dose was administered"

/*
@output: Measles immunization schedule is complete Guidance
@guidance: Measles immunization schedule is complete. Measles supplementary dose was administered.
*/
define "Measles immunization schedule is complete Guidance":
  'Measles immunization schedule is complete. Measles supplementary dose was administered.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '48.NSPCILVlt4w' then "Client is not due for measles supplementary dose" and "Guidance" = 'Should not vaccinate client with measles supplementary dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for supplementary dose.'
    when Patient.id = '48.NSPCOLVlt4w' then "Client is not due for measles supplementary dose" and "Guidance" = 'Should not vaccinate client with measles supplementary dose as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for supplementary dose.'
    when Patient.id = '49.NSPCILVgt4w' then "Consider measles supplementary dose. Create a clinical note" and "Guidance" = 'May vaccinate client with measles supplementary dose as supplementary dose was not administered, measles routine immunization schedule is complete and no live vaccine administered in the past 4 weeks.
Check if one of the measles supplementary dose specific scenarios is applicable.'
    when Patient.id = '49.NSPCOLVgt4w' then "Consider measles supplementary dose. Create a clinical note" and "Guidance" = 'May vaccinate client with measles supplementary dose as supplementary dose was not administered, measles routine immunization schedule is complete and no live vaccine administered in the past 4 weeks.
Check if one of the measles supplementary dose specific scenarios is applicable.'
    when Patient.id = '50.D1' then "Measles immunization schedule is complete" and "Guidance" = 'Measles immunization schedule is complete. Measles supplementary dose was administered.'
    else 'No test case set'
  end
