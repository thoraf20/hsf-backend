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

  console.log('Roles and permissions seeding completed.')
}
