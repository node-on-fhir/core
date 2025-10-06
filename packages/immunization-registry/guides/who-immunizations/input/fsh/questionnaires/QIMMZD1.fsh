Instance:     QIMMZD1
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.D1.Capture or update client history"
Description:  "Questionnaire for IMMZ.D1.Capture or update client history"
Usage: #definition

* version = "2025"
* status = #draft
* subjectType = #Patient
* language = #en
* contained[+] = IMMZ.D.DE258
* contained[+] = IMMZ.D.DE204
* contained[+] = IMMZ.D.DE243
* contained[+] = IMMZ.D.DE246
* contained[+] = IMMZ.D.DE212
* contained[+] = IMMZ.D.DE216
* contained[+] = IMMZ.D.DE220
* contained[+] = IMMZ.D.DE225
* contained[+] = IMMZ.D.DE229
* contained[+] = IMMZ.D.DE232
* contained[+] = IMMZ.D.DE237
* contained[+] = IMMZ.D.DE254
* contained[+] = IMMZ.D.DE241
* contained[+] = IMMZ.Z.VS
* contained[+] = IMMZ.Z.DE6
* contained[+] = IMMZ.Z.DE14
* contained[+] = IMMZ.Z.DE30
* contained[+] = IMMZ.Z.DE31
* contained[+] = IMMZ.Z.DE1
* contained[+] = IMMZ.Z.DE21
* contained[+] = IMMZ.Z.DE9
* contained[+] = IMMZ.Z.DE13
* contained[+] = IMMZ.Z.DE8
* contained[+] = IMMZ.Z.DE20
* contained[+] = IMMZ.Z.DE2
* contained[+] = IMMZ.Z.DE10
* contained[+] = IMMZ.Z.DE5
* contained[+] = IMMZ.Z.DE15
* contained[+] = IMMZ.Z.DE25
* extension[+].url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-targetStructureMap"
* extension[=].valueCanonical = "http://smart.who.int/immunizations/StructureMap/IMMZ.D1.QRToBundle"

* insert Question(birthDose, Birth dose, boolean, true, false)
* item[=]
  * code[+] = IMMZ.D#DE263
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "HepBorPolio"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE6') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE14') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE30') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE31')"
* insert Question(typeOfDose, Type of dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE258)
  * code[+] = IMMZ.D#DE258
* insert Question(completedThePrimaryVaccinationSeries, Completed the primary vaccination series, boolean, false, false)
* item[=]
  * code[+] = IMMZ.D#DE203
* insert Question(completedTheBoosterSeries, Completed the booster series, boolean, false, false)
* item[=]
  * code[+] = IMMZ.D#DE257
* insert Question(dateWhenPrimaryVaccinationSeriesWasCompleted, Date when primary vaccination series was completed, date, true, false)
* item[=]
  * code[+] = IMMZ.D#DE242
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/maxValue"
    * valueDate = 2100-01-01
      * extension[+]
        * url = "http://hl7.org/fhir/StructureDefinition/cqf-calculatedValue"
        * valueString = "today()"
  * enableWhen[+]
    * question = "completedThePrimaryVaccinationSeries"
    * operator = #=
    * answerBoolean = true
* insert Question(hivStatus, HIV status, choice, false, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE204)
  * code[+] = IMMZ.D#DE204
  * code[+] = $LNC#55277-8 "HIV Status"
  * code[+] = $SCT#278977008 "HIV status"
* insert Question(pretermBirth, Preterm birth, boolean, false, false)
* item[=]
  * code[+] = IMMZ.D#DE208
  * code[+] = $ICD11#KA21.4 "Preterm newborn"
  * code[+] = $LNC#76517-2 "Premature infant"
  * code[+] = $SCT#395507008 "Premature infant (finding)"
* insert Question(immunocompromised, Immunocompromised, boolean, false, false)
* item[=]
  * code[+] = IMMZ.D#DE209
  * code[+] = $ICD11#4B4Z "Diseases of the immune system, unspecified"
  * code[+] = $LNC#96381-9 "Immune status"
  * code[+] = $SCT#370388006 "Patient immunocompromised (finding)"
* insert Question(currentlyOnArt, Currently on ART, boolean, true, false)
* item[=]
  * code[+] = IMMZ.D#DE210
  * enableWhen[+]
    * question = "hivStatus"
    * operator = #=
    * answerCoding = IMMZ.D#DE205
* insert Question(typeOfTbInfectionTestPerformed, Type of TB infection test performed, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE243)
  * code[+] = IMMZ.D#DE243
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "BCG"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE1')"
* insert Question(tbInfectionTestResult, TB infection test result, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE246)
  * code[+] = IMMZ.D#DE246
  * enableWhen[+]
    * question = "typeOfTbInfectionTestPerformed"
    * operator = #exists
    * answerBoolean = true
