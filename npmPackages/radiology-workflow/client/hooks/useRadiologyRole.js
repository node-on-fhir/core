// npmPackages/radiology-workflow/client/hooks/useRadiologyRole.js

import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// =============================================================================
// RADIOLOGY ROLE HOOK
// =============================================================================
//
// Determines the current user's radiology workflow role by looking up their
// PractitionerRole.code. Returns one of: 'nurse', 'tech', 'radiologist', or null.
//
// This hook enables role-based UI rendering and access control.
// =============================================================================

/**
 * FHIR Role codes mapped to radiology workflow roles
 */
const ROLE_MAPPINGS = {
  // Nursing roles
  'RN': 'nurse',
  'nurse': 'nurse',
  'registered-nurse': 'nurse',
  'LPN': 'nurse',
  'lpn': 'nurse',
  'NP': 'nurse',
  'nurse-practitioner': 'nurse',

  // Radiology technologist roles
  'RAD_TECH': 'tech',
  'rad-tech': 'tech',
  'technologist': 'tech',
  'radiographer': 'tech',
  'RT': 'tech',
  'imaging-technician': 'tech',
  'ct-technologist': 'tech',
  'mri-technologist': 'tech',
  'xray-technologist': 'tech',

  // Radiologist roles
  'RAD': 'radiologist',
  'radiologist': 'radiologist',
  'diagnostic-radiologist': 'radiologist',
  'interventional-radiologist': 'radiologist',
  'physician': 'radiologist', // Default physicians to radiologist in radiology context
  'MD': 'radiologist',
  'DO': 'radiologist'
};

/**
 * Map a FHIR role code to a radiology workflow role
 * @param {String} roleCode - FHIR PractitionerRole.code value
 * @returns {String|null} 'nurse', 'tech', 'radiologist', or null
 */
export function mapToRadiologyRole(roleCode) {
  if (!roleCode) return null;

  // Check direct mapping
  const directMatch = ROLE_MAPPINGS[roleCode];
  if (directMatch) return directMatch;

  // Check lowercase
  const lowerCode = roleCode.toLowerCase();
  const lowerMatch = ROLE_MAPPINGS[lowerCode];
  if (lowerMatch) return lowerMatch;

  // Check if code contains keywords
  if (lowerCode.includes('nurse') || lowerCode.includes('rn')) {
    return 'nurse';
  }
  if (lowerCode.includes('tech') || lowerCode.includes('radiograph')) {
    return 'tech';
  }
  if (lowerCode.includes('radiolog') || lowerCode.includes('physician')) {
    return 'radiologist';
  }

  return null;
}

/**
 * Hook to get the current user's radiology workflow role
 *
 * @returns {Object} { role, isLoading, practitionerRole }
 *   - role: 'nurse' | 'tech' | 'radiologist' | null
 *   - isLoading: Boolean indicating if still loading
 *   - practitionerRole: Full PractitionerRole object (if found)
 *
 * @example
 * function MyComponent() {
 *   const { role, isLoading } = useRadiologyRole();
 *
 *   if (isLoading) return <CircularProgress />;
 *
 *   if (role === 'nurse') {
 *     return <NursingDashboard />;
 *   } else if (role === 'tech') {
 *     return <TechDashboard />;
 *   } else if (role === 'radiologist') {
 *     return <ReadingDashboard />;
 *   }
 *
 *   return <Alert>No radiology role assigned</Alert>;
 * }
 */
export function useRadiologyRole() {
  return useTracker(() => {
    const user = Meteor.user();

    // Not logged in
    if (!user) {
      return { role: null, isLoading: false, practitionerRole: null };
    }

    // Get practitioner ID from user
    const practitionerId = get(user, 'practitionerId') || get(user, 'profile.practitionerId');

    if (!practitionerId) {
      // User has no associated practitioner
      return { role: null, isLoading: false, practitionerRole: null };
    }

    // Get PractitionerRoles collection
    const PractitionerRoles = Meteor.Collections?.PractitionerRoles ||
                               window.PractitionerRoles ||
                               (typeof global !== 'undefined' ? global.Collections?.PractitionerRoles : null);

    if (!PractitionerRoles) {
      console.warn('[useRadiologyRole] PractitionerRoles collection not available');
      return { role: null, isLoading: false, practitionerRole: null };
    }

    // Subscribe to practitioner roles for this user
    const handle = Meteor.subscribe('autopublish.PractitionerRoles', {
      'practitioner.reference': { $in: [
        `Practitioner/${practitionerId}`,
        practitionerId
      ]}
    }, {});

    if (!handle.ready()) {
      return { role: null, isLoading: true, practitionerRole: null };
    }

    // Find the practitioner role
    const practitionerRole = PractitionerRoles.findOne({
      $or: [
        { 'practitioner.reference': `Practitioner/${practitionerId}` },
        { 'practitioner.reference': practitionerId }
      ],
      active: { $ne: false } // Include active or undefined
    });

    if (!practitionerRole) {
      return { role: null, isLoading: false, practitionerRole: null };
    }

    // Extract role code from PractitionerRole.code array
    // Try multiple paths as FHIR structure can vary
    const roleCode =
      get(practitionerRole, 'code.0.coding.0.code') ||
      get(practitionerRole, 'code.0.text') ||
      get(practitionerRole, 'code.0.coding.0.display') ||
      get(practitionerRole, 'specialty.0.coding.0.code') ||
      get(practitionerRole, 'specialty.0.text');

    const role = mapToRadiologyRole(roleCode);

    return {
      role,
      isLoading: false,
      practitionerRole,
      roleCode // Include raw code for debugging
    };
  }, []);
}

/**
 * Hook to check if current user has a specific radiology role
 * @param {String} requiredRole - 'nurse', 'tech', or 'radiologist'
 * @returns {Object} { hasRole, isLoading }
 */
export function useHasRadiologyRole(requiredRole) {
  const { role, isLoading } = useRadiologyRole();

  return {
    hasRole: role === requiredRole,
    isLoading
  };
}

/**
 * Hook to check if user has any radiology role
 * @returns {Object} { hasAnyRole, isLoading }
 */
export function useHasAnyRadiologyRole() {
  const { role, isLoading } = useRadiologyRole();

  return {
    hasAnyRole: role !== null,
    isLoading
  };
}

export default useRadiologyRole;
