// server/lib/PermissionModel.js
// Phase-1 internal authorization model: a minimal FHIR Permission.rule
// representation plus the CASL compiler that turns rules into per-role
// abilities. This is the seam between policy *source* (today: Consent-derived
// grants + hardcoded grants) and the CASL evaluation engine. Phase 2 will feed
// the same compiler from stored FHIR Permission resources instead.
//
// See .claude plan: "Migrate role-acl -> CASL (Phase 1), with a minimal FHIR
// Permission internal model". Conditions are evaluated by @ucast/mongo2js
// (no eval), which is what retires the role-acl -> jsonpath-plus CVE chain.

import { AbilityBuilder, createMongoAbility } from '@casl/ability';

// =============================================================================
// Confidentiality (HL7 v3 Confidentiality) — the ordinal sensitivity axis
// CodeSystem: http://terminology.hl7.org/CodeSystem/v3-Confidentiality
// =============================================================================

// Ordered ranks for the confidentiality scale. Both codes (U/L/M/N/R/V) and
// their display strings are accepted, since meta.security may carry either.
export const CONFIDENTIALITY_RANK = {
  U: 0, unrestricted: 0,
  L: 1, low: 1,
  M: 2, moderate: 2,
  N: 3, normal: 3,
  R: 4, restricted: 4,
  V: 5, 'very restricted': 5, 'very-restricted': 5
};

// When a record has no meta.security label we treat it as 'normal' (N). This
// matches the historical call-site default (get(record,'meta.security[0].display','normal'))
// and the existing Mongo pre-filters that only expose 'unrestricted' records to
// anonymous/citizen roles — so an unlabeled record stays hidden from low-clearance roles.
export const DEFAULT_RECORD_RANK = CONFIDENTIALITY_RANK.normal; // 3

export function rankOfLabel(label) {
  if (label === undefined || label === null || label === '') return DEFAULT_RECORD_RANK;
  const key = String(label).trim();
  if (key in CONFIDENTIALITY_RANK) return CONFIDENTIALITY_RANK[key];
  const lower = key.toLowerCase();
  if (lower in CONFIDENTIALITY_RANK) return CONFIDENTIALITY_RANK[lower];
  // Unknown label -> default (normal). Don't silently grant by treating it as unrestricted.
  console.warn('[PermissionModel] Unknown confidentiality label, defaulting to normal:', label);
  return DEFAULT_RECORD_RANK;
}

// Role -> maximum confidentiality clearance (rank). Roles NOT listed here are
// left unrestricted by confidentiality (rank V) so existing access is preserved;
// only the explicitly-listed roles gain a confidentiality ceiling. This table is
// the one piece of *policy* (not derivable from code) — see the approved plan.
export const ROLE_CLEARANCE = {
  citizen: CONFIDENTIALITY_RANK.U,                  // unrestricted only
  PAT: CONFIDENTIALITY_RANK.U,                       // (unregistered in practice; kept for completeness)
  user: CONFIDENTIALITY_RANK.N,                      // normal
  patient: CONFIDENTIALITY_RANK.N,                   // normal (own records reachable via owner path)
  'healthcare practitioner': CONFIDENTIALITY_RANK.R, // restricted
  'healthcare provider': CONFIDENTIALITY_RANK.R,     // restricted
  SYSTEM: CONFIDENTIALITY_RANK.V,                    // very restricted (full)
  system: CONFIDENTIALITY_RANK.V,                    // JWT backend services role (lowercase)
  noauth: CONFIDENTIALITY_RANK.V                     // SafeNoAuth dev bypass (full)
};

// Unlisted-but-registered roles get no confidentiality restriction, so the
// migration never *reduces* access for a role we didn't anticipate.
export const DEFAULT_ROLE_CLEARANCE = CONFIDENTIALITY_RANK.V; // 5

export function clearanceForRole(role) {
  if (Object.prototype.hasOwnProperty.call(ROLE_CLEARANCE, role)) return ROLE_CLEARANCE[role];
  return DEFAULT_ROLE_CLEARANCE;
}

