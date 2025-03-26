import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("roles", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").unique().notNullable();
    table.timestamps(true, true);
})
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("roles");
}

