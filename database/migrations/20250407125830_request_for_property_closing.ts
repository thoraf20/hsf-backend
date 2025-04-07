import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("property_closing", (table) => {
    table.uuid("property_closing_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string('closing_status').notNullable().defaultTo('Pending');
    table
    .uuid('property_id')
    .notNullable()
    .references('id')
    .inTable('properties')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
    table.uuid('user_id')
    .notNullable()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
    table.timestamps(true, true);
})
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("property_closing");
}


