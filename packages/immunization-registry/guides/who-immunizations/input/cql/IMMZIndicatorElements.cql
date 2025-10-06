/**
 * Immunization Indicator Elements by Patients as Context
 */

library IMMZIndicatorElements

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC

include IMMZConcepts called Concepts
include IMMZAgeConcepts called Age
include IMMZCommon called Common
include IMMZElements called Elements



codesystem "Administrative Gender Codes": 'http://hl7.org/fhir/administrative-gender'
code "Males" : 'male' from "Administrative Gender Codes" display 'Males'
code "Females" : 'female' from "Administrative Gender Codes" display 'Females'
code "Other" : 'other' from "Administrative Gender Codes" display 'Other/NA'

parameter "Measurement Period" Interval<Date> default Interval[@2025-01-01, @2025-12-31]

context Patient

/*
@stratifier: Age in Years
*/
define "Age Stratifier":
  case
    when AgeInYearsAt(end of "Measurement Period") < 1 then Age."P0Y--P1Y"
    when AgeInYearsAt(end of "Measurement Period") < 2 then Age."P1Y--P2Y"
    when AgeInYearsAt(end of "Measurement Period") < 3 then Age."P2Y--P3Y"
    when AgeInYearsAt(end of "Measurement Period") < 4 then Age."P3Y--P4Y"
    when AgeInYearsAt(end of "Measurement Period") < 5 then Age."P4Y--P5Y"
    when AgeInYearsAt(end of "Measurement Period") < 6 then Age."P5Y--P6Y"
    when AgeInYearsAt(end of "Measurement Period") < 7 then Age."P6Y--P7Y"
    when AgeInYearsAt(end of "Measurement Period") < 8 then Age."P7Y--P8Y"
    when AgeInYearsAt(end of "Measurement Period") < 9 then Age."P8Y--P9Y"
    when AgeInYearsAt(end of "Measurement Period") < 10 then Age."P9Y--P10Y"
    when AgeInYearsAt(end of "Measurement Period") < 11 then Age."P10Y--P11Y"
    when AgeInYearsAt(end of "Measurement Period") < 12 then Age."P11Y--P12Y"
    when AgeInYearsAt(end of "Measurement Period") < 13 then Age."P12Y--P13Y"
    when AgeInYearsAt(end of "Measurement Period") < 14 then Age."P13Y--P14Y"
    when AgeInYearsAt(end of "Measurement Period") < 15 then Age."P14Y--P15Y"
    when AgeInYearsAt(end of "Measurement Period") < 16 then Age."P15Y--P16Y"
    when AgeInYearsAt(end of "Measurement Period") < 17 then Age."P16Y--P17Y"
    when AgeInYearsAt(end of "Measurement Period") < 18 then Age."P17Y--P18Y"
    when AgeInYearsAt(end of "Measurement Period") < 19 then Age."P18Y--P19Y"
    when AgeInYearsAt(end of "Measurement Period") < 20 then Age."P19Y--P20Y"
    when AgeInYearsAt(end of "Measurement Period") < 21 then Age."P20Y--P21Y"
    when AgeInYearsAt(end of "Measurement Period") < 22 then Age."P21Y--P22Y"
    when AgeInYearsAt(end of "Measurement Period") < 23 then Age."P22Y--P23Y"
    when AgeInYearsAt(end of "Measurement Period") < 24 then Age."P23Y--P24Y"
    when AgeInYearsAt(end of "Measurement Period") < 25 then Age."P24Y--P25Y"
    when AgeInYearsAt(end of "Measurement Period") < 26 then Age."P25Y--P26Y"
    when AgeInYearsAt(end of "Measurement Period") < 27 then Age."P26Y--P27Y"
    when AgeInYearsAt(end of "Measurement Period") < 28 then Age."P27Y--P28Y"
    when AgeInYearsAt(end of "Measurement Period") < 29 then Age."P28Y--P29Y"
    when AgeInYearsAt(end of "Measurement Period") < 30 then Age."P29Y--P30Y"
    when AgeInYearsAt(end of "Measurement Period") < 31 then Age."P30Y--P31Y"
    when AgeInYearsAt(end of "Measurement Period") < 32 then Age."P31Y--P32Y"
    when AgeInYearsAt(end of "Measurement Period") < 33 then Age."P32Y--P33Y"
    when AgeInYearsAt(end of "Measurement Period") < 34 then Age."P33Y--P34Y"
    when AgeInYearsAt(end of "Measurement Period") < 35 then Age."P34Y--P35Y"
    when AgeInYearsAt(end of "Measurement Period") < 36 then Age."P35Y--P36Y"
    when AgeInYearsAt(end of "Measurement Period") < 37 then Age."P36Y--P37Y"
    when AgeInYearsAt(end of "Measurement Period") < 38 then Age."P37Y--P38Y"
    when AgeInYearsAt(end of "Measurement Period") < 39 then Age."P38Y--P39Y"
    when AgeInYearsAt(end of "Measurement Period") < 40 then Age."P39Y--P40Y"
    when AgeInYearsAt(end of "Measurement Period") < 41 then Age."P40Y--P41Y"
    when AgeInYearsAt(end of "Measurement Period") < 42 then Age."P41Y--P42Y"
    when AgeInYearsAt(end of "Measurement Period") < 43 then Age."P42Y--P43Y"
    when AgeInYearsAt(end of "Measurement Period") < 44 then Age."P43Y--P44Y"
    when AgeInYearsAt(end of "Measurement Period") < 45 then Age."P44Y--P45Y"
    when AgeInYearsAt(end of "Measurement Period") < 46 then Age."P45Y--P46Y"
    when AgeInYearsAt(end of "Measurement Period") < 47 then Age."P46Y--P47Y"
    when AgeInYearsAt(end of "Measurement Period") < 48 then Age."P47Y--P48Y"
    when AgeInYearsAt(end of "Measurement Period") < 49 then Age."P48Y--P49Y"
    when AgeInYearsAt(end of "Measurement Period") < 50 then Age."P49Y--P50Y"
    when AgeInYearsAt(end of "Measurement Period") < 51 then Age."P50Y--P51Y"
    when AgeInYearsAt(end of "Measurement Period") < 52 then Age."P51Y--P52Y"
    when AgeInYearsAt(end of "Measurement Period") < 53 then Age."P52Y--P53Y"
    when AgeInYearsAt(end of "Measurement Period") < 54 then Age."P53Y--P54Y"
    when AgeInYearsAt(end of "Measurement Period") < 55 then Age."P54Y--P55Y"
    when AgeInYearsAt(end of "Measurement Period") < 56 then Age."P55Y--P56Y"
    when AgeInYearsAt(end of "Measurement Period") < 57 then Age."P56Y--P57Y"
    when AgeInYearsAt(end of "Measurement Period") < 58 then Age."P57Y--P58Y"
    when AgeInYearsAt(end of "Measurement Period") < 59 then Age."P58Y--P59Y"
    when AgeInYearsAt(end of "Measurement Period") < 60 then Age."P59Y--P60Y"
    when AgeInYearsAt(end of "Measurement Period") < 61 then Age."P60Y--P61Y"
    when AgeInYearsAt(end of "Measurement Period") < 62 then Age."P61Y--P62Y"
    when AgeInYearsAt(end of "Measurement Period") < 63 then Age."P62Y--P63Y"
    when AgeInYearsAt(end of "Measurement Period") < 64 then Age."P63Y--P64Y"
    when AgeInYearsAt(end of "Measurement Period") < 65 then Age."P64Y--P65Y"
    when AgeInYearsAt(end of "Measurement Period") < 66 then Age."P65Y--P66Y"
    when AgeInYearsAt(end of "Measurement Period") < 67 then Age."P66Y--P67Y"
    when AgeInYearsAt(end of "Measurement Period") < 68 then Age."P67Y--P68Y"
    when AgeInYearsAt(end of "Measurement Period") < 69 then Age."P68Y--P69Y"
    when AgeInYearsAt(end of "Measurement Period") < 70 then Age."P69Y--P70Y"
    when AgeInYearsAt(end of "Measurement Period") < 71 then Age."P70Y--P71Y"
    when AgeInYearsAt(end of "Measurement Period") < 72 then Age."P71Y--P72Y"
    when AgeInYearsAt(end of "Measurement Period") < 73 then Age."P72Y--P73Y"
    when AgeInYearsAt(end of "Measurement Period") < 74 then Age."P73Y--P74Y"
    when AgeInYearsAt(end of "Measurement Period") < 75 then Age."P74Y--P75Y"
    when AgeInYearsAt(end of "Measurement Period") < 76 then Age."P75Y--P76Y"
    when AgeInYearsAt(end of "Measurement Period") < 77 then Age."P76Y--P77Y"
    when AgeInYearsAt(end of "Measurement Period") < 78 then Age."P77Y--P78Y"
    when AgeInYearsAt(end of "Measurement Period") < 79 then Age."P78Y--P79Y"
    when AgeInYearsAt(end of "Measurement Period") < 80 then Age."P79Y--P80Y"
    when AgeInYearsAt(end of "Measurement Period") < 81 then Age."P80Y--P81Y"
    when AgeInYearsAt(end of "Measurement Period") < 82 then Age."P81Y--P82Y"
    when AgeInYearsAt(end of "Measurement Period") < 83 then Age."P82Y--P83Y"
    when AgeInYearsAt(end of "Measurement Period") < 84 then Age."P83Y--P84Y"
    when AgeInYearsAt(end of "Measurement Period") < 85 then Age."P84Y--P85Y"
    when AgeInYearsAt(end of "Measurement Period") < 86 then Age."P85Y--P86Y"
    when AgeInYearsAt(end of "Measurement Period") < 87 then Age."P86Y--P87Y"
    when AgeInYearsAt(end of "Measurement Period") < 88 then Age."P87Y--P88Y"
    when AgeInYearsAt(end of "Measurement Period") < 89 then Age."P88Y--P89Y"
    when AgeInYearsAt(end of "Measurement Period") < 90 then Age."P89Y--P90Y"
    when AgeInYearsAt(end of "Measurement Period") < 91 then Age."P90Y--P91Y"
    when AgeInYearsAt(end of "Measurement Period") < 92 then Age."P91Y--P92Y"
    when AgeInYearsAt(end of "Measurement Period") < 93 then Age."P92Y--P93Y"
    when AgeInYearsAt(end of "Measurement Period") < 94 then Age."P93Y--P94Y"
    when AgeInYearsAt(end of "Measurement Period") < 95 then Age."P94Y--P95Y"
    when AgeInYearsAt(end of "Measurement Period") < 96 then Age."P95Y--P96Y"
    when AgeInYearsAt(end of "Measurement Period") < 97 then Age."P96Y--P97Y"
    when AgeInYearsAt(end of "Measurement Period") < 98 then Age."P97Y--P98Y"
    when AgeInYearsAt(end of "Measurement Period") < 99 then Age."P98Y--P99Y"
    when AgeInYearsAt(end of "Measurement Period") < 100 then Age."P99Y--P100Y"
    when AgeInYearsAt(end of "Measurement Period") >= 100 then Age."P100Y--P9999Y"
    else null
  end

