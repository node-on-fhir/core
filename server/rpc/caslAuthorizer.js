// server/rpc/caslAuthorizer.js
// Default authorizer for ServerMethods `allow: { roles: [...] }` declarations.
//
// FhirAuth's CASL AccessControl instance is Consent-derived resource×action
// grants (Patient/access etc.) — it does not carry method-level role labels.
// Per the plan (Task 2 Step 4), the adapter therefore evaluates against the
// user-role source that stack consumes: the resolved auth role (FhirAuth's
// `role` on HTTP contexts) or getAuthorizedRole(user.roles) for DDP/server
// contexts. CaslAccessControl itself is NOT modified.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { getAuthorizedRole } from '/server/lib/FhirAuth.js';

const ELEVATED_ROLES = ['system', 'SYSTEM'];

async function roleAuthorizer(context, allow) {
  const allowedRoles = get(allow, 'roles', []);
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return { allowed: true };
  }

  let role = context.role;
  if (!role && context.userId) {
    const user = await Meteor.users.findOneAsync({ _id: context.userId }, { fields: { roles: 1 } });
    role = getAuthorizedRole(get(user, 'roles', []));
  }

  if (ELEVATED_ROLES.includes(role)) {
    return { allowed: true };
  }
  if (allowedRoles.includes(role)) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'role "' + role + '" is not permitted (requires one of: ' + allowedRoles.join(', ') + ')' };
}

ServerMethods.setAuthorizer(roleAuthorizer);

export { roleAuthorizer };
