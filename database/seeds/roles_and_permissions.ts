import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    await knex("role_permissions").del();
    await knex("permissions").del();
    await knex("roles").del();

    // Insert roles
    await knex("roles").insert([
        { id: 1, name: "home_buyer" },
        { id: 2, name: "admin" },
        { id: 3, name: "developer" },
        { id: 4, name: "trustee" },
        { id: 5, name: "bank" },
    ]);

    // Insert permissions
    await knex("permissions").insert([
        { id: 1, name: "create_user" },
        { id: 2, name: "delete_user" },
        { id: 3, name: "update_user" },
        { id: 4, name: "view_users" },
    ]);

    // Assign permissions to the admin role (role_id = 2)
    await knex("role_permissions").insert([
        { role_id: 2, permission_id: 1 }, // Admin can create users
        { role_id: 2, permission_id: 2 }, // Admin can delete users
        { role_id: 2, permission_id: 3 }, // Admin can update users
        { role_id: 2, permission_id: 4 }, // Admin can view users
    ]);
}
