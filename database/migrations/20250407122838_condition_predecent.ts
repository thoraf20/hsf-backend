import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("precedent_document_upload", (table) => {
    table.uuid("precedent_document_upload_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.jsonb('precedent_documents').notNullable();
    table.string('precedent_document_type').notNullable();
    table.string('precedent_document_status').notNullable().defaultTo('Pending');
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
    return knex.schema.dropTable("precedent_document_upload");
}

