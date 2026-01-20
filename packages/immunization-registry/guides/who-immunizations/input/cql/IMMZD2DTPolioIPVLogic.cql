
/*
 * Library: IMMZD2DTPolioIPVLogic (IMMZ.D2.DT.Polio.IPV-only)
 * Rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
 * Decision Table: Inactivated polio vaccine (IPV)-only (in countries, in polio-free regions, with a very low risk of importation and sustained high routine immunization coverage (third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] > 90%)
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTPolioIPVLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for IPV vaccination" then "Client is not due for IPV vaccination Guidance"
    when "Client is due for IPV vaccination" then "Client is due for IPV vaccination Guidance"
    when "Polio immunization schedule is complete" then "Polio immunization schedule is complete Guidance"
    when "Primary series is complete. Client is not due for IPV booster dose" then "Primary series is complete. Client is not due for IPV booster dose Guidance"
    when "Primary series is complete. Client is due for IPV booster dose" then "Primary series is complete. Client is due for IPV booster dose Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for IPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for IPV vaccination Case 1":
  Encounter."No poliovirus primary series doses were administered"
    and Encounter."Client's age is less than 6 weeks"

/*
@output: Client is not due for IPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for IPV vaccination Case 2":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The latest poliovirus dose was administered less than 4 weeks ago"

/*
@output: Client is not due for IPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for IPV vaccination Case 3":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."The latest poliovirus dose was administered less than 4 weeks ago"

/*
@output: Client is not due for IPV vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for IPV vaccination":
  "Client is not due for IPV vaccination Case 1"
    or "Client is not due for IPV vaccination Case 2"
    or "Client is not due for IPV vaccination Case 3"

/*
@output: Client is not due for IPV vaccination Guidance
@guidance: Shold not vaccinate client with first IPV dose as client's age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first IPV dose.
@guidance: Should not vaccinate client with second IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the second dose.
@guidance: Should not vaccinate client with third IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the third dose.
*/
define "Client is not due for IPV vaccination Guidance":
  case
    when "Client is not due for IPV vaccination Case 1" then 'Shold not vaccinate client with first IPV dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first IPV dose.'
    when "Client is not due for IPV vaccination Case 2" then 'Should not vaccinate client with second IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the second dose.'
    when "Client is not due for IPV vaccination Case 3" then 'Should not vaccinate client with third IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the third dose.'
    else ''
  end

/*
@output: Client is due for IPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for IPV vaccination Case 1":
  Encounter."No poliovirus primary series doses were administered"
    and Encounter."Client's age is more than or equal to 6 weeks"

/*
@output: Client is due for IPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for IPV vaccination Case 2":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The latest poliovirus dose was administered more than 4 weeks ago"

/*
@output: Client is due for IPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for IPV vaccination Case 3":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."The latest poliovirus dose was administered more than 4 weeks ago"

/*
@output: Client is due for IPV vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for IPV vaccination":
  "Client is due for IPV vaccination Case 1"
    or "Client is due for IPV vaccination Case 2"
    or "Client is due for IPV vaccination Case 3"

/*
@output: Client is due for IPV vaccination Guidance
@guidance: Should vaccinate client with first IPV dose as client is within appropriate age range. 
Check for contraindications.
@guidance: Should vaccinate client with second IPV dose as the latest IPV dose was administered more than 4 weeks ago.
Check for contraindications.
@guidance: Should vaccinate client with third IPV dose as the latest poliovirus dose was administered more than 4 weeks ago. 
Check for contraindications.
*/
define "Client is due for IPV vaccination Guidance":
  case
    when "Client is due for IPV vaccination Case 1" then 'Should vaccinate client with first IPV dose as client is within appropriate age range. 
Check for contraindications.'
    when "Client is due for IPV vaccination Case 2" then 'Should vaccinate client with second IPV dose as the latest IPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when "Client is due for IPV vaccination Case 3" then 'Should vaccinate client with third IPV dose as the latest poliovirus dose was administered more than 4 weeks ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Polio immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Polio immunization schedule is complete Case 1":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."Client's age was more than 6 weeks when the primary series was started"

