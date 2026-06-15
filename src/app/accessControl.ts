export const APPLICATION_ROLES = {
  systemAdmin: "SuperAdmin",
  tenantAdmin: "Administrator",
  regularUser: "Operator"
} as const;

export function hasAnyRole(
  userRoles: readonly string[],
  requiredRoles?: readonly string[]
) {
  return (
    !requiredRoles ||
    requiredRoles.some((role) => userRoles.includes(role))
  );
}

export function canManageTenantResources(userRoles: readonly string[]) {
  return hasAnyRole(userRoles, [
    APPLICATION_ROLES.systemAdmin,
    APPLICATION_ROLES.tenantAdmin
  ]);
}

export function canManageUsers(userRoles: readonly string[]) {
  return canManageTenantResources(userRoles);
}

export function canManageSystem(userRoles: readonly string[]) {
  return hasAnyRole(userRoles, [APPLICATION_ROLES.systemAdmin]);
}