/* 
@stratifier: Infant disaggregations by age
*/
define "Newborn By Age Stratifier":
    case 
        when AgeInHoursAt(end of "Measurement Period") <= 24 then Age."PT0H--PT24H"
        when AgeInWeeksAt(end of "Measurement Period") <= 2 then Age."PT24H--P2W"
        when AgeInWeeksAt(end of "Measurement Period") > 2 then Age."P2W--P9999Y"
        else null
    end

/*
@stratifier: Infant disaggregations by age
*/
define "Infant By Age Stratifier":
    case 
        when AgeInYearsAt(end of "Measurement Period") < 1 then Age."P0Y--P1Y"
        when AgeInYearsAt(end of "Measurement Period") >= 1 then Age."P1Y--P9999Y"
        else null
    end

/* 
@stratifier: Toddler By Age Stratifiers
*/
define "Toddler By Age Stratifier":
    case 
        when AgeInYearsAt(end of "Measurement Period") < 1 then Age."P0Y--P1Y"
        when AgeInYearsAt(end of "Measurement Period") < 2 then Age."P1Y--P2Y"
        when AgeInYearsAt(end of "Measurement Period") >= 2 then Age."P2Y--P9999Y"
        else null
    end

/* 
@stratifier: Child By Age Stratifiers
*/
define "Child By Age Stratifier":
    case 
        when AgeInYearsAt(end of "Measurement Period") < 1 then Age."P0Y--P1Y"
        when AgeInYearsAt(end of "Measurement Period") < 3 then Age."P1Y--P3Y"
        when AgeInYearsAt(end of "Measurement Period") < 6 then Age."P3Y--P6Y"
        when AgeInYearsAt(end of "Measurement Period") < 13 then Age."P6Y--P13Y"
        when AgeInYearsAt(end of "Measurement Period") >= 13 then Age."P13Y--P9999Y"
        else null
    end