* insert Question(immunologicallyStable, Immunologically stable, boolean, true, false)
* item[=]
  * code[+] = IMMZ.D#DE249
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "BCGorTyphoid"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE1') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE21')"
* insert Question(clinicallyWell, Clinically well, boolean, true, false)
* item[=]
  * code[+] = IMMZ.D#DE250
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "BCG"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE1')"
* insert Question(birthWeightInGrams, Birth weight in grams, decimal, true, false)
* item[=]
  * code[+] = IMMZ.D#DE211
  * code[+] = $ICD11#KA21 "Disorders of newborn related to short gestation or low birth weight, not elsewhere classified"
  * code[+] = $LNC#8339-4 "Birth weight measured"
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/minValue"
    * valueDecimal = 0.0
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "BCGorHepB"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE1') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE6')"
* insert Question(typeOfPoliovirusDose, Type of poliovirus dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE212)
  * code[+] = IMMZ.D#DE212
  * code[+] = $ICD11#XM0N50 "Poliomyelitis vaccines"
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Polio"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE14') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE30') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE31')"
* insert Question(artStartDate, ART start date, date, true, false)
* item[=]
  * code[+] = IMMZ.D#DE215
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/maxValue"
    * valueDate = 2100-01-01
      * extension[+]
        * url = "http://hl7.org/fhir/StructureDefinition/cqf-calculatedValue"
        * valueString = "today()"
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Measles"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE9') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE32')"
* insert Question(highRiskOfPneumococcalInfection, High risk of pneumococcal infection, boolean, true, false)
* item[=]
  * code[+] = IMMZ.D#DE251
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Pneumococcal"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE13')"
* insert Question(typeOfJeDose, Type of JE dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE216)
  * code[+] = IMMZ.D#DE216
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "JE"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE8')"
* insert Question(typeOfTbeDose, Type of TBE dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE220)
  * code[+] = IMMZ.D#DE220
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "TBE"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE20')"
* insert Question(typeOfTyphoidDose, Type of typhoid dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE225)
  * code[+] = IMMZ.D#DE225
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Typhoid"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE21')"
* insert Question(typeOfCholeraDose, Type of cholera dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE229)
  * code[+] = IMMZ.D#DE229
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Cholera"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE2')"
* insert Question(typeOfMeningococcalDose, Type of meningococcal dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE232)
  * code[+] = IMMZ.D#DE232
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Meningococcal"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE10')"
* insert Question(ageInMonthsWhenClientReceivedFirstMeningococcalDose, Age in months when client received first meningococcal dose, decimal, true, false)
* item[=]
  * code[+] = IMMZ.D#DE236
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/minValue"
    * valueDecimal = 0.0
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Meningococcal"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE10')"
* insert Question(typeOfHepatitisADose, Type of hepatitis A dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE237)
  * code[+] = IMMZ.D#DE237
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "HepatitisA"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE5')"
* insert Question(typeOfHepatitisBDose, Type of hepatitis B dose, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE254)
  * code[+] = IMMZ.D#DE254
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "HepatitisB"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE6')"
* insert Question(vnaLevel, VNA level, decimal, true, false)
* item[=]
  * code[+] = IMMZ.D#DE240
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/minValue"
    * valueDecimal = 0.0
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Rabies"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE15')"
* insert Question(riskOfOccupationalExposureToRabiesVirus, Risk of occupational exposure to rabies virus, boolean, true, false)
* item[=]
  * code[+] = IMMZ.D#DE253
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Rabies"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE15')"
* insert Question(dengueSerostatus, Dengue serostatus, choice, false, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE241)
  * code[+] = IMMZ.D#DE241
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "Dengue"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE25')"
* insert Question(vaccineType, Vaccine type, choice, true, true)
* item[=]
  * answerValueSet = Canonical(IMMZ.Z.VS)
  * code[+] = IMMZ.D#DE19
  * code[+] = $LNC#39236-5 "Vaccine code (CPT [Current Procedural Terminology]) CPHS (Children's Preventative Health System)"
  * code[+] = $SCT#787859002 "Vaccine product (medicinal product)"
* insert Question(dateAndTimeOfVaccination, Date and time of vaccination, dateTime, true, false)
* item[=]
  * code[+] = IMMZ.D#DE20
  * code[+] = $LNC#30952-6 "Date and time of vaccination"
* insert Question(contactDate, Contact date, dateTime, false, false)
* item[=]
  * code[+] = IMMZ.D#DE201
  * code[+] = $LNC#21975-8 "Date last contact"
  * code[+] = $SCT#406543005 "Date of visit"
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/maxValue"
    * valueDateTime = 2100-01-01
      * extension[+]
        * url = "http://hl7.org/fhir/StructureDefinition/cqf-calculatedValue"
        * valueString = "now()"
* insert Question(ancContactNumber, ANC contact number, integer, false, false)
* item[=]
  * code[+] = IMMZ.D#DE202
  * code[+] = $LNC#75612-2 "Number of visits to this health-care entity in the last 12 months"
  * code[+] = $SCT#3401000175105 "Total number of prenatal care visits"
* insert Question(doseNumber, Dose number, integer, true, false)
* item[=]
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/minValue"
    * valueInteger = 0
  * code[+] = IMMZ.D#DE124
