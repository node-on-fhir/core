// server/lib/CaslAccessControl.js
// Drop-in replacement for role-acl's `AccessControl`, backed by CASL. It re-exposes
// the exact subset of role-acl's fluent surface that this codebase uses, so call
// sites in FhirEndpoints.js / DicomEndpoints.js / ConsentEngineHttp.js change zero
// lines — only the import source swaps from 'role-acl' to './CaslAccessControl.js'.
//
// Behavior faithfully reproduces role-acl's verified runtime quirks for the RBAC
// allow-list (the "coat-check" defense):
//   - unknown role throws AccessControlError: Role not found: "<role>"
//   - grant('<role>') with no .on() does NOT register the role (query throws -> deny)
//   - comma-joined action strings ("access, correct") match any element
//   - valid role / no matching rule -> { granted:false, attributes:[] } (no throw)
//   - .sync() returns a plain object; the async form (no .sync()) returns a Promise
//
// It INTENTIONALLY diverges from role-acl in one way: confidentiality conditions
// are actually enforced (role-acl ignored fluent .when()). A record's meta.security
// label is compared ordinally against the role's clearance. This is the deliberate
// "make enforcement real" change from the approved plan; it only affects requests
// against labeled records and is covered by the decision-matrix test.

import {
  aclRecordToPermissionRule,
  compilePermissionRules,
  clearanceForRole,
  rankOfLabel,
  labelFromContext,
  splitActions
} from './PermissionModel.js';

export class AccessControlError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AccessControlError';
  }
}

// Returned by acl.grant(role) — accumulates a grant via .execute().on().when().
class GrantBuilder {
  constructor(acl, role) {
    this._acl = acl;
    this._role = role;
    this._action = undefined;
  }
  execute(action) {
    this._action = action;
    return this;
  }
  on(resource, attributes = ['*']) {
    // A grant only registers its role once it targets a resource+action — matching
    // role-acl, where a bare grant('PAT') leaves PAT unqueryable.
    const rule = this._acl._addRecord({
      role: this._role,
      action: this._action,
      resource,
      attributes
    });
    // role-acl returns the grant so callers can chain .when(); preserve that.
    return {
      when: (condition) => {
        if (rule && condition) {
          rule._condition = condition;
          this._acl._dirty = true;
        }
        return this;
      }
    };
  }
}

// Returned by acl.can(role) — builds and evaluates a permission query.
class Query {
  constructor(acl, role) {
    this._acl = acl;
    this._role = role;
    this._action = undefined;
    this._ctx = {};
    this._sync = false;
  }
  execute(action) {
    this._action = action;
    return this;
  }
  with(ctx) {
    this._ctx = ctx || {};
    return this;
  }
  sync() {
    this._sync = true;
    return this;
  }
  on(resource) {
    const result = this._acl._evaluate(this._role, this._action, resource, this._ctx);
    return this._sync ? result : Promise.resolve(result);
  }
}

export class AccessControl {
  // `records` (optional) is the object-form constructor used by ConsentEngineHttp:
  // an array of flat role-acl grant records ({ role, action, resource, attributes, condition? }).
  constructor(records) {
    this._rules = [];          // minimal Permission.rule[] — the internal IR
    this._roles = new Set();   // roles with at least one completed grant
    this._abilities = null;    // Map<role, MongoAbility>, compiled lazily
    this._dirty = true;
    if (Array.isArray(records)) {
      records.forEach((rec) => this._addRecord(rec));
    }
  }

  grant(role) {
    return new GrantBuilder(this, role);
  }

  can(role) {
    return new Query(this, role);
  }

  getRoles() {
    return [...this._roles];
  }

  getGrants() {
    return this._rules;
  }

  // Append a flat grant record as a Permission.rule. Returns the stored rule so
  // GrantBuilder.when() can attach a condition to it. A record without a resource
  // or action does not register the role (matches role-acl's bare-grant behavior).
  _addRecord(rec) {
    if (!rec || !rec.role || !rec.resource || !rec.action) return null;
    const rule = aclRecordToPermissionRule(rec);
    this._rules.push(rule);
    this._roles.add(rec.role);
    this._dirty = true;
    return rule;
  }

  _abilitiesMap() {
    if (this._dirty || !this._abilities) {
      this._abilities = compilePermissionRules(this._rules);
      this._dirty = false;
    }
    return this._abilities;
  }

  _evaluate(role, action, resource, ctx) {
    // role-acl throws on an unknown/unregistered role; endpoints catch this -> deny.
    if (!this._roles.has(role)) {
      throw new AccessControlError(`Role not found: "${role}"`);
    }

    const ability = this._abilitiesMap().get(role);
    const label = labelFromContext(ctx);
    const subject = {
      type: resource,
      confidentiality: label == null ? undefined : String(label).trim()
    };

    // Axis 1: RBAC allow-list (role x resource x action), incl. any EQUALS condition.
    let rbacGranted = false;
    const actions = splitActions(action);
    for (const a of actions) {
      if (ability && ability.can(a, subject)) {
        rbacGranted = true;
        break;
      }
    }

    // Axis 2: confidentiality clearance (ordinal). Unlabeled -> 'normal' by default.
    const clearanceOk = rankOfLabel(label) <= clearanceForRole(role);

    const granted = rbacGranted && clearanceOk;
    return { granted, attributes: granted ? ['*'] : [] };
  }
}

export default AccessControl;
