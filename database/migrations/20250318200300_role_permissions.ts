import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("role_permissions", (table) => {
        table.increments("id").primary();
        table.integer("role_id").unsigned().references("id").inTable("roles").onDelete("CASCADE");
        table.integer("permission_id").unsigned().references("id").inTable("permissions").onDelete("CASCADE");
        table.unique(["role_id", "permission_id"]); // Prevent duplicate entries
        table.timestamps(true, true);
      });
}


export async function down(knex: Knex): Promise<void> {
}

