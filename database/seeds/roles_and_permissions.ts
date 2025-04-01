import { Knex } from "knex";
import * as uuid from "uuid"

const uuidv4 = uuid.v4 

export async function seed(knex: Knex): Promise<void> {
    // Define roles
    const roles = [
        { name: "home_buyer" },
        { name: "admin" },
        { name: "developer" },
        { name: "trustee" },
        { name: "bank" },
        { name: "super_admin" },
    ];

    // Define permissions
    const permissions = [
        { name: "create_user" },
        { name: "delete_user" },
        { name: "update_user" },
        { name: "view_users" },
    ];

    // Insert roles only if they do not exist
    for (const role of roles) {
        const existingRole = await knex("roles").where("name", role.name).first();
        if (!existingRole) {
            await knex("roles").insert({ id: uuidv4(), name: role.name });
        }
    }

    // Insert permissions only if they do not exist
    for (const permission of permissions) {
        const existingPermission = await knex("permissions").where("name", permission.name).first();
        if (!existingPermission) {
            await knex("permissions").insert({ id: uuidv4(), name: permission.name });
        }
    }

    // Fetch role IDs
    const adminRole = await knex("roles").where("name", "admin").first();
    const superAdminRole = await knex("roles").where("name", "super_admin").first();
    const allPermissions = await knex("permissions").select("id");

    // Assign permissions to admin and super_admin if not already assigned
    if (adminRole) {
        for (const permission of allPermissions) {
            const exists = await knex("role_permissions")
                .where({ role_id: adminRole.id, permission_id: permission.id })
                .first();
            if (!exists) {
                await knex("role_permissions").insert({ role_id: adminRole.id, permission_id: permission.id });
            }
        }
    }

    if (superAdminRole) {
        for (const permission of allPermissions) {
            const exists = await knex("role_permissions")
                .where({ role_id: superAdminRole.id, permission_id: permission.id })
                .first();
            if (!exists) {
                await knex("role_permissions").insert({ role_id: superAdminRole.id, permission_id: permission.id });
            }
        }
    }
}
