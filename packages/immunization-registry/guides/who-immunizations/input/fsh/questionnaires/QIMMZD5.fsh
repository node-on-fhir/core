Instance:     QIMMZD5
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.D5.Determine vaccine(s) to be administered based on contraindications"
Description:  "Questionnaire for IMMZ.D5.Determine vaccine(s) to be administered based on contraindications"
Usage: #definition

* version = "2025"
* status = #draft
* subjectType = #Patient
* language = #en
* contained[+] = IMMZ.D.DE161
* extension[+].url = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-targetStructureMap"
* extension[=].valueCanonical = "http://smart.who.int/immunizations/StructureMap/IMMZ.D5.QRToBundle"

* insert Question(potentialContraindications, Potential contraindications, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE161)
  * code[+] = IMMZ.D#DE161
