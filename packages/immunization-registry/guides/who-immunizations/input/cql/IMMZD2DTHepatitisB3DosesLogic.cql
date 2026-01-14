/*
 * Library: IMMZD2DTHepatitisB3DosesLogic (IMMZ.D2.DT.Hepatitis B.3 doses)
 * Rule: Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule
 * Decision Table: 3-dose schedule (birth dose + 2 primary series doses), on-time start
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTHepatitisB3DosesLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTHepatitisBEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case 
    when "Client is not due for a hepatitis B vaccination" then "Client is not due for a hepatitis B vaccination Guidance"
    when "Client is due for a hepatitis B vaccination" then "Client is due for a hepatitis B vaccination Guidance"
    when "Hepatitis B immunization schedule is complete" then "Hepatitis B immunization schedule is complete Guidance" 
    else ''
  end
  
define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for a hepatitis B vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination Case 1":
  Encounter."No hepatitis B primary series doses were administered"
    and Encounter."Client's age is less than {Member States defined lower limit}"

/*
@output: Client is not due for a hepatitis B vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination Case 2":
  Encounter."One hepatitis B primary series dose was administered"
    and Encounter."The latest hepatitis B dose was administered less than 4 weeks ago"

/*
@output: Client is not due for a hepatitis B vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination Case 3":
  Encounter."Two hepatitis B primary series doses were administered"
    and Encounter."Client's weight at birth was below 2000 g"
    and Encounter."The latest hepatitis B dose was administered less than 4 weeks ago"

/*
@output: Client is not due for a hepatitis B vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination Case 4":
  Encounter."Two hepatitis B primary series doses were administered"
    and Encounter."Client was a premature infant at birth"
    and Encounter."The latest hepatitis B dose was administered less than 4 weeks ago"

/*
@output: Client is not due for a hepatitis B vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for a hepatitis B vaccination":
  "Client is not due for a hepatitis B vaccination Case 1"
    or "Client is not due for a hepatitis B vaccination Case 2"
    or "Client is not due for a hepatitis B vaccination Case 3"
    or "Client is not due for a hepatitis B vaccination Case 4"

/*
@output: Client is not due for a hepatitis B vaccination Guidance
@guidance = Should not vaccinate client with first hepatitis B dose as client's age is not within appropriate age range. 
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
@guidance = Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.
@guidance = Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine was administered less than 4 weeks ago. 
Check for any other vaccines due, and inform the caregiver of when to come back for the third dose.
@guidance = Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for a hepatitis B vaccination Guidance":
  case
    when "Client is not due for a hepatitis B vaccination Case 1" then 'Should not vaccinate client with first hepatitis B dose as client\'s age is not within appropriate age range. 
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for a hepatitis B vaccination Case 2" then 'Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.'
    when "Client is not due for a hepatitis B vaccination Case 3" then 'Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine was administered less than 4 weeks ago. 
Check for any other vaccines due, and inform the caregiver of when to come back for the third dose.'
    when "Client is not due for a hepatitis B vaccination Case 4" then 'Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for a hepatitis B vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination Case 1":
  Encounter."No hepatitis B primary series doses were administered"
    and Encounter."Client's age is more than or equal to {Member States defined lower limit}"

/*
@output: Client is due for a hepatitis B vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination Case 2":
  Encounter."One hepatitis B primary series dose was administered"
    and Encounter."The latest hepatitis B dose was administered more than 4 weeks ago"

/*
@output: Client is due for a hepatitis B vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination Case 3":
  Encounter."Two hepatitis B primary series doses were administered"
    and Encounter."Client's weight at birth was below 2000 g"
    and Encounter."The latest hepatitis B dose was administered more than 4 weeks ago"

/*
@output: Client is due for a hepatitis B vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination Case 4":
  Encounter."Two hepatitis B primary series doses were administered"
    and Encounter."Client was a premature infant at birth"
    and Encounter."The latest hepatitis B dose was administered more than 4 weeks ago"

/*
@output: Client is due for a hepatitis B vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for a hepatitis B vaccination":
  "Client is due for a hepatitis B vaccination Case 1"
    or "Client is due for a hepatitis B vaccination Case 2"
    or "Client is due for a hepatitis B vaccination Case 3"
    or "Client is due for a hepatitis B vaccination Case 4"

/*
@output: Client is due for a hepatitis B vaccination Guidance
@guidance = Should vaccinate client with first hepatitis B dose as client's age is within appropriate age range. 
Check for contraindications.
@guidance = Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago. 
Check for contraindications.
@guidance = Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine administered more than 4 weeks ago. 
Check for contraindications.
@guidance = Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered more than 4 weeks ago. 
Check for contraindications.
*/
define "Client is due for a hepatitis B vaccination Guidance":
  case
    when "Client is due for a hepatitis B vaccination Case 1" then 'Should vaccinate client with first hepatitis B dose as client\'s age is within appropriate age range. 
