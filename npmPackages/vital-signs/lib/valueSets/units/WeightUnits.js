// packages/vital-signs/lib/valueSets/units/WeightUnits.js

export const WeightUnits = {
  resourceType: "ValueSet",
  id: "weight-units",
  url: "http://hl7.org/fhir/ValueSet/ucum-vitals-weight",
  version: "1.0.0",
  name: "WeightUnits",
  title: "Weight Units",
  status: "active",
  experimental: false,
  date: "2025-01-01",
  publisher: "HL7 International",
  description: "Common UCUM units for measuring weight in vital signs",
  compose: {
    include: [{
      system: "http://unitsofmeasure.org",
      concept: [
        {
          code: "kg",
          display: "kilogram"
        },
        {
          code: "g",
          display: "gram"
        },
        {
          code: "[lb_av]",
          display: "pound (avoirdupois)"
        },
        {
          code: "[oz_av]",
          display: "ounce (avoirdupois)"
        }
      ]
    }]
  }
};

export default WeightUnits;