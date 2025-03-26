import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("role_permissions", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("role_id").references("id").inTable("roles").onDelete("CASCADE");
        table.uuid("permission_id").references('id').inTable('permissions').onDelete('CASCADE');
        table.unique(["role_id", "permission_id"]); // Prevent duplicate entries
        table.timestamps(true, true);
      });
}


export async function down(knex: Knex): Promise<void> {
}

