import { Knex } from 'knex'
import * as uuid from 'uuid'
import { Role } from '../../src/domain/enums/rolesEmun'
import { Permission } from '../../src/domain/enums/permissionEnum'

const uuidv4 = uuid.v4

export async function seed(knex: Knex): Promise<void> {
  // Define roles from the Role enum
  const roles = Object.values(Role).map((role) => ({ name: role }))

  // Define permissions from the Permission enum
  const permissions = Object.values(Permission).map((permission) => ({
    name: permission,
  }))

  // Insert roles only if they do not exist
  for (const role of roles) {
    const existingRole = await knex('roles').where('name', role.name).first()
    if (!existingRole) {
      await knex('roles').insert({ id: uuidv4(), name: role.name })
    }
  }

  // Insert permissions only if they do not exist
  for (const permission of permissions) {
    const existingPermission = await knex('permissions')
      .where('name', permission.name)
      .first()
    if (!existingPermission) {
      await knex('permissions').insert({ id: uuidv4(), name: permission.name })
    }
  }

  // Fetch role IDs
  const adminRole = await knex('roles').where('name', Role.SUPER_ADMIN).first()
  const superAdminRole = await knex('roles')
    .where('name', Role.SUPER_ADMIN)
    .first()

  // Fetch all permission IDs
  const allPermissions = await knex('permissions').select('id')

  // Assign all permissions to admin and super_admin if not already assigned
  if (adminRole) {
    for (const permission of allPermissions) {
      const exists = await knex('role_permissions')
        .where({ role_id: adminRole.id, permission_id: permission.id })
        .first()
      if (!exists) {
        await knex('role_permissions').insert({
          id: uuidv4(),
          role_id: adminRole.id,
          permission_id: permission.id,
        })
      }
    }
  }

  if (superAdminRole) {
    for (const permission of allPermissions) {
      const exists = await knex('role_permissions')
        .where({ role_id: superAdminRole.id, permission_id: permission.id })
        .first()
      if (!exists) {
        await knex('role_permissions').insert({
          id: uuidv4(),
          role_id: superAdminRole.id,
          permission_id: permission.id,
        })
      }
    }
  }

  // --- Assign Permissions to Specific Roles ---

  // Helper function to assign permissions to a role
  const assignPermissionsToRole = async (
    roleName: Role,
    permissionNames: Permission[],
  ): Promise<void> => {
    const role = await knex('roles').where('name', roleName).first();

    if (!role) {
      console.warn(`Role '${roleName}' not found. Skipping permission assignment.`);
      return;
    }

    const permissions = await knex('permissions')
      .whereIn('name', permissionNames)
      .select('id', 'name'); // Select name for logging

    if (permissions.length !== permissionNames.length) {
      const foundNames = permissions.map(p => p.name);
      const missingNames = permissionNames.filter(name => !foundNames.includes(name));
      console.warn(`Could not find all permissions for role '${roleName}'. Missing: ${missingNames.join(', ')}`);
      // Continue with found permissions
    }


    for (const permission of permissions) {
      const exists = await knex('role_permissions')
        .where({ role_id: role.id, permission_id: permission.id })
        .first();
      if (!exists) {
        await knex('role_permissions').insert({
          id: uuidv4(),
          role_id: role.id,
          permission_id: permission.id,
        });
      }
    }
    console.log(
      `Assigned ${permissions.length} permissions to role '${roleName}'.`,
    );
  };

  // Define permissions for DEVELOPER_ADMIN role
  const developerAdminPermissionNames = [
    Permission.VIEW_OWN_ORGANIZATION_PROFILE,
    Permission.EDIT_OWN_ORGANIZATION_PROFILE,
    Permission.MANAGE_OWN_ORGANIZATION_MEMBERS, // Add permission to manage members
    Permission.CREATE_PROPERTY_LISTING,
    Permission.EDIT_OWN_PROPERTY_LISTING,
    Permission.EDIT_ANY_PROPERTY_LISTING_IN_OWN_ORG,
    Permission.DELETE_PROPERTY_LISTING,
    Permission.VIEW_ALL_PROPERTY_LISTINGS_IN_OWN_ORG,
    Permission.TOGGLE_PROPERTY_LIVE_STATUS, // Admin should likely toggle live status
    Permission.VIEW_OWN_LOAN_APPLICATIONS,
    Permission.VIEW_LOAN_APPLICATIONS_ASSIGNED, // Admin needs to see applications on org properties
    Permission.UPLOAD_DOCUMENT,
    Permission.VIEW_DOCUMENTS,
    Permission.SUBMIT_ENQUIRY, // Can submit enquiries
    Permission.RESPOND_TO_ENQUIRY, // Can respond to enquiries for their org

  ];

  // Define permissions for DEVELOPER_AGENT role
  const developerAgentPermissionNames = [
    Permission.CREATE_PROPERTY_LISTING, // Agents can create listings
    Permission.EDIT_OWN_PROPERTY_LISTING, // Agents can edit their own listings
    // Permission.DELETE_PROPERTY_LISTING, // Decide if agents can delete or only admin
    Permission.VIEW_ALL_PROPERTY_LISTINGS_IN_OWN_ORG, // Agents likely need to see all org properties
    Permission.UPLOAD_DOCUMENT, // Can upload documents related to properties
    Permission.VIEW_DOCUMENTS, // Can view documents related to properties
    Permission.SUBMIT_ENQUIRY, // Can submit enquiries
    Permission.RESPOND_TO_ENQUIRY, // Can respond to enquiries related to their properties/org
    Permission.VIEW_OWN_LOAN_APPLICATIONS, // To see applications on properties they manage
    // Permission.VIEW_LOAN_APPLICATIONS_ASSIGNED, // Less likely for agent, more for admin
  ];

  // Assign permissions using the helper function
  await assignPermissionsToRole(Role.DEVELOPER_ADMIN, developerAdminPermissionNames);
  await assignPermissionsToRole(Role.DEVELOPER_AGENT, developerAgentPermissionNames);


  console.log('Roles and permissions seeding completed.')
}
