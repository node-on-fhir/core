// packages/patient-matching/lib/utils/matchingAlgorithm.js
import { get } from 'lodash';
import moment from 'moment';

// Matching weights configuration
const DEFAULT_WEIGHTS = {
  identifier: 0.35,
  name: 0.25,
  birthDate: 0.20,
  gender: 0.05,
  address: 0.10,
  telecom: 0.05
};

// Fuzzy matching library stub
const levenshteinDistance = function(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return 1 - (matrix[len1][len2] / Math.max(len1, len2));
};

// Main matching algorithm
export const MatchingAlgorithm = {
  // Calculate match score between two patients
  calculateMatchScore: function(patient1, patient2, options = {}) {
    const weights = Object.assign({}, DEFAULT_WEIGHTS, options.weights || {});
    const scores = {};
    let totalWeight = 0;
    let weightedScore = 0;
    
    // Match identifiers
    if (weights.identifier > 0) {
      scores.identifier = this.matchIdentifiers(
        get(patient1, 'identifier', []),
        get(patient2, 'identifier', [])
      );
      weightedScore += scores.identifier * weights.identifier;
      totalWeight += weights.identifier;
    }
    
    // Match names
    if (weights.name > 0) {
      scores.name = this.matchNames(
        get(patient1, 'name', []),
        get(patient2, 'name', [])
      );
      weightedScore += scores.name * weights.name;
      totalWeight += weights.name;
    }
    
    // Match birth date
    if (weights.birthDate > 0) {
      scores.birthDate = this.matchBirthDate(
        get(patient1, 'birthDate'),
        get(patient2, 'birthDate')
      );
      weightedScore += scores.birthDate * weights.birthDate;
      totalWeight += weights.birthDate;
    }
    
    // Match gender
    if (weights.gender > 0) {
      scores.gender = this.matchGender(
        get(patient1, 'gender'),
        get(patient2, 'gender')
      );
      weightedScore += scores.gender * weights.gender;
      totalWeight += weights.gender;
    }
    
    // Match address
    if (weights.address > 0) {
      scores.address = this.matchAddresses(
        get(patient1, 'address', []),
        get(patient2, 'address', [])
      );
      weightedScore += scores.address * weights.address;
      totalWeight += weights.address;
    }
    
    // Match telecom
    if (weights.telecom > 0) {
      scores.telecom = this.matchTelecoms(
        get(patient1, 'telecom', []),
        get(patient2, 'telecom', [])
      );
      weightedScore += scores.telecom * weights.telecom;
      totalWeight += weights.telecom;
    }
    
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    return {
      score: finalScore,
      confidence: this.getConfidenceLevel(finalScore),
      details: scores,
      algorithm: options.algorithm || 'weighted'
    };
  },
  
  // Match identifiers
  matchIdentifiers: function(identifiers1, identifiers2) {
    if (!identifiers1.length || !identifiers2.length) return 0;
    
    let bestScore = 0;
    
    for (const id1 of identifiers1) {
      for (const id2 of identifiers2) {
        if (get(id1, 'system') === get(id2, 'system')) {
          if (get(id1, 'value') === get(id2, 'value')) {
            return 1.0; // Exact identifier match
          }
        }
      }
    }
    
    return bestScore;
  },
  
  // Match names
  matchNames: function(names1, names2) {
    if (!names1.length || !names2.length) return 0;
    
    let bestScore = 0;
    
    for (const name1 of names1) {
      for (const name2 of names2) {
        let score = 0;
        let count = 0;
        
        // Match family name
        const family1 = get(name1, 'family', '').toLowerCase();
        const family2 = get(name2, 'family', '').toLowerCase();
        if (family1 && family2) {
          score += levenshteinDistance(family1, family2);
          count++;
        }
        
        // Match given names
        const given1 = get(name1, 'given', []).join(' ').toLowerCase();
        const given2 = get(name2, 'given', []).join(' ').toLowerCase();
        if (given1 && given2) {
          score += levenshteinDistance(given1, given2);
          count++;
        }
        
        if (count > 0) {
          const nameScore = score / count;
          if (nameScore > bestScore) {
            bestScore = nameScore;
          }
        }
      }
    }
    
    return bestScore;
  },
  
  // Match birth dates
  matchBirthDate: function(date1, date2) {
    if (!date1 || !date2) return 0;
    
    const d1 = moment(date1);
    const d2 = moment(date2);
    
    if (!d1.isValid() || !d2.isValid()) return 0;
    
    if (d1.isSame(d2, 'day')) return 1.0;
    
    const daysDiff = Math.abs(d1.diff(d2, 'days'));
    
    // Partial credit for close dates
    if (daysDiff <= 1) return 0.9;
    if (daysDiff <= 7) return 0.7;
    if (daysDiff <= 30) return 0.5;
    if (daysDiff <= 365) return 0.3;
    
    return 0;
  },
  
  // Match gender
  matchGender: function(gender1, gender2) {
    if (!gender1 || !gender2) return 0;
    return gender1.toLowerCase() === gender2.toLowerCase() ? 1.0 : 0;
  },
  
  // Match addresses
  matchAddresses: function(addresses1, addresses2) {
    if (!addresses1.length || !addresses2.length) return 0;
    
    let bestScore = 0;
    
    for (const addr1 of addresses1) {
      for (const addr2 of addresses2) {
        let score = 0;
        let count = 0;
        
        // Match postal code
        if (get(addr1, 'postalCode') === get(addr2, 'postalCode')) {
          score += 1.0;
          count++;
        }
        
        // Match city
        const city1 = get(addr1, 'city', '').toLowerCase();
        const city2 = get(addr2, 'city', '').toLowerCase();
        if (city1 && city2) {
          score += levenshteinDistance(city1, city2);
          count++;
        }
        
        // Match state
        if (get(addr1, 'state') === get(addr2, 'state')) {
          score += 1.0;
          count++;
        }
        
        if (count > 0) {
          const addrScore = score / count;
          if (addrScore > bestScore) {
            bestScore = addrScore;
          }
        }
      }
    }
    
    return bestScore;
  },
  
  // Match telecoms
  matchTelecoms: function(telecoms1, telecoms2) {
    if (!telecoms1.length || !telecoms2.length) return 0;
    
    for (const tel1 of telecoms1) {
      for (const tel2 of telecoms2) {
        if (get(tel1, 'system') === get(tel2, 'system')) {
          const value1 = get(tel1, 'value', '').replace(/\D/g, '');
          const value2 = get(tel2, 'value', '').replace(/\D/g, '');
          if (value1 && value2 && value1 === value2) {
            return 1.0;
          }
        }
      }
    }
    
    return 0;
  },
  
  // Get confidence level from score
  getConfidenceLevel: function(score) {
    if (score >= 0.95) return 'certain';
    if (score >= 0.80) return 'probable';
    if (score >= 0.60) return 'possible';
    return 'certainly-not';
  },
  
  // Phonetic matching
  soundex: function(str) {
    if (!str) return '';
    
    str = str.toUpperCase();
    const firstLetter = str[0];
    let coded = '';
    
    const codes = {
      B: '1', F: '1', P: '1', V: '1',
      C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
      D: '3', T: '3',
      L: '4',
      M: '5', N: '5',
      R: '6'
    };
    
    for (let i = 1; i < str.length; i++) {
      const code = codes[str[i]];
      if (code && code !== coded[coded.length - 1]) {
        coded += code;
      }
    }
    
    return (firstLetter + coded + '000').substring(0, 4);
  }
};

export default MatchingAlgorithm;