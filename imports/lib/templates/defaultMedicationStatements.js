///============================================
// STU
// v3.0.1

export const medicationStatement3 = {
    resourceType: "MedicationStatement",
    identifier: [{
      type: {
        coding: [
          {
            system: "http://hl7.org/fhir/identifier-type",
            code: "SNO"
          }
        ],
        text: "Serial Number"
      },
      value: ""
    }],
    basedOn: [],
    partOf: [],
    context: {
      referenec: ''
    },
    status: "",
    category: [{
      coding: [{
        code: "",
        display: ""
      }]
    }],
    medicationCodeableConcept: {
      coding: []
    },
    medicationReference: {
      reference: "",
      display: ""
    },
    effectiveDateTime: null,
    effectivePeriod: null,
    dateAsserted: null,
    informationSource: {
      reference: "",
      display: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    taken: "y",
    reasonCode: [{
      coding: [{
        code: "",
        display: ""
      }]
    }],
    reasonReference: [{
      display: '',
      referene: ''
    }],
    note: [{
      text: ''
    }],
    dosage: [{
      text: ''
    }]
  };



///============================================
// DSTU2
// v1.0.2

export const medicationStatement2 = {
  resourceType: "MedicationStatement",
  identifier: [{
    type: {
      coding: [
        {
          system: "http://hl7.org/fhir/identifier-type",
          code: "SNO"
        }
      ],
      text: "Serial Number"
    },
    value: ""
  }],
  patient: {
    reference: "",
    display: ""
  },
  informationSource: {
    reference: "",
    display: ""
  },
  dateAsserted: new Date(),
  status: "",
  wasNotTaken: false,
  reasonNotTaken: [],
  reasonForUseCodeableConcept: {
    coding: [{
      code: "",
      display: ""
    }]
  },
  reasonForUseReference: {
    reference: '',
    display: ''
  },
  effectiveDateTime: null,
  effectivePeriod: null,
  note: [{
    text: ''
  }],
  supportingInformation: [{
    display: '',
    reference: ''
  }],
  medicationReference: {
    reference: "",
    display: ""
  },
  dosage: [{
    text: ''
  }]
};

