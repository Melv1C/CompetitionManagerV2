import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, memberAc, ownerAc } from "better-auth/plugins/organization/access";

export const competitionActions = ["create", "update", "publish", "delete-draft"] as const;

const statements = {
  ...defaultStatements,
  competition: competitionActions,
} as const;

export const organizationAccessControl = createAccessControl(statements);

export const organizationOwnerRole = organizationAccessControl.newRole({
  ...ownerAc.statements,
  competition: [...competitionActions],
});

export const organizationStaffRole = organizationAccessControl.newRole({
  ...memberAc.statements,
  competition: [...competitionActions],
});

export const organizationMemberRole = organizationAccessControl.newRole({
  ...memberAc.statements,
  competition: [],
});

export const organizationRoles = {
  owner: organizationOwnerRole,
  staff: organizationStaffRole,
  member: organizationMemberRole,
};

export type CompetitionPermission = (typeof competitionActions)[number];
