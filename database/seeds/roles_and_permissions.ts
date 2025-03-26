import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";

export async function seed(knex: Knex): Promise<void> {
    await knex("role_permissions").del();
    await knex("permissions").del();
    await knex("roles").del();

    // Generate UUIDs for roles
    const roles = [
        { id: uuidv4(), name: "home_buyer" },
        { id: uuidv4(), name: "admin" },
        { id: uuidv4(), name: "developer" },
        { id: uuidv4(), name: "trustee" },
        { id: uuidv4(), name: "bank" },
    ];

    // Insert roles
    await knex("roles").insert(roles);

    // Generate UUIDs for permissions
    const permissions = [
        { id: uuidv4(), name: "create_user" },
        { id: uuidv4(), name: "delete_user" },
        { id: uuidv4(), name: "update_user" },
        { id: uuidv4(), name: "view_users" },
    ];

    // Insert permissions
    await knex("permissions").insert(permissions);

    // Find admin role ID
    const adminRole = roles.find((role) => role.name === "admin");
    
    // Assign permissions to the admin role
    if (adminRole) {
        const rolePermissions = permissions.map((permission) => ({
            role_id: adminRole.id,
            permission_id: permission.id,
        }));

        await knex("role_permissions").insert(rolePermissions);
    }
}
