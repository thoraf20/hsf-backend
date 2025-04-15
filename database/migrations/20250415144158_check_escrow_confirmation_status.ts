import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('escrow_status', (table) => {
         table.uuid('escrow_status_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
         table.string('escrow_status').defaultTo('awaiting escrow meeting')
         table.boolean('is_escrow_set').defaultTo(false)
         table.timestamps(true, true);
         table
         .uuid('property_id') 
         .notNullable()
         .references('id')
         .inTable('properties')
         .onDelete('CASCADE')
         .onUpdate('CASCADE')
         table
         .uuid('escrow_information_id') 
         .references('escrow_id')
         .inTable('escrow_information')
         .onDelete('CASCADE')
         .onUpdate('CASCADE')
         table.uuid('user_id')
         .notNullable()
         .references('id')
         .inTable('users')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');

    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('escrow_status');
}