/* 
@stratifier: Adolescent By Age Stratifiers
*/
define "Adolescent By Age Stratifier":
    case 
        when AgeInYearsAt(end of "Measurement Period") < 9 then Age."P0Y--P9Y"
        when AgeInYearsAt(end of "Measurement Period") <= 14 then Age."P9Y--P15Y"
        when AgeInYearsAt(end of "Measurement Period") > 14 then Age."P15Y--P9999Y"
        else null
    end

/*
@stratifier: Age Group Stratifier
*/
define "By Age Group Stratifier":
  case 
    when AgeInYearsAt(end of "Measurement Period") < 18 then Age."P0Y--P18Y"
    when AgeInYearsAt(end of "Measurement Period") < 30 then Age."P18Y--P30Y"
    when AgeInYearsAt(end of "Measurement Period") < 50 then Age."P30Y--P50Y"
    when AgeInYearsAt(end of "Measurement Period") < 70 then Age."P50Y--P70Y"
    when AgeInYearsAt(end of "Measurement Period") >= 70 then Age."P70Y--P9999Y"
    else null
  end

/*
@stratifier: By Administrative Gender of Patient Stratifier
*/
define "By Administrative Gender Stratifier":
    case 
        when Patient.gender = 'male' then "Males"
        when Patient.gender = 'female' then "Females"
        else "Other"
    end

