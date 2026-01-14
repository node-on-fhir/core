Instance:     QIMMZD2
InstanceOf:   sdc-questionnaire-extr-smap
Title:        "IMMZ.D2.Determine required vaccination(s)"
Description:  "Questionnaire for IMMZ.D2.Determine required vaccination(s)"
Usage: #definition

* version = "2025"
* status = #draft
* subjectType = #Patient
* language = #en
* contained[+] = IMMZ.D.DE156

* insert Question(immunizationRecommendationStatus, Immunization recommendation status, choice, true, false)
* item[=]
  * answerValueSet = Canonical(IMMZ.D.DE156)
  * code[+] = IMMZ.D#DE156
