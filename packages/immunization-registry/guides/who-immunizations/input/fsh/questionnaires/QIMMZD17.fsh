Instance:     QIMMZD17
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.D17.Report AEFI"
Description:  "Questionnaire for IMMZ.D17.Report AEFI"
Usage: #definition

* version = "2025"
* status = #draft
* subjectType = #Patient
* language = #en
* contained[+] = IMMZ.D.DE95
* contained[+] = IMMZ.D.DE107
* contained[+] = IMMZ.D.DE115
* extension[+].url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-targetStructureMap"
* extension[=].valueCanonical = "http://smart.who.int/immunizations/StructureMap/IMMZ.D17.QRToBundle"

* insert Question(reactionReported, Reaction reported, boolean, false, false)
* item[=]
  * code[+] = IMMZ.D#DE92
  * code[+] = $ICD11#PK81.7 "Injection or infusion for therapeutic or diagnostic purposes associated with injury or harm in therapeutic use"
  * code[+] = $SCT#418799008 "Finding reported by subject or history provider (finding)"
* insert Question(reactionDate, Reaction date, date, true, false)
* item[=]
  * extension[+]
    * url = "http://hl7.org/fhir/StructureDefinition/maxValue"
    * valueDate = 2100-01-01
      * extension[+]
        * url = "http://hl7.org/fhir/StructureDefinition/cqf-calculatedValue"
        * valueString = "today()"
  * code[+] = IMMZ.D#DE93
  * code[+] = $LNC#30953-4 "Date and time of onset of vaccination adverse event"
  * enableWhen[+]
    * question = "reactionReported"
    * operator = #=
    * answerBoolean = true
* insert Question(reactionManifestation, Reaction manifestation, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE95)
  * code[+] = IMMZ.D#DE95
  * code[+] = $ICD11#NE80.3 "Other serum reactions. This code includes 'Complications of vaccination, serum reaction'. A more specific code may be selected based on the documented reaction/manifestation"
  * enableWhen[+]
    * question = "reactionReported"
    * operator = #=
    * answerBoolean = true
* insert Question(typeOfReaction, Type of reaction, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE107)
  * code[+] = IMMZ.D#DE107
  * enableWhen[+]
    * question = "reactionReported"
    * operator = #=
    * answerBoolean = true
* insert Question(otherImportantMedicalEvent, [[Other important medical event (specify)]], string, false, false)
* item[=]
  * code[+] = IMMZ.D#DE113
* insert Question(reactionOutcome, Reaction outcome, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE115)
  * code[+] = IMMZ.D#DE115
  * code[+] = $SCT#293104008 "Adverse reaction to component of vaccine product (disorder)"
  * enableWhen[+]
    * question = "reactionReported"
    * operator = #=
    * answerBoolean = true