Check for contraindications.'
    when "Client is due for a hepatitis B vaccination Case 2" then 'Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when "Client is due for a hepatitis B vaccination Case 3" then 'Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine administered more than 4 weeks ago. 
Check for contraindications.'
    when "Client is due for a hepatitis B vaccination Case 4" then 'Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered more than 4 weeks ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Hepatitis B immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B immunization schedule is complete Case 1":
  Encounter."Two hepatitis B primary series doses were administered"
    and Encounter."Client's weight at birth was over 2000 g"
    and Encounter."Client was not a premature infant at birth"

/*
@output: Hepatitis B immunization schedule is complete Case 2
@pseudocode: '"Immunization recommendation status" = "Complete"
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B immunization schedule is complete Case 2":
  Encounter."Three hepatitis B primary series doses were administered"

/*
@output: Hepatitis B immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B immunization schedule is complete":
  "Hepatitis B immunization schedule is complete Case 1"
    or "Hepatitis B immunization schedule is complete Case 2"

/*
@output: Hepatitis B immunization schedule is complete Guidance
@guidance = Hepatitis B immunization schedule is complete for client whose weight at birth was over 2000 g and who was not premature infant. Two hepatitis B primary series doses were administered.
@guidance = The hepatitis B immunization schedule is complete for client whose weight at birth was below 2000 g and who was a premature infant. Four hepatitis B primary series doses were administered. 
Check for any other vaccines due.
*/
define "Hepatitis B immunization schedule is complete Guidance":
  case
    when "Hepatitis B immunization schedule is complete Case 1" then 'Hepatitis B immunization schedule is complete for client whose weight at birth was over 2000 g and who was not premature infant. Two hepatitis B primary series doses were administered.'
    when "Hepatitis B immunization schedule is complete Case 2" then 'The hepatitis B immunization schedule is complete for client whose weight at birth was below 2000 g and who was a premature infant. Four hepatitis B primary series doses were administered. 
Check for any other vaccines due.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'HepatitisB19.2' then "Client is not due for a hepatitis B vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first hepatitis B dose as client\'s age is not within appropriate age range. 
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = 'HepatitisB20.2' then "Client is due for a hepatitis B vaccination Case 1" and "Guidance" = 'Should vaccinate client with first hepatitis B dose as client\'s age is within appropriate age range. 
Check for contraindications.'
    when Patient.id = 'HepatitisB21.2' then "Client is not due for a hepatitis B vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the third dose.'
    when Patient.id = 'HepatitisB22.2' then "Client is due for a hepatitis B vaccination Case 2" and "Guidance" = 'Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = 'HepatitisB23.3' then "Hepatitis B immunization schedule is complete Case 1" and "Guidance" = 'Hepatitis B immunization schedule is complete for client whose weight at birth was over 2000 g and who was not premature infant. Two hepatitis B primary series doses were administered.'
    when Patient.id = 'HepatitisB24.3' then "Client is not due for a hepatitis B vaccination Case 3" and "Guidance" = 'Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine was administered less than 4 weeks ago. 
Check for any other vaccines due, and inform the caregiver of when to come back for the third dose.'
    when Patient.id = 'HepatitisB25.3' then "Client is due for a hepatitis B vaccination Case 3" and "Guidance" = 'Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = 'HepatitisB26.3' then "Client is not due for a hepatitis B vaccination Case 4" and "Guidance" = 'Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = 'HepatitisB27.3' then "Client is due for a hepatitis B vaccination Case 4" and "Guidance" = 'Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = 'HepatitisB28.1' then "Hepatitis B immunization schedule is complete Case 2" and "Guidance" = 'The hepatitis B immunization schedule is complete for client whose weight at birth was below 2000 g and who was a premature infant. Four hepatitis B primary series doses were administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
