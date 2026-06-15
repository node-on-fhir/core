// packages/healthcare-surveys/lib/valuesets/CareTeamFunctionValueSet.js

// v3-ParticipationFunction Code System
// URL: http://terminology.hl7.org/CodeSystem/v3-ParticipationFunction
const CareTeamFunctionValueSet = {
  system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationFunction",
  
  // Primary Healthcare Provider Codes
  codes: {
    // Physicians
    ADMPHYS: {
      code: "ADMPHYS",
      display: "Admitting Physician",
      definition: "A physician who admitted a patient to a hospital or other care unit that is the context of this service."
    },
    ATTPHYS: {
      code: "ATTPHYS", 
      display: "Attending Physician",
      definition: "The physician primarily responsible for a patient during hospitalization."
    },
    DISPHYS: {
      code: "DISPHYS",
      display: "Discharging Physician",
      definition: "The physician who discharged a patient from a hospital or other care unit."
    },
    PCP: {
      code: "PCP",
      display: "Primary Care Physician",
      definition: "The healthcare provider that holds primary responsibility for the overall care of a patient."
    },
    RNDPHYS: {
      code: "RNDPHYS",
      display: "Rounding Physician", 
      definition: "A physician who made rounds on a patient in a hospital or other care center."
    },
    
    // Surgical Team
    PRISURG: {
      code: "PRISURG",
      display: "Primary Surgeon",
      definition: "The principal surgeon who performed the surgical procedure."
    },
    FASST: {
      code: "FASST",
      display: "First Assistant",
      definition: "The first assistant to the primary surgeon."
    },
    SASST: {
      code: "SASST",
      display: "Second Assistant",
      definition: "The second assistant to the primary surgeon."
    },
    TASST: {
      code: "TASST",
      display: "Third Assistant",
      definition: "The third assistant to the primary surgeon."
    },
    
    // Anesthesia Team
    ANEST: {
      code: "ANEST",
      display: "Anesthesiologist",
      definition: "The healthcare provider who administered anesthesia."
    },
    ANRS: {
      code: "ANRS",
      display: "Anesthesia Nurse",
      definition: "A nurse who assists with anesthesia administration."
    },
    
    // Nursing Staff
    MDWF: {
      code: "MDWF",
      display: "Midwife",
      definition: "A person skilled in aiding the delivery of babies."
    },
    NASST: {
      code: "NASST",
      display: "Nurse Assistant",
      definition: "A person who assists nurses in care delivery."
    },
    SNRS: {
      code: "SNRS",
      display: "Scrub Nurse",
      definition: "A nurse who assists in surgery."
    },
    
    // Administrative/Support Roles
    AUTM: {
      code: "AUTM",
      display: "Care Team Information Receiver",
      definition: "Care team member authorized to receive patient health information."
    },
    AUWA: {
      code: "AUWA",
      display: "Authenticator",
      definition: "A verifier who attests to the accuracy of information."
    },
    GUAR: {
      code: "GUAR",
      display: "Guarantor",
      definition: "Person who assumes financial responsibility for a patient's healthcare."
    },
    INF: {
      code: "INF",
      display: "Informant",
      definition: "A source of reported information."
    },
    TRANS: {
      code: "TRANS",
      display: "Transcriber",
      definition: "Person who transcribed dictated content."
    },
    SOURCE: {
      code: "SOURCE",
      display: "Source of Information",
      definition: "The source of the information in the entry."
    },
    SPRF: {
      code: "SPRF",
      display: "Specialist Performer",
      definition: "A care team member with specialized expertise."
    }
  },
  
  // Helper function to get code details
  getCode: function(code) {
    return this.codes[code] || null;
  },
  
  // Helper function to create a CodeableConcept
  toCodeableConcept: function(code) {
    const codeDetails = this.getCode(code);
    if (!codeDetails) {
      return null;
    }
    
    return {
      coding: [{
        system: this.system,
        code: codeDetails.code,
        display: codeDetails.display
      }],
      text: codeDetails.display
    };
  },
  
  // Get all codes as array
  getAllCodes: function() {
    return Object.keys(this.codes).map(key => this.codes[key]);
  }
};

// Export
if (typeof exports === 'object') {
  module.exports = { CareTeamFunctionValueSet };
}