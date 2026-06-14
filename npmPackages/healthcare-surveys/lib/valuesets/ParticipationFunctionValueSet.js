// packages/healthcare-surveys/lib/valuesets/ParticipationFunctionValueSet.js

// Additional participation functions not covered in CareTeamFunctionValueSet
// These can be used for broader participation contexts beyond care team roles
const ParticipationFunctionValueSet = {
  system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
  
  // Additional participation types for healthcare surveys
  codes: {
    // Direct Care Participation
    PRF: {
      code: "PRF",
      display: "Performer",
      definition: "The principal or primary performer of the act."
    },
    PPRF: {
      code: "PPRF",
      display: "Primary Performer", 
      definition: "The principal performer of the act."
    },
    SPRF: {
      code: "SPRF",
      display: "Secondary Performer",
      definition: "A person assisting in an act through his substantial presence and involvement."
    },
    
    // Location/Device Participation
    LOC: {
      code: "LOC",
      display: "Location",
      definition: "The facility where the service is done."
    },
    DST: {
      code: "DST",
      display: "Destination",
      definition: "The destination for services."
    },
    DEV: {
      code: "DEV",
      display: "Device",
      definition: "A device that plays a role in the service."
    },
    
    // Information/Documentation
    AUT: {
      code: "AUT",
      display: "Author",
      definition: "The originator of the document or information."
    },
    INF: {
      code: "INF",
      display: "Informant",
      definition: "A source of information about the subject."
    },
    WIT: {
      code: "WIT",
      display: "Witness",
      definition: "A person witnessing the action happening."
    },
    ENT: {
      code: "ENT",
      display: "Data Entry",
      definition: "The person entering the data."
    },
    
    // Administrative/Coverage
    COV: {
      code: "COV",
      display: "Coverage Target",
      definition: "The party covered under the policy."
    },
    HLD: {
      code: "HLD",
      display: "Holder",
      definition: "The party who holds the insurance policy."
    },
    
    // Patient/Subject Related
    RCT: {
      code: "RCT",
      display: "Record Target",
      definition: "The record target indicates whose medical record holds the documentation of this act."
    },
    SBJ: {
      code: "SBJ",
      display: "Subject",
      definition: "The subject of the service."
    },
    BEN: {
      code: "BEN",
      display: "Beneficiary",
      definition: "The beneficiary of the service."
    },
    
    // Consent/Authorization
    CSN: {
      code: "CSN",
      display: "Consent",
      definition: "The entity that provided consent for the service."
    },
    
    // Referral/Consultation
    REF: {
      code: "REF",
      display: "Referrer",
      definition: "A person who referred the subject."
    },
    REFT: {
      code: "REFT",
      display: "Referred To",
      definition: "The person who receives the referral."
    },
    CON: {
      code: "CON",
      display: "Consultant",
      definition: "An advisor participating in the service."
    }
  },
  
  // SNOMED CT codes commonly used in participation
  snomedCodes: {
    PHYSICIAN: {
      system: "http://snomed.info/sct",
      code: "309343006",
      display: "Physician"
    },
    NURSE: {
      system: "http://snomed.info/sct",
      code: "106292003",
      display: "Nurse"
    },
    PHARMACIST: {
      system: "http://snomed.info/sct",
      code: "46255001",
      display: "Pharmacist"
    },
    SOCIAL_WORKER: {
      system: "http://snomed.info/sct",
      code: "106328005",
      display: "Social worker"
    },
    CARE_COORDINATOR: {
      system: "http://snomed.info/sct",
      code: "768820003",
      display: "Care coordinator"
    },
    FAMILY_MEMBER: {
      system: "http://snomed.info/sct",
      code: "303071001",
      display: "Family member"
    },
    CAREGIVER: {
      system: "http://snomed.info/sct",
      code: "133932002",
      display: "Caregiver"
    }
  },
  
  // Helper function to get code details
  getCode: function(code) {
    return this.codes[code] || null;
  },
  
  // Helper function to get SNOMED code details
  getSnomedCode: function(code) {
    return this.snomedCodes[code] || null;
  },
  
  // Helper function to create a CodeableConcept
  toCodeableConcept: function(code, useSnomed = false) {
    if (useSnomed) {
      const snomedDetails = this.getSnomedCode(code);
      if (!snomedDetails) {
        return null;
      }
      
      return {
        coding: [{
          system: snomedDetails.system,
          code: snomedDetails.code,
          display: snomedDetails.display
        }],
        text: snomedDetails.display
      };
    }
    
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
  
  // Create CodeableConcept with both v3 and SNOMED coding
  toMultiCodeableConcept: function(v3Code, snomedCode) {
    const coding = [];
    const v3Details = this.getCode(v3Code);
    const snomedDetails = this.getSnomedCode(snomedCode);
    
    if (v3Details) {
      coding.push({
        system: this.system,
        code: v3Details.code,
        display: v3Details.display
      });
    }
    
    if (snomedDetails) {
      coding.push({
        system: snomedDetails.system,
        code: snomedDetails.code,
        display: snomedDetails.display
      });
    }
    
    if (coding.length === 0) {
      return null;
    }
    
    return {
      coding: coding,
      text: v3Details?.display || snomedDetails?.display || ""
    };
  },
  
  // Get all codes as array
  getAllCodes: function() {
    return Object.keys(this.codes).map(key => this.codes[key]);
  },
  
  // Get all SNOMED codes as array
  getAllSnomedCodes: function() {
    return Object.keys(this.snomedCodes).map(key => this.snomedCodes[key]);
  }
};

// Export
if (typeof exports === 'object') {
  module.exports = { ParticipationFunctionValueSet };
}