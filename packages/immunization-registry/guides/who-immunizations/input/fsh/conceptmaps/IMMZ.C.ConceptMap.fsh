Instance: IMMZ.C.ConceptMap
InstanceOf: ConceptMap
Description:  "Mapping to and from IMMZ.C Data Dictionary to other codesystems."
Usage:        #definition

* name = "IMMZ_C_ConceptMap"
* title = "ConceptMap to and from IMMZ.C DataElements"
* status = #active
* experimental = false
* date = "2024-12-12"

* group[+]
  * source = Canonical(IMMZ.C)
  * target = $GENDER
  * insert ElementMap(DE6, male, equivalent)
  * insert ElementMap(DE7, female, equivalent)
  * insert ElementMap(DE8, unknown, equivalent)
  * insert ElementMap(DE9, other, wider)
* group[+]
  * source = $GENDER
  * target = Canonical(IMMZ.C)
  * insert ElementMap(male, DE6, equivalent)
  * insert ElementMap(female, DE7, equivalent)
  * insert ElementMap(unknown, DE8, equivalent)
  * insert ElementMapComment(other, DE9, narrower, The DAK only provides Intersex as other options so the other from the source may be something else.)

* group[+]
  * source = Canonical(IMMZ.C)
  * target = $ICD11
  * insert ElementMap(DE6, XX2UQ8, equivalent)
  * insert ElementMap(DE7, XX2V25, equivalent)
  * insert ElementMap(DE8, XX2PX3, equivalent)
  * insert ElementMap(DE9, XX45B7, equivalent)
* group[+]
  * source = $ICD11
  * target = Canonical(IMMZ.C)
  * insert ElementMap(XX2UQ8, DE6, equivalent)
  * insert ElementMap(XX2V25, DE7, equivalent)
  * insert ElementMap(XX2PX3, DE8, equivalent)
  * insert ElementMap(XX45B7, DE9, equivalent)

* group[+]
  * source = Canonical(IMMZ.C)
  * target = $LNC
  * insert ElementMap(DE2, 54125-0, equivalent)
  * insert ElementMap(DE3, 45392-8, equivalent)
  * insert ElementMap(DE4, 45394-4, equivalent)
  * insert ElementMap(DE5, 46098-0, equivalent)
  * insert ElementMap(DE10, 21112-8, equivalent)
  * insert ElementMap(DE13, 63900-5, wider)
  * insert ElementMap(DE16, 45392-8, wider)
  * insert ElementMap(DE17, 45394-4, wider)
  * insert ElementMap(DE18, 42077-8, equivalent)
  * insert ElementMapComment(DE19, 56799-0, narrower, Per the Immunizations DAK)
* group[+]
  * source = $LNC
  * target = Canonical(IMMZ.C)
  * insert ElementMap(54125-0, DE2, equivalent)
  * insert ElementMap(45392-8, DE3, equivalent)
  * insert ElementMap(45394-4, DE4, equivalent)
  * insert ElementMap(46098-0, DE5, equivalent)
  * insert ElementMap(21112-8, DE10, equivalent)
  * insert ElementMapComment(63900-5, DE13, narrower, Per the Immunizations DAK)
  * insert ElementMapComment(45392-8, DE16, narrower, Per the Immunizations DAK)
  * insert ElementMapComment(45394-4, DE17, narrower, Per the Immunizations DAK)
  * insert ElementMap(42077-8, DE18, equivalent)
  * insert ElementMap(56799-0, DE19, wider)

* group[+]
  * source = Canonical(IMMZ.C)
  * target = $SCT
  * insert ElementMap(DE2, 371484003, equivalent)
  * insert ElementMap(DE3, 184095009, relatedto)
  * insert ElementMap(DE4, 184096005, relatedto)
  * insert ElementMap(DE5, 184100006, equivalent)
  * insert ElementMap(DE6, 248153007, equivalent)
  * insert ElementMap(DE7, 248152002, equivalent)
  * insert ElementMap(DE8, 772004004, relatedto)
  * insert ElementMap(DE9, 15867007, equivalent)
  * insert ElementMap(DE10, 184099003, equivalent)
  * insert ElementMap(DE14, 184140000, wider)
  * insert ElementMap(DE15, 184140000, wider)
  * insert ElementMap(DE18, 184103008, equivalent)
  * insert ElementMapComment(DE19, 184097001, narrower, Per the Immunizations DAK)
* group[+]
  * source = $SCT
  * target = Canonical(IMMZ.C)
  * insert ElementMap(371484003, DE2, equivalent)
  * insert ElementMap(184095009, DE3, relatedto)
  * insert ElementMap(184096005, DE4, relatedto)
  * insert ElementMap(184100006, DE5, equivalent)
  * insert ElementMap(248153007, DE6, equivalent)
  * insert ElementMap(248152002, DE7, equivalent)
  * insert ElementMap(772004004, DE8, relatedto)
  * insert ElementMap(15867007, DE9, equivalent)
  * insert ElementMap(184099003, DE10, equivalent)
  * insert ElementMapComment(184140000, DE14, narrower, Per the Immunizations DAK)
  * insert ElementMapComment(184140000, DE15, narrower, Per the Immunizations DAK)
  * insert ElementMap(184103008, DE18, equivalent)
  * insert ElementMap(184097001, DE19, wider)

