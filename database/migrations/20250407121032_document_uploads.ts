import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("document_upload", (table) => {
    table.uuid("document_upload_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.jsonb('documents').notNullable();
    table.string('document_type').notNullable();
    table.string('document_status').notNullable().defaultTo('Pending');
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
    return knex.schema.dropTable("document_upload");
}

