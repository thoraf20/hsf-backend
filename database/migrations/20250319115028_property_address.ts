import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("property_address", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string('street_address').notNullable();
        table.string('city').notNullable();
        table.string('unit_number').notNullable();
        table.string('postal_code').notNullable();
        table.string('landmark').notNullable();

    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("property_address");
}

