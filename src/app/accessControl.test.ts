import { describe, expect, it } from "vitest";
import {
  APPLICATION_ROLES,
  canManageSystem,
  canManageTenantResources,
  canManageUsers,
  hasAnyRole
} from "./accessControl";

describe("access control", () => {
  it("grants global administration only to SuperAdmin", () => {
    expect(canManageSystem([APPLICATION_ROLES.systemAdmin])).toBe(true);
    expect(canManageSystem([APPLICATION_ROLES.tenantAdmin])).toBe(false);
    expect(canManageSystem([APPLICATION_ROLES.regularUser])).toBe(false);
  });

  it("grants tenant resources and user management to both admin levels", () => {
    for (const role of [
      APPLICATION_ROLES.systemAdmin,
      APPLICATION_ROLES.tenantAdmin
    ]) {
      expect(canManageTenantResources([role])).toBe(true);
      expect(canManageUsers([role])).toBe(true);
    }
  });

  it("keeps regular users out of administrative areas", () => {
    const roles = [APPLICATION_ROLES.regularUser];

    expect(canManageTenantResources(roles)).toBe(false);
    expect(canManageUsers(roles)).toBe(false);
    expect(canManageSystem(roles)).toBe(false);
  });

  it("allows unrestricted navigation items for authenticated users", () => {
    expect(hasAnyRole([APPLICATION_ROLES.regularUser])).toBe(true);
  });
});
