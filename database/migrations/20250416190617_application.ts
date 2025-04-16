import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('application', (table) => {
         table.uuid('application_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
         table.string('application_type')
         table
         .uuid('escrow_information_id') 
         .references('escrow_id')
         .inTable('escrow_information')
         .onDelete('CASCADE')
         .onUpdate('CASCADE')
         table.uuid('escrow_status_id')
         .references('escrow_status_id')
         .inTable('escrow_status')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');
         table.uuid('prequalifier_id')
         .references('status_id')
         .inTable('prequalify_status')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');
         table.uuid('property_closing_id')
         .references('property_closing_id')
         .inTable('property_closing')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');
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
    return knex.schema.dropTable('application');
}