// Pull the confidentiality label out of a permission-check context object,
// reconciling the historical key drift (securityLabel / securityLevel / confidentiality).
export function labelFromContext(ctx) {
  if (!ctx) return undefined;
  if (ctx.securityLabel != null) return ctx.securityLabel;
  if (ctx.securityLevel != null) return ctx.securityLevel;
  if (ctx.confidentiality != null) return ctx.confidentiality;
  return undefined;
}

// =============================================================================
// Permission.rule IR helpers
// =============================================================================

// role-acl joined multiple action codes into a single comma-delimited string
// ("access, correct") and matched any element. Preserve that semantics.
export function splitActions(action) {
  if (Array.isArray(action)) return action.map(a => String(a).trim()).filter(Boolean);
  return String(action == null ? '' : action).split(',').map(a => a.trim()).filter(Boolean);
}

// Subject type detector for CASL: subjects are plain objects { type, confidentiality }
// (or, defensively, a bare resourceType string).
export function subjectTypeOf(subject) {
  if (typeof subject === 'string') return subject;
  return subject && subject.type;
}

// Convert a flat role-acl grant record — the shape produced by
// FhirUtilities.consentIntoAccessControl and by the fluent grant() builder —
// into a minimal FHIR Permission.rule. Only the fields we use are populated;
// `_condition`/`_attributes` are internal (underscore-prefixed) carriers, not
// part of the FHIR element set.
export function aclRecordToPermissionRule(rec) {
  const rule = {
    type: 'permit',
    data: [{ resourceType: rec.resource }],
    activity: [{
      actor: [{ role: rec.role }],
      action: splitActions(rec.action)
    }]
  };
  if (rec.condition) rule._condition = rec.condition;       // { Fn:'EQUALS', args:{ <key>: <value> } }
  if (rec.attributes) rule._attributes = rec.attributes;    // projection (unused in P1; always ['*'])
  return rule;
}

// Port a role-acl EQUALS condition to a CASL MongoDB-style condition keyed on the
// canonical `confidentiality` subject field. This deliberately reconciles the old
// securityLevel/securityLabel key mismatch so conditioned grants actually evaluate.
function caslConditionFrom(condition) {
  if (!condition) return undefined;
  if (condition.Fn === 'EQUALS' && condition.args && typeof condition.args === 'object') {
    const firstVal = Object.values(condition.args)[0];
    if (firstVal !== undefined) return { confidentiality: firstVal };
  }
  // Unknown function — treat as unconditional (role-acl was permissive here).
  return undefined;
}

// Compile minimal Permission.rule[] into a Map<role, MongoAbility>. Phase 1 only
// emits permit rules, so the combining strategy is implicit deny-unless-permit,
// which is exactly CASL's default-deny. Confidentiality clearance is applied
// separately (ordinal compare) by the evaluator, not encoded here.
export function compilePermissionRules(rules) {
  const byRole = new Map();
  for (const rule of (rules || [])) {
    if (rule.type && rule.type !== 'permit') continue;
    const condition = caslConditionFrom(rule._condition);
    for (const data of (rule.data || [])) {
      const resourceType = data.resourceType;
      if (!resourceType) continue;
      for (const activity of (rule.activity || [])) {
        const actions = (activity.action && activity.action.length) ? activity.action : ['access'];
        for (const actor of (activity.actor || [])) {
          const role = actor.role;
          if (!role) continue;
          if (!byRole.has(role)) byRole.set(role, []);
          byRole.get(role).push({ resourceType, actions, condition });
        }
      }
    }
  }

  const abilities = new Map();
  for (const [role, entries] of byRole) {
    const { can, build } = new AbilityBuilder(createMongoAbility);
    for (const { resourceType, actions, condition } of entries) {
      for (const action of actions) {
        if (condition) can(action, resourceType, condition);
        else can(action, resourceType);
      }
    }
    abilities.set(role, build({ detectSubjectType: subjectTypeOf }));
  }
  return abilities;
}
