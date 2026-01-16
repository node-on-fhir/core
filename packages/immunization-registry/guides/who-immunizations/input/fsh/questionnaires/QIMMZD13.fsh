Instance:     QIMMZD13
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.D13.Update client record"
Description:  "Questionnaire for IMMZ.D13.Update client record"
Usage: #definition

* version = "2025"
* status = #draft
* subjectType = #Patient
* language = #en
* contained[+] = IMMZ.D.DE258
* contained[+] = IMMZ.D.DE204
* contained[+] = IMMZ.D.DE212
* contained[+] = IMMZ.D.DE216
* contained[+] = IMMZ.D.DE220
* contained[+] = IMMZ.D.DE225
* contained[+] = IMMZ.D.DE229
* contained[+] = IMMZ.D.DE232
* contained[+] = IMMZ.D.DE237
* contained[+] = IMMZ.D.DE254
* contained[+] = IMMZ.D.DE1
* contained[+] = IMMZ.D.DE5
* contained[+] = IMMZ.D.DE18
* contained[+] = IMMZ.D.DE23
* contained[+] = IMMZ.D.DE25
* contained[+] = IMMZ.D.DE126
* contained[+] = IMMZ.Z.VS
* contained[+] = IMMZ.Z.DE6
* contained[+] = IMMZ.Z.DE14
* contained[+] = IMMZ.Z.DE8
* contained[+] = IMMZ.Z.DE20
* contained[+] = IMMZ.Z.DE21
* contained[+] = IMMZ.Z.DE2
* contained[+] = IMMZ.Z.DE10
* contained[+] = IMMZ.Z.DE5
* extension[+].url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-targetStructureMap"
* extension[=].valueCanonical = "http://smart.who.int/immunizations/StructureMap/IMMZ.D13.QRToBundle"

* insert Question(birthDose, Birth dose, boolean, true, false)
* item[=]
  * code[+] = IMMZ.D#DE263
  * extension[+]
    * url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression"
    * valueExpression
      * name = "HepBorPolio"
      * language = #text/fhirpath
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE6') or %resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE14')"
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
      * expression = "%resource.item.where(linkId='vaccineType').answer.value.memberOf('http://smart.who.int/immunizations/ValueSet/IMMZ.Z.DE14')"
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
* insert Question(typeOfHepatitisADose, Type of hepatitis A dose, choice, false, false)
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
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/maxValue"
    * valueDateTime = 2100-01-01
      * extension[+]
        * url = "http://hl7.org/fhir/StructureDefinition/cqf-calculatedValue"
        * valueString = "now()"
  * code[+] = IMMZ.D#DE201
  * code[+] = $LNC#21975-8 "Date last contact"
  * code[+] = $SCT#406543005 "Date of visit"
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
* insert Question(immunizationEventStatus, Immunization event status, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE1)
  * code[+] = IMMZ.D#DE1
* insert Question(reasonVaccineWasNotAdministered, Reason vaccine was not administered, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE5)
  * code[+] = IMMZ.D#DE5
  * code[+] = $ICD11#QC04 "Immunization not carried out"
  * enableWhen[+]
    * question = "immunizationEventStatus"
    * operator = #=
    * answerCoding = IMMZ.D#DE4
* insert Question(vaccineBrand, Vaccine brand, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE18)
  * code[+] = IMMZ.D#DE18
* insert Question(liveVaccine, Live vaccine, boolean, false, false)
* item[=]
  * code[+] = IMMZ.D#DE173
* insert Question(countryOfVaccination, Country of vaccination, choice, true, false)
* item[=]
  * answerValueSet = "http://hl7.org/fhir/ValueSet/iso3166-1-3"
  * code[+] = IMMZ.D#DE21
* insert Question(administrativeArea, Administrative area, choice, false, false)
* item[=]
  * code[+] = IMMZ.D#DE22
  * code[+] = $LNC#72060-7 "Where was vaccine received"
* insert Question(vaccineManufacturer, Vaccine manufacturer, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE23)
  * code[+] = IMMZ.D#DE23
  * code[+] = $LNC#30957-5 "Manufacturer name [Identifier] Vaccine"
* insert Question(vaccineBatchNumber, Vaccine batch number, string, false, false)
* item[=]
  * code[+] = IMMZ.D#DE24
  * code[+] = $LNC#30959-1 "Lot number [Identifier] Vaccine"
* insert Question(vaccineMarketAuthorizationHolder, Vaccine market authorization holder, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE25)
  * code[+] = IMMZ.D#DE25
* insert Question(expirationDate, Expiration date, date, false, false)
* item[=]
  * code[+] = IMMZ.D#DE26
  * code[+] = $LNC#74066-2 "Expiration date of medication (Agency for Healthcare Research and Quality [AHRQ])"
* insert Question(doseQuantity, Dose quantity, quantity, false, false)
* item[=]
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/minValue"
    * valueDecimal = 0.00001
  * code[+] = IMMZ.D#DE34
  * code[+] = $LNC#82745-1 "Doses of vaccine given per symptom onset"
* insert Question(healthWorkerIdentifier, Health worker identifier, string, false, false)
* item[=]
  * code[+] = IMMZ.D#DE35
* insert Question(totalDosesInSeries, Total doses in series, integer, false, false)
* item[=]
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/minValue"
    * valueInteger = 1
  * code[+] = IMMZ.D#DE125
* insert Question(diseaseTargeted, Disease targeted, choice, false, true)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE126)
  * code[+] = IMMZ.D#DE126
* insert Question(dueDateOfNextDose, Due date of next dose, date, false, false)
* item[=]
  * code[+] = IMMZ.D#DE149