/*
@stratifier: By Geographic Region of Patient Stratifier
*/
define "By Geographic Region Stratifier":
    First(Patient.address A where A.use in { 'home' }).state

/** 
 * @dataElement Patient is deceased
 */
define "Patient Deceased During Measurement Period":
  case 
    when Patient.deceased is FHIR.boolean then Patient.deceased as FHIR.boolean
    when Patient.deceased is FHIR.dateTime then Patient.deceased as FHIR.dateTime before end of "Measurement Period"
    else false
  end

/** 
 * Patient was born during measurement period
 */
define "Patient Born During Measurement Period":
    Patient.birthDate during "Measurement Period"

/** 
 * Patient is < 12 months old at the end of the measurement period
 */
define "Patient Under 12 Months Old During Measurement Period":
    Patient.birthDate less than 12 months before end of "Measurement Period"

/** 
 * Patient is < 12 years old at the end of the measurement period
 */
define "Patient Under 2 Years Old During Measurement Period":
    Patient.birthDate less than 2 years before end of "Measurement Period"

/** 
 * @define Doses which were administered during the measurement period
 */
define "Doses Administered to Patient During Measurement Period":
  Elements."Doses Administered to Patient"  I
    where I.occurrence.toInterval() starts during "Measurement Period"

define "Adverse Events During Measurement Period":
  [AdverseEvent] AE
    where AE.date.toInterval() starts during "Measurement Period"
/*
  [Observation: WHOConcepts."Adverse Events"] O
    where O.effective.toInterval() during "Measurement Period"
*/

define "Immunizations And Adverse Events During Measurement Period":
  from
    "Doses Administered to Patient During Measurement Period" I,
    "Adverse Events During Measurement Period" O
  where I.reaction.detail.references(O)
  return { immunization: I, adverseEvent: O }

define "Pentavalent Doses Administered to Patient":
  Elements."Doses Administered to Patient" I 
    where I.vaccineCode in Concepts."Pentavalent vaccines"

define "Pentavalent Doses Administered to Patient During Measurement Period":
  "Pentavalent Doses Administered to Patient" I
    where I.occurrence.toInterval() starts during "Measurement Period"

define "Measles and Rubella Doses Administered to Patient":
  Elements."Doses Administered to Patient" I 
    where I.vaccineCode in Concepts."Measles and rubella-containing vaccines"

define "Measles and Rubella Doses Administered to Patient During Measurement Period":
  "Measles and Rubella Doses Administered to Patient" I
    where I.occurrence.toInterval() starts during "Measurement Period"

define "COVID-19 Doses Administered to Patient During Measurement Period":
  "Doses Administered to Patient During Measurement Period" I 
    where I.vaccineCode in Concepts."COVID-19 vaccines"

define "Adverse Events for Immunization":
  [AdverseEvent] AE
    where AE.actuality = 'actual'

/** 
 * @define Adverse events for immunizations which occurred during (or observed) during measurement period
 */
define "Immunizations with Adverse Events During Measurement Period":
  "Immunizations And Adverse Events During Measurement Period" I
    return I.immunization

/** 
 * @define Adverse events for immunizations which occurred during (or observed) during measurement period
 */
define "Adverse Event Reactions During Measurement Period":
  "Immunizations And Adverse Events During Measurement Period" I
    return I.adverseEvent

/** 
 * @function
 * @param immunization The immunization record for which the location should be retrieved
 * @return FHIR.address The location that the immunization event occurred
 */
define function GetGeographicRegionForImmunization(immunization Immunization):
  (
    [Location] L
        where immunization.location.references(L)
  ).only().address.state

/** 
 * @function
 * @param immunization The immunization record for which the location should be retrieved
 * @return FHIR.name The name of the location that the immunization event occurred
 */
define function GetLocationNameForImmunization(immunization Immunization):
  (
    [Location] L
        where immunization.location.references(L)
  ).only().name