/*
@output: Polio immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Polio immunization schedule is complete Case 2":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."Polio booster dose was administered"

/*
@output: Polio immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Polio immunization schedule is complete":
  "Polio immunization schedule is complete Case 1"
    or "Polio immunization schedule is complete Case 2"

/*
@output: Polio immunization schedule is complete Guidance
@guidance: Polio immunization schedule is complete as client's age was more than 6 weeks when the primary series was started. Three poliovirus primary series doses were administered. 
@guidance: Polio immunization schedule is complete. Three poliovirus primary series doses and a booster dose were administered.
*/
define "Polio immunization schedule is complete Guidance":
  case
    when "Polio immunization schedule is complete Case 1" then 'Polio immunization schedule is complete as client\'s age was more than 6 weeks when the primary series was started. Three poliovirus primary series doses were administered. '
    when "Polio immunization schedule is complete Case 2" then 'Polio immunization schedule is complete. Three poliovirus primary series doses and a booster dose were administered.'
    else ''
  end

/*
@output: Primary series is complete. Client is not due for IPV booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
@note: Added No polio booster dose because if the booster was less than 6 months ago this would still trigger 
       because the 6 month check pseudocode doesn't specify primary series for last does check.
*/
define "Primary series is complete. Client is not due for IPV booster dose":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."Client's age was 6 weeks when the primary series was started"
    and Encounter."The latest poliovirus dose was administered less than 6 months ago"
    and Encounter."No polio booster dose was administered"

/*
@output: Primary series is complete. Client is not due for IPV booster dose Guidance
@guidance: Should not vaccinate client with IPV booster dose as the latest poliovirus dose was administered less than 6 months ago.
Check for any other vaccines due and inform the caregiver when to come back for the booster dose.
*/
define "Primary series is complete. Client is not due for IPV booster dose Guidance":
  'Should not vaccinate client with IPV booster dose as the latest poliovirus dose was administered less than 6 months ago.
Check for any other vaccines due and inform the caregiver when to come back for the booster dose.'

/*
@output: Primary series is complete. Client is due for IPV booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Primary series is complete. Client is due for IPV booster dose":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."Client's age was 6 weeks when the primary series was started"
    and Encounter."The latest poliovirus dose was administered more than 6 months ago"
    and Encounter."No polio booster dose was administered"

/*
@output: Primary series is complete. Client is due for IPV booster dose Guidance
@guidance: Should vaccinate client with IPV booster dose as three poliovirus primary series doses were administered, client's age was 6 weeks when the primary series was started and the latest poliovirus dose was administered more than 6 months ago. 
Check for contraindications.
*/
define "Primary series is complete. Client is due for IPV booster dose Guidance":
  'Should vaccinate client with IPV booster dose as three poliovirus primary series doses were administered, client\'s age was 6 weeks when the primary series was started and the latest poliovirus dose was administered more than 6 months ago. 
Check for contraindications.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '71.Alt6w' then "Client is not due for IPV vaccination Case 1" and "Guidance" = 'Shold not vaccinate client with first IPV dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first IPV dose.'
    when Patient.id = '72.Agt6w' then "Client is due for IPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first IPV dose as client is within appropriate age range. 
Check for contraindications.'
    when Patient.id = '73.D1PDlt4w' then "Client is not due for IPV vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the second dose.'
    when Patient.id = '74.D1PDgt4w' then "Client is due for IPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with second IPV dose as the latest IPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '75.D2PDlt4w' then "Client is not due for IPV vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver when to come back for the third dose.'
    when Patient.id = '76.D2PDgt4w' then "Client is due for IPV vaccination Case 3" and "Guidance" = 'Should vaccinate client with third IPV dose as the latest poliovirus dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = '77.D3FDAgt6w' then "Polio immunization schedule is complete Case 1" and "Guidance" = 'Polio immunization schedule is complete as client\'s age was more than 6 weeks when the primary series was started. Three poliovirus primary series doses were administered. '
    when Patient.id = '78.D3FDA6wPDlt6m' then "Primary series is complete. Client is not due for IPV booster dose" and "Guidance" = 'Should not vaccinate client with IPV booster dose as the latest poliovirus dose was administered less than 6 months ago.
Check for any other vaccines due and inform the caregiver when to come back for the booster dose.'
    when Patient.id = '79.D3FDA6wPDgt6mBF' then "Primary series is complete. Client is due for IPV booster dose" and "Guidance" = 'Should vaccinate client with IPV booster dose as three poliovirus primary series doses were administered, client\'s age was 6 weeks when the primary series was started and the latest poliovirus dose was administered more than 6 months ago. 
Check for contraindications.'
    when Patient.id = '80.D3FDA6wPDgt6mBT' then "Polio immunization schedule is complete Case 2" and "Guidance" = 'Polio immunization schedule is complete. Three poliovirus primary series doses and a booster dose were administered.'
    else 'No test case set'
  end
